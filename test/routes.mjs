/**
 * Route-level test: mounts the real handler on a fake webServer and drives
 * it with fake request/response objects. Verifies the JSON contract and the
 * same-origin fence without starting a host.
 */
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'

import { mountRoutes } from '../src/routes.js'
import { createState } from '../src/state.js'
import { ConnectorStore, ConnectorRuntime } from '../src/connectors.js'
import { resolveAgentsHome, resolveDshHome, resolveWorkbuddyHome } from '../src/util.js'

const failures = []
function check(label, condition, detail) {
  if (condition) { console.log('  ok   ' + label); return }
  failures.push(label)
  console.log('  FAIL ' + label + (detail === undefined ? '' : ' :: ' + detail))
}

const temp = await mkdtemp(join(tmpdir(), 'wbs-routes-'))
const dshHome = resolveDshHome()
const agentsHome = resolveAgentsHome()
const workbuddyHome = resolveWorkbuddyHome()
const store = new ConnectorStore({ file: join(temp, 'connectors.json'), workbuddyHome })
const runtime = new ConnectorRuntime(store)
const state = createState({
  dshHome, agentsHome, workbuddyHome, projectRoot: process.cwd(),
  async connectors() {
    const connectors = await store.list()
    const seeds = await store.workbuddyServers()
    const known = new Set(connectors.map(function (i) { return i.id }))
    return { connectors, seeds: seeds.filter(function (s) { return !known.has(s.id) }) }
  },
})

let handler
const webServer = { register(spec) { handler = spec.handler; check('registered as prefix', spec.kind === 'prefix'); check('route base', spec.path === '/dsh-workbuddy-suite', spec.path); return function () {} } }
const dispose = mountRoutes({ webServer, state, store, runtime, projectRoot: process.cwd() })
check('mount returns a disposer', typeof dispose === 'function')

async function request(method, path, body, headers) {
  const request = Readable.from(body === undefined ? [] : [Buffer.from(JSON.stringify(body))])
  request.method = method
  request.url = path
  request.headers = Object.assign({ host: '127.0.0.1:60212' }, headers || {})
  const captured = { status: 0, headers: null, body: '' }
  const response = {
    writeHead(status, hdrs) { captured.status = status; captured.headers = hdrs },
    end(chunk) { captured.body = chunk === undefined ? '' : String(chunk) },
  }
  await handler(request, response)
  let parsed = null
  try { parsed = JSON.parse(captured.body) } catch { parsed = null }
  return { status: captured.status, headers: captured.headers, body: parsed, raw: captured.body }
}

console.log('state')
const stateResponse = await request('GET', '/dsh-workbuddy-suite/api/state')
check('GET /api/state is 200', stateResponse.status === 200, String(stateResponse.status))
check('no-store header', stateResponse.headers['cache-control'] === 'no-store')
check('payload is ok', stateResponse.body !== null && stateResponse.body.ok === true)
check('has experts', Array.isArray(stateResponse.body.value.experts) && stateResponse.body.value.experts.length > 0)
check('has skills', Array.isArray(stateResponse.body.value.skills) && stateResponse.body.value.skills.length > 0)
check('has connectors array', Array.isArray(stateResponse.body.value.connectors))
check('no token in payload', stateResponse.raw.indexOf('Bearer ') < 0)

console.log('security fence')
const crossSite = await request('POST', '/dsh-workbuddy-suite/api/experts/uninstall', { id: 'x' }, { 'sec-fetch-site': 'cross-site' })
check('cross-site POST refused', crossSite.status === 403, String(crossSite.status))
const foreignOrigin = await request('POST', '/dsh-workbuddy-suite/api/experts/uninstall', { id: 'x' }, { origin: 'https://evil.example' })
check('foreign origin refused', foreignOrigin.status === 403, String(foreignOrigin.status))
const badHost = await request('POST', '/dsh-workbuddy-suite/api/experts/uninstall', { id: 'x' }, { host: 'evil.example' })
check('non-loopback host refused', badHost.status === 403, String(badHost.status))
const getMutation = await request('GET', '/dsh-workbuddy-suite/api/experts/uninstall')
check('GET on a mutation is 405', getMutation.status === 405, String(getMutation.status))
const sameOrigin = await request('POST', '/dsh-workbuddy-suite/api/experts/uninstall', { id: 'no-such-expert' }, { origin: 'http://127.0.0.1:60212' })
check('same-origin mutation reaches the handler', sameOrigin.status !== 403, String(sameOrigin.status))
check('missing expert reports not-found', sameOrigin.body !== null && sameOrigin.body.error.code === 'not-found', JSON.stringify(sameOrigin.body))
const unknown = await request('GET', '/dsh-workbuddy-suite/api/nope')
check('unknown route is 404', unknown.status === 404, String(unknown.status))

