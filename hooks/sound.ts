// Short sound effects, synthesized as WAV so the mod ships no audio files.

export type SoundKind = 'tick' | 'start' | 'done' | 'goal'

const RATE = 22050

const SEQUENCES: Record<SoundKind, { hz: number; ms: number }[]> = {
  tick: [{ hz: 1100, ms: 45 }],
  start: [{ hz: 587, ms: 90 }, { hz: 880, ms: 140 }],
  done: [{ hz: 523, ms: 100 }, { hz: 659, ms: 100 }, { hz: 784, ms: 200 }],
  goal: [{ hz: 523, ms: 110 }, { hz: 659, ms: 110 }, { hz: 784, ms: 110 }, { hz: 1047, ms: 380 }],
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

const base64 = (bytes: Uint8Array): string => {
  let out = ''

  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] ?? 0
    const b = bytes[i + 1] ?? 0
    const c = bytes[i + 2] ?? 0
    const n = (a << 16) | (b << 8) | c

    out += B64[(n >> 18) & 63] ?? ''
    out += B64[(n >> 12) & 63] ?? ''
    out += i + 1 < bytes.length ? (B64[(n >> 6) & 63] ?? '') : '='
    out += i + 2 < bytes.length ? (B64[n & 63] ?? '') : '='
  }

  return out
}

const wav = (seq: { hz: number; ms: number }[]): string => {
  const samples: number[] = []

  for (const { hz, ms } of seq) {
    const n = Math.round((RATE * ms) / 1000)

    for (let i = 0; i < n; i++) {
      const t = i / RATE
      const attack = Math.min(i / 200, 1)
      const decay = Math.exp((-3.2 * i) / n)

      samples.push(Math.sin(2 * Math.PI * hz * t) * attack * decay * 0.55)
    }
  }

  const data = new Uint8Array(44 + samples.length * 2)
  const view = new DataView(data.buffer)
  const str = (at: number, s: string) => [...s].forEach((ch, i) => view.setUint8(at + i, ch.charCodeAt(0)))

  str(0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true)
  str(8, 'WAVE')
  str(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, RATE, true)
  view.setUint32(28, RATE * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  str(36, 'data')
  view.setUint32(40, samples.length * 2, true)
  samples.forEach((s, i) => view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, s)) * 32767, true))

  return base64(data)
}

const cache: Partial<Record<SoundKind, string>> = {}

export const soundOf = (kind: SoundKind): string => (cache[kind] ??= wav(SEQUENCES[kind]))
