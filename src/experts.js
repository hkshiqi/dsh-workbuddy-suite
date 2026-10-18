/**
 * Expert catalog: one merged view over the WorkBuddy marketplace plus the
 * experts actually installed on this machine.
 *
 *   1. WorkBuddy marketplace manifest  <wbHome>/app/cache/experts/manifest.json
 *      (448 bilingual entries with CDN avatars - the catalog the desktop app
 *      shows, categories included)
 *   2. WorkBuddy installed experts     <wbHome>/plugins/marketplaces/experts/plugins/<id>
 *      and <wbHome>/plugins/cache/experts/<id> (real folders with skills)
 *   3. Curated seed                    data/curated-experts.json (fallback only)
 *   4. DSH user experts                <dshHome>/experts/<id>/role.md
 *   5. DSH project experts             <cwd>/.agents/experts/<id>/role.md
 *
 * Sources 4 and 5 are the install target: installing an expert materialises a
 * folder with role.md (+ avatar.png + skills/) so a DSH session picks it up.
 *
 * Everything here is read-only against WorkBuddy; only the DSH expert roots
 * are written, and only for folders this plugin created (marker file).
 */

import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { catalogAvatarBytes, loadExpertCatalog } from './expert-catalog.js'
import { mapLimit, tryRealpath, tryStat } from './util.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const PACKAGE_ROOT = join(HERE, '..')
export const SEED_FILE = join(PACKAGE_ROOT, 'data', 'curated-experts.json')

/** Expert ids are used as directory names - keep them boring. */
export const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/

/** Marker written into every folder this plugin installs (ownership proof). */
export const MARKER_FILE = '.dsh-workbuddy-suite.json'

/** Document-relative API base, mirroring the route base without its slash. */
export const API_BASE = 'dsh-workbuddy-suite/api'

function asString(value) {
  return typeof value === 'string' ? value : ''
}

/** Pick the active language out of a {en, zh} pair, preferring zh. */
function bilingual(pair) {
  if (pair === null || typeof pair !== 'object') return ''
  return asString(pair.zh) !== '' ? asString(pair.zh) : asString(pair.en)
}

/** Pick a localized list out of {en: [], zh: []}. */
function bilingualList(pair) {
  if (Array.isArray(pair)) return pair.filter(function (item) { return typeof item === 'string' })
  if (pair === null || typeof pair !== 'object') return []
  const list = Array.isArray(pair.zh) && pair.zh.length > 0 ? pair.zh : pair.en
  return Array.isArray(list) ? list.filter(function (item) { return typeof item === 'string' }) : []
}

async function readJsonFile(target) {
  try {
    return JSON.parse(await readFile(target, 'utf8'))
  } catch {
    return undefined
  }
}

async function readTextFile(target) {
  try {
    return await readFile(target, 'utf8')
  } catch {
    return ''
  }
}

/** First non-heading paragraph of a markdown body. */
function firstParagraph(markdown) {
  const lines = markdown.split(/\r?\n/)
  let buffer = []
  let inFrontmatter = false
  let fence = false
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed === '---') {
      if (buffer.length === 0 && !inFrontmatter) {
        inFrontmatter = true
        continue
      }
      if (inFrontmatter) {
        inFrontmatter = false
        continue
      }
    }
    if (inFrontmatter) continue
    if (trimmed.startsWith('```')) {
      fence = !fence
      continue
    }
    if (fence) continue
    if (trimmed === '') {
      if (buffer.length > 0) break
      continue
    }
    if (trimmed.startsWith('#')) {
      if (buffer.length > 0) break
      continue
    }
    buffer.push(trimmed)
  }
  return buffer.join(' ').slice(0, 240)
}

/** Minimal YAML frontmatter reader - flat key: value pairs only. */
export function frontmatterOf(markdown) {
  const text = markdown.replace(/^\uFEFF/, '')
  if (!text.startsWith('---')) return {}
  const end = text.indexOf('\n---', 3)
  if (end < 0) return {}
  const block = text.slice(3, end)
  const result = {}
  for (const line of block.split(/\r?\n/)) {
    const match = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line)
    if (match === null) continue
    let value = match[2].trim()
    if (value.length > 1 && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) {
      value = value.slice(1, -1)
    }
    result[match[1]] = value
  }
  return result
}

/** List sub-directory names of a directory (empty when it does not exist). */
async function subdirsOf(root) {
  try {
    const entries = await readdir(root, { withFileTypes: true })
    return entries.filter(function (entry) { return entry.isDirectory() }).map(function (entry) { return entry.name })
  } catch {
    return []
  }
}

