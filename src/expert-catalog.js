/**
 * Expert catalog: the 448-entry WorkBuddy expert marketplace manifest.
 *
 * The desktop app caches the whole marketplace at
 *   <wbHome>/app/cache/experts/manifest.json   (categories + experts)
 *   <wbHome>/app/cache/experts/metadata.json   (CDN baseUrl + manifest hash)
 * Every entry is bilingual ({zh, en}) and carries an avatar path relative to
 * the CDN base (`/avatars/<file>.png`). The avatars are NOT cached locally, so
 * this module proxies them: the route handler asks for bytes, we keep a copy
 * under <dshHome>/workbuddy-suite/avatar-cache/ and fetch from the CDN only on
 * a miss. A failed fetch stays a failure (the panel falls back to initials).
 *
 * Everything here is read-only against WorkBuddy.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

import { tryStat } from './util.js'

/** Where the desktop app caches its marketplace manifest. */
export const MANIFEST_RELATIVE = ['app', 'cache', 'experts', 'manifest.json']

/** Fallback CDN base when metadata.json is missing or unreadable. */
export const DEFAULT_CDN_BASE = 'https://acc-1258344699.cos.accelerate.myqcloud.com/workbuddy/expert-marketplace'

const AVATAR_MAX_BYTES = 4 * 1024 * 1024

function asString(value) {
  return typeof value === 'string' ? value : ''
}

/** Pick the Chinese side of a {en, zh} pair, falling back to English. */
export function pickZh(pair) {
  if (pair === null || typeof pair !== 'object') return asString(pair)
  return asString(pair.zh) !== '' ? asString(pair.zh) : asString(pair.en)
}

/** Pick the English side of a {en, zh} pair, falling back to Chinese. */
function pickEn(pair) {
  if (pair === null || typeof pair !== 'object') return asString(pair)
  return asString(pair.en) !== '' ? asString(pair.en) : asString(pair.zh)
}

/** Localized string list out of [{zh,en}] or [string]. */
function localizedList(list) {
  if (!Array.isArray(list)) return []
  const out = []
  for (const item of list) {
    const value = typeof item === 'string' ? item : pickZh(item)
    if (value !== '') out.push(value)
  }
  return out
}

async function readJson(target) {
  try {
    return JSON.parse(await readFile(target, 'utf8'))
  } catch {
    return undefined
  }
}

/**
 * Read the cached marketplace manifest plus its CDN coordinates.
 * @param {{workbuddyHome: string}} options
 * @returns {Promise<{cards: object[], categories: object[], baseUrl: string, manifestPath: string} | undefined>}
 */
export async function loadExpertCatalog(options) {
  const base = join(options.workbuddyHome, ...MANIFEST_RELATIVE)
  const manifest = await readJson(base)
  if (manifest === null || typeof manifest !== 'object') return undefined
  if (!Array.isArray(manifest.experts)) return undefined

  const metadata = await readJson(join(dirname(base), 'metadata.json'))
  let baseUrl = DEFAULT_CDN_BASE
  if (metadata !== null && typeof metadata === 'object' && typeof metadata.sourceSignature === 'string') {
    try {
      const signature = JSON.parse(metadata.sourceSignature)
      if (typeof signature.baseUrl === 'string' && signature.baseUrl.startsWith('https://')) {
        baseUrl = signature.baseUrl.replace(/\/+$/, '')
      }
    } catch {
      /* keep the default base */
    }
  }

  const categories = []
  const categoryName = new Map()
  if (Array.isArray(manifest.categories)) {
    for (const category of manifest.categories) {
      if (category === null || typeof category !== 'object') continue
      const id = asString(category.id)
      if (id === '') continue
      const name = pickZh(category.name)
      categoryName.set(id, name)
      categories.push({
        id,
        name,
        nameEn: pickEn(category.name),
        description: pickZh(category.description),
        count: 0,
      })
    }
  }

  const cards = []
  for (const entry of manifest.experts) {
    if (entry === null || typeof entry !== 'object') continue
    const id = asString(entry.id)
    if (id === '') continue
    const tags = localizedList(entry.tags)
    const quickPrompts = localizedList(entry.quickPrompts)
    const categoryId = asString(entry.categoryId)
    const avatarRel = asString(entry.avatar)
    const card = {
      key: 'catalog:' + id,
      id,
      name: pickZh(entry.displayName) || id,
      nameEn: pickEn(entry.displayName) || id,
      profession: pickZh(entry.profession),
      description: pickZh(entry.description),
      descriptionEn: pickEn(entry.description),
      tags: tags.slice(0, 4),
      allTags: tags,
      quickPrompts: quickPrompts.slice(0, 8),
      origin: 'catalog',
      kind: asString(entry.expertType) === 'team' ? 'team' : 'expert',
      teamSize: undefined,
      categoryId,
      categoryName: categoryName.get(categoryId) ?? '',
      version: '',
      skills: [],
      agentFiles: [],
      homepage: '',
      promptFile: asString(entry.promptFile),
      plugin: asString(entry.plugin),
      agentName: asString(entry.agentName),
      installed: false,
      __avatarRel: avatarRel === '' ? undefined : avatarRel,
    }
    cards.push(card)
    const category = categories.find(function (item) { return item.id === categoryId })
    if (category !== undefined) category.count += 1
  }

  return { cards, categories, baseUrl, manifestPath: base }
}

/** Cache file for one catalog avatar; the extension is kept so the route can type it. */
function cacheFileFor(dshHome, id, rel) {
  const ext = /(\.png|\.jpe?g|\.webp|\.svg)$/i.exec(rel)
  return join(dshHome, 'workbuddy-suite', 'avatar-cache', id + (ext === null ? '.png' : ext[1].toLowerCase()))
}

const MIME_BY_EXT = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
}

function mimeFor(file) {
  const ext = (/\.(png|jpe?g|webp|svg)$/i.exec(file) ?? [])[0]
  return ext === undefined ? 'image/png' : (MIME_BY_EXT[ext.toLowerCase()] ?? 'image/png')
}

/**
 * Bytes for one catalog avatar: disk cache first, then the CDN.
 * @returns {Promise<{bytes: Buffer, contentType: string} | undefined>}
 */
export async function catalogAvatarBytes(options) {
  const rel = options.rel
  if (rel === '' || !rel.startsWith('/')) return undefined
  const file = cacheFileFor(options.dshHome, options.id, rel)
  const cached = await tryStat(file)
  if (cached !== undefined && cached.isFile() && cached.size > 0) {
    try {
      return { bytes: await readFile(file), contentType: mimeFor(file) }
    } catch {
      /* fall through to the network */
    }
  }
  const url = options.baseUrl.replace(/\/+$/, '') + rel
  let response
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(20000),
      headers: { accept: 'image/png,image/*;q=0.8' },
    })
  } catch {
    return undefined
  }
  if (!response.ok) return undefined
  const type = String(response.headers.get('content-type') ?? '')
  if (type !== '' && !type.startsWith('image/')) return undefined
  let buffer
  try {
    buffer = Buffer.from(await response.arrayBuffer())
  } catch {
    return undefined
  }
  if (buffer.length === 0 || buffer.length > AVATAR_MAX_BYTES) return undefined
  try {
    await mkdir(dirname(file), { recursive: true })
    await writeFile(file, buffer)
  } catch {
    /* a cache miss is not an error */
  }
  return { bytes: buffer, contentType: type.startsWith('image/') ? type.split(';')[0] : mimeFor(file) }
}
