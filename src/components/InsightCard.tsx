import { Link } from 'react-router-dom'
import type { InsightChain } from '../types'
import { Badge } from './ui'

const area = { fit: 'Career fit', funnel: 'Funnel', skills: 'Skills' } as const

/** Concise view of an insight chain: claim, strongest evidence, gap. Full chain lives on Experiments. */
export default function InsightCard({ chain }: { chain: InsightChain }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4">
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <Badge tone="accent">{area[chain.area]}</Badge>
        <Badge tone={chain.confidence === 'high' ? 'good' : chain.confidence === 'medium' ? 'accent' : 'warn'}>{chain.confidence} confidence</Badge>
      </div>
      <h4 className="text-[13px] font-semibold leading-snug tracking-tight text-zinc-900">{chain.title}</h4>
      <p className="mt-1.5 text-xs leading-relaxed text-zinc-600"><span className="font-medium text-zinc-800">Evidence: </span>{chain.evidence[0]}</p>
      <p className="mt-1 text-xs leading-relaxed text-zinc-600"><span className="font-medium text-rose-700">Gap: </span>{chain.gap}</p>
      <Link to="/experiments" className="mt-2 inline-block text-xs font-medium text-indigo-600">See full reasoning →</Link>
    </div>
  )
}
