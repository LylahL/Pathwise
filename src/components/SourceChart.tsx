import { BarChart3 } from 'lucide-react'
import type { Application } from '../types'
import { pct, segmentBy } from '../lib/analytics'
import { Bar, EmptyState } from './ui'

/**
 * Response rate for any grouping. Color means the rate (emerald healthy, indigo middling, rose weak);
 * small samples are faded and labelled so a 3-of-4 never looks as solid as 1-of-20.
 */
export default function SegmentChart({ apps, by, minN = 8 }: { apps: Application[]; by: (a: Application) => string; minN?: number }) {
  const data = segmentBy(apps, by)
  if (data.length === 0) return <EmptyState icon={BarChart3} title="Nothing to compare yet" hint="Response rates appear once you log applications." />
  return (
    <ul className="space-y-3.5 px-5 pb-5">
      {data.map((s) => {
        const low = s.n < minN, p = Math.round(s.rate * 100)
        return (
          <li key={s.key} title={`${s.responded} of ${s.n} applications got a response (${pct(s.rate)})`}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px]">
              <span className="truncate font-medium text-zinc-800">{s.key}</span>
              <span className="num shrink-0 text-xs text-zinc-500">
                <b className="text-sm font-semibold text-zinc-900">{p}%</b> · {s.responded}/{s.n}
                {low && <span className="ml-1.5 rounded bg-amber-50 px-1 py-0.5 text-[10px] font-medium text-amber-700">small sample</span>}
              </span>
            </div>
            <Bar value={p} color={p >= 30 ? 'bg-emerald-500' : p >= 12 ? 'bg-indigo-500' : 'bg-rose-500'} className={low ? 'opacity-50' : undefined} />
          </li>
        )
      })}
    </ul>
  )
}