/** First image file inside a directory. */
async function firstImageIn(root) {
  try {
    const entries = await readdir(root, { withFileTypes: true })
    const hit = entries.find(function (entry) { return entry.isFile() && /\.(png|jpg|jpeg|webp)$/i.test(entry.name) })
    return hit === undefined ? undefined : join(root, hit.name)
  } catch {
    return undefined
  }
}

/**
 * Scan one expert folder into a card.
 * @param {string} folder absolute expert directory
 * @param {'workbuddy' | 'user' | 'project'} origin
 */
async function readExpertFolder(folder, origin) {
  const id = folder.split(/[\\/]/).pop()
  if (!ID_RE.test(id)) return { warning: 'ignored "' + id + '": not a valid expert id' }

  const pluginJson = await readJsonFile(join(folder, '.codebuddy-plugin', 'plugin.json'))
    ?? await readJsonFile(join(folder, '.workbuddy-plugin', 'plugin.json'))
  const roleText = await readTextFile(join(folder, 'role.md'))
  const skillText = await readTextFile(join(folder, 'SKILL.md'))
  const skillFront = frontmatterOf(skillText)
  const roleFront = frontmatterOf(roleText)

  if (pluginJson === undefined && roleText === '' && skillText === '') {
    return { warning: 'ignored "' + id + '": no plugin.json, role.md or SKILL.md' }
  }

  const meta = pluginJson !== null && typeof pluginJson === 'object' ? pluginJson : {}
  const team = meta.teamInfo !== null && typeof meta.teamInfo === 'object' && meta.teamInfo !== undefined ? meta.teamInfo : {}
  const members = Array.isArray(meta.members) ? meta.members.filter(function (m) { return m !== null && typeof m === 'object' }) : []

  const name = bilingual(meta.displayName)
    || asString(meta.displayName)
    || asString(roleFront.displayName)
    || asString(meta.name)
    || id
  const profession = bilingual(meta.profession) || asString(meta.profession) || ''
  const description = bilingual(meta.displayDescription)
    || asString(meta.description)
    || asString(roleFront.description)
    || asString(skillFront.description)
    || firstParagraph(roleText || skillText)
    || ''
  const tags = bilingualList(meta.tags)
  const scenarios = Array.isArray(meta.scenarios) ? meta.scenarios.filter(function (s) { return typeof s === 'string' }) : []
  const labels = (tags.length > 0 ? tags : scenarios).slice(0, 4)

  let avatarFile
  const declared = asString(meta.avatar)
  if (declared !== '') {
    const info = await tryStat(join(folder, declared))
    if (info !== undefined && info.isFile()) avatarFile = join(folder, declared)
  }
  if (avatarFile === undefined) {
    const info = await tryStat(join(folder, 'avatar.png'))
    if (info !== undefined && info.isFile()) avatarFile = join(folder, 'avatar.png')
  }
  if (avatarFile === undefined) avatarFile = await firstImageIn(join(folder, 'avatars'))

  const skills = await subdirsOf(join(folder, 'skills'))
  const agentFiles = await subdirsOf(join(folder, 'agents'))

  return {
    card: {
      key: origin + ':' + id,
      id,
      name,
      profession,
      description,
      tags: labels,
      origin,
      kind: asString(meta.expertType) === 'team' || team.leadAgent !== undefined ? 'team' : 'expert',
      teamSize: members.length > 0 ? members.length : undefined,
      categoryId: asString(meta.categoryId),
      categoryName: '',
      version: asString(meta.version),
      skills,
      agentFiles,
      homepage: asString(meta.homepage),
      __dir: folder,
      __avatarFile: avatarFile,
    },
  }
}

/** SeniorDeveloper -> Senior Developer (display fallback only). */
function humanizeId(id) {
  return id.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').trim()
}

/** Load the bundled curated seed (built-in WorkBuddy experts). */
export async function loadSeed() {
  const parsed = await readJsonFile(SEED_FILE)
  const candidates = parsed !== null && typeof parsed === 'object' && Array.isArray(parsed.candidates) ? parsed.candidates : []
  const cards = []
  for (const entry of candidates) {
    if (entry === null || typeof entry !== 'object') continue
    const id = asString(entry.id)
    if (id === '') continue
    const scenarios = Array.isArray(entry.scenarios) ? entry.scenarios.filter(function (s) { return typeof s === 'string' }) : []
    cards.push({
      key: 'seed:' + id,
      id,
      name: humanizeId(id),
      profession: scenarios.length > 0 ? scenarios[0] : '',
      description: asString(entry.description),
      tags: scenarios.slice(0, 3),
      origin: 'seed',
      kind: entry.type === 'expert_team' ? 'team' : 'expert',
      categoryId: '',
      categoryName: '',
      version: '',
      skills: [],
      agentFiles: [],
      homepage: '',
    })
  }
  return cards
}

