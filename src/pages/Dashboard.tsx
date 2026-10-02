import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useApp } from '../store'
import { pct } from '../lib/analytics'
import { Badge, Bar, Card, CardHeader, PageHeader, Stat, scoreColor, tierTone } from '../components/ui'
import FunnelChart from '../components/FunnelChart'
import SegmentChart from '../components/SourceChart'
import ReadinessRing from '../components/ReadinessRing'
import InsightChain from '../components/InsightChain'

export default function Dashboard() {
  const { summary, readiness, ranked, applications, report, experiments, proposals, profile } = useApp()
  const topGaps = ranked
    .filter((r) => profile.targetPathIds.includes(r.path.id))
    .flatMap((r) => r.gaps.map((g) => ({ ...g, path: r.path.title })))
    .sort((a, b) => b.weight * b.deficit - a.weight * a.deficit)
    .filter((g, i, all) => all.findIndex((x) => x.skill === g.skill) === i)
    .slice(0, 4)
  const running = experiments.filter((e) => e.status === 'running')

  return (
    <>
      <PageHeader title={`Welcome back, ${profile.name.split(' ')[0]}`} sub="Your job search, measured. Everything below is computed from your logged applications and skills." />

      {report && (
        <div className="mb-5 overflow-hidden rounded-xl bg-zinc-900 p-5 text-white">
          <div className="flex items-start justify-between gap-6">
            <div className="max-w-2xl">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-indigo-300"><Sparkles size={12} /> Next best action</div>
              <p className="text-lg font-semibold leading-snug tracking-tight">{report.nextBestAction.title}</p>
              <p className="mt-1.5 text-[13px] text-zinc-400">{report.nextBestAction.why}</p>
            </div>
            <Link to="/experiments" className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-100">
              Run as experiment <ArrowRight size={12} />
            </Link>
          </div>
          <ol className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
            {report.nextBestAction.steps.map((s, i) => (
              <li key={s} className="flex items-center gap-2 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-zinc-300"><span className="tabular text-zinc-500">{i + 1}</span>{s}</li>
            ))}
          </ol>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <Card className="flex items-center gap-4 p-4">
          <ReadinessRing score={readiness.score} size={96} />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-zinc-500">Career readiness</div>
            <div className="mt-2 space-y-1.5">
              {readiness.parts.map((p) => (
                <div key={p.label} title={`${p.label}: ${p.value} × ${p.weight}`}><Bar value={p.value} color="bg-zinc-800" className="h-1" /></div>
              ))}
            </div>
            <div className="mt-1.5 text-[10px] text-zinc-400">fit · response · projects</div>
          </div>
        </Card>
        <Stat label="Applications" value={summary.applications} sub={`since ${applications.map((a) => a.appliedOn).sort()[0]}`} />
        <Stat label="Response rate" value={pct(summary.responseRate, 1)} sub={`${summary.responses} responses`} />
        <Stat label="Interviews" value={summary.interviews} sub={`${summary.finals} reached final round · ${summary.offers} offers`} />
      </div>

      <div className="mt-4 grid grid-cols-5 gap-4">
        <Card className="col-span-3">
          <CardHeader title="Application funnel" sub="Where candidates drop off, stage by stage" right={report && <Badge tone="bad">Breaks at {report.diagnosis.breakpoint}</Badge>} />
          <FunnelChart apps={applications} breakpoint={report?.diagnosis.breakpoint} />
        </Card>
        <Card className="col-span-2">
          <CardHeader title="Response rate by source" sub="Hover for counts — samples are small" />
          <SegmentChart apps={applications} by={(a) => a.source} height={210} />
        </Card>
      </div>

      {report && (
        <Card className="mt-4">
          <CardHeader title="AI funnel diagnosis" sub={`${report.generatedBy === 'llm' ? 'LLM' : 'Rules engine'} · typed output, every number computed from your data`} />
          <div className="grid grid-cols-[1.2fr_1fr] gap-6 px-5 pb-5">
            <div>
              <p className="text-sm font-medium leading-snug text-zinc-900">{report.diagnosis.headline}</p>
              <ul className="mt-3 space-y-1.5 text-[13px] text-zinc-600">
                {report.diagnosis.drivers.map((d) => <li key={d} className="flex gap-2"><span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-zinc-400" />{d}</li>)}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {report.diagnosis.transitions.map((t) => (
                <div key={t.to} className={`rounded-lg border px-3 py-2 ${`${t.from} → ${t.to}` === report.diagnosis.breakpoint ? 'border-rose-200 bg-rose-50' : 'border-zinc-200'}`}>
                  <div className="text-[11px] text-zinc-500">{t.from} → {t.to}</div>
                  <div className="tabular text-sm font-semibold">{pct(t.rate)} <span className="text-xs font-normal text-zinc-500">{t.converted}/{t.n}</span></div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      <div className="mt-4 grid grid-cols-5 gap-4">
        <Card className="col-span-3">
          <CardHeader title="Career fit" sub="Weighted skill coverage vs. typical requirements" right={<Link to="/fit" className="text-xs font-medium text-indigo-600">View all</Link>} />
          <div className="space-y-3 px-5 pb-5">
            {ranked.map((r) => (
              <div key={r.path.id} className="grid grid-cols-[150px_1fr_44px_76px] items-center gap-3 text-[13px]">
                <span className="truncate font-medium text-zinc-800">{r.path.title}</span>
                <Bar value={r.score} color={scoreColor(r.score)} />
                <span className="tabular text-right font-semibold">{r.score}%</span>
                <Badge tone={tierTone(r.tier)}>{r.tier}</Badge>
              </div>
            ))}
          </div>
        </Card>
        <Card className="col-span-2">
          <CardHeader title="Skill gaps" sub="Biggest gaps across your target paths" right={<Link to="/skills" className="text-xs font-medium text-indigo-600">View all</Link>} />
          <div className="space-y-3 px-5 pb-5">
            {topGaps.map((g) => (
              <div key={g.skill} className="text-[13px]">
                <div className="mb-1 flex justify-between"><span className="font-medium text-zinc-800">{g.skill}</span><span className="tabular text-zinc-500">L{g.have} → L{g.need}</span></div>
                <Bar value={g.have} max={g.need} color="bg-rose-400" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-4">
        <Card className="col-span-3">
          <CardHeader title="AI insights" sub="Evidence → Inference → Gap → Recommendation → Experiment" />
          {report?.chains[0] && <InsightChain chain={report.chains[0]} />}
          {report && report.chains.length > 1 && (
            <div className="border-t border-zinc-100 px-5 py-3 text-xs text-zinc-500">
              {report.chains.length - 1} more insights on the <Link to="/experiments" className="font-medium text-indigo-600">Experiments</Link> page
            </div>
          )}
        </Card>
        <Card className="col-span-2">
          <CardHeader title="Experiments" sub={`${running.length} running`} right={<Link to="/experiments" className="text-xs font-medium text-indigo-600">View all</Link>} />
          <ul className="divide-y divide-zinc-100">
            {[...experiments, ...proposals].slice(0, 6).map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 px-5 py-3 text-[13px]">
                <span className="min-w-0 truncate text-zinc-800">{e.title}</span>
                <Badge tone={e.status === 'running' ? 'accent' : e.status === 'completed' ? 'good' : 'warn'}>{e.status === 'proposed' ? 'AI proposed' : e.status}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  )
}
