/**
 * dsh-workbuddy-suite - host half.
 *
 * Ports the three WorkBuddy surfaces into DSH: experts, skills, connectors.
 * Nothing here writes to WorkBuddy; the WorkBuddy directories are read as a
 * catalog and an import source, and every write goes to a DSH root this
 * plugin owns (marker file in each folder it creates).
 *
 * Services are reached through staged `ctx.inject`, never a synchronous
 * `ctx.get` - the latter silently does nothing during composition. The route
 * mount lives inside a webServer injection and returns a disposer, so a host
 * reload tears the whole surface down cleanly.
 */

import { join } from 'node:path'

import { createState } from './state.js'
import { ConnectorStore, ConnectorRuntime } from './connectors.js'
import { mountRoutes } from './routes.js'
import { resolveAgentsHome, resolveDshHome, resolveWorkbuddyHome, ROUTE_BASE } from './util.js'

export const name = 'dsh-workbuddy-suite'
export const inject = []

let Config
try {
  const schemastery = await import('@deepseek-ai/schemastery')
  const z = schemastery.default ?? schemastery
  Config = z.object({
    dshHome: z.string(),
    agentsHome: z.string(),
    workbuddyHome: z.string(),
    projectRoot: z.string(),
  })
} catch {
  Config = undefined
}
export { Config }

function firstNonEmpty() {
  for (const value of arguments) {
    if (typeof value === 'string' && value.trim() !== '') return value.trim()
  }
  return undefined
}

export function apply(ctx, config = {}) {
  const settings = config ?? {}
  const projectRoot = firstNonEmpty(settings.projectRoot)
    ?? firstNonEmpty(process.env.DSH_WORKSPACE_ROOT)
    ?? process.cwd()
  const dshHome = resolveDshHome(settings.dshHome)
  const agentsHome = resolveAgentsHome(settings.agentsHome)
  const workbuddyHome = resolveWorkbuddyHome(settings.workbuddyHome)

  const store = new ConnectorStore({
    file: join(dshHome, 'workbuddy-suite', 'connectors.json'),
    workbuddyHome,
  })
  const runtime = new ConnectorRuntime(store)

  const state = createState({
    dshHome,
    agentsHome,
    workbuddyHome,
    projectRoot,
    async connectors() {
      const connectors = await store.list()
      const seeds = await store.workbuddyServers()
      const known = new Set(connectors.map(function (item) { return item.id }))
      return {
        connectors,
        seeds: seeds.filter(function (seed) { return !known.has(seed.id) }),
      }
    },
  })

  ctx.logger?.info?.('dsh-workbuddy-suite:', 'dshHome=' + dshHome
    + ' workbuddyHome=' + workbuddyHome
    + ' projectRoot=' + projectRoot)

  ctx.effect(() => () => {
    void runtime.closeAll()
  }, 'dsh-workbuddy-suite: connector runtime')

  ctx.inject(['webServer'], (c) => {
    ctx.effect(() => mountRoutes({
      webServer: c.webServer,
      state,
      store,
      runtime,
      projectRoot,
    }), 'dsh-workbuddy-suite: routes')
  })

  ctx.inject(['commands'], (c) => {
    ctx.effect(() => c.commands.register({
      name: 'workbuddy',
      description: '列出 WorkBuddy 专家、技能与连接器（/workbuddy experts|skills|connectors）',
      input: { hint: 'experts | skills | connectors' },
      handler: async function (invocation) {
        const target = String(invocation?.rawInput ?? '').trim().toLowerCase()
        try {
          const snapshot = await state.snapshot()
          if (target === '' || target === 'experts') {
            const lines = snapshot.experts.slice(0, 40).map(function (expert) {
              return '- ' + expert.name + (expert.installed ? ' （已安装）' : '') + ' - ' + expert.description
            })
            return {
              kind: 'success',
              text: ['WorkBuddy 专家（' + String(snapshot.experts.length) + '）'].concat(lines).join('\n'),
            }
          }
          if (target === 'skills') {
            const lines = snapshot.skills.slice(0, 60).map(function (skill) {
              return '- ' + skill.name + ' [' + skill.origin + '] ' + skill.description
            })
            return {
              kind: 'success',
              text: ['技能（' + String(snapshot.skills.length) + '）'].concat(lines).join('\n'),
            }
          }
          if (target === 'connectors') {
            const lines = snapshot.connectors.map(function (connector) {
              return '- ' + connector.name + ' [' + connector.transport + '] ' + (connector.enabled ? '已启用' : '已停用')
            })
            return {
              kind: 'success',
              text: ['连接器（' + String(snapshot.connectors.length) + '）'].concat(lines).join('\n'),
            }
          }
          return { kind: 'error', text: '用法：/workbuddy experts|skills|connectors' }
        } catch (error) {
          return { kind: 'error', text: '读取失败：' + String(error) }
        }
      },
    }), 'dsh-workbuddy-suite: command')
  })
}

export { ROUTE_BASE }
