/**
 * WorkBuddy skill marketplace (api.skillhub.cn) — the data source behind the
 * WorkBuddy app's own "技能" tab: featured skills, category chips, usage and
 * download counters, and one-click install.
 *
 * Everything here is read-only against the public API; installing a skill
 * downloads its zip and unpacks it into <dshHome>/skills/<slug> with this
 * plugin's marker file, so removal stays under the same ownership fence as a
 * WorkBuddy-side import.
 */

import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { inflateRawSync } from 'node:zlib'
import { createHash } from 'node:crypto'

import { SKILL_MARKER } from './skills.js'

export const SKILLHUB_BASE = 'https://api.skillhub.cn'
export const ICON_HOSTS = [
  'myqcloud.com',
  'tencent-cloud.com',
  'codebuddy.cn',
  'workbuddy.cn',
  'skillhub.cn',
]

const LIST_TTL = 60000
const CACHE_LIMIT = 800
const ICON_MAX_BYTES = 2 * 1024 * 1024
const ZIP_MAX_BYTES = 24 * 1024 * 1024
const FETCH_TIMEOUT = 20000

const memo = new Map()

function cacheGet(key) {
  const hit = memo.get(key)
  if (hit === undefined) return undefined
  if (hit.expires < Date.now()) {
    memo.delete(key)
    return undefined
  }
  return hit.value
}

function cacheSet(key, value, ttl) {
  if (memo.size > CACHE_LIMIT) memo.clear()
  memo.set(key, { value, expires: Date.now() + (ttl ?? LIST_TTL) })
  return value
}

/** Drop every cached page (used after an install changes the installed set). */
export function invalidateSkillMarket() {
  memo.clear()
}

async function getJson(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
    headers: { accept: 'application/json' },
  })
  if (!response.ok) throw new Error('技能市场返回 ' + response.status)
  const payload = await response.json()
  if (payload === null || typeof payload !== 'object') throw new Error('技能市场返回了非 JSON 内容')
  return payload
}

/** Chinese-first description: description_zh, else summary_zh, else description. */
export function pickText(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim() !== '') return value.trim()
  }
  return ''
}

/** Map one API row into the card the panel renders. */
export function toCard(raw, installed) {
  const namespace = raw.namespace ?? {}
  const handle = typeof namespace.handle === 'string' ? namespace.handle : ''
  const slug = String(raw.slug ?? '')
  const id = handle === '' ? slug : handle + '/' + slug
  const stats = raw.stats ?? {}
  return {
    key: 'market:' + id,
    id,
    slug,
    namespace: handle,
    name: pickText(raw.name, raw.displayName, namespace.displayName, slug),
    description: pickText(raw.description_zh, raw.summary_zh, raw.description, raw.summary),
    descriptionEn: pickText(raw.description_en, raw.summary_en, raw.summary) || '',
    category: String(raw.category ?? ''),
    version: String(raw.version ?? ''),
    installs: Number(raw.installs ?? stats.installs ?? 0) || 0,
    downloads: Number(raw.downloads ?? stats.downloads ?? 0) || 0,
    stars: Number(raw.stars ?? stats.stars ?? 0) || 0,
    owner: String((raw.publisher && raw.publisher.name) || raw.ownerName || ''),
    requiresApiKey: Boolean(raw.labels && raw.labels.requires_api_key === 'true'),
    iconUrl: pickText(raw.iconUrl, raw.icon_url) === ''
      ? ''
      : 'dsh-workbuddy-suite/api/skill-icon?slug=' + encodeURIComponent(slug) + '&ns=' + encodeURIComponent(handle) + '&v=' + encodeURIComponent(String(raw.version ?? '')),
    remoteIcon: pickText(raw.iconUrl, raw.icon_url),
    installed: installed === true,
  }
}

