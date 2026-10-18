/**
 * A small, dependency-free MCP client.
 *
 * The connector page needs three things from a connector that a static cordis
 * patch cannot give it: connect on demand, list the tools the server
 * advertises, and call one tool. The official @deepseek-ai/dsh-mcp-client
 * bundle does this too, but it registers its servers at composition time from
 * the patch file - so a server added from a settings panel would need a host
 * restart. This module speaks the protocol directly instead:
 *
 *   - stdio transport: spawn the command, newline-delimited JSON-RPC on
 *     stdin/stdout, stderr swallowed into a bounded ring buffer;
 *   - streamable-http transport: POST JSON-RPC, accept plain JSON or an SSE
 *     body, carry the Mcp-Session-Id header when the server issues one.
 *
 * Only the handful of methods the panel uses are implemented (initialize,
 * tools/list, tools/call, ping); everything else answers a JSON-RPC error.
 */

import { spawn } from 'node:child_process'

const PROTOCOL_VERSION = '2025-06-18'
const CLIENT_INFO = { name: 'dsh-workbuddy-suite', version: '0.1.0' }
const MAX_LINE = 8 * 1024 * 1024

function rpcError(message) {
  const error = new Error(message)
  error.code = 'MCP_ERROR'
  return error
}

/** Strip a BOM and trim; used on every inbound line. */
function cleanLine(line) {
  return line.replace(/^\uFEFF/, '').trim()
}

/**
 * A single MCP connection over stdio.
 * @param {{command: string, args?: string[], env?: Record<string, string>, cwd?: string}} spec
 */
export class StdioConnection {
  constructor(spec) {
    this.spec = spec
    this.nextId = 1
    this.pending = new Map()
    this.buffer = ''
    this.stderr = []
    this.closed = false
    this.child = undefined
  }

  get label() {
    return ['stdio', this.spec.command].concat(this.spec.args ?? []).join(' ')
  }

  async open(timeoutMs) {
    const child = spawn(this.spec.command, this.spec.args ?? [], {
      cwd: this.spec.cwd,
      env: Object.assign({}, process.env, this.spec.env ?? {}),
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    })
    this.child = child
    child.on('error', (error) => this.failAll(errorMessageOf(error)))
    child.on('exit', (code, signal) => {
      this.closed = true
      this.failAll('MCP 进程已退出 (code=' + String(code) + ', signal=' + String(signal) + ')'
        + (this.stderr.length > 0 ? '\n' + this.stderr.join('\n') : ''))
    })
    child.stdout.setEncoding('utf8')
    child.stdout.on('data', (chunk) => this.consume(chunk))
    child.stderr.setEncoding('utf8')
    child.stderr.on('data', (chunk) => {
      for (const line of String(chunk).split(/\r?\n/)) {
        if (line.trim() === '') continue
        this.stderr.push(line)
        while (this.stderr.length > 40) this.stderr.shift()
      }
    })
    const result = await this.request('initialize', {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: { tools: {} },
      clientInfo: CLIENT_INFO,
    }, timeoutMs)
    this.notify('notifications/initialized', {})
    return result
  }

  consume(chunk) {
    this.buffer += chunk
    if (this.buffer.length > MAX_LINE) {
      this.buffer = ''
      this.failAll('MCP 输出超过上限（' + String(MAX_LINE) + ' 字节）')
      return
    }
    for (;;) {
      const index = this.buffer.indexOf('\n')
      if (index < 0) return
      const line = cleanLine(this.buffer.slice(0, index))
      this.buffer = this.buffer.slice(index + 1)
      if (line === '') continue
      let message
      try {
        message = JSON.parse(line)
      } catch {
        continue
      }
      this.dispatch(message)
    }
  }

  dispatch(message) {
    if (message === null || typeof message !== 'object') return
    if (message.id === undefined || message.id === null) return
    const entry = this.pending.get(message.id)
    if (entry === undefined) return
    this.pending.delete(message.id)
    clearTimeout(entry.timer)
    if (message.error !== undefined) {
      entry.reject(rpcError(message.error.message ?? 'MCP 调用失败'))
      return
    }
    entry.resolve(message.result)
  }

  failAll(message) {
    for (const [id, entry] of this.pending) {
      clearTimeout(entry.timer)
      entry.reject(rpcError(message))
      this.pending.delete(id)
    }
  }

  write(payload) {
    if (this.closed || this.child === undefined) throw rpcError('MCP 连接已关闭')
    this.child.stdin.write(JSON.stringify(payload) + '\n')
  }

  notify(method, params) {
    try {
      this.write({ jsonrpc: '2.0', method, params })
    } catch {
      /* the peer went away; the next request reports it */
    }
  }

  request(method, params, timeoutMs = 20000) {
    if (this.closed) return Promise.reject(rpcError('MCP 连接已关闭'))
    const id = this.nextId
    this.nextId += 1
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(rpcError('MCP 调用超时：' + method))
      }, Math.max(1000, timeoutMs))
      this.pending.set(id, { resolve, reject, timer })
      try {
        this.write({ jsonrpc: '2.0', id, method, params })
      } catch (error) {
        clearTimeout(timer)
        this.pending.delete(id)
        reject(error)
      }
    })
  }

  async close() {
    this.closed = true
    this.failAll('MCP 连接已关闭')
    const child = this.child
    if (child === undefined) return
    try {
      child.stdin.end()
    } catch {
      /* already gone */
    }
    await new Promise((resolve) => {
      const timer = setTimeout(() => {
        try {
          child.kill()
        } catch {
          /* already gone */
        }
        resolve()
      }, 1500)
      child.once('exit', () => {
        clearTimeout(timer)
        resolve()
      })
    })
  }
}

