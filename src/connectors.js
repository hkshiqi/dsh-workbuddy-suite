/**
 * Connector store: the mutable side of the third tab.
 *
 * DSH itself has no connector concept - an extension port is normally the
 * cordis patch, which is a composition-time file. This plugin owns a small
 * JSON registry instead (<dshHome>/workbuddy-suite/connectors.json) describing
 * MCP servers, and exposes them at runtime through the minimal client in
 * mcp.js. Two seeded sources keep the page useful on a machine that already
 * runs WorkBuddy:
 *
 *   - <wbHome>/mcp.json                 the servers the desktop app is configured with
 *   - <wbHome>/mcp-tool-list.json       the cached tool names per server
 *
 * Write discipline: the whole file is rewritten atomically (tmp + rename) and
 * never contains credentials - header/env values live in the same file but are
 * masked on the way out to the browser.
 */

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

import { connect, listTools, callTool } from './mcp.js'
import { errorMessage, tryStat } from './util.js'

/** Connector ids become object keys and URL params - keep them boring. */
export const CONNECTOR_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/

const SECRET_HEADER_RE = /authorization|token|key|secret|cookie/i

function asString(value) {
  return typeof value === 'string' ? value : ''
}

/** Mask every header value that looks like a credential. */
function maskHeaders(headers) {
  if (headers === null || typeof headers !== 'object') return {}
  const masked = {}
  for (const key of Object.keys(headers)) {
    masked[key] = SECRET_HEADER_RE.test(key) ? '***' : String(headers[key])
  }
  return masked
}

/** Mask env values whose names look like credentials. */
function maskEnv(env) {
  if (env === null || typeof env !== 'object') return {}
  const masked = {}
  for (const key of Object.keys(env)) {
    masked[key] = SECRET_HEADER_RE.test(key) ? '***' : String(env[key])
  }
  return masked
}

/**
 * Connector registry backed by one JSON file.
 */
export class ConnectorStore {
  constructor(options) {
    this.file = options.file
    this.workbuddyHome = options.workbuddyHome
    this.cache = undefined
  }

  async load() {
    if (this.cache !== undefined) return this.cache
    let data
    try {
      data = JSON.parse(await readFile(this.file, 'utf8'))
    } catch {
      data = { version: 1, connectors: [] }
    }
    const connectors = Array.isArray(data.connectors) ? data.connectors.filter(function (item) {
      return item !== null && typeof item === 'object' && CONNECTOR_ID_RE.test(asString(item.id))
    }) : []
    this.cache = { version: 1, connectors }
    return this.cache
  }

  async save(next) {
    this.cache = { version: 1, connectors: next }
    await mkdir(dirname(this.file), { recursive: true })
    const temp = this.file + '.tmp'
    await writeFile(temp, JSON.stringify(this.cache, null, 2), 'utf8')
    await rename(temp, this.file)
    return this.cache
  }

  /** The WorkBuddy-side servers this machine already has configured. */
  async workbuddyServers() {
    const results = []
    let configured
    try {
      configured = JSON.parse(await readFile(join(this.workbuddyHome, 'mcp.json'), 'utf8'))
    } catch {
      configured = undefined
    }
    let toolCache = {}
    try {
      const parsed = JSON.parse(await readFile(join(this.workbuddyHome, 'mcp-tool-list.json'), 'utf8'))
      if (parsed !== null && typeof parsed === 'object' && parsed.entries !== null && typeof parsed.entries === 'object') {
        toolCache = parsed.entries
      }
    } catch {
      toolCache = {}
    }
    const servers = configured !== null && typeof configured === 'object' && configured.mcpServers !== null
      && typeof configured.mcpServers === 'object' ? configured.mcpServers : {}
    for (const name of Object.keys(servers)) {
      const spec = servers[name]
      if (spec === null || typeof spec !== 'object') continue
      results.push({
        id: name,
        name,
        transport: asString(spec.url) !== '' ? 'streamable-http' : 'stdio',
        command: asString(spec.command),
        args: Array.isArray(spec.args) ? spec.args.map(String) : [],
        url: asString(spec.url),
        cachedTools: [],
      })
    }
    return results
  }

  /** The whole catalog: stored connectors, each merged with seed metadata. */
  async list() {
    const data = await this.load()
    return data.connectors.map(function (connector) {
      return {
        id: connector.id,
        name: asString(connector.name) || connector.id,
        transport: connector.transport === 'streamable-http' ? 'streamable-http' : 'stdio',
        command: asString(connector.command),
        args: Array.isArray(connector.args) ? connector.args : [],
        url: asString(connector.url),
        cwd: asString(connector.cwd),
        headers: maskHeaders(connector.headers),
        env: maskEnv(connector.env),
        enabled: connector.enabled !== false,
        note: asString(connector.note),
        updatedAt: asString(connector.updatedAt),
      }
    })
  }

