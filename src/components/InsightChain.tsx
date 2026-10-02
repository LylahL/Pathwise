import type { InsightChain as Chain } from '../types'
import { Badge } from './ui'

const steps = [
  ['Evidence', 'text-zinc-500', 'bg-zinc-400'],
  ['Inference', 'text-indigo-600', 'bg-indigo-500'],
  ['Gap', 'text-rose-600', 'bg-rose-500'],
  ['Recommendation', 'text-emerald-600', 'bg-emerald-500'],
  ['Experiment', 'text-amber-600', 'bg-amber-500'],
] as const

/** The full reasoning: Evidence → Inference → Gap → Recommendation → Experiment. */
export default function InsightChain({ chain, hideTitle }: { chain: Chain; hideTitle?: boolean }) {
  const body: Record<string, React.ReactNode> = {
    Evidence: <ul className="space-y-1">{chain.evidence.map((e) => <li key={e}>{e}</li>)}</ul>,
    Inference: chain.inference,
    Gap: chain.gap,
    Recommendation: chain.recommendation,
    Experiment: <>{chain.experiment.hypothesis} <span className="text-zinc-500">Metric: {chain.experiment.metric}.</span></>,
  }
  return (
    <div className="px-5 pb-5">
      {!hideTitle && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h4 className="text-sm font-semibold text-zinc-900">{chain.title}</h4>
          <Badge tone={chain.confidence === 'high' ? 'good' : chain.confidence === 'medium' ? 'info' : 'warn'}>{chain.confidence} confidence</Badge>
        </div>
      )}
      <ol className="relative space-y-3 border-l border-zinc-200 pl-5">
        {steps.map(([k, text, dot]) => (
          <li key={k} className="relative text-[13px] leading-relaxed text-zinc-700">
            <span className={`absolute -left-[25px] top-1.5 h-2 w-2 rounded-full ring-4 ring-white ${dot}`} />
            <div className={`mb-0.5 text-[10px] font-semibold uppercase tracking-wider ${text}`}>{k}</div>
            {body[k]}
          </li>
        ))}
      </ol>
      <p className="mt-3 text-[11px] text-zinc-400">{chain.confidenceNote}</p>
    </div>
  )
}
