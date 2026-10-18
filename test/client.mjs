/**
 * Client bundle test: loads client/client.js the way the web shell does
 * (through window.__ModuleLoader__), stubs react, and drives apply() against
 * a fake ctx to prove it registers the panel and disposes cleanly.
 */
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const BUNDLE = join(HERE, '..', 'client', 'client.js')
const failures = []
function check(label, condition, detail) {
  if (condition) { console.log('  ok   ' + label); return }
  failures.push(label)
  console.log('  FAIL ' + label + (detail === undefined ? '' : ' :: ' + detail))
}

let captured
globalThis.window = {
  __ModuleLoader__: {
    load(spec) { captured = spec },
  },
}
globalThis.document = {
  head: { appendChild() {} },
  getElementById() { return null },
  createElement() { return { setAttribute() {}, remove() {}, textContent: '' } },
  addEventListener() {},
  removeEventListener() {},
}

const react = {
  createElement(type, props, ...children) { return { type, props: props || {}, children } },
  useState(initial) {
    let value = typeof initial === 'function' ? initial() : initial
    return [value, function (next) { value = typeof next === 'function' ? next(value) : next }]
  },
  useEffect() {},
  useMemo(fn) { return fn() },
  useCallback(fn) { return fn },
  useRef(initial) { return { current: initial } },
}

const source = await readFile(BUNDLE, 'utf8')
new Function('window', source)(globalThis.window)
check('bundle registers with ModuleLoader', captured !== undefined)
check('bundle id', captured.id === 'dsh-workbuddy-suite', captured.id)

const factory = captured.factory
const loaded = factory(function (name) {
  if (name === 'react') return react
  throw new Error('unexpected require: ' + name)
})
check('exports a name', loaded.name === 'dsh-workbuddy-suite', loaded.name)
check('declares slots + locale', Array.isArray(loaded.inject)
  && loaded.inject.includes('slots') && loaded.inject.includes('locale'), JSON.stringify(loaded.inject))
check('exports apply', typeof loaded.apply === 'function')

/* fake ctx -------------------------------------------------------------- */

const registrations = []
const localeRegistrations = []
const effects = []
const slots = {
  inject(name, run) {
    return run()
  },
  register(spec, component) {
    registrations.push({ spec, component })
    return function () { registrations.pop() }
  },
}
const ctx = {
  slots,
  locale: {
    register(ns, dicts) { localeRegistrations.push({ ns, dicts }); return function () {} },
    bind() { return function (key) { return key } },
    getLocale() { return { active: 'zh' } },
  },
  effect(fn, label) {
    const disposer = fn()
    effects.push({ label, disposer })
    return function () { if (typeof disposer === 'function') disposer() }
  },
  logger: { warn() {}, info() {} },
}

loaded.apply(ctx)
check('registers a settings section', registrations.some(function (r) { return r.spec.name === 'settings.section' }))
check('settings section id', registrations.some(function (r) { return r.spec.name === 'settings.section' && r.spec.id === 'workbuddy-suite' }))
check('registers a sidebar action', registrations.some(function (r) { return r.spec.name === 'sidebar.footer.action' }))
check('registers locale dicts', localeRegistrations.length === 1 && localeRegistrations[0].ns === 'workbuddy-suite')
check('locale has zh and en', localeRegistrations[0].dicts.zh !== undefined && localeRegistrations[0].dicts.en !== undefined)
check('no duplicate sections', registrations.filter(function (r) { return r.spec.name === 'settings.section' }).length === 1)
check('components are functions', registrations.every(function (r) { return typeof r.component === 'function' }))

/* the panel component must render without throwing ----------------------- */

const root = registrations.find(function (r) { return r.spec.name === 'settings.section' }).component
let rendered
try {
  rendered = root({})
  check('root renders', rendered !== undefined && rendered !== null)
} catch (error) {
  check('root renders', false, String(error))
}

/* the shell's t() must resolve real copy -------------------------------- */

const tInjected = registrations.find(function (r) { return r.spec.name === 'settings.section' }).spec.inject().t
check('t() returns translated copy', tInjected('nav') !== 'nav', String(tInjected('nav')))

/* disposal -------------------------------------------------------------- */

check('registers an effect for cleanup', effects.length > 0)
for (const effect of effects) {
  if (typeof effect.disposer === 'function') effect.disposer()
}
check('cleanup leaves no registrations', registrations.length === 0, String(registrations.length))

console.log('')
if (failures.length > 0) {
  console.log('FAILED ' + String(failures.length))
  process.exitCode = 1
} else {
  console.log('all client checks passed')
}
