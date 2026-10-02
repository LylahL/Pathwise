import type { Application } from '../types'
import { funnelCounts, pct } from '../lib/analytics'

export default function FunnelChart({ apps, breakpoint }: { apps: Application[]; breakpoint?: string }) {
  const counts = funnelCounts(apps)
  const top = counts[0].count || 1
  return (
    <div className="space-y-2.5 px-5 pb-5">
      {counts.map((c, i) => {
        const prev = counts[i - 1]?.count
        const conv = prev ? c.count / prev : null
        const isBreak = breakpoint === `${counts[i - 1]?.stage} → ${c.stage}`
        return (
          <div key={c.stage}>
            <div className="mb-1 flex items-baseline justify-between text-xs">
              <span className="font-medium text-zinc-700">{c.stage}</span>
              <span className="tabular text-zinc-500">
                <span className="font-semibold text-zinc-900">{c.count}</span>
                {conv !== null && (
                  <span className={isBreak ? 'ml-2 font-semibold text-rose-600' : 'ml-2'}>{pct(conv)} of prev{isBreak ? ' · breaks here' : ''}</span>
                )}
              </span>
            </div>
            <div className="h-6 rounded-md bg-zinc-100">
              <div
                className="h-full rounded-md"
                style={{ width: `${Math.max((c.count / top) * 100, c.count ? 1.5 : 0)}%`, background: isBreak ? '#e11d48' : `rgba(79,70,229,${1 - i * 0.17})` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
