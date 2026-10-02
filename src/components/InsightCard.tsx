import { Link } from 'react-router-dom'
import type { InsightChain } from '../types'
import { Badge, cx } from './ui'
import type { Tone } from './ui'

const area: Record<InsightChain['area'], { label: string; tone: Tone; bar: string }> = {
  fit: { label: 'Career fit', tone: 'good', bar: 'bg-emerald-500' },
  funnel: { label: 'Funnel', tone: 'warn', bar: 'bg-amber-500' },
  skills: { label: 'Skills', tone: 'accent', bar: 'bg-indigo-500' },
}
const confidenceDot = { low: 'bg-amber-400', medium: 'bg-sky-400', high: 'bg-emerald-500' } as const

/** Short, scannable view of an insight: the finding, its strongest evidence and the gap. Full reasoning lives on Experiments. */
export default function InsightCard({ chain }: { chain: InsightChain }) {
  const a = area[chain.area]
  return (
    <article className="relative flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white p-4 pl-5">
      <span className={cx('absolute inset-y-0 left-0 w-1', a.bar)} aria-hidden />
      <div className="mb-2"><Badge tone={a.tone}>{a.label}</Badge></div>
      <h4 className="text-[13px] font-semibold leading-snug text-zinc-900">{chain.title}</h4>
      <p className="mt-2 text-xs leading-relaxed text-zinc-600">{chain.evidence[0]}</p>
      <p className="mt-1 text-xs leading-relaxed text-zinc-500"><span className="font-medium text-rose-600">Gap · </span>{chain.gap}</p>
      <div className="mt-3 flex items-center justify-between gap-2 pt-1 text-[11px] text-zinc-500">
        <span className="inline-flex items-center gap-1.5" title={chain.confidenceNote}><span className={cx('h-1.5 w-1.5 rounded-full', confidenceDot[chain.confidence])} />{chain.confidence} confidence</span>
        <Link to="/experiments" className="font-medium text-indigo-600 hover:text-indigo-500">Reasoning →</Link>
      </div>
    </article>
  )
}
