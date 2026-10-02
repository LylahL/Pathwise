import { FlaskConical, Play, Check } from 'lucide-react'
import { useApp, chainToExperiment } from '../store'
import { AiMark, Badge, Bar, Button, Card, CardHeader, EmptyState, PageHeader } from '../components/ui'
import InsightChain from '../components/InsightChain'
import { pct } from '../lib/analytics'
import type { Experiment } from '../types'

const rate = (x?: { n: number; responses: number }) => (x && x.n ? x.responses / x.n : null)

function ExperimentCard({ e, onComplete }: { e: Experiment; onComplete?: () => void }) {
  const c = rate(e.control), v = rate(e.variant)
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-zinc-900">{e.title}</h4>
          <p className="mt-1 text-[13px] leading-relaxed text-zinc-600">{e.hypothesis}</p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          {e.origin === 'demo-seed' && <Badge>demo</Badge>}
          <Badge tone={e.status === 'running' ? 'accent' : e.status === 'completed' ? 'good' : 'warn'}>{e.status}</Badge>
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
        <div><dt className="text-zinc-500">Change</dt><dd className="mt-0.5 text-zinc-800">{e.change}</dd></div>
        <div><dt className="text-zinc-500">Metric · target sample</dt><dd className="mt-0.5 text-zinc-800">{e.metric} · n={e.targetN}</dd></div>
      </dl>
      {e.control && e.variant && c !== null && v !== null && (
        <div className="mt-4 space-y-2 rounded-lg bg-zinc-50 p-3 text-xs">
          {([['Baseline', c, e.control, 'bg-zinc-300'], ['Variant', v, e.variant, 'bg-indigo-500']] as const).map(([label, r, d, color]) => (
            <div key={label} className="grid grid-cols-[4.5rem_1fr_6.5rem] items-center gap-3">
              <span className="text-zinc-500">{label}</span><Bar value={r * 100} color={color} /><span className="num text-right text-zinc-500"><b className="text-sm text-zinc-900">{pct(r)}</b> · {d.responses}/{d.n}</span>
            </div>
          ))}
          <p className="pt-1 text-zinc-500">{e.variant.n < e.targetN ? `${e.variant.n} of ${e.targetN} planned applications sent. ` : ''}Samples this small are directional only; no significance claim is made.</p>
        </div>
      )}
      {onComplete && <div className="mt-4"><Button variant="ghost" onClick={onComplete}><Check size={12} /> Mark complete</Button></div>}
    </Card>
  )
}

const Heading = ({ children, count }: { children: string; count: number }) => (
  <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">{children}<span className="num rounded-full bg-zinc-200/70 px-1.5 py-0.5 text-[10px] text-zinc-600">{count}</span></h2>
)

export default function Experiments() {
  const { experiments, proposals, launch, complete, report } = useApp()
  const active = experiments.filter((e) => e.status !== 'completed')
  const done = experiments.filter((e) => e.status === 'completed')
  const proposed = report?.chains.filter((c) => proposals.some((p) => p.chainId === c.id)) ?? []
  return (
    <>
      <PageHeader kicker="4 · What to do next" title="Experiments" sub="Treat each change to your search as a hypothesis with a metric and a sample size, so you learn what works instead of guessing." />

      <Heading count={proposed.length}>Proposed by AI</Heading>
      <div className="mb-9 grid gap-4">
        {proposed.map((c, i) => (
          <Card key={c.id}>
            <CardHeader
              title={c.experiment.title}
              sub={c.experiment.hypothesis}
              right={<span className="flex items-center gap-2">{report && <AiMark source={report.generatedBy} />}<Button onClick={() => launch(chainToExperiment(c))}><Play size={12} /> Launch</Button></span>}
            />
            <div className="flex flex-wrap items-center gap-1.5 px-5 pb-3 text-[11px]">
              <Badge tone="accent">From insight · {c.title}</Badge>
              <Badge tone={c.confidence === 'high' ? 'good' : c.confidence === 'medium' ? 'info' : 'warn'}>{c.confidence} confidence</Badge>
              <Badge>impact {c.impact}/5</Badge><Badge>effort {c.effort}/5</Badge>
            </div>
            <details open={i === 0} className="group border-t border-zinc-100">
              <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3 text-xs font-medium text-zinc-600 hover:text-zinc-900">
                <span>Why the AI proposes this: evidence → inference → gap → recommendation → experiment</span>
                <span className="text-zinc-400 transition-transform group-open:rotate-90">›</span>
              </summary>
              <InsightChain chain={c} hideTitle />
            </details>
          </Card>
        ))}
        {proposed.length === 0 && <Card><div className="pt-4"><EmptyState icon={FlaskConical} title={report ? 'Every current insight already has an experiment' : 'Analysing your data…'} hint={report ? 'New proposals appear as your data changes.' : undefined} /></div></Card>}
      </div>

      <Heading count={active.length}>Active</Heading>
      <div className="mb-9 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {active.map((e) => <ExperimentCard key={e.id} e={e} onComplete={() => complete(e.id)} />)}
        {active.length === 0 && <Card className="lg:col-span-2"><div className="pt-4"><EmptyState icon={FlaskConical} title="Nothing running" hint="Launch a proposal above to start measuring." /></div></Card>}
      </div>

      <Heading count={done.length}>Completed</Heading>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {done.map((e) => <ExperimentCard key={e.id} e={e} />)}
        {done.length === 0 && <Card className="lg:col-span-2"><div className="pt-4"><EmptyState icon={FlaskConical} title="No completed experiments yet" hint="Results land here once you mark an experiment complete." /></div></Card>}
      </div>
    </>
  )
}
