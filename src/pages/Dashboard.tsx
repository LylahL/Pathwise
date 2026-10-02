import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useApp } from '../store'
import { pct, skillStanding, tier, weekly } from '../lib/analytics'
import { Badge, Bar, Card, CardHeader, EmptyState, ErrorState, PageHeader, Skeleton, Spark, Stat, scoreColor, tierTone } from '../components/ui'
import FunnelChart from '../components/FunnelChart'
import ReadinessRing from '../components/ReadinessRing'
import InsightCard from '../components/InsightCard'
import { careerPaths } from '../data/seed'
import type { Experiment } from '../types'

const FIT_PATHS = ['da', 'swe', 'pa', 'mle']
const rate = (x?: { n: number; responses: number }) => (x && x.n ? x.responses / x.n : null)

function ExperimentOutcome({ e }: { e: Experiment }) {
  const c = rate(e.control), v = rate(e.variant)
  const tone = e.status === 'running' ? 'accent' : e.status === 'completed' ? 'good' : 'warn'
  return (
    <div className="rounded-lg border border-zinc-200 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <Badge tone={tone}>{e.status === 'proposed' ? 'AI proposed' : e.status}</Badge>
        {e.origin === 'demo-seed' && <Badge>demo</Badge>}
      </div>
      <h4 className="text-[13px] font-semibold leading-snug tracking-tight">{e.title}</h4>
      {e.control && e.variant && c !== null && v !== null ? (
        <>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div><div className="text-zinc-500">Baseline</div><div className="tabular text-sm font-semibold">{pct(c)} <span className="font-normal text-zinc-400">{e.control.responses}/{e.control.n}</span></div></div>
            <div><div className="text-zinc-500">Variant</div><div className="tabular text-sm font-semibold">{pct(v)} <span className="font-normal text-zinc-400">{e.variant.responses}/{e.variant.n}</span></div></div>
          </div>
          <p className="mt-2 text-[11px] text-zinc-500">
            {e.variant.n < e.targetN ? `${e.variant.n}/${e.targetN} planned applications sent. ` : ''}Directional only — samples are too small to call a winner.
          </p>
        </>
      ) : (
        <p className="mt-2 text-xs text-zinc-500">{e.hypothesis}</p>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { summary, readiness, ranked, applications, report, reportError, retryReport, experiments, proposals, profile, analysis, analysisError, retryAnalysis } = useApp()
  const fit = (analysis?.analysis.careerPaths ?? []).filter((p) => FIT_PATHS.includes(p.pathId))
  const appsByPath = (id: string) => ranked.find((r) => r.path.id === id)
  const { strongest, weakest } = skillStanding(profile, careerPaths.filter((p) => FIT_PATHS.includes(p.id)))
  const outcomes = [...experiments, ...proposals].slice(0, 4)
  const nba = report?.nextBestAction

  return (
    <>
      <PageHeader
        title={`Welcome back, ${profile.name.split(' ')[0]}`}
        sub="Your job search, measured. Every figure is computed from your logged applications and skills."
        right={<Badge tone="warn">Demo data</Badge>}
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="flex items-center gap-4 p-4">
          <ReadinessRing score={readiness.score} size={92} />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-zinc-500">Career readiness</div>
            <dl className="mt-2 space-y-1.5">
              {readiness.parts.map((p) => (
                <div key={p.label} title={`${p.label} · weight ${p.weight * 100}%`}>
                  <div className="flex justify-between text-[10px] text-zinc-500"><dt className="truncate">{p.label.split(' (')[0]}</dt><dd className="tabular">{p.value}</dd></div>
                  <Bar value={p.value} color="bg-zinc-800" className="h-1" />
                </div>
              ))}
            </dl>
          </div>
        </Card>
        <Stat label="Applications" value={summary.applications} sub={applications.length ? `since ${applications.map((a) => a.appliedOn).sort()[0]}` : 'None logged yet'}>
          <Spark values={weekly(applications).map((w) => w.applied)} className="mt-3" />
        </Stat>
        <Stat label="Response rate" value={applications.length ? pct(summary.responseRate, 1) : '—'} sub={`${summary.responses} of ${summary.applications} applications replied`}>
          <Bar value={summary.responseRate * 100} color="bg-indigo-500" className="mt-3" />
        </Stat>
        <Stat label="Interviews" value={summary.interviews} sub={`${summary.screens} recruiter screens · ${summary.finals} final rounds · ${summary.offers} offers`} />
      </div>

      {/* Next best action */}
      <div className="mt-4 overflow-hidden rounded-xl bg-zinc-900 text-white">
        {!report && !reportError && (
          <div className="space-y-3 p-6"><Skeleton className="h-3 w-32 bg-white/10" /><Skeleton className="h-6 w-2/3 bg-white/10" /><Skeleton className="h-4 w-1/2 bg-white/10" /></div>
        )}
        {reportError && <div className="p-6 text-sm text-zinc-300">Next best action unavailable. <button onClick={retryReport} className="cursor-pointer font-medium text-white underline">Retry</button></div>}
        {nba && (
          <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-indigo-300"><Sparkles size={12} /> Next best action</div>
              <p className="text-xl font-semibold leading-snug tracking-tight sm:text-2xl">{nba.title}</p>
              <p className="mt-2 text-sm text-zinc-400">{nba.detail}</p>
              <ol className="mt-4 space-y-1.5">
                {nba.steps.map((s, i) => (
                  <li key={s} className="flex gap-2.5 text-[13px] text-zinc-300"><span className="tabular mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/10 text-[11px] text-zinc-300">{i + 1}</span>{s}</li>
                ))}
              </ol>
              <Link to="/experiments" className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-100">Run as experiment <ArrowRight size={12} /></Link>
            </div>
            <div className="rounded-lg bg-white/5 p-4">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Why</div>
              <ul className="space-y-2">
                {nba.reasons.map((r) => <li key={r} className="flex gap-2 text-[13px] leading-snug text-zinc-200"><span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-indigo-300" />{r}</li>)}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Funnel + Career fit */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader title="Application funnel" sub="Applications → Responses → Recruiter screens → Interviews → Final rounds" right={report && <Badge tone="bad">Breaks at {report.diagnosis.breakpoint}</Badge>} />
          <FunnelChart apps={applications} breakpoint={report?.diagnosis.breakpoint} />
          {report && applications.length > 0 && <p className="border-t border-zinc-100 px-5 py-3 text-[13px] text-zinc-700"><span className="font-medium">Diagnosis:</span> {report.diagnosis.headline}</p>}
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader
            title="Career fit"
            sub={analysis ? `${analysis.analysis.generatedBy === 'llm' ? 'AI analysis' : 'Rules-based analysis'} of your profile` : 'Analysing your profile…'}
            right={<Link to="/fit" className="text-xs font-medium text-indigo-600">Details</Link>}
          />
          {analysisError && <ErrorState message={analysisError} onRetry={retryAnalysis} />}
          {!analysis && !analysisError && <div className="space-y-4 px-5 pb-5">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>}
          {analysis?.fallbackReason && <p className="mx-5 mb-3 rounded-md bg-amber-50 px-3 py-2 text-[11px] text-amber-800">AI analysis unavailable: {analysis.fallbackReason}. Showing the rules-based analysis.</p>}
          {analysis && fit.length === 0 && <EmptyState title="No career paths to show" hint="Add skills or experience to your profile." />}
          {analysis && fit.length > 0 && (
            <div className="space-y-4 px-5 pb-5">
              {fit.map((r) => {
                const t = tier(r.fitScore), mine = appsByPath(r.pathId)
                return (
                  <div key={r.pathId}>
                    <div className="mb-1.5 flex items-center justify-between text-[13px]">
                      <span className="font-medium text-zinc-800">{r.title}</span>
                      <span className="flex items-center gap-2"><Badge tone={tierTone(t)}>{t}</Badge><span className="tabular w-9 text-right font-semibold">{r.fitScore}%</span></span>
                    </div>
                    <Bar value={r.fitScore} color={scoreColor(r.fitScore)} />
                    <p className="mt-1.5 text-[11px] leading-snug text-zinc-500"><span className="font-medium text-emerald-700">Evidence</span> {r.evidence.slice(0, 2).map((e) => e.split(' — ')[0]).join(' · ') || '—'}</p>
                    <p className="text-[11px] leading-snug text-zinc-500"><span className="font-medium text-rose-700">Gaps</span> {r.missingSkills.slice(0, 2).map((m) => m.skill).join(' · ') || 'None'}</p>
                    {mine && <p className="text-[11px] text-zinc-400">{mine.applications} applications · {mine.responded} {mine.responded === 1 ? 'response' : 'responses'}</p>}
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Skill gaps + insights */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-2">
          <CardHeader title="Skill gaps" sub="Relevant to Data Analyst, Software, Product, ML paths" right={<Link to="/skills" className="text-xs font-medium text-indigo-600">Details</Link>} />
          <div className="space-y-5 px-5 pb-5">
            {([['Strongest', strongest, 'bg-emerald-500', 'text-emerald-600'], ['Weakest', weakest, 'bg-rose-400', 'text-rose-600']] as const).map(([label, list, bar, text]) => (
              <div key={label}>
                <div className={`mb-2 text-[10px] font-semibold uppercase tracking-wider ${text}`}>{label}</div>
                {list.length === 0 ? <p className="text-xs text-zinc-500">None at this level.</p> : (
                  <div className="space-y-2.5">
                    {list.map((s) => (
                      <div key={s.skill} className="text-[13px]">
                        <div className="mb-1 flex justify-between"><span className="font-medium text-zinc-800">{s.skill}</span><span className="tabular text-zinc-500">L{s.have} <span className="text-zinc-300">/</span> L{s.need} needed</span></div>
                        <Bar value={s.have} max={s.need} color={bar} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
        <Card className="xl:col-span-3">
          <CardHeader title="AI insights" sub={report ? `${report.generatedBy === 'llm' ? 'LLM' : 'Rules engine'} · derived from your demo data` : 'Analysing your data…'} />
          {reportError && <ErrorState message={reportError} onRetry={retryReport} />}
          {!report && !reportError && <div className="grid gap-3 px-5 pb-5 sm:grid-cols-2"><Skeleton className="h-32" /><Skeleton className="h-32" /></div>}
          {report && report.chains.length === 0 && <EmptyState title="Not enough data for insights yet" hint="Log at least 10 applications with source and resume version." />}
          {report && report.chains.length > 0 && (
            <div className="grid gap-3 px-5 pb-5 sm:grid-cols-2">{report.chains.slice(0, 4).map((c) => <InsightCard key={c.id} chain={c} />)}</div>
          )}
        </Card>
      </div>

      {/* Experiments */}
      <Card className="mt-4">
        <CardHeader title="Experiments" sub="Recent tests and what they showed so far" right={<Link to="/experiments" className="text-xs font-medium text-indigo-600">View all</Link>} />
        {outcomes.length === 0 ? <EmptyState title="No experiments yet" hint="Launch one from an AI insight." /> : (
          <div className="grid gap-3 px-5 pb-5 sm:grid-cols-2 xl:grid-cols-4">{outcomes.map((e) => <ExperimentOutcome key={e.id} e={e} />)}</div>
        )}
      </Card>

      <p className="mt-6 text-center text-[11px] text-zinc-400">Demo data: fictional persona, companies and results. Sample sizes are small; nothing here is a real-world performance claim.</p>
    </>
  )
}