  /** Insert or update one connector; validated and normalized. */
  async upsert(input) {
    const id = asString(input.id).trim()
    if (!CONNECTOR_ID_RE.test(id)) {
      return { ok: false, code: 'bad-id', message: '连接器 id 只能包含字母、数字、点、下划线、连字符' }
    }
    const data = await this.load()
    const others = data.connectors.filter(function (item) { return item.id !== id })
    const transport = input.transport === 'streamable-http' ? 'streamable-http' : 'stdio'
    const previous = data.connectors.find(function (item) { return item.id === id })
    const record = {
      id,
      name: asString(input.name).trim() || id,
      transport,
      command: transport === 'stdio' ? asString(input.command).trim() : '',
      args: Array.isArray(input.args) ? input.args.map(String) : [],
      url: transport === 'streamable-http' ? asString(input.url).trim() : '',
      cwd: asString(input.cwd).trim(),
      headers: input.headers !== null && typeof input.headers === 'object' ? input.headers : (previous?.headers ?? {}),
      env: input.env !== null && typeof input.env === 'object' ? input.env : (previous?.env ?? {}),
      enabled: input.enabled !== false,
      note: asString(input.note),
      updatedAt: new Date().toISOString(),
    }
    if (transport === 'stdio' && record.command === '') {
      return { ok: false, code: 'bad-input', message: 'stdio 连接器需要一个可执行命令' }
    }
    if (transport === 'streamable-http' && record.url === '') {
      return { ok: false, code: 'bad-input', message: 'HTTP 连接器需要一个 URL' }
    }
    await this.save(others.concat([record]))
    return { ok: true, id }
  }

  /** Remove one connector. */
  async remove(id) {
    const data = await this.load()
    const next = data.connectors.filter(function (item) { return item.id !== id })
    if (next.length === data.connectors.length) return { ok: false, code: 'not-found', message: '未找到连接器 ' + id }
    await this.save(next)
    return { ok: true, id }
  }

  /** Toggle the enabled flag. */
  async setEnabled(id, enabled) {
    const data = await this.load()
    const target = data.connectors.find(function (item) { return item.id === id })
    if (target === undefined) return { ok: false, code: 'not-found', message: '未找到连接器 ' + id }
    target.enabled = enabled !== false
    target.updatedAt = new Date().toISOString()
    await this.save(data.connectors)
    return { ok: true, id, enabled: target.enabled }
  }

  /** Raw (unmasked) record for an outbound connection. */
  async raw(id) {
    const data = await this.load()
    return data.connectors.find(function (item) { return item.id === id })
  }

  /** Import every server from the WorkBuddy mcp.json that is not stored yet. */
  async importFromWorkbuddy() {
    const seeds = await this.workbuddyServers()
    const data = await this.load()
    const known = new Set(data.connectors.map(function (item) { return item.id }))
    const added = []
    const next = data.connectors.slice()
    for (const seed of seeds) {
      if (known.has(seed.id)) continue
      next.push({
        id: seed.id,
        name: seed.name,
        transport: seed.transport,
        command: seed.command,
        args: seed.args,
        url: seed.url,
        cwd: '',
        headers: {},
        env: {},
        enabled: true,
        note: '从 WorkBuddy mcp.json 导入',
        updatedAt: new Date().toISOString(),
      })
      added.push(seed.id)
    }
    if (added.length > 0) await this.save(next)
    return { ok: true, added }
  }
}

/** One live connection per connector id, reused across probes. */
export class ConnectorRuntime {
  constructor(store) {
    this.store = store
    this.live = new Map()
    this.toolCache = new Map()
  }

  async connectionFor(id) {
    const existing = this.live.get(id)
    if (existing !== undefined) return existing
    const record = await this.store.raw(id)
    if (record === undefined) throw new Error('未找到连接器 ' + id)
    const opened = await connect({
      transport: record.transport,
      command: record.command,
      args: record.args,
      cwd: record.cwd === '' ? undefined : record.cwd,
      env: record.env,
      url: record.url,
      headers: record.headers,
    }, 25000)
    this.live.set(id, opened.connection)
    return opened.connection
  }

  async drop(id) {
    const existing = this.live.get(id)
    if (existing === undefined) return
    this.live.delete(id)
    this.toolCache.delete(id)
    try {
      await existing.close()
    } catch {
      /* already gone */
    }
  }

  async closeAll() {
    const ids = Array.from(this.live.keys())
    for (const id of ids) await this.drop(id)
  }

  /** Connect (if needed) and list the server's tools. */
  async tools(id, timeoutMs) {
    const connection = await this.connectionFor(id)
    const tools = await listTools(connection, timeoutMs)
    this.toolCache.set(id, tools.map(function (tool) { return tool.name }))
    return tools
  }

  /** Call one tool through a connector. */
  async call(id, name, args) {
    const connection = await this.connectionFor(id)
    return callTool(connection, name, args, 120000)
  }

  cachedToolNames(id) {
    return this.toolCache.get(id)
  }
}

export { errorMessage, tryStat }