console.log('connectors')
const upsert = await request('POST', '/dsh-workbuddy-suite/api/connectors/upsert', {
  id: 'fixture', name: 'Fixture', transport: 'stdio',
  command: process.execPath, args: [join(process.cwd(), 'test', 'fixture-mcp.mjs')],
})
check('upsert is 200', upsert.status === 200, JSON.stringify(upsert.body))
const tools = await request('POST', '/dsh-workbuddy-suite/api/connectors/tools', { id: 'fixture' })
check('tools probe is 200', tools.status === 200, JSON.stringify(tools.body))
check('tool list returned', tools.body.ok === true && tools.body.value.tools.length === 1)
const call = await request('POST', '/dsh-workbuddy-suite/api/connectors/call', { id: 'fixture', name: 'echo', args: { text: 'hi' } })
check('tool call is 200', call.status === 200, JSON.stringify(call.body))
check('tool call text', call.body.value.text === 'echo: hi', JSON.stringify(call.body.value))
const remove = await request('POST', '/dsh-workbuddy-suite/api/connectors/remove', { id: 'fixture' })
check('remove is 200', remove.status === 200)

console.log('connector catalog')
const catalog = await request('GET', '/dsh-workbuddy-suite/api/connector-catalog')
check('GET /api/connector-catalog is 200', catalog.status === 200, String(catalog.status))
check('catalog lists connectors', catalog.body.ok === true && Array.isArray(catalog.body.value.connectors) && catalog.body.value.connectors.length > 0)
check('catalog flags every entry', catalog.body.value.connectors.every(function (c) {
  return typeof c.installed === 'boolean' && typeof c.available === 'boolean'
}))
const installable = catalog.body.value.connectors.filter(function (c) { return c.available })[0]
const install = await request('POST', '/dsh-workbuddy-suite/api/connectors/install-catalog', { id: installable.id })
check('install-catalog is 200', install.status === 200, JSON.stringify(install.body).slice(0, 200))
const installed = await store.list()
check('catalog install lands in the store', installed.some(function (c) { return c.id === installable.id }), JSON.stringify(installed.map(function (c) { return c.id })))
await request('POST', '/dsh-workbuddy-suite/api/connectors/remove', { id: installable.id })
const noServer = catalog.body.value.connectors.filter(function (c) { return !c.available })[0]
if (noServer) {
  const refused = await request('POST', '/dsh-workbuddy-suite/api/connectors/install-catalog', { id: noServer.id })
  check('install-catalog refuses a serverless entry', refused.status === 400 && refused.body.error.code === 'no-server', JSON.stringify(refused.body).slice(0, 160))
}
const icon = await request('GET', '/dsh-workbuddy-suite/api/connector-icon?id=' + encodeURIComponent(installable.id))
check('connector icon answers', icon.status === 200 || icon.status === 404, String(icon.status))
const iconTraversal = await request('GET', '/dsh-workbuddy-suite/api/connector-icon?id=' + encodeURIComponent('../package.json'))
check('icon route rejects traversal', iconTraversal.status === 404, String(iconTraversal.status))
const avatar = await request('GET', '/dsh-workbuddy-suite/api/expert-avatar?id=nope:nope')
check('avatar route answers 404 for an unknown expert', avatar.status === 404, String(avatar.status))

await runtime.closeAll()
dispose()
await rm(temp, { recursive: true, force: true })

console.log('')
if (failures.length > 0) {
  console.log('FAILED ' + String(failures.length))
  process.exitCode = 1
} else {
  console.log('all route checks passed')
}
