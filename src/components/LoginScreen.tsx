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

export default function LoginScreen({ clientId, error, onCredential }: { clientId: string; error?: string; onCredential: (credential: string) => void }) {
  const slot = useRef<HTMLDivElement>(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let live = true
    loadGoogle()
      .then(() => {
        if (!live || !slot.current || !window.google) return
        window.google.accounts.id.initialize({ client_id: clientId, callback: (r) => onCredential(r.credential) })
        window.google.accounts.id.renderButton(slot.current, { theme: 'outline', size: 'large', text: 'continue_with', shape: 'pill', width: 280 })
      })
      .catch(() => live && setLoadError(true))
    return () => { live = false }
  }, [clientId, onCredential])

  return (
    <main className="grid min-h-full place-items-center px-4 py-10">
      <div className="anim-page w-full max-w-sm rounded-2xl border border-zinc-200/80 bg-white p-8 text-center shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-indigo-600 text-lg font-bold text-white shadow-sm">P</div>
        <h1 className="mt-5 text-2xl font-semibold text-zinc-900">Pathwise</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">Turn the job search into a data problem. See where you fit, where your search is breaking, and what to do next.</p>
        <div className="mt-7 flex min-h-[44px] justify-center" ref={slot} />
        {loadError && <p role="alert" className="mt-3 text-sm text-rose-600">Couldn’t load Google sign-in. Check your connection or disable the blocker for accounts.google.com, then reload.</p>}
        {error && <p role="alert" className="mt-3 text-sm text-rose-600">{error}</p>}
        <p className="mt-6 text-[11px] leading-relaxed text-zinc-400">We use your Google name and email only to sign you in. Demo data: the career profile you’ll see is fictional.</p>
      </div>
    </main>
  )
}
