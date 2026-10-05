// Lists every English text the plugin can show and reports which have no Turkish translation.
// Usage: npx tsx scripts/i18n-check.mjs [--print]   (--print writes the missing keys as a TypeScript stub)
import { readFileSync } from 'node:fs'
import { CATALOG } from '../hooks/catalog.ts'
import { BADGES } from '../hooks/badges.ts'
import { TR } from '../hooks/tr.ts'
import { REGION_LABEL } from '../hooks/muscles.ts'

const keys = new Set()
const add = k => k && keys.add(k.replace(/\\'/g, "'"))

// texts passed to T(), tx(), tr() and notify(): read each call's arguments, quotes and nesting respected
const src = readFileSync('hooks/register.tsx', 'utf8')
const starts = /\b(?:T|tx|tr|notify|fail|msg)\(/g
for (const m of src.matchAll(starts)) {
  let i = m.index + m[0].length
  let depth = 1
  while (i < src.length && depth > 0) {
    const c = src[i]
    if (c === "'" || c === '"' || c === '`') {
      let j = i + 1
      while (j < src.length && src[j] !== c) j += src[j] === '\\' ? 2 : 1
      // a plain string at the top level of the call (or inside a ternary) is a text to translate
      if (c === "'" || c === '"') add(src.slice(i + 1, j))
      i = j + 1
      continue
    }
    if (c === '(' || c === '{' || c === '[') depth += c === '(' ? 1 : 0
    if (c === ')') depth -= 1
    i += 1
  }
}
// one-line hints per goal
for (const m of src.matchAll(/GOAL_HINTS[^{]*\{([^}]*)\}/g)) for (const lit of m[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)) add(lit[1])
// labels in option lists and constants
for (const m of src.matchAll(/label: '((?:[^'\\]|\\.)*)'/g)) add(m[1])
for (const m of src.matchAll(/\['(Su|Mo|Tu|We|Th|Fr|Sa)'/g)) add(m[1])
for (const d of ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']) add(d)
const settings = readFileSync('hooks/settings.ts', 'utf8')
for (const m of settings.matchAll(/label: '((?:[^'\\]|\\.)*)'/g)) if (m[1] !== 'Türkçe' && m[1] !== 'English') add(m[1])
for (const t of ['all', 'important', 'none']) void t
// exercises, areas, levels, badges
for (const e of CATALOG) { add(e.name); add(e.howto); add(e.area); add(e.level) }
for (const b of BADGES) { add(b.name); add(b.desc) }
// body regions, kinds, intensity words and the planner's reasons
for (const v of Object.values(REGION_LABEL)) add(v)
for (const m of src.matchAll(/KIND_LABEL = \{([^}]*)\}/g)) for (const lit of m[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)) add(lit[1])
for (const t of ['light', 'moderate', 'intense', 'Office and home', 'Home only', 'Office only']) add(t)
for (const m of readFileSync('hooks/planner.ts', 'utf8').matchAll(/text: '((?:[^'\\]|\\.)*)'/g)) add(m[1])
// server messages shown to people
for (const m of ['nickname taken', 'no team with that code', 'too many sign-ups, try later', 'you are in too many teams', 'team is full',
  'not a member', 'unknown user', 'bad signature', 'replay', 'clock skew', 'missing credentials', 'bad json', 'too large', 'not found',
  'nickname must be 3-20 letters, digits, _ or -', 'no such team', 'only the team owner can do that', 'no such member', 'use leave to leave your own team', 'could not make a new code', 'no such user', 'team name must be 3-30 characters', 'bad secret']) add(m)

const IGNORE = new Set(['home', ' · ', ', ', 'en', 'tr', 'board', 'team', '▢', '▣', '★', '☆'])
const missing = [...keys].filter(k => !IGNORE.has(k) && !(k in TR)).sort()
const extra = Object.keys(TR).filter(k => !keys.has(k) && !k.startsWith('nickname ') )
// a translation must keep exactly the {placeholders} of its English text
const holes = t => [...t.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(',')
const broken = Object.entries(TR).filter(([k, v]) => holes(k) !== holes(v))
for (const [k, v] of broken) console.log('  placeholders differ:', k, '=>', v)
console.log(`${keys.size} texts, ${keys.size - missing.length} translated, ${missing.length} missing, ${extra.length} unused`)
if (process.argv.includes('--print')) for (const k of missing) console.log(JSON.stringify(k))
else {
  for (const k of missing) console.log('  missing:', k)
  for (const k of extra) console.log('  unused :', k)
}
process.exit(missing.length === 0 && broken.length === 0 ? 0 : 1)
