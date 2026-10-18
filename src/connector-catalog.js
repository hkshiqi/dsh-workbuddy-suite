/**
 * Connector catalog: WorkBuddy's own connector marketplace.
 *
 * The desktop app keeps a directory marketplace at
 *   <wbHome>/plugins/marketplaces/workbuddy-connector-plugins-official/connectors/<id>/
 * with, per connector:
 *   .codebuddy-plugin/plugin.json   name/description, localized under
 *                                   extensions['ai.workbuddy'].display or .connector
 *   mcp.json or .mcp.json           the MCP server spec (http or stdio)
 *   ai.workbuddy/assets/icon.png|svg
 *
 * The panel shows this catalog (not only the servers already registered) so a
 * user can browse ~400 official connectors and install one with a click.
 * Nothing is written to WorkBuddy: installing copies the server spec into this
 * plugin's own registry (connectors.json).
 */

import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

import { mapLimit, tryStat } from './util.js'

/** Marketplace folder, relative to the WorkBuddy home. */
export const MARKETPLACE_DIR = ['plugins', 'marketplaces', 'workbuddy-connector-plugins-official', 'connectors']

const CJK_RE = /[\u3400-\u9fff]/

function asString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function hasChinese(text) {
  return CJK_RE.test(text)
}

async function readJson(target) {
  try {
    return JSON.parse(await readFile(target, 'utf8'))
  } catch {
    return undefined
  }
}

/** Icon bytes plus their content type, for the icon route. */
const ICON_NAMES = ['icon.png', 'icon.svg', 'icon.jpg', 'icon.webp']

const MIME_BY_EXT = {
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
}

/**
 * Read one connector directory into a catalog card.
 * @param {string} folder absolute connector directory
 */
async function readConnectorFolder(folder) {
  const id = folder.split(/[\\/]/).pop()
  const pluginJson = await readJson(join(folder, '.codebuddy-plugin', 'plugin.json')) ?? {}
  const extension = pluginJson.extensions !== null && typeof pluginJson.extensions === 'object'
    ? (pluginJson.extensions['ai.workbuddy'] ?? {})
    : {}
  const display = extension.display !== null && typeof extension.display === 'object' ? extension.display : {}
  const connector = extension.connector !== null && typeof extension.connector === 'object' ? extension.connector : {}

  // Localized name: display.name is already the Chinese one for 402/409; a
  // handful keep their brand name at the top level.
  const name = asString(display.name)
    || asString(display.name_zh)
    || asString(connector.name)
    || asString(connector.name_zh)
    || asString(pluginJson.name)
    || id
  const nameEn = asString(display.name_en) || asString(connector.name_en) || name

  // Localized description. Most cards carry description_zh; when it is absent
  // the top-level description is usually the Chinese one already, and only
  // then do we fall back to the English copy (the client shows it verbatim).
  const zhCandidates = [
    asString(display.description_zh),
    asString(connector.description_zh),
    hasChinese(asString(pluginJson.description)) ? asString(pluginJson.description) : '',
  ]
  const description = zhCandidates.find(function (text) { return text !== '' }) ?? ''
  const descriptionEn = asString(display.description_en)
    || asString(connector.description_en)
    || asString(pluginJson.description)

  const examples = Array.isArray(display.examples_zh) && display.examples_zh.length > 0
    ? display.examples_zh.filter(function (item) { return typeof item === 'string' })
    : (Array.isArray(connector.examples_zh) ? connector.examples_zh.filter(function (item) { return typeof item === 'string' }) : [])

  let server
  for (const fileName of ['mcp.json', '.mcp.json']) {
    const parsed = await readJson(join(folder, fileName))
    const servers = parsed !== null && typeof parsed === 'object' && parsed.mcpServers !== null
      && typeof parsed.mcpServers === 'object' ? parsed.mcpServers : undefined
    if (servers === undefined) continue
    const keys = Object.keys(servers)
    if (keys.length === 0) continue
    const spec = servers[keys[0]]
    if (spec === null || typeof spec !== 'object') continue
    server = {
      serverName: keys[0],
      transport: asString(spec.url) !== '' ? 'streamable-http' : 'stdio',
      url: asString(spec.url),
      command: asString(spec.command),
      args: Array.isArray(spec.args) ? spec.args.map(String) : [],
      env: spec.env !== null && typeof spec.env === 'object' ? spec.env : {},
      headers: spec.headers !== null && typeof spec.headers === 'object' ? spec.headers : {},
      authMode: asString(connector.auth_mode) || asString(extension.auth?.mode),
    }
    break
  }

  let icon
  for (const iconName of ICON_NAMES) {
    const candidate = join(folder, 'ai.workbuddy', 'assets', iconName)
    const info = await tryStat(candidate)
    if (info !== undefined && info.isFile() && info.size > 0) {
      icon = candidate
      break
    }
  }
  if (icon === undefined) {
    try {
      const files = await readdir(join(folder, 'ai.workbuddy', 'assets'))
      const hit = files.find(function (file) { return /^icon\.(png|svg|jpe?g|webp)$/i.test(file) })
      if (hit !== undefined) icon = join(folder, 'ai.workbuddy', 'assets', hit)
    } catch {
      /* no assets folder */
    }
  }

  return {
    card: {
      key: 'connector:' + id,
      id,
      name,
      nameEn,
      description,
      descriptionEn,
      examples: examples.slice(0, 6),
      origin: 'workbuddy-marketplace',
      available: server !== undefined,
      transport: server === undefined ? '' : server.transport,
      url: server === undefined ? '' : server.url,
      command: server === undefined ? '' : server.command,
      serverName: server === undefined ? '' : server.serverName,
      authMode: server === undefined ? '' : (server.authMode ?? ''),
      iconUrl: icon === undefined ? '' : ('dsh-workbuddy-suite/api/connector-icon?id=' + encodeURIComponent(id)),
      __dir: folder,
      __iconFile: icon,
      __server: server,
    },
  }
}

