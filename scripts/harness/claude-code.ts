// A stand-in for the engine's 'claude-code' module, enough to run the plugin's hooks in plain Node.
const values = new Map<string, unknown>()
const keyOf = (a: { ref: { plugin: string; key: string } }) => `${a.ref.plugin}.${a.ref.key}`

export const atom = (ref: { plugin: string; key: string }, initial: unknown) => ({ ref, initial })
export const read = async (_$: unknown, a: { ref: { plugin: string; key: string }; initial: unknown }) =>
  values.has(keyOf(a)) ? values.get(keyOf(a)) : a.initial
export const update = async (_$: unknown, a: { ref: { plugin: string; key: string }; initial: unknown }, fn: (v: any) => unknown) => {
  values.set(keyOf(a), fn(values.has(keyOf(a)) ? values.get(keyOf(a)) : a.initial))
}
export const resetState = () => values.clear()
