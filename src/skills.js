/**
 * Skill catalog: every skill root a DSH session can see, plus the WorkBuddy
 * skill folder as an import source.
 *
 * Roots, in DSH's own precedence order (see @deepseek-ai/dsh-skill-filesystem):
 *   <cwd>/.dsh/skills       project, rank 100
 *   <cwd>/.agents/skills    project, rank 200
 *   <dshHome>/skills        user,    rank 400
 *   <agentsHome>/skills     user,    rank 500
 *   <wbHome>/skills         WorkBuddy, import source only (read-only)
 *
 * A skill is a folder with SKILL.md. Its YAML frontmatter must carry `name`
 * and `description`; the two invocation switches are the kebab-case keys
 * `disable-model-invocation` and `user-invocable` (camelCase is rejected by
 * the host parser, so this module never writes it).
 */

import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { frontmatterOf } from './experts.js'
import { mapLimit, tryRealpath, tryStat } from './util.js'

export const SKILL_FILE = 'SKILL.md'
export const SKILL_MARKER = '.dsh-workbuddy-suite.json'
export const SKILL_ID_RE = /^[a-z0-9][a-z0-9._-]*$/i

function asString(value) {
  return typeof value === 'string' ? value : ''
}

/** Split a SKILL.md into frontmatter map and body. */
export function splitSkill(text) {
  const normalized = text.replace(/^\uFEFF/, '')
  if (!normalized.startsWith('---')) return { front: {}, body: normalized }
  const end = normalized.indexOf('\n---', 3)
  if (end < 0) return { front: {}, body: normalized }
  const bodyStart = normalized.indexOf('\n', end + 4)
  return {
    front: frontmatterOf(normalized.slice(0, end + 4)),
    body: bodyStart < 0 ? '' : normalized.slice(bodyStart + 1),
  }
}

/** Serialize frontmatter + body back into SKILL.md text. */
export function joinSkill(front, body) {
  const lines = ['---']
  const order = ['name', 'description', 'version', 'license']
  const keys = Object.keys(front)
  const ordered = order.filter(function (key) { return keys.includes(key) })
    .concat(keys.filter(function (key) { return !order.includes(key) }))
  for (const key of ordered) {
    const value = front[key]
    if (value === undefined || value === '') continue
    lines.push(key + ': ' + String(value))
  }
  lines.push('---')
  lines.push('')
  return lines.join('\n') + body.replace(/^\n+/, '')
}

/** Count files under a directory (bounded), skipping node_modules/.git. */
async function countFiles(root, budget) {
  const state = { count: 0, scripts: 0, references: 0 }
  async function walk(current, depth) {
    if (depth > 4 || state.count >= budget) return
    let entries
    try {
      entries = await readdir(current, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue
      const absolute = join(current, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === 'scripts') state.scripts += 1
        if (entry.name === 'references') state.references += 1
        await walk(absolute, depth + 1)
      } else {
        state.count += 1
        if (state.count >= budget) return
      }
    }
  }
  await walk(root, 0)
  return state
}

/** Read one skill folder into a card (undefined when it is not a skill). */
async function readSkillFolder(folder, origin) {
  const text = await (async function () {
    try {
      return await readFile(join(folder, SKILL_FILE), 'utf8')
    } catch {
      return undefined
    }
  })()
  if (text === undefined) return undefined
  const parts = splitSkill(text)
  const name = asString(parts.front.name) || folder.split(/[\\/]/).pop()
  const description = asString(parts.front.description)
  const stats = await countFiles(folder, 400)
  const marker = await (async function () {
    try {
      return JSON.parse(await readFile(join(folder, SKILL_MARKER), 'utf8'))
    } catch {
      return undefined
    }
  })()
  return {
    key: origin + ':' + folder,
    name,
    description,
    origin,
    folder,
    files: stats.count,
    hasScripts: stats.scripts > 0,
    hasReferences: stats.references > 0,
    modelInvocable: asString(parts.front['disable-model-invocation']).toLowerCase() !== 'true',
    userInvocable: asString(parts.front['user-invocable']).toLowerCase() !== 'false',
    version: asString(parts.front.version),
    managed: marker !== undefined,
    valid: name !== '' && description !== '',
    problem: name === '' ? 'SKILL.md 缺少 name' : (description === '' ? 'SKILL.md 缺少 description' : ''),
  }
}

