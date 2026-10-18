/**
 * Install doctor: reports whether this plugin is wired into a DSH profile and
 * whether the panel route is currently served. Run after installing:
 *
 *   node scripts/doctor.mjs [profileDir] [--url http://127.0.0.1:60212]
 *
 * Read-only: it never edits the profile or restarts the host.
 */

import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const PACKAGE_NAME = 'dsh-workbuddy-suite'

const args = process.argv.slice(2)
let profileDir = join(homedir(), '.dsh', 'profiles', 'desktop')
let baseUrl = 'http://127.0.0.1:60212'
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === '--url') {
    baseUrl = args[i + 1]
    i += 1
  } else if (!args[i].startsWith('--')) {
    profileDir = resolve(args[i])
  }
}

const problems = []
function say(line) { console.log(line) }
function bad(line) { problems.push(line); console.log(line) }

say('plugin   ' + join(HERE, '..'))
say('profile  ' + profileDir)

const manifest = JSON.parse(await readFile(join(HERE, '..', 'package.json'), 'utf8'))
say('manifest ' + manifest.name + '@' + manifest.version
  + ' (manifestVersion ' + String(manifest.dsh?.manifestVersion ?? 'missing') + ')')

const profilePath = join(profileDir, 'package.json')
if (!existsSync(profilePath)) {
  bad('MISSING profile package.json at ' + profilePath)
} else {
  const profile = JSON.parse(await readFile(profilePath, 'utf8'))
  const dependency = profile.dependencies?.[PACKAGE_NAME]
  const bundles = profile.dsh?.profile?.bundles ?? []
  if (dependency === undefined) bad('dependency MISSING: add "' + PACKAGE_NAME + '" to dependencies')
  else say('dependency ' + dependency)
  if (!bundles.includes(PACKAGE_NAME)) bad('bundle MISSING: add "' + PACKAGE_NAME + '" to dsh.profile.bundles')
  else say('bundle     listed at position ' + String(bundles.indexOf(PACKAGE_NAME) + 1) + '/' + String(bundles.length))
  const installed = join(profileDir, 'node_modules', PACKAGE_NAME, 'package.json')
  if (!existsSync(installed)) bad('installed  MISSING: run pnpm install in ' + profileDir)
  else say('installed  ' + installed)
}

let served = false
try {
  const response = await fetch(baseUrl + '/dsh-workbuddy-suite/api/state', {
    signal: AbortSignal.timeout(8000),
  })
  served = response.ok
  say('route      ' + baseUrl + '/dsh-workbuddy-suite/api/state -> HTTP ' + String(response.status))
} catch (error) {
  say('route      unreachable (' + String(error.message || error) + ')')
}

if (!served) {
  say('')
  say('The route is not served yet. Expected until the DSH host restarts:')
  say('bundles are composed from dsh.profile.bundles at startup, so restart the')
  say('desktop app once after installing.')
}
if (problems.length > 0) {
  say('')
  say('profile wiring is incomplete (' + String(problems.length) + ' problem(s))')
  process.exitCode = 1
} else if (served) {
  say('')
  say('ready: profile wired and the route answers')
} else {
  say('')
  say('profile wired; restart the host to load the plugin')
}
