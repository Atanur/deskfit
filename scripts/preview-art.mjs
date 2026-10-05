// Writes .claude/preview/index.html: every exercise drawing, animated, plus the charts.
// Usage: node --experimental-strip-types scripts/preview-art.mjs
import { writeFileSync, mkdirSync } from 'node:fs'
import { CATALOG } from '../hooks/catalog.ts'
import { figureSvg, figureText, ringSvg, barsSvg, badgesSvg, podiumSvg } from '../hooks/art.ts'

mkdirSync('.claude/preview', { recursive: true })
const weak = new Set(['neck-roll','chin-tuck','shoulder-roll','wrist-circles','prayer-stretch','calf-raise','glute-bridge-stand','plank','wall-sit','march','wall-angel','chair-twist'])
const only = process.env.ONLY ? new Set(process.env.ONLY.split(',')) : null
const isNew = e => e.equipment.length > 0 || (e.places.length === 1 && e.places[0] === 'home') || ['seated-leg-extension','figure-four','quad-stretch','glute-kickback','wall-pushup','wall-chest-stretch','overhead-reach'].includes(e.id)
const cards = CATALOG.filter(e => (only ? only.has(e.id) : process.env.NEW ? isNew(e) : !process.env.WEAK || weak.has(e.id))).map(
  e => `<div class="c"><div class="t">${e.id}</div><div class="r">${figureSvg(e.id, 150, 0, true, process.env.LOOK ?? 'drawn')}${figureSvg(e.id, 150, 1, true, process.env.LOOK ?? 'drawn')}${figureSvg(e.id, 190, undefined, true, process.env.LOOK ?? 'drawn')}</div></div>`,
).join('')
const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, i) => ({ label, sets: [3, 5, 6, 2, 5, 0, 4][i] }))
const badges = ['first-set', 'streak-3', 'build-break', 'ten-sets', 'early-bird'].map((id, i) => ({ id, name: id, earned: i < 3 }))
const html = `<!doctype html><meta charset="utf-8"><style>
body{font-family:system-ui;background:#fff;color:#222;margin:16px}
@media(prefers-color-scheme:dark){body{background:#16181d;color:#ddd}}
.g{display:flex;flex-wrap:wrap;gap:14px}.r{display:flex;gap:2px}.c{width:540px;border:1px solid #8884;border-radius:10px;padding:8px}
.t{font-weight:600;margin-bottom:4px}pre{font-size:9px;line-height:1;margin:4px 0 0;color:#14b8a6}
</style><h3>Charts</h3><div class="g">${ringSvg(3, 5)}${ringSvg(5, 5)}${barsSvg(days, 5)}${badgesSvg(badges)}${podiumSvg([{nickname:'ann',points:340},{nickname:'bobby_t',points:280},{nickname:'cem',points:120}])}</div>
<h3>Exercises</h3><div class="g">${cards}</div>`
writeFileSync('.claude/preview/index.html', html)
console.log('wrote', CATALOG.length, 'exercises,', html.length, 'bytes')
