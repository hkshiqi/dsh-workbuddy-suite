/**
 * HTTP surface for the settings panel.
 *
 * One prefix route (ROUTE_BASE) serves every API call. The security model is
 * the one already proven by dsh-workbuddy-expert on this runtime: mutations
 * are same-origin POSTs only, the Host must name loopback, JSON bodies are
 * capped, every response is no-store, and all mutations are serialised - a
 * concurrent second write gets 409 instead of interleaving.
 */

import { sendJson, readJsonBody, sameOrigin, errorMessage } from './util.js'
import { ROUTE_BASE } from './util.js'
import { scanExperts, installExpert, uninstallExpert, avatarBytesFor } from './experts.js'
import { scanSkills, readSkillDetail, setSkillFlags, importSkill, removeSkill, createSkill } from './skills.js'

const MAX_BODY = 65536

/** Read-only endpoints. */
const GET_ROUTES = new Set([
  '/api/state',
  '/api/expert-avatar',
  '/api/skill-detail',
])

/** Mutating endpoints (same-origin POST only). */
const POST_ROUTES = new Set([
  '/api/experts/install',
  '/api/experts/uninstall',
  '/api/experts/refresh',
  '/api/skills/flags',
  '/api/skills/import',
  '/api/skills/remove',
  '/api/skills/create',
  '/api/connectors/upsert',
  '/api/connectors/remove',
  '/api/connectors/enable',
  '/api/connectors/import',
  '/api/connectors/tools',
  '/api/connectors/call',
])

function notFound(response) {
  sendJson(response, 404, { ok: false, error: { code: 'not-found', message: '未知接口' } })
}

function fail(response, status, code, message) {
  sendJson(response, status, { ok: false, error: { code, message } })
}

/** Strip the query string and the route prefix off a request URL. */
function pathOf(request) {
  const raw = String(request.url ?? '/')
  const query = raw.indexOf('?')
  const path = query < 0 ? raw : raw.slice(0, query)
  return path.startsWith(ROUTE_BASE) ? path.slice(ROUTE_BASE.length) : path
}

/** Parse the query string of a request. */
function queryOf(request) {
  const raw = String(request.url ?? '/')
  const index = raw.indexOf('?')
  if (index < 0) return new URLSearchParams('')
  return new URLSearchParams(raw.slice(index + 1))
}

/**
 * Mount the panel API.
 * @param {object} options {webServer, catalog: {experts(), skills(), connectors()}, store, runtime, profile}
 * @returns {() => void} disposer
 */
