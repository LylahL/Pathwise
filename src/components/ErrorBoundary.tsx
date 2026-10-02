import { Component } from 'react'
import type { ReactNode } from 'react'

/** Last line of defence: a render error in one page shows a message instead of a blank screen. */
export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: unknown) { console.error('[ui] render error:', error) }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div role="alert" className="mx-auto mt-24 max-w-md rounded-xl border border-rose-200 bg-white p-6 text-center">
        <h2 className="text-base font-semibold text-zinc-900">This page hit an unexpected error</h2>
        <p className="mt-1.5 text-sm text-zinc-500">Your data is safe. Reloading usually fixes it.</p>
        <button onClick={() => location.reload()} className="mt-4 cursor-pointer rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500">Reload</button>
      </div>
    )
  }
}
