/**
 * Shared helpers for dsh-workbuddy-suite: HTTP plumbing, the origin fence
 * ported from dsh-workbuddy-expert (proven on this runtime), path roots and
 * small filesystem utilities. Node built-ins only — the plugin ships with
 * zero runtime dependencies so a `file:` install never needs a build step.
 */

import { realpath, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { isAbsolute, join, relative, resolve, sep } from 'node:path'

/** Absolute route base; the browser side addresses it relative to the document base. */
export const ROUTE_BASE = '/dsh-workbuddy-suite'

/** Write a JSON payload with no-store caching. */
export function sendJson(response, status, payload) {
  response.writeHead(status, {
    'cache-control': 'no-store',
    'content-type': 'application/json; charset=utf-8',
  })
  response.end(JSON.stringify(payload))
}

/** Whether a `Host` header names a loopback authority (DNS-rebinding defence). */
export function loopbackAuthority(host) {
  if (host === undefined) return false
  const lower = String(host).toLowerCase()
  const name = lower.startsWith('[') ? lower.slice(0, lower.indexOf(']') + 1) : lower.split(':')[0]
  return name === '127.0.0.1' || name === 'localhost' || name === '[::1]'
}

/**
 * Mutating routes accept same-origin POSTs only. A PRESENT Host must name
 * loopback; `sec-fetch-site: cross-site` is refused; an ABSENT Origin passes
 * (the Desktop proxy strips it); a present Origin must equal Host.
 */
export function sameOrigin(request) {
  const host = request.headers.host
  if (host !== undefined && !loopbackAuthority(host)) return false
  if (request.headers['sec-fetch-site'] === 'cross-site') return false
  const origin = request.headers.origin
  if (origin === undefined) return true
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

/** Read and parse a JSON body, rejecting anything over the cap. */
export async function readJsonBody(request, maxBytes = 65536) {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.length
    if (size > maxBytes) throw new Error('request body too large')
    chunks.push(buffer)
  }
  const text = Buffer.concat(chunks).toString('utf8').trim()
  return text === '' ? {} : JSON.parse(text)
}

/** One-line message for thrown values. */
export function errorMessage(error) {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

/** Expand a leading `~` against the current home directory. */
export function expandTildePath(raw) {
  if (typeof raw !== 'string' || raw === '') return raw
  if (raw === '~') return homedir()
  if (raw.startsWith('~/') || raw.startsWith('~\\')) return join(homedir(), raw.slice(2))
  return raw
}

/** DSH home: explicit config > $DSH_HOME > ~/.dsh. */
export function resolveDshHome(configured) {
  if (typeof configured === 'string' && configured.trim() !== '') return resolve(configured)
  const env = process.env.DSH_HOME
  if (typeof env === 'string' && env.trim() !== '') return resolve(env)
  return join(homedir(), '.dsh')
}

/** Agents home (~/.agents), overridable through $AGENTS_HOME. */
export function resolveAgentsHome(configured) {
  if (typeof configured === 'string' && configured.trim() !== '') return resolve(configured)
  const env = process.env.AGENTS_HOME
  if (typeof env === 'string' && env.trim() !== '') return resolve(env)
  return join(homedir(), '.agents')
}

/**
 * WorkBuddy home — the desktop app's user data root, the read-only source of
 * the expert/skill/connector catalogs this plugin mirrors.
 */
export function resolveWorkbuddyHome(configured) {
  if (typeof configured === 'string' && configured.trim() !== '') return resolve(configured)
  const env = process.env.WORKBUDDY_HOME
  if (typeof env === 'string' && env.trim() !== '') return resolve(env)
  return join(homedir(), '.workbuddy')
}

/** True when a fully resolved candidate sits strictly inside a fully resolved root. */
export function isWithinRoot(rootReal, candidateReal) {
  const rel = relative(rootReal, candidateReal)
  return rel !== '' && rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel)
}

/** realpath that answers undefined instead of throwing. */
export async function tryRealpath(target) {
  try {
    return await realpath(target)
  } catch {
    return undefined
  }
}

/** stat that answers undefined instead of throwing. */
export async function tryStat(target) {
  try {
    return await stat(target)
  } catch {
    return undefined
  }
}

/** Stable short id for a filesystem path (used as a client row key). */
export function pathId(target) {
  let hash = 0
  const text = String(target)
  for (let index = 0; index < text.length; index += 1) {
    hash = (Math.imul(hash, 31) + text.charCodeAt(index)) | 0
  }
  return (hash >>> 0).toString(36)
}

/** Bounded async pool — keeps a wide scan from opening hundreds of handles. */
export async function mapLimit(items, limit, worker) {
  const results = new Array(items.length)
  let cursor = 0
  const runners = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    for (;;) {
      const index = cursor
      cursor += 1
      if (index >= items.length) return
      results[index] = await worker(items[index], index)
    }
  })
  await Promise.all(runners)
  return results
}
