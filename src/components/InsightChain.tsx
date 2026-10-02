import type { InsightChain as Chain } from '../types'
import { Badge } from './ui'

const steps = [
  ['Evidence', 'text-zinc-500'], ['Inference', 'text-indigo-600'], ['Gap', 'text-rose-600'], ['Recommendation', 'text-emerald-600'], ['Experiment', 'text-amber-600'],
] as const

export default function InsightChain({ chain }: { chain: Chain }) {
  const body: Record<string, React.ReactNode> = {
    Evidence: <ul className="space-y-1">{chain.evidence.map((e) => <li key={e}>{e}</li>)}</ul>,
    Inference: chain.inference,
    Gap: chain.gap,
    Recommendation: chain.recommendation,
    Experiment: <>{chain.experiment.hypothesis} <span className="text-zinc-500">Metric: {chain.experiment.metric}.</span></>,
  }
  return (
    <div className="px-5 pb-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h4 className="text-sm font-semibold tracking-tight">{chain.title}</h4>
        <Badge tone={chain.confidence === 'high' ? 'good' : chain.confidence === 'medium' ? 'accent' : 'warn'}>{chain.confidence} confidence</Badge>
        <Badge>impact {chain.impact}/5</Badge>
        <Badge>effort {chain.effort}/5</Badge>
      </div>
      <ol className="relative space-y-2.5 border-l border-zinc-200 pl-4">
        {steps.map(([k, color]) => (
          <li key={k} className="relative text-[13px] leading-snug text-zinc-700">
            <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full border-2 border-white bg-zinc-300 ring-1 ring-zinc-200" />
            <div className={`mb-0.5 text-[10px] font-semibold uppercase tracking-wider ${color}`}>{k}</div>
            {body[k]}
          </li>
        ))}
      </ol>
      <p className="mt-3 text-[11px] text-zinc-400">{chain.confidenceNote}</p>
    </div>
  )
}