/** Page through the marketplace catalogue. */
export async function listMarketSkills(options) {
  const page = Math.max(1, Number(options.page ?? 1))
  const pageSize = Math.min(100, Math.max(1, Number(options.pageSize ?? 24)))
  const sortBy = ['installs', 'downloads', 'stars', 'score', 'updated_at'].includes(options.sortBy)
    ? options.sortBy
    : 'installs'
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), sortBy, order: 'desc' })
  if (typeof options.category === 'string' && options.category !== '') params.set('category', options.category)
  if (typeof options.keyword === 'string' && options.keyword.trim() !== '') params.set('keyword', options.keyword.trim())
  const cacheKey = 'list:' + params.toString()
  const cached = cacheGet(cacheKey)
  if (cached !== undefined) return cached
  const payload = await getJson(SKILLHUB_BASE + '/api/skills?' + params.toString())
  const data = payload.data ?? {}
  const rows = Array.isArray(data.skills) ? data.skills : []
  return cacheSet(cacheKey, {
    total: Number(data.total ?? rows.length) || 0,
    page,
    pageSize,
    cards: rows.map(function (row) { return toCard(row, false) }),
  })
}

/** The 13 marketplace categories. */
export async function marketCategories() {
  const cached = cacheGet('categories')
  if (cached !== undefined) return cached
  const payload = await getJson(SKILLHUB_BASE + '/api/v1/categories')
  const rows = Array.isArray(payload.items) ? payload.items : []
  return cacheSet('categories', rows.map(function (row) {
    return {
      key: String(row.key ?? ''),
      name: pickText(row.name, row.nameEn, row.key),
      nameEn: String(row.nameEn ?? ''),
    }
  }).filter(function (row) { return row.key !== '' }), 3600000)
}

/** Free-text search across the marketplace. */
export async function searchMarketSkills(query, limit) {
  const q = String(query ?? '').trim()
  if (q === '') return []
  const params = new URLSearchParams({ q, limit: String(Math.min(50, Math.max(1, Number(limit ?? 24)))) })
  const cached = cacheGet('search:' + params.toString())
  if (cached !== undefined) return cached
  const payload = await getJson(SKILLHUB_BASE + '/api/v1/search?' + params.toString())
  const rows = Array.isArray(payload.results) ? payload.results : []
  return cacheSet('search:' + params.toString(), rows.map(function (row) { return toCard(row, false) }))
}

/** One skill's full detail row. */
export async function marketSkillDetail(options) {
  const slug = String(options.slug ?? '')
  if (slug === '') return undefined
  const params = new URLSearchParams()
  if (typeof options.namespace === 'string' && options.namespace !== '') params.set('namespace', options.namespace)
  const suffix = params.toString() === '' ? '' : '?' + params.toString()
  const cacheKey = 'detail:' + slug + suffix
  const cached = cacheGet(cacheKey)
  if (cached !== undefined) return cached
  const payload = await getJson(SKILLHUB_BASE + '/api/v1/skills/' + encodeURIComponent(slug) + suffix)
  const skill = payload.skill ?? {}
  const card = toCard(Object.assign({}, skill, {
    slug: payload.slug ?? slug,
    namespace: payload.namespace ?? skill.namespace,
  }), false)
  const examples = []
  for (const item of (Array.isArray(skill.examples) ? skill.examples : [])) {
    const text = typeof item === 'string' ? item : pickText(item.zh, item.en)
    if (text !== '') examples.push(text)
  }
  return cacheSet(cacheKey, Object.assign(card, {
    examples,
    security: (payload.securityReports && payload.securityReports.keen && payload.securityReports.keen.statusText) || '',
    changelog: (payload.latestVersion && payload.latestVersion.changelog) || '',
    versions: Number(skill.stats && skill.stats.versions) || 0,
    comments: Number(skill.stats && skill.stats.comments) || 0,
    ownerAvatar: (payload.owner && payload.owner.image) || '',
    homepage: String(skill.homepage ?? ''),
  }), 120000)
}

/** Guard: only images on known CDNs are proxied. */
export function iconUrlAllowed(raw) {
  let url
  try {
    url = new URL(String(raw))
  } catch {
    return false
  }
  if (url.protocol !== 'https:') return false
  const host = url.hostname.toLowerCase()
  return ICON_HOSTS.some(function (suffix) { return host === suffix || host.endsWith('.' + suffix) })
}

