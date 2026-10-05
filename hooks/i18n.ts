// Text in the person's language. The English text is the key (as in gettext): `tr('tr', 'Daily goal')`.
// A `{name}` in the text is filled from `vars`. Text with no translation shows in English.
import { TR } from './tr'

export type Lang = 'en' | 'tr'
export type Vars = Record<string, string | number>

export const tr = (lang: Lang, text: string, vars?: Vars): string => {
  const base = lang === 'tr' ? (TR[text] ?? text) : text

  return vars ? base.replace(/\{(\w+)\}/g, (whole, key: string) => (key in vars ? String(vars[key]) : whole)) : base
}