/**
 * A single MCP connection over streamable HTTP.
 * @param {{url: string, headers?: Record<string, string>}} spec
 */
export class HttpConnection {
  constructor(spec) {
    this.spec = spec
    this.nextId = 1
    this.sessionId = undefined
    this.closed = false
  }

  get label() {
    return 'http ' + this.spec.url
  }

  headers() {
    const headers = Object.assign({
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
    }, this.spec.headers ?? {})
    if (this.sessionId !== undefined) headers['mcp-session-id'] = this.sessionId
    return headers
  }

  async send(payload, timeoutMs) {
    if (this.closed) throw rpcError('MCP 连接已关闭')
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), Math.max(1000, timeoutMs))
    let response
    try {
      response = await fetch(this.spec.url, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
    } catch (error) {
      clearTimeout(timer)
      throw rpcError('无法连接 MCP 服务：' + errorMessageOf(error))
    }
    clearTimeout(timer)
    const session = response.headers.get('mcp-session-id')
    if (session !== null && session !== '') this.sessionId = session
    const text = await response.text()
    if (!response.ok && text.trim() === '') {
      throw rpcError('MCP 服务返回 HTTP ' + String(response.status))
    }
    return parseBody(text, response.headers.get('content-type') ?? '')
  }

  async request(method, params, timeoutMs = 20000) {
    const id = this.nextId
    this.nextId += 1
    const body = await this.send({ jsonrpc: '2.0', id, method, params }, timeoutMs)
    if (body === undefined) throw rpcError('MCP 服务返回了空响应：' + method)
    if (body.error !== undefined) throw rpcError(body.error.message ?? 'MCP 调用失败')
    return body.result
  }

  notify(method, params) {
    this.send({ jsonrpc: '2.0', method, params }, 10000).catch(function () {
      /* notifications are best-effort */
    })
  }

  async open(timeoutMs) {
    const result = await this.request('initialize', {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: { tools: {} },
      clientInfo: CLIENT_INFO,
    }, timeoutMs)
    this.notify('notifications/initialized', {})
    return result
  }

  async close() {
    this.closed = true
  }
}

function errorMessageOf(error) {
  if (error instanceof Error) return error.message
  return String(error)
}

/** Decode a streamable-HTTP body: plain JSON or one SSE event stream. */
function parseBody(text, contentType) {
  const trimmed = text.trim()
  if (trimmed === '') return undefined
  if (contentType.includes('text/event-stream') || trimmed.startsWith('event:') || trimmed.startsWith('data:')) {
    let last
    for (const block of trimmed.split(/\r?\n\r?\n/)) {
      const dataLines = block.split(/\r?\n/)
        .filter(function (line) { return line.startsWith('data:') })
        .map(function (line) { return line.slice(5).trim() })
      if (dataLines.length === 0) continue
      const payload = dataLines.join('\n')
      if (payload === '' || payload === '[DONE]') continue
      try {
        last = JSON.parse(payload)
      } catch {
        continue
      }
    }
    return last
  }
  try {
    return JSON.parse(trimmed)
  } catch {
    throw rpcError('无法解析 MCP 响应：' + trimmed.slice(0, 200))
  }
}

/**
 * Open a connection for one connector entry.
 * @param {object} server {transport, command, args, env, cwd, url, headers}
 * @returns {Promise<StdioConnection | HttpConnection>}
 */
export async function connect(server, timeoutMs = 20000) {
  const declared = typeof server.transport === 'string' ? server.transport : ''
  const hasUrl = typeof server.url === 'string' && server.url.trim() !== ''
  const transport = declared === 'streamable-http' || (declared === '' && hasUrl) ? 'streamable-http' : 'stdio'
  const connection = transport === 'streamable-http'
    ? new HttpConnection({ url: server.url, headers: server.headers })
    : new StdioConnection({ command: server.command, args: server.args, env: server.env, cwd: server.cwd })
  try {
    const init = await connection.open(timeoutMs)
    return { connection, init }
  } catch (error) {
    await connection.close()
    throw error
  }
}

/** List every tool a connected server advertises (with paging). */
export async function listTools(connection, timeoutMs = 20000) {
  const tools = []
  let cursor
  for (let page = 0; page < 20; page += 1) {
    const params = cursor === undefined ? {} : { cursor }
    const result = await connection.request('tools/list', params, timeoutMs)
    const batch = result !== null && typeof result === 'object' && Array.isArray(result.tools) ? result.tools : []
    for (const tool of batch) {
      if (tool === null || typeof tool !== 'object') continue
      tools.push({
        name: String(tool.name ?? ''),
        description: typeof tool.description === 'string' ? tool.description : '',
        inputSchema: tool.inputSchema,
      })
    }
    const next = result !== null && typeof result === 'object' ? result.nextCursor : undefined
    if (typeof next !== 'string' || next === '') break
    cursor = next
  }
  return tools
}

/** Call one tool and flatten the MCP result into panel-friendly text. */
export async function callTool(connection, name, args, timeoutMs = 60000) {
  const result = await connection.request('tools/call', { name, arguments: args ?? {} }, timeoutMs)
  const content = result !== null && typeof result === 'object' && Array.isArray(result.content) ? result.content : []
  const parts = []
  for (const item of content) {
    if (item === null || typeof item !== 'object') continue
    if (item.type === 'text' && typeof item.text === 'string') parts.push(item.text)
    else if (item.type === 'resource' && item.resource !== undefined && typeof item.resource.text === 'string') parts.push(item.resource.text)
    else parts.push('[' + String(item.type ?? 'content') + ']')
  }
  return {
    isError: result !== null && typeof result === 'object' && result.isError === true,
    text: parts.join('\n').slice(0, 200000),
    structured: result !== null && typeof result === 'object' ? result.structuredContent : undefined,
  }
}