export function mountRoutes(options) {
  const state = options.state
  const store = options.store
  const runtime = options.runtime
  let busy = false

  /** Run one mutation, refusing (instead of queueing) when one is in flight. */
  async function mutate(response, work) {
    if (busy) {
      fail(response, 409, 'busy', '上一次操作尚未完成，请稍后再试')
      return
    }
    busy = true
    try {
      const result = await work()
      if (result === undefined) {
        fail(response, 500, 'no-result', '操作没有返回结果')
      } else if (result.ok === false) {
        sendJson(response, result.status ?? 400, { ok: false, error: { code: result.code ?? 'failed', message: result.message ?? '操作失败' } })
      } else {
        sendJson(response, 200, { ok: true, value: result.value })
      }
    } catch (error) {
      fail(response, 500, 'exception', errorMessage(error))
    } finally {
      busy = false
    }
  }

  const handler = async function (request, response) {
    const method = String(request.method ?? 'GET').toUpperCase()
    const path = pathOf(request)

    // Unknown routes answer 404 before the method fence, so a typo is not
    // reported as 'only POST is accepted'.
    if (!GET_ROUTES.has(path) && !POST_ROUTES.has(path)) {
      notFound(response)
      return
    }

    if (method === 'GET' && path === '/api/state') {
      try {
        const snapshot = await state.snapshot()
        sendJson(response, 200, { ok: true, value: snapshot })
      } catch (error) {
        fail(response, 500, 'exception', errorMessage(error))
      }
      return
    }

    if (method === 'GET' && path === '/api/expert-avatar') {
      const key = queryOf(request).get('id') ?? ''
      try {
        const bytes = await avatarBytesFor({ catalog: await state.expertsCatalog(), key })
        if (bytes === undefined) {
          notFound(response)
          return
        }
        response.writeHead(200, {
          'cache-control': 'private, max-age=60',
          'content-type': 'image/png',
        })
        response.end(bytes)
      } catch (error) {
        fail(response, 500, 'exception', errorMessage(error))
      }
      return
    }

    if (method === 'GET' && path === '/api/skill-detail') {
      try {
        const detail = await readSkillDetail(queryOf(request).get('key') ?? '')
        if (detail === undefined) {
          notFound(response)
          return
        }
        sendJson(response, 200, { ok: true, value: detail })
      } catch (error) {
        fail(response, 500, 'exception', errorMessage(error))
      }
      return
    }

    if (method !== 'POST') {
      fail(response, 405, 'method', '该接口只接受 POST')
      return
    }
    if (!sameOrigin(request)) {
      fail(response, 403, 'origin', '只接受同源请求')
      return
    }
    let body
    try {
      body = await readJsonBody(request, MAX_BODY)
    } catch (error) {
      fail(response, 400, 'body', errorMessage(error))
      return
    }

    if (path === '/api/experts/install') {
      await mutate(response, async function () {
        const catalog = await state.expertsCatalog()
        const result = await installExpert({
          catalog,
          id: String(body.id ?? ''),
          dshHome: state.dshHome,
          workbuddyHome: state.workbuddyHome,
          projectRoot: state.projectRoot,
          locale: body.locale,
        })
        if (result.ok) state.invalidateExperts()
        return result.ok ? { ok: true, value: result } : result
      })
      return
    }
    if (path === '/api/experts/uninstall') {
      await mutate(response, async function () {
        const result = await uninstallExpert({ id: String(body.id ?? ''), dshHome: state.dshHome })
        if (result.ok) state.invalidateExperts()
        return result.ok ? { ok: true, value: result } : result
      })
      return
    }
    if (path === '/api/experts/refresh') {
      await mutate(response, async function () {
        state.invalidateExperts()
        state.invalidateSkills()
        return { ok: true, value: await state.snapshot() }
      })
      return
    }
    if (path === '/api/skills/flags') {
      await mutate(response, async function () {
        const result = await setSkillFlags({
          key: String(body.key ?? ''),
          modelInvocable: typeof body.modelInvocable === 'boolean' ? body.modelInvocable : undefined,
          userInvocable: typeof body.userInvocable === 'boolean' ? body.userInvocable : undefined,
        })
        if (result.ok) state.invalidateSkills()
        return result.ok ? { ok: true, value: result } : result
      })
      return
    }
    if (path === '/api/skills/import') {
      await mutate(response, async function () {
        const result = await importSkill({ key: String(body.key ?? ''), dshHome: state.dshHome })
        if (result.ok) state.invalidateSkills()
        return result.ok ? { ok: true, value: result } : result
      })
      return
    }
    if (path === '/api/skills/remove') {
      await mutate(response, async function () {
        const result = await removeSkill({ key: String(body.key ?? '') })
        if (result.ok) state.invalidateSkills()
        return result.ok ? { ok: true, value: result } : result
      })
      return
    }
    if (path === '/api/skills/create') {
      await mutate(response, async function () {
        const result = await createSkill({
          name: String(body.name ?? ''),
          description: String(body.description ?? ''),
          scope: body.scope === 'project' ? 'project' : 'user',
          dshHome: state.dshHome,
          projectRoot: state.projectRoot,
        })
        if (result.ok) state.invalidateSkills()
        return result.ok ? { ok: true, value: result } : result
      })
      return
    }
    if (path === '/api/connectors/upsert') {
      await mutate(response, async function () {
        const result = await store.upsert(body)
        await runtime.drop(String(body.id ?? ''))
        return result.ok ? { ok: true, value: result } : result
      })
      return
    }
    if (path === '/api/connectors/remove') {
      await mutate(response, async function () {
        const id = String(body.id ?? '')
        await runtime.drop(id)
        const result = await store.remove(id)
        return result.ok ? { ok: true, value: result } : result
      })
      return
    }
    if (path === '/api/connectors/enable') {
      await mutate(response, async function () {
        const id = String(body.id ?? '')
        if (body.enabled === false) await runtime.drop(id)
        const result = await store.setEnabled(id, body.enabled !== false)
        return result.ok ? { ok: true, value: result } : result
      })
      return
    }
    if (path === '/api/connectors/import') {
      await mutate(response, async function () {
        const result = await store.importFromWorkbuddy()
        return { ok: true, value: result }
      })
      return
    }
    if (path === '/api/connectors/tools') {
      const id = String(body.id ?? '')
      try {
        const tools = await runtime.tools(id, 30000)
        sendJson(response, 200, { ok: true, value: { tools } })
      } catch (error) {
        fail(response, 502, 'mcp', errorMessage(error))
      }
      return
    }
    if (path === '/api/connectors/call') {
      const id = String(body.id ?? '')
      const name = String(body.name ?? '')
      try {
        const result = await runtime.call(id, name, body.args)
        sendJson(response, 200, { ok: true, value: result })
      } catch (error) {
        fail(response, 502, 'mcp', errorMessage(error))
      }
      return
    }

    notFound(response)
  }

  return options.webServer.register({ kind: 'prefix', path: ROUTE_BASE, handler })
}
