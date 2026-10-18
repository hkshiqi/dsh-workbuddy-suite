/** A minimal stdio MCP server used by the smoke test. */
import { createInterface } from 'node:readline'

const TOOLS = [
  {
    name: 'echo',
    description: 'Echo the given text back',
    inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] },
  },
]

function reply(payload) {
  process.stdout.write(JSON.stringify(payload) + '\n')
}

const lines = createInterface({ input: process.stdin })
lines.on('line', function (line) {
  const text = line.trim()
  if (text === '') return
  let message
  try {
    message = JSON.parse(text)
  } catch {
    return
  }
  if (message.id === undefined) return
  if (message.method === 'initialize') {
    reply({
      jsonrpc: '2.0',
      id: message.id,
      result: {
        protocolVersion: '2025-06-18',
        capabilities: { tools: {} },
        serverInfo: { name: 'fixture', version: '0.0.1' },
      },
    })
    return
  }
  if (message.method === 'tools/list') {
    reply({ jsonrpc: '2.0', id: message.id, result: { tools: TOOLS } })
    return
  }
  if (message.method === 'tools/call') {
    const args = message.params && message.params.arguments ? message.params.arguments : {}
    reply({
      jsonrpc: '2.0',
      id: message.id,
      result: { content: [{ type: 'text', text: 'echo: ' + String(args.text ?? '') }] },
    })
    return
  }
  reply({ jsonrpc: '2.0', id: message.id, error: { code: -32601, message: 'unknown method ' + String(message.method) } })
})