/** Directory of the connector marketplace (may not exist). */
export function marketplaceRoot(workbuddyHome) {
  return join(workbuddyHome, ...MARKETPLACE_DIR)
}

/**
 * Scan the marketplace into catalog cards.
 * @param {{workbuddyHome: string}} options
 */
export async function scanConnectorCatalog(options) {
  const root = marketplaceRoot(options.workbuddyHome)
  let names
  try {
    const entries = await readdir(root, { withFileTypes: true })
    names = entries.filter(function (entry) { return entry.isDirectory() }).map(function (entry) { return entry.name })
  } catch {
    return { connectors: [], root, found: false }
  }
  names.sort()
  const results = await mapLimit(names, 8, function (name) {
    return readConnectorFolder(join(root, name))
  })
  const cards = results.map(function (result) { return result.card })
  cards.sort(function (left, right) {
    if (left.available !== right.available) return left.available ? -1 : 1
    return String(left.name).localeCompare(String(right.name), 'zh-Hans-CN')
  })
  return { connectors: cards, root, found: true }
}

/** Icon bytes for one connector id (undefined when the card has no icon). */
export async function connectorIconFor(options) {
  const realRoot = marketplaceRoot(options.workbuddyHome)
  const id = String(options.id ?? '')
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(id)) return undefined
  const folder = join(realRoot, id)
  for (const iconName of ICON_NAMES) {
    const candidate = join(folder, 'ai.workbuddy', 'assets', iconName)
    const info = await tryStat(candidate)
    if (info === undefined || !info.isFile() || info.size === 0) continue
    try {
      const ext = (/\.(png|jpe?g|webp|svg)$/i.exec(candidate) ?? [])[0]
      return {
        bytes: await readFile(candidate),
        contentType: ext === undefined ? 'image/png' : (MIME_BY_EXT[ext.toLowerCase()] ?? 'image/png'),
      }
    } catch {
      return undefined
    }
  }
  return undefined
}

/** The server spec of one catalog connector, for the install action. */
export async function connectorSpecFor(options) {
  const folder = join(marketplaceRoot(options.workbuddyHome), String(options.id ?? ''))
  const result = await readConnectorFolder(folder)
  const card = result.card
  if (card.__server === undefined) {
    return { ok: false, code: 'no-server', message: '该连接器没有可直接使用的 MCP 地址：' + card.id }
  }
  const server = card.__server
  // Placeholder credentials (${VAR}) are copied through untouched: the panel
  // masks them on the way out and the runtime resolves what the user fills in.
  return {
    ok: true,
    spec: {
      id: card.id,
      name: card.name,
      transport: server.transport,
      command: server.command,
      args: server.args,
      url: server.url,
      env: server.env,
      headers: server.headers,
      note: card.description.slice(0, 200),
    },
  }
}
