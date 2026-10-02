import { Play, Check } from 'lucide-react'
import { useApp, chainToExperiment } from '../store'
import { Badge, Button, Card, CardHeader, PageHeader } from '../components/ui'
import InsightChain from '../components/InsightChain'
import { pct } from '../lib/analytics'
import type { Experiment } from '../types'

const rate = (x?: { n: number; responses: number }) => (x && x.n ? x.responses / x.n : null)

function ExperimentCard({ e, onLaunch, onComplete }: { e: Experiment; onLaunch?: () => void; onComplete?: () => void }) {
  const c = rate(e.control), v = rate(e.variant)
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold tracking-tight">{e.title}</h4>
          <p className="mt-1 text-[13px] text-zinc-600">{e.hypothesis}</p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          {e.origin === 'demo-seed' && <Badge>demo</Badge>}
          <Badge tone={e.status === 'running' ? 'accent' : e.status === 'completed' ? 'good' : 'warn'}>{e.status}</Badge>
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
        <div><dt className="text-zinc-500">Change</dt><dd className="mt-0.5 text-zinc-800">{e.change}</dd></div>
        <div><dt className="text-zinc-500">Metric · target sample</dt><dd className="mt-0.5 text-zinc-800">{e.metric} · n={e.targetN}</dd></div>
      </dl>
      {e.control && e.variant && (
        <div className="mt-3 rounded-lg bg-zinc-50 p-3 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div><div className="text-zinc-500">Baseline</div><div className="tabular text-sm font-semibold">{e.control.responses}/{e.control.n} <span className="font-normal text-zinc-500">({pct(c ?? 0)})</span></div></div>
            <div><div className="text-zinc-500">Variant</div><div className="tabular text-sm font-semibold">{e.variant.responses}/{e.variant.n} <span className="font-normal text-zinc-500">({pct(v ?? 0)})</span></div></div>
          </div>
          <p className="mt-2 text-zinc-500">{e.variant.n < e.targetN ? `${e.variant.n} of ${e.targetN} planned applications sent. ` : ''}Samples this small are directional only — no significance claim is made.</p>
        </div>
      )}
      {(onLaunch || onComplete) && (
        <div className="mt-4">
          {onLaunch && <Button onClick={onLaunch}><Play size={12} /> Launch experiment</Button>}
          {onComplete && <Button variant="ghost" onClick={onComplete}><Check size={12} /> Mark complete</Button>}
        </div>
      )}
    </Card>
  )
}

export default function Experiments() {
  const { experiments, proposals, launch, complete, report } = useApp()
  const active = experiments.filter((e) => e.status !== 'completed')
  const done = experiments.filter((e) => e.status === 'completed')
  return (
    <>
      <PageHeader title="Experiments" sub="Treat each change to your search as a hypothesis with a metric and a sample size." />

      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Proposed by AI · {proposals.length}</h2>
      <div className="mb-8 grid gap-4">
        {report?.chains.filter((c) => proposals.some((p) => p.chainId === c.id)).map((c) => (
          <Card key={c.id}>
            <CardHeader title={c.experiment.title} sub={`From insight: ${c.title}`} right={<Button onClick={() => launch(chainToExperiment(c))}><Play size={12} /> Launch</Button>} />
            <InsightChain chain={c} />
          </Card>
        ))}
        {proposals.length === 0 && <Card className="p-5 text-sm text-zinc-500">All current insights have experiments running.</Card>}
      </div>

      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Active · {active.length}</h2>
      <div className="mb-8 grid grid-cols-2 gap-4">{active.map((e) => <ExperimentCard key={e.id} e={e} onComplete={() => complete(e.id)} />)}</div>

      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Completed · {done.length}</h2>
      <div className="grid grid-cols-2 gap-4">{done.map((e) => <ExperimentCard key={e.id} e={e} />)}</div>
    </>
  )
}
