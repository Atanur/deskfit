// Request signing and recovery codes. Pure functions, no `$`: the hooks module
// runs where crypto.subtle offers digest() only, so HMAC-SHA256 is built on it.
// The server verifies with native HMAC; both produce the same bytes.

const enc = new TextEncoder()

export const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')

export const fromHex = (s: string): Uint8Array =>
  new Uint8Array((s.match(/../g) ?? []).map(h => parseInt(h, 16)))

export const randomHex = (n: number): string => toHex(crypto.getRandomValues(new Uint8Array(n)))

const sha256 = async (data: Uint8Array): Promise<Uint8Array> =>
  new Uint8Array(await crypto.subtle.digest('SHA-256', data))

export const sha256Hex = async (text: string): Promise<string> => toHex(await sha256(enc.encode(text)))

export const hmacSha256Hex = async (secretHex: string, message: string): Promise<string> => {
  const BLOCK = 64
  let key = fromHex(secretHex)

  if (key.length > BLOCK) key = await sha256(key)

  const ipad = new Uint8Array(BLOCK)
  const opad = new Uint8Array(BLOCK)

  for (let i = 0; i < BLOCK; i++) {
    const k = key[i] ?? 0

    ipad[i] = k ^ 0x36
    opad[i] = k ^ 0x5c
  }

  const msg = enc.encode(message)
  const inner = new Uint8Array(BLOCK + msg.length)

  inner.set(ipad)
  inner.set(msg, BLOCK)

  const innerHash = await sha256(inner)
  const outer = new Uint8Array(BLOCK + innerHash.length)

  outer.set(opad)
  outer.set(innerHash, BLOCK)

  return toHex(await sha256(outer))
}

export type SignedHeaders = Record<string, string>

/** The four headers the server checks; `path` includes the query string. */
export const signHeaders = async (
  userId: string,
  secretHex: string,
  method: string,
  path: string,
  body: string,
  ts: number,
  nonce: string,
): Promise<SignedHeaders> => {
  const canonical = [method, path, ts, nonce, await sha256Hex(body)].join('\n')

  return {
    'x-user': userId,
    'x-ts': String(ts),
    'x-nonce': nonce,
    'x-sig': await hmacSha256Hex(secretHex, canonical),
  }
}

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

const base32 = (bytes: Uint8Array): string => {
  let bits = 0
  let value = 0
  let out = ''

  for (const b of bytes) {
    value = (value << 8) | b
    bits += 8

    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }

  if (bits > 0) out += B32[(value << (5 - bits)) & 31]

  return out
}

const unbase32 = (text: string): Uint8Array | null => {
  let bits = 0
  let value = 0
  const out: number[] = []

  for (const c of text) {
    const i = B32.indexOf(c)

    if (i === -1) return null

    value = (value << 5) | i
    bits += 5

    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }

  return new Uint8Array(out)
}

const crc16 = (bytes: Uint8Array): number => {
  let crc = 0xffff

  for (const b of bytes) {
    crc ^= b << 8

    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
  }

  return crc
}

/** 8 bytes of user id + 32 bytes of secret + 2 bytes of checksum, as XXXX-XXXX-… */
export const encodeRecovery = (userId: string, secretHex: string): string => {
  const raw = new Uint8Array(40)

  raw.set(fromHex(userId), 0)
  raw.set(fromHex(secretHex), 8)

  const sum = crc16(raw)
  const all = new Uint8Array(42)

  all.set(raw)
  all[40] = sum >> 8
  all[41] = sum & 255

  return (base32(all).match(/.{1,4}/g) ?? []).join('-')
}

export const decodeRecovery = (code: string): { userId: string; secret: string } | null => {
  const bytes = unbase32(code.toUpperCase().replace(/[^A-Z2-7]/g, ''))

  if (!bytes || bytes.length < 42) return null

  const raw = bytes.slice(0, 40)
  const sum = crc16(raw)

  if (bytes[40] !== sum >> 8 || bytes[41] !== (sum & 255)) return null

  return { userId: toHex(raw.slice(0, 8)), secret: toHex(raw.slice(8, 40)) }
}
