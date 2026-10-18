/**
 * Smoke test: exercises the host half against this machine's real catalogs
 * plus a throwaway connector registry. Run with `node test/smoke.mjs`.
 *
 * Nothing is written outside a temp directory; the expert and skill scans are
 * read-only, and the connector store points at a temp file.
 */

import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { scanExperts } from '../src/experts.js'
import { scanSkills } from '../src/skills.js'
import { ConnectorStore, ConnectorRuntime } from '../src/connectors.js'
import { resolveAgentsHome, resolveDshHome, resolveWorkbuddyHome } from '../src/util.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const FIXTURE = join(HERE, 'fixture-mcp.mjs')
const failures = []

function check(label, condition, detail) {
  if (condition) {
    console.log('  ok   ' + label)
    return
  }
  failures.push(label + (detail === undefined ? '' : ' :: ' + detail))
  console.log('  FAIL ' + label + (detail === undefined ? '' : ' :: ' + detail))
}

const dshHome = resolveDshHome()
const agentsHome = resolveAgentsHome()
const workbuddyHome = resolveWorkbuddyHome()
const projectRoot = process.cwd()

console.log('roots')
console.log('  dshHome        ' + dshHome)
console.log('  agentsHome     ' + agentsHome)
console.log('  workbuddyHome  ' + workbuddyHome)
console.log('  projectRoot    ' + projectRoot)

console.log('experts')
const experts = await scanExperts({ dshHome, workbuddyHome, projectRoot })
check('expert catalog is non-empty', experts.experts.length > 0, String(experts.experts.length))
check('seed experts are present', experts.experts.some(function (e) { return e.origin === 'seed' }))
check('every card has an id', experts.experts.every(function (e) { return typeof e.id === 'string' && e.id !== '' }))
check('every card has a name', experts.experts.every(function (e) { return typeof e.name === 'string' && e.name !== '' }))
check('no internal field leaks', experts.experts.every(function (e) {
  return e.__dir === undefined && e.__avatarFile === undefined
}))
console.log('  count ' + String(experts.experts.length) + ' (teams '
  + String(experts.experts.filter(function (e) { return e.kind === 'team' }).length) + ')')

console.log('skills')
const skills = await scanSkills({ dshHome, agentsHome, workbuddyHome, projectRoot })
check('skill catalog is non-empty', skills.skills.length > 0, String(skills.skills.length))
check('every skill has a name', skills.skills.every(function (s) { return typeof s.name === 'string' && s.name !== '' }))
check('keys are unique', new Set(skills.skills.map(function (s) { return s.name })).size === skills.skills.length)
console.log('  count ' + String(skills.skills.length) + ' (workbuddy '
  + String(skills.skills.filter(function (s) { return s.origin === 'workbuddy' }).length) + ')')

console.log('connectors')
const temp = await mkdtemp(join(tmpdir(), 'wbs-smoke-'))
try {
  const store = new ConnectorStore({ file: join(temp, 'connectors.json'), workbuddyHome })
  const runtime = new ConnectorRuntime(store)

  const seeds = await store.workbuddyServers()
  console.log('  workbuddy seeds ' + String(seeds.length))

  const upserted = await store.upsert({
    id: 'fixture',
    name: 'Fixture',
    transport: 'stdio',
    command: process.execPath,
    args: [FIXTURE],
  })
  check('upsert succeeds', upserted.ok === true, JSON.stringify(upserted))

  const listed = await store.list()
  check('connector is listed', listed.length === 1 && listed[0].id === 'fixture')

  check('bad id rejected', (await store.upsert({ id: 'bad id!', command: 'x' })).ok === false)
  check('empty command rejected', (await store.upsert({ id: 'empty', transport: 'stdio', command: '' })).ok === false)

  const tools = await runtime.tools('fixture', 15000)
  check('tool list has the fixture tool', tools.length === 1 && tools[0].name === 'echo', JSON.stringify(tools))

  const called = await runtime.call('fixture', 'echo', { text: 'hello' })
  check('tool call returns text', called.text === 'echo: hello', called.text)

  await runtime.closeAll()

  const removed = await store.remove('fixture')
  check('remove succeeds', removed.ok === true)
  check('store is empty again', (await store.list()).length === 0)

  // The persisted file must never be left half-written or carry secrets.
  const raw = await readFile(join(temp, 'connectors.json'), 'utf8')
  check('store file is valid JSON', JSON.parse(raw).version === 1)
} finally {
  await rm(temp, { recursive: true, force: true })
}

console.log('')
if (failures.length > 0) {
  console.log('FAILED ' + String(failures.length))
  for (const failure of failures) console.log('  - ' + failure)
  process.exitCode = 1
} else {
  console.log('all checks passed')
}
