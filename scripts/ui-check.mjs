// Runs the plugin's Pane render in plain Node against a stand-in engine, presses through every screen,
// and fails on any exception or on a button/element that breaks a few of the engine's rules.
// Usage: npx tsx --tsconfig tsconfig.harness.json scripts/ui-check.mjs
const NOW = new Date(2026, 9, 5, 10).getTime()
const el = (type, props, ...children) => ({ type, props: props ?? {}, children: children.flat(Infinity).filter(c => c !== null && c !== undefined && c !== false) })

globalThis.h = (type, props, ...children) => (typeof type === 'function' ? type({ ...props, children }) : el(type, props, ...children))
globalThis.Fragment = 'Fragment'

const hooks = []
const on = (event, a, b) => hooks.push({ event, matcher: typeof a === 'function' ? undefined : a, fn: typeof a === 'function' ? a : b })
const storeData = {
  profile: { age: 30, weightKg: 70, heightCm: 175, sex: 'unspecified', goal: 'fitness', abilities: ['squat'], limits: [], dailySets: 5, isQuiet: false, places: ['office', 'home'], equipment: ['band'], isQuietX: false },
  uiVersion: 4,
}
const handle = (path, args) => {
  if (path === '$.clock.now') return NOW
  if (path === '$.store.get') return storeData[args[0]]
  if (path === '$.store.set') { storeData[args[0]] = args[1]; return }
  if (path === '$.ui.resolve') return Object.fromEntries(['Box', 'Text', 'Button', 'Input', 'Select', 'Svg', 'Markdown', 'Client'].map(n => [n, n]))
  if (path === '$.clock.every' || path === '$.clock.after') return { id: 1 }
  if (path === '$.http.fetch') return { ok: false, status: 0, text: '' }
  return undefined
}
const mk = path => new Proxy(function () {}, {
  get: (_t, k) => (k === 'then' ? undefined : mk(`${path}.${String(k)}`)),
  apply: (_t, _s, args) => (path === '$.ui.resolve' ? handle(path, args) : Promise.resolve(handle(path, args))),
})
const $ = mk('$')

const { register } = await import('../hooks/register.tsx')
register(on, {})

const find = (tree, pred, out = []) => {
  if (!tree || typeof tree !== 'object') return out
  if (pred(tree)) out.push(tree)
  for (const c of tree.children ?? []) find(c, pred, out)
  return out
}
const render = async surface => {
  const hook = hooks.find(x => x.event === 'ui.render' && x.matcher?.component === 'Pane')
  return hook.fn($, { surface, component: 'Pane', requestId: 'deskfit', props: {} }, async x => x)
}
const text = tree => find(tree, t => t.type === 'Text').map(t => t.children.join('')).join(' | ')
let failures = 0
const fail = msg => { failures++; console.log('  FAIL', msg) }

// The engine may refuse a very large tree, and the Moves screen once did not draw. Keep every screen small.
const MAX_KB = 160
const sizeCheck = (tree, where) => {
  const kb = JSON.stringify(tree).length / 1024

  console.log(`  ${where}: ${kb.toFixed(0)} KB`)
  if (kb > MAX_KB) fail(`${where}: tree is ${kb.toFixed(0)} KB, over the ${MAX_KB} KB budget`)
}

const lint = (tree, where) => {
  for (const b of find(tree, t => t.type === 'Button')) {
    if (b.props.autoFocus === false) fail(`${where}: autoFocus={false} on ${b.props.key ?? b.props.label}`)
    if (b.children.some(c => c.type === 'Fragment')) fail(`${where}: fragment in a button`)
  }
  for (const box of find(tree, t => t.type === 'Box')) {
    if (box.children.some(c => c.type === 'Fragment')) fail(`${where}: fragment inside a Box`)
  }
  const keys = find(tree, t => t.props?.key !== undefined).map(t => t.props.key)
  const dup = keys.filter((k, i) => keys.indexOf(k) !== i)
  if (dup.length) fail(`${where}: duplicate keys ${[...new Set(dup)].join(', ')}`)
}

for (const hook of hooks.filter(x => x.event === 'session.start')) await hook.fn($, { surface: 'desktop' }, async x => x)

for (const surface of ['desktop', 'terminal']) {
  let tree = await render(surface)
  console.log(`[${surface}] home:`, text(tree).slice(0, 90))
  lint(tree, `${surface}/home`)

  for (const key of ['nav-moves', 'nav-stats', 'nav-settings', 'nav-home']) {
    const nav = find(tree, t => t.type === 'Button' && t.props.key === key)[0]
    if (!nav) { fail(`${surface}: no ${key} button`); continue }
    try {
      await nav.props.onPress()
      tree = await render(surface)
      console.log(`[${surface}] ${key}:`, text(tree).slice(0, 110))
      lint(tree, `${surface}/${key}`)
      sizeCheck(tree, `${surface}/${key}`)
    } catch (e) { fail(`${surface}/${key}: ${e.stack}`) }
  }

  // the Moves screen: press every filter and page button
  try {
    await find(tree, t => t.props?.key === 'nav-moves')[0].props.onPress()
    for (const key of ['r-core', 'r-neck', 'p-office', 'p-home', 'mine', 'r-all', 'p-all', 'more']) {
      tree = await render(surface)
      const b = find(tree, t => t.type === 'Button' && t.props.key === key)[0]
      if (!b) { console.log(`  (no ${key} on screen)`); continue }
      await b.props.onPress()
      tree = await render(surface)
      lint(tree, `${surface}/moves/${key}`)
      if (key === 'r-all') sizeCheck(tree, `${surface}/moves first page`)
      console.log(`[${surface}] moves ${key}: ${text(tree).match(/\d+ moves/)?.[0]}`)
    }
  } catch (e) { fail(`${surface}/moves: ${e.stack}`) }
}

{
  // size of the Moves tree: the engine may refuse a very large one
  const tree = await render('desktop')
  const svgs = find(tree, t => t.type === 'Svg').map(t => String(t.props.source).length)
  console.log(`last tree: ${(JSON.stringify(tree).length / 1024).toFixed(0)} KB, ${svgs.length} svgs, largest ${(Math.max(0, ...svgs) / 1024).toFixed(0)} KB`)
}

console.log(failures === 0 ? '\nui ok' : `\n${failures} problem(s)`)
process.exit(failures === 0 ? 0 : 1)
