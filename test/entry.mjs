/** Host entry test: imports src/index.js the way the bundle loader does and
 * drives apply() against a fake ctx with a fake webServer. */
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const failures = []
function check(label, condition, detail) {
  if (condition) { console.log('  ok   ' + label); return }
  failures.push(label)
  console.log('  FAIL ' + label + (detail === undefined ? '' : ' :: ' + detail))
}

const mod = await import('../src/index.js')
check('exports name', mod.name === 'dsh-workbuddy-suite', mod.name)
check('exports apply', typeof mod.apply === 'function')
check('exports Config or undefined', mod.Config === undefined || typeof mod.Config === 'object')
check('exports ROUTE_BASE', mod.ROUTE_BASE === '/dsh-workbuddy-suite', mod.ROUTE_BASE)

const registers = []
const commandHandlers = []
const effects = []
const ctx = {
  logger: { info() {}, warn() {} },
  effect(fn, label) {
    const disposer = fn()
    effects.push({ label, disposer })
    return function () { if (typeof disposer === 'function') disposer() }
  },
  inject(names, run) {
    const services = {}
    for (const name of names) {
      if (name === 'webServer') services.webServer = { register(spec) { registers.push(spec); return function () {} } }
      if (name === 'commands') services.commands = { register(spec) { commandHandlers.push(spec); return function () {} } }
    }
    run(services)
  },
}

const temp = await mkdtemp(join(tmpdir(), 'wbs-entry-'))
try {
  mod.apply(ctx, {})
  check('mounts exactly one route', registers.length === 1, String(registers.length))
  check('route is a prefix', registers[0].kind === 'prefix')
  check('route base matches', registers[0].path === '/dsh-workbuddy-suite')
  check('registers the /workbuddy command', commandHandlers.length === 1 && commandHandlers[0].name === 'workbuddy')
  check('command has a handler', typeof commandHandlers[0].handler === 'function')

  const listing = await commandHandlers[0].handler({ rawInput: 'experts' })
  check('command returns success', listing.kind === 'success', JSON.stringify(listing).slice(0, 160))
  check('command lists experts', listing.text.includes('专家'), listing.text.slice(0, 80))

  const usage = await commandHandlers[0].handler({ rawInput: 'bogus' })
  check('command rejects unknown argument', usage.kind === 'error')

  check('registers cleanup effects', effects.length > 0, String(effects.length))
  for (const effect of effects) {
    if (typeof effect.disposer === 'function') effect.disposer()
  }
} finally {
  await rm(temp, { recursive: true, force: true })
}

console.log('')
if (failures.length > 0) {
  console.log('FAILED ' + String(failures.length))
  process.exitCode = 1
} else {
  console.log('all host entry checks passed')
}
