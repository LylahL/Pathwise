/**
 * Minimal Google sign-in. The browser gets an ID token from Google Identity Services and posts it here; we confirm
 * with Google that it is valid and was issued for OUR client id, then set a signed, HTTP-only session cookie.
 * Auth is OFF unless GOOGLE_CLIENT_ID is set, so local dev and the tests behave as before.
 */
import { randomBytes } from 'node:crypto'
import { Hono } from 'hono'
import type { MiddlewareHandler } from 'hono'
import { deleteCookie, getSignedCookie, setSignedCookie } from 'hono/cookie'
import { z } from 'zod'
import { config } from './config'
import { body, HttpError } from './http'

const COOKIE = 'pathwise_session'
const WEEK = 60 * 60 * 24 * 7
// Without SESSION_SECRET a random one is used, so everyone is signed out whenever the server restarts.
const SECRET = process.env.SESSION_SECRET ?? randomBytes(32).toString('hex')

const SessionUser = z.object({ sub: z.string(), email: z.string(), name: z.string(), picture: z.string().optional() })
export type SessionUser = z.infer<typeof SessionUser>

const clientId = () => process.env.GOOGLE_CLIENT_ID || undefined
export const authEnabled = () => Boolean(clientId())

/** Optional allow-list so strangers can't spend your AI quota: ALLOWED_EMAILS=a@x.com,b@y.com */
const allowed = (email: string) => {
  const list = (process.env.ALLOWED_EMAILS ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
  return list.length === 0 || list.includes(email.toLowerCase())
}

async function verifyGoogleToken(idToken: string): Promise<SessionUser> {
  const base = process.env.GOOGLE_TOKENINFO_URL ?? 'https://oauth2.googleapis.com/tokeninfo'
  let res: Response
  try { res = await fetch(`${base}?id_token=${encodeURIComponent(idToken)}`) } catch { throw new HttpError(502, 'Could not reach Google to verify the sign-in', 'auth_unreachable') }
  if (!res.ok) throw new HttpError(401, 'Google did not accept this sign-in', 'invalid_token')
  const t = (await res.json().catch(() => ({}))) as Record<string, string>
  if (t.aud !== clientId()) throw new HttpError(401, 'This sign-in was issued for a different app', 'invalid_token')
  if (!['accounts.google.com', 'https://accounts.google.com'].includes(t.iss)) throw new HttpError(401, 'Unexpected token issuer', 'invalid_token')
  if (String(t.email_verified) !== 'true') throw new HttpError(401, 'Your Google email is not verified', 'invalid_token')
  if (!(Number(t.exp) * 1000 > Date.now())) throw new HttpError(401, 'This sign-in has expired', 'invalid_token')
  if (!allowed(t.email)) throw new HttpError(403, 'This account is not on the allow-list', 'not_allowed')
  return { sub: t.sub, email: t.email, name: t.name || t.email, picture: t.picture }
}

async function readSession(c: Parameters<MiddlewareHandler>[0]): Promise<SessionUser | null> {
  const raw = await getSignedCookie(c, SECRET, COOKIE)
  if (!raw) return null
  try {
    const parsed = SessionUser.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch { return null }
}

/** Blocks the API for signed-out visitors when auth is on. Health and auth routes stay open. */
export const requireSession: MiddlewareHandler = async (c, next) => {
  if (!authEnabled() || c.req.path === '/api/health' || c.req.path.startsWith('/api/auth/')) return next()
  if (!(await readSession(c))) return c.json({ error: 'unauthorized', message: 'Sign in required' }, 401)
  return next()
}

export const auth = new Hono()

// The client id is public by design (it is embedded in every Google sign-in button).
auth.get('/auth/me', async (c) => c.json({ enabled: authEnabled(), clientId: clientId() ?? null, user: authEnabled() ? await readSession(c) : null }))

auth.post('/auth/google', async (c) => {
  if (!authEnabled()) throw new HttpError(400, 'Sign-in is not enabled on this server', 'auth_disabled')
  const { credential } = await body(c, z.object({ credential: z.string().min(20).max(4096) }))
  const user = await verifyGoogleToken(credential)
  await setSignedCookie(c, COOKIE, JSON.stringify(user), SECRET, { httpOnly: true, sameSite: 'Lax', secure: config.isProd, path: '/', maxAge: WEEK })
  return c.json({ user })
})

auth.post('/auth/logout', (c) => {
  deleteCookie(c, COOKIE, { path: '/' })
  return c.json({ ok: true })
})