function extensionOf(contentType, url) {
  const type = String(contentType ?? '').toLowerCase()
  if (type.includes('svg')) return '.svg'
  if (type.includes('webp')) return '.webp'
  if (type.includes('jpeg') || type.includes('jpg')) return '.jpg'
  if (type.includes('png')) return '.png'
  const match = /\.(png|svg|webp|jpg|jpeg)(\?|$)/i.exec(String(url ?? ''))
  return match === null ? '.png' : '.' + match[1].toLowerCase()
}

/** The remote icon a marketplace card points at (resolved lazily). */
export async function remoteIconFor(options) {
  const slug = String(options.slug ?? '')
  const namespace = String(options.namespace ?? '')
  const direct = String(options.url ?? '')
  if (direct !== '' && iconUrlAllowed(direct)) return direct
  const detail = await marketSkillDetail({ slug, namespace })
  if (detail === undefined) return undefined
  const url = detail.remoteIcon
  if (url === '' || !iconUrlAllowed(url)) return undefined
  return url
}

/** Proxy + disk-cache one marketplace icon. */
export async function skillIconBytes(options) {
  const dshHome = options.dshHome
  const url = await remoteIconFor({ slug: options.slug, namespace: options.namespace, url: options.url })
  if (url === undefined) return undefined
  const dir = join(dshHome, 'workbuddy-suite', 'skill-icon-cache')
  const hash = createHash('sha256').update(url).digest('hex').slice(0, 32)
  const candidates = ['.png', '.svg', '.webp', '.jpg']
  for (const ext of candidates) {
    try {
      const bytes = await readFile(join(dir, hash + ext))
      return { bytes, contentType: ext === '.svg' ? 'image/svg+xml' : 'image/' + ext.slice(1) }
    } catch {
      /* try the next extension */
    }
  }
  let response
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT) })
  } catch {
    return undefined
  }
  if (!response.ok) return undefined
  const type = String(response.headers.get('content-type') ?? '')
  if (!type.startsWith('image/')) return undefined
  const buffer = Buffer.from(await response.arrayBuffer())
  if (buffer.length === 0 || buffer.length > ICON_MAX_BYTES) return undefined
  const ext = extensionOf(type, url)
  try {
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, hash + ext), buffer)
  } catch {
    /* caching is best effort */
  }
  return { bytes: buffer, contentType: type.split(';')[0] }
}

/**
 * Minimal ZIP reader (stored + deflate entries, no zip64 needed for skill
 * bundles). Returns [{name, data}] with directory entries dropped.
 */
export function readZip(buffer) {
  const entries = []
  let eocd = -1
  for (let at = buffer.length - 22; at >= 0 && at >= buffer.length - 65558; at -= 1) {
    if (buffer.readUInt32LE(at) === 0x06054b50) {
      eocd = at
      break
    }
  }
  if (eocd < 0) throw new Error('不是有效的 zip 文件')
  const count = buffer.readUInt16LE(eocd + 10)
  let cursor = buffer.readUInt32LE(eocd + 16)
  for (let index = 0; index < count; index += 1) {
    if (cursor + 46 > buffer.length || buffer.readUInt32LE(cursor) !== 0x02014b50) break
    const method = buffer.readUInt16LE(cursor + 10)
    const compressedSize = buffer.readUInt32LE(cursor + 20)
    const size = buffer.readUInt32LE(cursor + 24)
    const nameLength = buffer.readUInt16LE(cursor + 28)
    const extraLength = buffer.readUInt16LE(cursor + 30)
    const commentLength = buffer.readUInt16LE(cursor + 32)
    const localOffset = buffer.readUInt32LE(cursor + 42)
    const name = buffer.toString('utf8', cursor + 46, cursor + 46 + nameLength)
    cursor += 46 + nameLength + extraLength + commentLength
    if (name.endsWith('/') || name === '') continue
    const local = localOffset
    if (local + 30 > buffer.length || buffer.readUInt32LE(local) !== 0x04034b50) throw new Error('zip 局部头损坏：' + name)
    const localNameLength = buffer.readUInt16LE(local + 26)
    const localExtraLength = buffer.readUInt16LE(local + 28)
    const start = local + 30 + localNameLength + localExtraLength
    const raw = buffer.subarray(start, start + (compressedSize === 0 ? size : compressedSize))
    let data
    if (method === 0) data = Buffer.from(raw)
    else if (method === 8) data = inflateRawSync(raw)
    else throw new Error('不支持的 zip 压缩方式：' + method)
    entries.push({ name, data })
  }
  return entries
}