/** The scan roots for one call. */
export function skillRoots(options) {
  const roots = [
    { path: join(options.projectRoot, '.dsh', 'skills'), origin: 'project', label: '项目 .dsh/skills' },
    { path: join(options.projectRoot, '.agents', 'skills'), origin: 'project', label: '项目 .agents/skills' },
    { path: join(options.dshHome, 'skills'), origin: 'user', label: 'DSH 用户技能' },
    { path: join(options.agentsHome, 'skills'), origin: 'user', label: 'Agents 用户技能' },
    { path: join(options.workbuddyHome, 'skills'), origin: 'workbuddy', label: 'WorkBuddy 技能' },
  ]
  return roots.filter(function (root) { return existsSync(root.path) })
}

/** Scan every root; first hit for a name wins (mirrors DSH precedence). */
export async function scanSkills(options) {
  const warnings = []
  const seen = new Map()
  const cards = []
  for (const root of skillRoots(options)) {
    let names = []
    try {
      const entries = await readdir(root.path, { withFileTypes: true })
      names = entries.filter(function (entry) { return entry.isDirectory() }).map(function (entry) { return entry.name })
    } catch (error) {
      warnings.push(root.label + ': ' + String(error))
      continue
    }
    const scanned = await mapLimit(names, 8, function (name) {
      return readSkillFolder(join(root.path, name), root.origin)
    })
    for (const card of scanned) {
      if (card === undefined) continue
      if (seen.has(card.name)) continue
      seen.set(card.name, card)
      cards.push(card)
    }
  }
  for (const card of cards) delete card.folder
  cards.sort(function (left, right) {
    if (left.origin !== right.origin) {
      const weight = { project: 0, user: 1, workbuddy: 2 }
      return (weight[left.origin] ?? 9) - (weight[right.origin] ?? 9)
    }
    return left.name.localeCompare(right.name)
  })
  return { skills: cards, warnings, roots: skillRoots(options).map(function (root) { return { path: root.path, origin: root.origin, label: root.label } }) }
}

/** Locate a skill folder by key (the key carries the absolute folder). */
async function folderOfKey(key) {
  const index = String(key).indexOf(':')
  if (index < 0) return undefined
  const folder = key.slice(index + 1)
  const info = await tryStat(folder)
  if (info === undefined || !info.isDirectory()) return undefined
  return folder
}

/** Full SKILL.md body for one skill (detail panel). */
export async function readSkillDetail(key) {
  const folder = await folderOfKey(key)
  if (folder === undefined) return undefined
  let text
  try {
    text = await readFile(join(folder, SKILL_FILE), 'utf8')
  } catch {
    return undefined
  }
  const parts = splitSkill(text)
  let entries = []
  try {
    const listing = await readdir(folder, { withFileTypes: true })
    entries = listing.map(function (entry) { return { name: entry.name, dir: entry.isDirectory() } })
  } catch {
    entries = []
  }
  return {
    key,
    folder,
    front: parts.front,
    body: parts.body,
    files: entries.sort(function (a, b) { return Number(b.dir) - Number(a.dir) })
  }
}

