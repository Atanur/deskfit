// Turns the downloaded Workout Guide frames into hooks/art-wg.ts: one compact path per frame.
// Paths are rounded to two decimals and re-written without needless spaces; each result is rendered next to
// the original and compared, so a rounding mistake cannot slip in.
//   npx tsx scripts/art/wg-build.mjs
import { existsSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { Resvg } from '@resvg/resvg-js'
import { WG } from './wg-map.mjs'

const require = createRequire(import.meta.url)
const Jimp = require('jimp')

const manifest = JSON.parse(readFileSync('art-work/workout-guide/manifest.json', 'utf8'))
const bySlug = new Map(manifest.map(e => [e.slug, e]))

/** Rewrites path data with numbers rounded to `digits` decimals and the shortest legal separators. */
const squeeze = (d, digits = Number(process.env.DIGITS ?? 2)) => {
  const tokens = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) ?? []
  let out = ''
  let prevNumber = false

  for (const t of tokens) {
    if (/[a-zA-Z]/.test(t)) { out += t; prevNumber = false; continue }

    let n = String(Math.round(parseFloat(t) * 10 ** digits) / 10 ** digits)

    if (n === '-0') n = '0'
    n = n.replace(/^(-?)0\./, '$1.')

    // "1.5" then ".5" can be written "1.5.5"; a negative number needs no separator at all
    const needsSpace = prevNumber && !n.startsWith('-') && !(n.startsWith('.') && out.slice(out.lastIndexOf(' ') + 1).match(/[.]/) && /[\d.]$/.test(out) && /\.\d*$/.test(out.replace(/[^.\d-]+$/, '')))

    out += (needsSpace ? ' ' : '') + n
    prevNumber = true
  }

  return out
}

const svgOf = d => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="256" height="256"><rect width="512" height="512" fill="#000"/><path fill="#fff" fill-rule="evenodd" d="${d}"/></svg>`
const png = d => Buffer.from(new Resvg(svgOf(d), { fitTo: { mode: 'width', value: 256 } }).render().asPng())

const entries = []
let before = 0
let after = 0
let worst = 0

for (const [id, slug] of Object.entries(WG)) {
  const frames = []

  for (const frame of bySlug.get(slug).frames) {
    const original = /\bd="([^"]+)"/.exec(readFileSync(`art-work/workout-guide/${frame.path}`, 'utf8'))[1]
    const small = squeeze(original)
    const a = await Jimp.read(png(original))
    const b = await Jimp.read(png(small))
    let diff = 0

    for (let i = 0; i < a.bitmap.data.length; i += 4) if (Math.abs(a.bitmap.data[i] - b.bitmap.data[i]) > 64) diff++

    worst = Math.max(worst, diff / (256 * 256))
    before += original.length
    after += small.length
    frames.push(small)
  }

  entries.push({ id, json: JSON.stringify(frames) })
}

// Frames made with an image model (art-extra/*.json), already in the 512 x 512 box and of even line weight.
const even = []

if (existsSync('art-extra')) {
  for (const f of readdirSync('art-extra').filter(f => f.endsWith('.json')).sort()) {
    const id = f.replace('.json', '')

    if (entries.some(e => e.id === id)) continue

    entries.push({ id, json: JSON.stringify(JSON.parse(readFileSync(`art-extra/${f}`, 'utf8'))) })
    even.push(id)
  }
}

// The engine reads at most 1 MiB from one imported file, so the data is split into shards of about 600 KB.
const LIMIT = 600 * 1024
const shards = [[]]
let size = 0

for (const e of entries) {
  if (size + e.json.length > LIMIT) { shards.push([]); size = 0 }

  shards[shards.length - 1].push(e)
  size += e.json.length
}

const header = `// Exercise line art from Workout Guide (https://github.com/bryllim/workout-guide) by Bryl Lim, built on Everkinetic artwork.
// Licensed under CC BY-SA 4.0: https://creativecommons.org/licenses/by-sa/4.0/ . Changes: path data rounded to two decimals and
// re-written compactly, the fill is taken from the theme at draw time. See NOTICE.md. Written by scripts/art/wg-build.mjs: do not edit.
// Each move has up to three frames of path data in a 512 x 512 box.
`
const names = shards.map((_, i) => `art-wg-${i + 1}`)

// stale shards from an earlier run would be picked up by the index, so list and clean them
for (const f of readdirSync('hooks')) if (/^art-wg-\d+\.ts$/.test(f)) unlinkSync(`hooks/${f}`)

shards.forEach((list, i) => {
  const body = `${header}export const WG_${i + 1}: Record<string, string[]> = {\n${list.map(e => `  '${e.id}': ${e.json},`).join('\n')}\n}\n`

  writeFileSync(`hooks/${names[i]}.ts`, body)
  console.log(`  ${names[i]}.ts  ${list.length} moves, ${Math.round(body.length / 1024)} KB`)
})

writeFileSync(
  'hooks/art-wg.ts',
  `${header}${names.map((n, i) => `import { WG_${i + 1} } from './${n}'`).join('\n')}\n\nexport const WG_ART: Record<string, string[]> = { ${names.map((_, i) => `...WG_${i + 1}`).join(', ')} }\n\n// moves drawn with an image model: their frames already share one line weight\nexport const WG_EVEN: string[] = ${JSON.stringify(even)}\n`,
)

console.log(`${entries.length} moves, ${Math.round(before / 1024)} KB -> ${Math.round(after / 1024)} KB of path data in ${shards.length} files`)
console.log(`worst pixel difference after rounding: ${(worst * 100).toFixed(3)}% of the picture`)
