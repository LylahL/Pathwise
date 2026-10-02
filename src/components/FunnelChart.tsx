import { Inbox } from 'lucide-react'
import type { Application } from '../types'
import { funnelCounts, pct } from '../lib/analytics'
import { Badge, Bar, EmptyState } from './ui'

const STAGE_COLORS = ['bg-indigo-600', 'bg-indigo-500', 'bg-indigo-400', 'bg-indigo-300', 'bg-indigo-200']

/** Horizontal funnel. Between stages it states how many dropped out, and flags the biggest leak. */
export default function FunnelChart({ apps, breakpoint }: { apps: Application[]; breakpoint?: string }) {
  const counts = funnelCounts(apps)
  if (apps.length === 0) return <EmptyState icon={Inbox} title="No applications yet" hint="Log an application to see where your funnel drops off." />
  const top = counts[0].count || 1
  return (
    <ol className="px-5 pb-5">
      {counts.map((c, i) => {
        const prev = counts[i - 1]
        const isBreak = Boolean(prev) && breakpoint === `${prev.stage} → ${c.stage}`
        return (
          <li key={c.stage}>
            {prev && (
              <div className="my-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 pl-[7.75rem] text-[11px] sm:pl-[8.5rem]">
                <span className={isBreak ? 'font-semibold text-rose-600' : 'text-zinc-400'}>↓ {prev.count - c.count} dropped · {pct(prev.count ? c.count / prev.count : 0)} moved on</span>
                {isBreak && <Badge tone="bad">Biggest drop</Badge>}
              </div>
            )}
            <div className="grid grid-cols-[6.75rem_1fr_2rem] items-center gap-3 sm:grid-cols-[7.5rem_1fr_2rem]">
              <span className="text-[13px] font-medium leading-tight text-zinc-700">{c.stage}</span>
              <div className="h-7 overflow-hidden rounded-md bg-zinc-100">
                <div className={`anim-grow h-full rounded-md transition-[width] duration-500 ${isBreak ? 'bg-rose-500' : STAGE_COLORS[i]}`} style={{ width: `${Math.max((c.count / top) * 100, c.count ? 2 : 0)}%`, animationDelay: `${i * 70}ms` }} />
              </div>
              <span className="num text-right text-sm font-semibold text-zinc-900">{c.count}</span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export { Bar }
