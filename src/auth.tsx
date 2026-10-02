import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { API_BASE, apiEnabled } from './api'
import LoginScreen from './components/LoginScreen'
import { Skeleton } from './components/ui'

export interface AuthUser { sub: string; email: string; name: string; picture?: string }
type State =
  | { status: 'loading' }
  | { status: 'off' }                                   // no backend, or the server has no GOOGLE_CLIENT_ID
  | { status: 'signedOut'; clientId: string; mock: boolean; error?: string }
  | { status: 'signedIn'; clientId: string; mock: boolean; user: AuthUser }

interface Ctx { user: AuthUser | null; signOut: () => Promise<void> }
const AuthCtx = createContext<Ctx>({ user: null, signOut: async () => {} })
export const useAuth = () => useContext(AuthCtx)

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(typeof json.message === 'string' ? json.message : `Request failed (${res.status})`)
  return json as T
}

/** Shows the login screen when the server requires Google sign-in; otherwise renders the app untouched. */
export function AuthGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(apiEnabled ? { status: 'loading' } : { status: 'off' })

  useEffect(() => {
    if (!apiEnabled) return
    let live = true
    fetch(`${API_BASE}/auth/me`)
      .then((r) => r.json())
      .then((j: { enabled: boolean; clientId: string | null; mock?: boolean; user: AuthUser | null }) => {
        if (!live) return
        const mock = Boolean(j.mock), clientId = j.clientId ?? ''
        if (!j.enabled || (!clientId && !mock)) setState({ status: 'off' })
        else setState(j.user ? { status: 'signedIn', clientId, mock, user: j.user } : { status: 'signedOut', clientId, mock })
      })
      .catch(() => live && setState({ status: 'off' })) // backend unreachable: the app shows its own offline indicator
    return () => { live = false }
  }, [])

  useEffect(() => {
    const onUnauthorized = () => setState((s) => (s.status === 'signedIn' ? { status: 'signedOut', clientId: s.clientId, mock: s.mock, error: 'Your session expired. Please sign in again.' } : s))
    window.addEventListener('pathwise:unauthorized', onUnauthorized)
    return () => window.removeEventListener('pathwise:unauthorized', onUnauthorized)
  }, [])

  // In mock mode the "credential" is ignored: the server signs in a fictional demo user.
  const signIn = useCallback(async (credential: string) => {
    try {
      const { user } = await post<{ user: AuthUser }>(credential === 'mock' ? '/auth/mock' : '/auth/google', credential === 'mock' ? undefined : { credential })
      setState((s) => (s.status === 'off' || s.status === 'loading' ? s : { status: 'signedIn', clientId: s.clientId, mock: s.mock, user }))
    } catch (e) {
      setState((s) => (s.status === 'signedOut' ? { ...s, error: e instanceof Error ? e.message : 'Sign-in failed' } : s))
    }
  }, [])

  const signOut = useCallback(async () => {
    await post('/auth/logout').catch(() => {})
    setState((s) => (s.status === 'signedIn' ? { status: 'signedOut', clientId: s.clientId, mock: s.mock } : s))
  }, [])

  if (state.status === 'loading') return <div className="grid min-h-full place-items-center p-6" aria-busy="true"><Skeleton className="h-10 w-48" /></div>
  if (state.status === 'signedOut') return <LoginScreen clientId={state.clientId} mock={state.mock} error={state.error} onCredential={signIn} />
  return <AuthCtx.Provider value={{ user: state.status === 'signedIn' ? state.user : null, signOut }}>{children}</AuthCtx.Provider>
}