/** Root list for one scan, in priority order (only existing roots). */
export async function expertRoots(options) {
  const workbuddyHome = options.workbuddyHome
  const dshHome = options.dshHome
  const projectRoot = options.projectRoot
  const roots = []
  const candidates = [
    { path: join(workbuddyHome, 'plugins', 'marketplaces', 'experts', 'plugins'), origin: 'workbuddy', label: 'WorkBuddy 市场专家' },
    { path: join(workbuddyHome, 'plugins', 'cache', 'experts'), origin: 'workbuddy', label: 'WorkBuddy 缓存专家' },
    { path: join(dshHome, 'experts'), origin: 'user', label: 'DSH 用户专家' },
    { path: join(projectRoot, '.agents', 'experts'), origin: 'project', label: '项目专家' },
  ]
  for (const candidate of candidates) {
    if (existsSync(candidate.path)) roots.push(candidate)
  }
  return roots
}

/**
 * Merge folder metadata into a catalog card: the marketplace manifest has the
 * good copy and the avatar, the folder has the real skills and version.
 */
function mergeFolderIntoCatalog(card, folderCard) {
  if (folderCard.name !== '' && card.name === '') card.name = folderCard.name
  if (card.description === '' && folderCard.description !== '') card.description = folderCard.description
  if (card.profession === '' && folderCard.profession !== '') card.profession = folderCard.profession
  if (card.tags.length === 0 && folderCard.tags.length > 0) card.tags = folderCard.tags
  if (folderCard.version !== '') card.version = folderCard.version
  if (folderCard.skills.length > 0) card.skills = folderCard.skills
  if (folderCard.agentFiles.length > 0) card.agentFiles = folderCard.agentFiles
  if (folderCard.homepage !== '') card.homepage = folderCard.homepage
  if (card.__dir === undefined && folderCard.__dir !== undefined) card.__dir = folderCard.__dir
  if (card.__avatarFile === undefined && folderCard.__avatarFile !== undefined) card.__avatarFile = folderCard.__avatarFile
}

/**
 * Scan every source into one catalog.
 * @returns {Promise<{experts: object[], warnings: string[], roots: object[], categories: object[], internals: object[]}>}
 */
export async function scanExperts(options) {
  const warnings = []
  const roots = await expertRoots(options)
  const seen = new Map()
  const cards = []
  const folders = []

  // 1. The marketplace manifest first: it is the full catalog and the only
  // source of avatars and categories.
  const catalog = await loadExpertCatalog({ workbuddyHome: options.workbuddyHome })
  if (catalog === undefined) {
    warnings.push('未找到 WorkBuddy 专家目录缓存（' + join(options.workbuddyHome, 'app', 'cache', 'experts', 'manifest.json') + '），只显示本机已安装的专家')
  } else {
    for (const card of catalog.cards) {
      seen.set(card.id, card)
      cards.push(card)
    }
  }

  // 2. Installed folders (workbuddy) enrich a catalog entry, or stand alone
  // when the manifest does not know them.
  for (const root of roots) {
    const names = await subdirsOf(root.path)
    const scanned = await mapLimit(names, 8, async function (name) {
      if (name.startsWith('git:')) return { warning: 'skipped "' + name + '": git-prefixed entry', origin: root.origin }
      const result = await readExpertFolder(join(root.path, name), root.origin)
      result.origin = root.origin
      result.label = root.label
      return result
    })
    for (const result of scanned) {
      if (result.warning !== undefined) {
        warnings.push(result.label + ': ' + result.warning)
        continue
      }
      const card = result.card
      const existing = seen.get(card.id)
      if (result.origin === 'workbuddy') {
        if (existing !== undefined) {
          mergeFolderIntoCatalog(existing, card)
          continue
        }
        seen.set(card.id, card)
        cards.push(card)
        folders.push(card)
        continue
      }
      // DSH user/project folders: an install of a catalog entry becomes a flag
      // on the catalog card instead of a duplicate row.
      if (existing !== undefined) {
        existing.installed = true
        existing.installedVersion = existing.installedVersion ?? card.version
        if (existing.skills.length === 0 && card.skills.length > 0) existing.skills = card.skills
        continue
      }
      card.installed = true
      seen.set(card.id, card)
      cards.push(card)
      folders.push(card)
    }
  }

  // 3. The bundled seed is a fallback: it only fills ids nothing else knows.
  for (const seed of await loadSeed()) {
    const existing = seen.get(seed.id)
    if (existing !== undefined) {
      if (existing.description === '') existing.description = seed.description
      if (existing.tags.length === 0) existing.tags = seed.tags
      if (existing.profession === '') existing.profession = seed.profession
      continue
    }
    seen.set(seed.id, seed)
    cards.push(seed)
  }

  const publicCards = []
  for (const card of cards) {
    const copy = Object.assign({}, card)
    const avatarFile = copy.__avatarFile
    const avatarRel = copy.__avatarRel
    const catalogKey = copy.key
    delete copy.__avatarFile
    delete copy.__avatarRel
    delete copy.__dir
    copy.installed = copy.installed === true || copy.origin === 'user' || copy.origin === 'project'
    if (avatarFile !== undefined || avatarRel !== undefined) {
      // The route resolves the card from its key, so the key must survive.
      copy.avatarUrl = API_BASE + '/expert-avatar?id=' + encodeURIComponent(catalogKey)
    }
    publicCards.push(copy)
  }

  publicCards.sort(function (left, right) {
    if (left.installed !== right.installed) return left.installed ? -1 : 1
    if (left.kind !== right.kind) return left.kind === 'team' ? -1 : 1
    return String(left.name).localeCompare(String(right.name), 'zh-Hans-CN')
  })

  return {
    experts: publicCards,
    warnings,
    roots: roots.map(function (root) { return { path: root.path, origin: root.origin, label: root.label } }),
    categories: catalog === undefined ? [] : catalog.categories,
    avatarBaseUrl: catalog === undefined ? '' : (catalog.baseUrl ?? ''),
    internals: cards,
  }
}

