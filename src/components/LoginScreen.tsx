import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    google?: { accounts: { id: {
      initialize: (o: { client_id: string; callback: (r: { credential: string }) => void }) => void
      renderButton: (el: HTMLElement, o: Record<string, unknown>) => void
    } } }
  }
}

const GIS = 'https://accounts.google.com/gsi/client'

function loadGoogle(): Promise<void> {
  if (window.google) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = GIS; s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('blocked'))
    document.head.appendChild(s)
  })
}

const GoogleG = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
    <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
  </svg>
)

export default function LoginScreen({ clientId, mock, error, onCredential }: { clientId: string; mock?: boolean; error?: string; onCredential: (credential: string) => void }) {
  const slot = useRef<HTMLDivElement>(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (mock) return // demo mode: no Google script, no real sign-in
    let live = true
    loadGoogle()
      .then(() => {
        if (!live || !slot.current || !window.google) return
        window.google.accounts.id.initialize({ client_id: clientId, callback: (r) => onCredential(r.credential) })
        window.google.accounts.id.renderButton(slot.current, { theme: 'outline', size: 'large', text: 'continue_with', shape: 'pill', width: 280 })
      })
      .catch(() => live && setLoadError(true))
    return () => { live = false }
  }, [clientId, mock, onCredential])

  return (
    <main className="grid min-h-full place-items-center px-4 py-10">
      <div className="anim-page w-full max-w-sm rounded-2xl border border-zinc-200/80 bg-white p-8 text-center shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-indigo-600 text-lg font-bold text-white shadow-sm">P</div>
        <h1 className="mt-5 text-2xl font-semibold text-zinc-900">Pathwise</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">Turn the job search into a data problem. See where you fit, where your search is breaking, and what to do next.</p>
        {mock ? (
          <div className="mt-7">
            <button onClick={() => onCredential('mock')} className="mx-auto flex h-10 w-[280px] cursor-pointer items-center justify-center gap-3 rounded-full border border-zinc-300 bg-white text-sm font-medium text-zinc-700 transition hover:bg-zinc-50">
              <GoogleG /> Continue with Google
            </button>
            <p className="mt-2 text-[11px] text-amber-700">Demo mode: sign-in is simulated. No Google account is used.</p>
          </div>
        ) : (
          <div className="mt-7 flex min-h-[44px] justify-center" ref={slot} />
        )}
        {!mock && loadError && <p role="alert" className="mt-3 text-sm text-rose-600">Couldn’t load Google sign-in. Check your connection or disable the blocker for accounts.google.com, then reload.</p>}
        {error && <p role="alert" className="mt-3 text-sm text-rose-600">{error}</p>}
        <p className="mt-6 text-[11px] leading-relaxed text-zinc-400">We use your Google name and email only to sign you in. Demo data: the career profile you’ll see is fictional.</p>
      </div>
    </main>
  )
}
