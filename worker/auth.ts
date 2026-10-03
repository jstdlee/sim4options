import type { Env } from './env'

// Access-token login. ACCESS_TOKEN is a Worker secret; several tokens may be given, comma-separated.
// A valid login sets an HttpOnly cookie holding HMAC(token). Changing a token signs out its sessions.
const COOKIE = 'oq_session'
const MAX_AGE = 60 * 60 * 24 * 30
const enc = new TextEncoder()

const tokens = (env: Env) => (env.ACCESS_TOKEN ?? '').split(',').map((t) => t.trim()).filter(Boolean)

async function hmacHex(key: string, msg: string) {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', k, enc.encode(msg))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
const sha256 = async (s: string) => new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s)))
const sameBytes = (a: Uint8Array, b: Uint8Array) => a.length === b.length && (crypto.subtle as any).timingSafeEqual(a, b)
const session = (token: string) => hmacHex(token, 'oq-session-v1')

function readCookie(req: Request) {
  const m = (req.headers.get('cookie') ?? '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=([a-f0-9]{64})`))
  return m?.[1] ?? null
}

export async function isAuthed(req: Request, env: Env) {
  const got = readCookie(req)
  if (!got) return false
  const gotHash = await sha256(got)
  for (const t of tokens(env)) if (sameBytes(gotHash, await sha256(await session(t)))) return true
  return false
}

/** Returns the session cookie for a valid token, or null. */
export async function login(token: string, env: Env) {
  const gotHash = await sha256(String(token ?? '').trim())
  for (const t of tokens(env)) {
    if (sameBytes(gotHash, await sha256(t))) return `${COOKIE}=${await session(t)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`
  }
  return null
}

export const logoutCookie = `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
export const isConfigured = (env: Env) => tokens(env).length > 0