/** Build a role.md body from a card (install payload for catalog experts). */
function roleMarkdown(card, locale) {
  const zh = locale !== 'en'
  const focus = card.tags.length > 0 ? card.tags.join('、') : (zh ? '通用' : 'general')
  const lines = []
  lines.push('---')
  lines.push('name: ' + card.id)
  lines.push('description: ' + (card.description || card.name).replace(/\s+/g, ' ').slice(0, 200))
  lines.push('---')
  lines.push('')
  lines.push('# ' + card.name)
  lines.push('')
  if (card.profession !== '') lines.push(zh ? '**专长**：' + card.profession : '**Profession**: ' + card.profession)
  lines.push('')
  lines.push(zh ? '## 人设' : '## Persona')
  lines.push('')
  lines.push(zh
    ? '你是一位「' + card.name + '」。' + card.description
    : 'You are "' + card.name + '". ' + card.description)
  lines.push('')
  if (Array.isArray(card.quickPrompts) && card.quickPrompts.length > 0) {
    lines.push(zh ? '## 典型任务' : '## Typical tasks')
    lines.push('')
    for (const prompt of card.quickPrompts) lines.push('- ' + prompt)
    lines.push('')
  }
  lines.push(zh ? '## 关注领域' : '## Focus')
  lines.push('')
  lines.push('- ' + focus)
  lines.push('')
  lines.push(zh ? '## 工作方式' : '## Working style')
  lines.push('')
  lines.push(zh
    ? '1. 先确认目标与约束，再动手；信息不足时先提一个最关键的问题。'
    : '1. Confirm the goal and constraints before acting; ask one key question when information is missing.')
  lines.push(zh ? '2. 给出可执行的结论，避免空泛建议。' : '2. Give actionable conclusions rather than generic advice.')
  lines.push(zh ? '3. 交付物要完整，能直接使用。' : '3. Deliver complete, directly usable output.')
  lines.push('')
  lines.push(zh
    ? '<!-- 由 dsh-workbuddy-suite 生成：可在「专家」面板卸载 -->'
    : '<!-- generated by dsh-workbuddy-suite: uninstall from the Experts panel -->')
  lines.push('')
  return lines.join('\n')
}

/** Resolve which on-disk folder backs an expert id (for copy-on-install). */
async function resolveExpertDir(options) {
  const roots = await expertRoots(options)
  for (const root of roots) {
    if (root.origin !== 'workbuddy') continue
    const candidate = join(root.path, options.id)
    const info = await tryStat(candidate)
    if (info !== undefined && info.isDirectory()) {
      const real = await tryRealpath(candidate)
      if (real !== undefined) return real
    }
  }
  return undefined
}