/** Reject absolute paths and '..' escapes inside an archive. */
export function safeEntryPath(name) {
  const normalized = String(name).replace(/\\/g, '/')
  if (normalized.startsWith('/') || /^[A-Za-z]:/.test(normalized)) return undefined
  const parts = normalized.split('/').filter(function (part) { return part !== '' && part !== '.' })
  if (parts.length === 0) return undefined
  if (parts.some(function (part) { return part === '..' })) return undefined
  return parts.join('/')
}

/** Strip the single wrapping folder skill bundles are shipped in. */
export function stripCommonRoot(entries) {
  if (entries.length === 0) return entries
  const first = entries[0].name.split('/')
  if (first.length < 2) return entries
  const root = first[0]
  const all = entries.every(function (entry) { return entry.name.startsWith(root + '/') })
  if (!all) return entries
  return entries.map(function (entry) {
    return { name: entry.name.slice(root.length + 1), data: entry.data }
  })
}

/** Read the installed-skill markers WorkBuddy itself writes. */
export async function installedSkillMeta(options) {
  const root = join(options.workbuddyHome ?? '', 'skills')
  let names = []
  try {
    const entries = await readdir(root, { withFileTypes: true })
    names = entries.filter(function (entry) { return entry.isDirectory() }).map(function (entry) { return entry.name })
  } catch {
    return new Map()
  }
  const map = new Map()
  for (const name of names) {
    for (const file of ['_skillhub_meta.json', '_meta.json', 'manifest.json']) {
      let payload
      try {
        payload = JSON.parse(await readFile(join(root, name, file), 'utf8'))
      } catch {
        continue
      }
      const slug = String(payload.slug ?? '')
      if (slug === '') continue
      const namespace = String(payload.namespace ?? '')
      const id = namespace === '' ? slug : namespace + '/' + slug
      if (!map.has(id) && !map.has(slug)) map.set(id, { slug, namespace, folder: join(root, name), version: String(payload.version ?? '') })
      break
    }
  }
  return map
}

/** Download and unpack one marketplace skill into the DSH user skills root. */
export async function installMarketSkill(options) {
  const slug = String(options.slug ?? '')
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(slug)) return { ok: false, code: 'bad-id', message: '非法的技能 slug：' + slug }
  const namespace = String(options.namespace ?? '')
  const params = new URLSearchParams({ slug })
  if (namespace !== '') params.set('namespace', namespace)
  let response
  try {
    response = await fetch(SKILLHUB_BASE + '/api/v1/download?' + params.toString(), {
      signal: AbortSignal.timeout(60000),
    })
  } catch (error) {
    return { ok: false, code: 'network', message: '下载技能失败：' + String(error && error.message ? error.message : error) }
  }
  if (!response.ok) return { ok: false, code: 'network', message: '下载技能失败：HTTP ' + response.status }
  const buffer = Buffer.from(await response.arrayBuffer())
  if (buffer.length === 0 || buffer.length > ZIP_MAX_BYTES) return { ok: false, code: 'too-large', message: '技能包大小异常：' + buffer.length }
  let entries
  try {
    entries = stripCommonRoot(readZip(buffer))
  } catch (error) {
    return { ok: false, code: 'bad-zip', message: String(error && error.message ? error.message : error) }
  }
  if (entries.length === 0) return { ok: false, code: 'empty', message: '技能包为空' }
  const root = join(options.dshHome, 'skills')
  const target = join(root, slug)
  const existing = await stat(target).catch(function () { return undefined })
  if (existing !== undefined) {
    let marker
    try {
      marker = JSON.parse(await readFile(join(target, SKILL_MARKER), 'utf8'))
    } catch {
      marker = undefined
    }
    if (marker === undefined) return { ok: false, code: 'exists', message: '同名技能已存在（非本插件安装）：' + target }
    await rm(target, { recursive: true, force: true })
  }
  await mkdir(target, { recursive: true })
  for (const entry of entries) {
    const relative = safeEntryPath(entry.name)
    if (relative === undefined) continue
    const destination = join(target, relative)
    await mkdir(join(destination, '..'), { recursive: true })
    await writeFile(destination, entry.data)
  }
  await writeFile(join(target, SKILL_MARKER), JSON.stringify({
    installedBy: 'dsh-workbuddy-suite',
    source: 'skillhub',
    slug,
    namespace,
    installedAt: new Date().toISOString(),
  }, null, 2), 'utf8')
  invalidateSkillMarket()
  return { ok: true, path: target, slug, key: 'user:' + target, files: entries.length }
}
/** Rotating "featured" trio, like WorkBuddy's 换一批 button. */
export async function featuredSkills(seed) {
  const page = await listMarketSkills({ page: 1, pageSize: 100, sortBy: 'installs' })
  const pool = page.cards
  if (pool.length === 0) return []
  const offset = ((Number(seed ?? 0) % Math.max(1, Math.floor(pool.length / 3))) + Math.max(1, Math.floor(pool.length / 3))) % Math.max(1, Math.floor(pool.length / 3))
  return pool.slice(offset * 3, offset * 3 + 3)
}