/** Flip the two invocation switches in SKILL.md frontmatter. */
export async function setSkillFlags(options) {
  const folder = await folderOfKey(options.key)
  if (folder === undefined) return { ok: false, code: 'not-found', message: '技能目录不存在' }
  const path = join(folder, SKILL_FILE)
  let text
  try {
    text = await readFile(path, 'utf8')
  } catch {
    return { ok: false, code: 'not-found', message: 'SKILL.md 不存在' }
  }
  const parts = splitSkill(text)
  const front = Object.assign({}, parts.front)
  if (typeof options.modelInvocable === 'boolean') {
    if (options.modelInvocable) delete front['disable-model-invocation']
    else front['disable-model-invocation'] = 'true'
  }
  if (typeof options.userInvocable === 'boolean') {
    if (options.userInvocable) delete front['user-invocable']
    else front['user-invocable'] = 'false'
  }
  await writeFile(path, joinSkill(front, parts.body), 'utf8')
  return { ok: true, key: options.key }
}

/** Copy a WorkBuddy skill into the DSH user skills root (managed import). */
export async function importSkill(options) {
  const folder = await folderOfKey(options.key)
  if (folder === undefined) return { ok: false, code: 'not-found', message: '技能目录不存在' }
  const name = folder.split(/[\\/]/).pop()
  if (!SKILL_ID_RE.test(name)) return { ok: false, code: 'bad-id', message: '非法的技能目录名：' + name }
  const root = join(options.dshHome, 'skills')
  const target = join(root, name)
  const info = await tryStat(target)
  if (info !== undefined) return { ok: false, code: 'exists', message: '目标已存在：' + target }
  const real = await tryRealpath(folder)
  if (real === undefined) return { ok: false, code: 'not-found', message: '技能目录不可读' }
  await mkdir(root, { recursive: true })
  await cp(real, target, {
    recursive: true,
    force: true,
    filter: function (item) { return !/[\\/]node_modules([\\/]|$)/.test(item) },
  })
  await writeFile(join(target, SKILL_MARKER), JSON.stringify({
    installedBy: 'dsh-workbuddy-suite',
    from: real,
    importedAt: new Date().toISOString(),
  }, null, 2), 'utf8')
  return { ok: true, path: target, name }
}

/** Delete an imported skill - only when this plugin imported it. */
export async function removeSkill(options) {
  const folder = await folderOfKey(options.key)
  if (folder === undefined) return { ok: false, code: 'not-found', message: '技能目录不存在' }
  const marker = await (async function () {
    try {
      return JSON.parse(await readFile(join(folder, SKILL_MARKER), 'utf8'))
    } catch {
      return undefined
    }
  })()
  if (marker === undefined) {
    return { ok: false, code: 'foreign', message: '该技能不是本插件导入的，已拒绝删除' }
  }
  await rm(folder, { recursive: true, force: true })
  return { ok: true }
}

/** Create a new skill folder under a chosen root. */
export async function createSkill(options) {
  const name = asString(options.name).trim()
  if (!SKILL_ID_RE.test(name)) return { ok: false, code: 'bad-id', message: '技能名只能包含字母、数字、点、下划线、连字符' }
  const description = asString(options.description).trim()
  if (description === '') return { ok: false, code: 'bad-input', message: '请填写一句话描述' }
  const scope = options.scope === 'project' ? 'project' : 'user'
  const root = scope === 'project'
    ? join(options.projectRoot, '.dsh', 'skills')
    : join(options.dshHome, 'skills')
  const target = join(root, name)
  const info = await tryStat(target)
  if (info !== undefined) return { ok: false, code: 'exists', message: '同名技能已存在：' + target }
  await mkdir(target, { recursive: true })
  const front = { name, description }
  const body = [
    '',
    '# ' + name,
    '',
    description,
    '',
    '## 使用方式',
    '',
    '- 说明什么时候应该使用这个技能。',
    '- 列出可复用的步骤。',
    '',
  ].join('\n')
  await writeFile(join(target, SKILL_FILE), joinSkill(front, body), 'utf8')
  await writeFile(join(target, SKILL_MARKER), JSON.stringify({
    installedBy: 'dsh-workbuddy-suite',
    created: true,
    createdAt: new Date().toISOString(),
  }, null, 2), 'utf8')
  return { ok: true, path: target, key: scope + ':' + target }
}