/** Download one catalog avatar into the install folder, best effort. */
async function installAvatarBytes(card, options) {
  if (card.__avatarRel === undefined || card.__avatarRel === '') {
    if (card.__avatarFile === undefined) return undefined
    try {
      return { bytes: await readFile(card.__avatarFile), contentType: 'image/png' }
    } catch {
      return undefined
    }
  }
  return await catalogAvatarBytes({
    dshHome: options.dshHome,
    id: card.id,
    rel: card.__avatarRel,
    baseUrl: options.catalog.avatarBaseUrl ?? '',
  })
}

/**
 * Install an expert into the DSH user experts root.
 * Copies the WorkBuddy folder when one exists; otherwise materialises a
 * role.md from the catalog entry (plus its avatar). Refuses to overwrite a
 * folder it does not own.
 */
export async function installExpert(options) {
  const catalog = options.catalog
  const id = options.id
  const locale = options.locale === 'en' ? 'en' : 'zh'
  if (!ID_RE.test(id)) return { ok: false, code: 'bad-id', message: '非法的专家 id' }
  const card = catalog.experts.find(function (entry) { return entry.id === id })
  if (card === undefined) return { ok: false, code: 'not-found', message: '未找到专家 ' + id }

  const root = join(options.dshHome, 'experts')
  const target = join(root, id)
  const existing = await tryStat(target)
  if (existing !== undefined) {
    const marker = await readJsonFile(join(target, MARKER_FILE))
    if (marker === undefined) {
      return { ok: false, code: 'exists', message: '目标目录已存在且不是本插件安装的：' + target }
    }
    await rm(target, { recursive: true, force: true })
  }

  await mkdir(root, { recursive: true })
  const source = await resolveExpertDir({
    workbuddyHome: options.workbuddyHome,
    dshHome: options.dshHome,
    projectRoot: options.projectRoot,
    id,
  })
  if (source !== undefined) {
    await cp(source, target, {
      recursive: true,
      force: true,
      filter: function (item) { return !/[\\/]node_modules([\\/]|$)/.test(item) },
    })
  } else {
    await mkdir(target, { recursive: true })
    await writeFile(join(target, 'role.md'), roleMarkdown(card, locale), 'utf8')
  }
  // Resolve the avatar into the install folder; the catalog path goes over the
  // CDN, a marketplace folder copy already carries its own avatar.
  const avatar = await installAvatarBytes(card, {
    dshHome: options.dshHome,
    catalog: catalog,
  })
  if (avatar !== undefined) {
    const ext = avatar.contentType === 'image/svg+xml' ? '.svg' : '.png'
    try {
      await writeFile(join(target, 'avatar' + ext), avatar.bytes)
    } catch {
      /* the avatar is decorative; a failure must not fail the install */
    }
  }
  await writeFile(join(target, MARKER_FILE), JSON.stringify({
    installedBy: 'dsh-workbuddy-suite',
    id,
    origin: card.origin,
    installedAt: new Date().toISOString(),
  }, null, 2), 'utf8')
  return { ok: true, path: target, copied: source !== undefined }
}

/** Uninstall an expert folder - only when this plugin created it. */
export async function uninstallExpert(options) {
  const id = options.id
  if (!ID_RE.test(id)) return { ok: false, code: 'bad-id', message: '非法的专家 id' }
  const target = join(options.dshHome, 'experts', id)
  const info = await tryStat(target)
  if (info === undefined) return { ok: false, code: 'not-found', message: '未安装：' + id }
  const marker = await readJsonFile(join(target, MARKER_FILE))
  if (marker === undefined) {
    return { ok: false, code: 'foreign', message: '该专家目录不是本插件安装的，已拒绝删除：' + target }
  }
  await rm(target, { recursive: true, force: true })
  return { ok: true, id }
}

/**
 * Avatar bytes for a card key: a local file when the expert folder has one,
 * otherwise the marketplace CDN copy (cached under the DSH home).
 * @returns {Promise<{bytes: Buffer, contentType: string} | undefined>}
 */
export async function avatarBytesFor(options) {
  const internals = options.catalog.internals
  for (const card of internals) {
    if (card.key !== options.key) continue
    if (card.__avatarFile !== undefined) {
      try {
        return { bytes: await readFile(card.__avatarFile), contentType: 'image/png' }
      } catch {
        /* fall through to the CDN */
      }
    }
    if (card.__avatarRel !== undefined && card.__avatarRel !== '') {
      return await catalogAvatarBytes({
        dshHome: options.dshHome,
        id: card.id,
        rel: card.__avatarRel,
        baseUrl: options.catalog.avatarBaseUrl ?? '',
      })
    }
    return undefined
  }
  return undefined
}