/**
 * One call that fills the whole skills tab: catalogue page, categories,
 * featured trio, and which skills are already on disk.
 */
export async function marketOverview(options) {
  const warnings = []
  const installed = new Map()
  const installedIds = new Set()
  try {
    const localMeta = await installedSkillMeta({ workbuddyHome: options.workbuddyHome })
    for (const [id, meta] of localMeta) {
      installedIds.add(id)
      if (meta.slug !== '') installedIds.add(meta.slug)
      installed.set(id, meta)
    }
  } catch (error) {
    warnings.push('WorkBuddy 技能目录：' + String(error && error.message ? error.message : error))
  }
  const localSkills = Array.isArray(options.localSkills) ? options.localSkills : []
  for (const skill of localSkills) {
    installedIds.add(String(skill.name ?? ''))
    // The install lands in <dshHome>/skills/<slug>, so the folder name is the
    // marketplace slug even when SKILL.md renames the skill.
    const key = String(skill.key ?? '')
    const cut = key.lastIndexOf(':')
    const folder = cut >= 0 ? key.slice(cut + 1) : ''
    if (folder !== '') {
      const base = folder.split(/[\\/]/).filter(Boolean).pop()
      if (base) installedIds.add(base)
    }
  }

  let cards = []
  let total = 0
  let categories = []
  let featured = []
  try {
    const keyword = typeof options.keyword === 'string' ? options.keyword.trim() : ''
    const page = keyword !== ''
      ? { total: 0, cards: await searchMarketSkills(keyword, options.pageSize) }
      : await listMarketSkills({
          page: options.page,
          pageSize: options.pageSize,
          sortBy: options.sortBy,
          category: options.category,
        })
    total = page.total
    cards = page.cards
  } catch (error) {
    warnings.push('技能市场列表：' + String(error && error.message ? error.message : error))
  }
  try {
    categories = await marketCategories()
  } catch (error) {
    warnings.push('技能市场分类：' + String(error && error.message ? error.message : error))
  }
  try {
    featured = await featuredSkills(options.featuredSeed)
  } catch (error) {
    warnings.push('精选技能：' + String(error && error.message ? error.message : error))
  }
  function flag(card) {
    return Object.assign({}, card, {
      installed: installedIds.has(card.id) || installedIds.has(card.slug),
    })
  }
  return {
    cards: cards.map(flag),
    featured: featured.map(flag),
    categories,
    total,
    page: Number(options.page ?? 1),
    pageSize: Number(options.pageSize ?? 24),
    pageCount: Math.max(1, Math.ceil(total / Math.max(1, Number(options.pageSize ?? 24)))),
    installedCount: localSkills.length,
    installedLocal: localSkills.map(function (skill) {
      return { key: skill.key, name: skill.name, origin: skill.origin, description: skill.description }
    }),
    warnings,
  }
}
