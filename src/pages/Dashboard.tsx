import { Link } from 'react-router-dom'
import { ArrowRight, BarChart3, CalendarCheck, Compass, FlaskConical, Lightbulb, MailCheck, Send, Sparkles, Target, TrendingDown } from 'lucide-react'
import { useApp } from '../store'
import { pct, RESPONSE_RATE_TARGET, skillStanding, tier, weekly } from '../lib/analytics'
import { AiMark, Badge, Bar, Card, CardHeader, EmptyState, ErrorState, Kpi, LevelMeter, SectionLabel, Skeleton, Spark, scoreColor, tierTone } from '../components/ui'
import FunnelChart from '../components/FunnelChart'
import SegmentChart from '../components/SourceChart'
import ReadinessRing from '../components/ReadinessRing'
import InsightCard from '../components/InsightCard'
import { careerPaths } from '../data/seed'
import type { Experiment } from '../types'

const FIT_PATHS = ['da', 'swe', 'pa', 'mle']
const TIER_PHRASE = { Strong: 'a strong fit for', Reachable: 'a reasonable fit for', Stretch: 'still a stretch for' } as const
const OUTCOME_PHRASE: Record<string, string> = {
  Responses: 'got a response', 'Recruiter screens': 'led to a recruiter screen', Interviews: 'led to an interview', 'Final rounds': 'reached a final round',
}
const rate = (x?: { n: number; responses: number }) => (x && x.n ? x.responses / x.n : null)
const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)

const Em = ({ tone, children }: { tone: 'good' | 'bad' | 'accent'; children: React.ReactNode }) => (
  <span className={tone === 'good' ? 'text-emerald-600' : tone === 'bad' ? 'text-rose-600' : 'text-indigo-600'}>{children}</span>
)

function Meter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs text-zinc-300">
      <span>{label}</span>
      <span className="flex items-center gap-1.5" title={`${label}: ${value} of 5`}>
        {Array.from({ length: 5 }, (_, i) => <span key={i} className={`h-1.5 w-4 rounded-full ${i < value ? color : 'bg-white/15'}`} />)}
        <span className="num w-6 text-right text-zinc-400">{value}/5</span>
      </span>
    </div>
  )
}

function ExperimentRow({ e }: { e: Experiment }) {
  const c = rate(e.control), v = rate(e.variant)
  const tone = e.status === 'running' ? 'accent' : e.status === 'completed' ? 'good' : 'warn'
  return (
    <li className="px-5 py-3.5">
      <div className="mb-1.5 flex items-start justify-between gap-3">
        <span className="text-[13px] font-medium leading-snug text-zinc-900">{e.title}</span>
        <Badge tone={tone}>{e.status === 'proposed' ? 'AI proposed' : e.status}</Badge>
      </div>
      {e.control && e.variant && c !== null && v !== null ? (
        <div className="space-y-1.5 text-[11px] text-zinc-500">
          {([['Before', c, e.control, 'bg-zinc-300'], ['After', v, e.variant, 'bg-indigo-500']] as const).map(([label, r, d, color]) => (
            <div key={label} className="grid grid-cols-[3rem_1fr_5.5rem] items-center gap-2">
              <span>{label}</span><Bar value={r * 100} color={color} /><span className="num text-right"><b className="text-zinc-900">{pct(r)}</b> · {d.responses}/{d.n}</span>
            </div>
          ))}
          <p className="pt-0.5 text-zinc-400">Directional only: samples are too small to call a winner.</p>
        </div>
      ) : (
        <p className="line-clamp-2 text-xs leading-relaxed text-zinc-500">{e.hypothesis}</p>
      )}
    </li>
  )
}

export default function Dashboard() {
  const { summary, readiness, ranked, applications, report, reportError, retryReport, experiments, proposals, profile, analysis, analysisError, retryAnalysis } = useApp()
  const fit = (analysis?.analysis.careerPaths ?? []).filter((p) => FIT_PATHS.includes(p.pathId))
  const appsByPath = (id: string) => ranked.find((r) => r.path.id === id)
  const { strongest, weakest } = skillStanding(profile, careerPaths.filter((p) => FIT_PATHS.includes(p.id)))
  const outcomes = [...experiments, ...proposals].slice(0, 4)
  const nba = report?.nextBestAction
  const top = ranked[0], topTier = tier(top.score)
  const drop = report?.diagnosis.transitions.find((t) => `${t.from} → ${t.to}` === report.diagnosis.breakpoint)
  const rateTone = summary.responseRate >= RESPONSE_RATE_TARGET ? 'good' : summary.responseRate >= RESPONSE_RATE_TARGET / 2 ? 'warn' : 'bad'

  return (
    <>
      {/* The 10-second answer: where you fit, where it breaks, what to do. */}
      <header className="mb-9">
        <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-indigo-600">
          Welcome back, {profile.name.split(' ')[0]} <Badge tone="warn">Demo data</Badge>
        </div>
        {applications.length === 0 ? (
          <h1 className="max-w-3xl text-[26px] font-semibold leading-tight text-zinc-900 sm:text-[30px]">Add your applications to see where your search breaks.</h1>
        ) : !report && !reportError ? (
          <div className="space-y-3" aria-busy="true" aria-label="Analysing your search"><Skeleton className="h-8 w-full max-w-3xl" /><Skeleton className="h-8 w-2/3 max-w-xl" /></div>
        ) : (
          <h1 className="max-w-4xl text-[26px] font-semibold leading-[1.28] text-zinc-900 sm:text-[30px]">
            {topTier === 'Stretch' ? 'Your closest fit is ' : 'You’re '}
            <Em tone="good">{topTier === 'Stretch' ? top.path.title : `${TIER_PHRASE[topTier]} ${top.path.title}`} ({top.score}%)</Em>
            {drop ? <>, {topTier === 'Stretch' ? 'and' : 'but'} <Em tone="bad">only {drop.converted} of {drop.n} {drop.from.toLowerCase()} {OUTCOME_PHRASE[drop.to] ?? `reached ${drop.to.toLowerCase()}`}</Em>.</> : '.'}
            {nba && <span className="text-zinc-400"> Next: <Em tone="accent">{lowerFirst(nba.title)}</Em>.</span>}
          </h1>
        )}
        <nav className="mt-5 flex flex-wrap gap-2 text-xs" aria-label="Sections">
          {[['stand', 'Where you stand', 'bg-indigo-600'], ['fits', 'What fits you', 'bg-emerald-600'], ['breaks', 'What’s breaking', 'bg-rose-600'], ['next', 'What to do next', 'bg-zinc-900']].map(([id, label, dot], i) => (
            <a key={id} href={`#${id}`} className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 font-medium text-zinc-700 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition hover:border-zinc-300 hover:bg-zinc-50">
              <span className={`grid h-4 w-4 place-items-center rounded-full text-[10px] text-white ${dot}`}>{i + 1}</span>{label}
            </a>
          ))}
        </nav>
      </header>

      {/* 1 · Where you stand */}
      <SectionLabel id="stand" n={1} color="bg-indigo-600" title="Where you stand" hint="Computed from your applications and skills" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="flex items-center gap-4 p-4">
          <ReadinessRing score={readiness.score} size={92} />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-zinc-500">Career readiness</div>
            <dl className="mt-2.5 space-y-2">
              {readiness.parts.map((p) => (
                <div key={p.label} title={`${p.label} · weight ${Math.round(p.weight * 100)}%`}>
                  <div className="flex justify-between text-[10px] text-zinc-500"><dt className="truncate">{p.label.split(' (')[0]}</dt><dd className="num font-medium text-zinc-700">{p.value}</dd></div>
                  <Bar value={p.value} color={p.value >= 75 ? 'bg-emerald-500' : p.value >= 50 ? 'bg-indigo-500' : 'bg-amber-500'} className="mt-0.5 h-1" />
                </div>
              ))}
            </dl>
          </div>
        </Card>
        <Kpi label="Applications" icon={Send} tone="info" value={summary.applications} sub={applications.length ? `since ${applications.map((a) => a.appliedOn).sort()[0]}` : 'None logged yet'}>
          <Spark values={weekly(applications).map((w) => w.applied)} className="mt-3" />
        </Kpi>
        <Kpi label="Response rate" icon={MailCheck} tone={rateTone} value={applications.length ? pct(summary.responseRate, 1) : '—'} sub={`${summary.responses} of ${summary.applications} applications replied`}>
          <Bar value={summary.responseRate * 100} max={RESPONSE_RATE_TARGET * 100} color={rateTone === 'good' ? 'bg-emerald-500' : rateTone === 'warn' ? 'bg-amber-500' : 'bg-rose-500'} className="mt-3" />
          <div className="mt-1 text-[10px] text-zinc-400">bar fills at a {pct(RESPONSE_RATE_TARGET)} reference rate</div>
        </Kpi>
        <Kpi label="Interviews" icon={CalendarCheck} tone="good" value={summary.interviews} sub={`${summary.screens} recruiter screens · ${summary.finals} final rounds · ${summary.offers} offers`} />
      </div>

      {/* 2 · What fits you */}
      <SectionLabel id="fits" n={2} color="bg-emerald-600" title="What careers fit you" hint="Your skills against each path’s typical requirements" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader icon={Compass} tone="good" title="Career fit" sub="Share of each path’s weighted requirements you already meet"
            right={<span className="flex items-center gap-2">{analysis && <AiMark source={analysis.analysis.generatedBy} />}<Link to="/fit" className="text-xs font-medium text-indigo-600 hover:text-indigo-500">Details</Link></span>} />
          {analysisError && <ErrorState message={analysisError} onRetry={retryAnalysis} />}
          {!analysis && !analysisError && <div className="space-y-4 px-5 pb-5" aria-busy="true"><p className="text-xs text-zinc-500">Matching your skills and projects to each career…</p>{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>}
          {analysis?.fallbackReason && <p className="mx-5 mb-3 rounded-md bg-amber-50 px-3 py-2 text-[11px] text-amber-800">AI analysis unavailable: {analysis.fallbackReason}. Showing the rules-based analysis.</p>}
          {analysis && fit.length === 0 && <EmptyState icon={Compass} title="No career paths to show" hint="Add skills or experience to your profile." />}
          {analysis && fit.length > 0 && (
            <ul className="divide-y divide-zinc-100 px-5 pb-2">
              {fit.map((r) => {
                const t = tier(r.fitScore), mine = appsByPath(r.pathId)
                return (
                  <li key={r.pathId} className="py-3.5">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-zinc-900">{r.title}</span>
                      <span className="flex items-center gap-2"><Badge tone={tierTone(t)}>{t}</Badge><span className="num w-10 text-right text-base font-semibold text-zinc-900">{r.fitScore}%</span></span>
                    </div>
                    <Bar value={r.fitScore} color={scoreColor(r.fitScore)} className="h-2" />
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      {r.evidence.slice(0, 2).map((e) => <Badge key={e} tone="good">✓ {e.split(' — ')[0]}</Badge>)}
                      {r.missingSkills.slice(0, 2).map((m) => <Badge key={m.skill} tone="bad">✕ {m.skill}</Badge>)}
                      {mine && <span className="ml-auto text-[11px] text-zinc-400">{mine.applications} applied · {mine.responded} {mine.responded === 1 ? 'reply' : 'replies'}</span>}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader icon={Target} tone="warn" title="Skill gaps" sub="Across Data Analyst, Software, Product and ML paths" right={<Link to="/skills" className="text-xs font-medium text-indigo-600 hover:text-indigo-500">Details</Link>} />
          <div className="space-y-5 px-5 pb-5">
            {([['Strongest', strongest, 'text-emerald-600'], ['Weakest', weakest, 'text-rose-600']] as const).map(([label, list, text]) => (
              <div key={label}>
                <div className={`mb-2 text-[10px] font-semibold uppercase tracking-wider ${text}`}>{label}</div>
                {list.length === 0 ? <p className="text-xs text-zinc-500">None at this level.</p> : (
                  <ul className="space-y-2.5">
                    {list.map((s) => (
                      <li key={s.skill} className="flex items-center justify-between gap-3 text-[13px]">
                        <span className="min-w-0 truncate font-medium text-zinc-800">{s.skill}</span>
                        <span className="flex shrink-0 items-center gap-2.5"><LevelMeter have={s.have} need={s.need} /><span className="num w-14 text-right text-[11px] text-zinc-500">L{s.have}{s.have < s.need ? ` → ${s.need}` : ''}</span></span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            <p className="border-t border-zinc-100 pt-3 text-[11px] text-zinc-400">Filled = your level. The outlined segment = the level roles ask for.</p>
          </div>
        </Card>
      </div>

      {/* 3 · What's breaking */}
      <SectionLabel id="breaks" n={3} color="bg-rose-600" title="Where your search is breaking" hint="Stage by stage, and by channel" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader icon={TrendingDown} tone="bad" title="Application funnel" sub="Where candidates drop out between stages" right={report && <AiMark source={report.generatedBy} />} />
          <FunnelChart apps={applications} breakpoint={report?.diagnosis.breakpoint} />
          {report && applications.length > 0 && <p className="border-t border-zinc-100 px-5 py-3 text-[13px] leading-relaxed text-zinc-700"><span className="font-semibold text-zinc-900">Diagnosis · </span>{report.diagnosis.headline}</p>}
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader icon={BarChart3} tone="info" title="Response rate by channel" sub="Where replies actually come from" />
          <SegmentChart apps={applications} by={(a) => a.source} />
          <p className="border-t border-zinc-100 px-5 py-3 text-[11px] text-zinc-400">Faded bars have fewer than 8 applications, so treat them as hints rather than results.</p>
        </Card>
      </div>

      {/* 4 · What to do next */}
      <SectionLabel id="next" n={4} color="bg-zinc-900" title="What to do next" hint="The AI’s recommendation, the reasoning behind it, and tests you can run" />
      <div className="overflow-hidden rounded-xl bg-zinc-900 text-white shadow-[0_1px_2px_rgba(16,24,40,0.12)]">
        {!report && !reportError && <div className="space-y-3 p-6" aria-busy="true"><Skeleton className="h-3 w-32 bg-white/10" /><Skeleton className="h-7 w-2/3 bg-white/10" /><Skeleton className="h-4 w-1/2 bg-white/10" /></div>}
        {reportError && <div className="p-6 text-sm text-zinc-300">Next best action unavailable: {reportError}. <button onClick={retryReport} className="cursor-pointer font-medium text-white underline">Retry</button></div>}
        {nba && report && (
          <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.15fr_1fr]">
            <div>
              <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-indigo-300"><Sparkles size={12} /> Next best action <AiMark source={report.generatedBy} onDark /></div>
              <p className="text-xl font-semibold leading-snug sm:text-2xl">{nba.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{nba.detail}</p>
              <ol className="mt-5 space-y-2">
                {nba.steps.map((s, i) => <li key={s} className="flex gap-2.5 text-[13px] text-zinc-200"><span className="num mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full bg-indigo-500/25 text-[11px] font-semibold text-indigo-200">{i + 1}</span>{s}</li>)}
              </ol>
              <Link to="/experiments" className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-semibold text-zinc-900 transition hover:bg-zinc-100">Run it as an experiment <ArrowRight size={12} /></Link>
            </div>
            <div className="rounded-lg bg-white/[0.06] p-4 ring-1 ring-inset ring-white/10 sm:p-5">
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Why this first</div>
              <ul className="space-y-2.5">
                {nba.reasons.map((r) => <li key={r} className="flex gap-2.5 text-[13px] leading-snug text-zinc-100"><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />{r}</li>)}
              </ul>
              {(nba.impact || nba.effort) && (
                <div className="mt-5 space-y-2 border-t border-white/10 pt-4">
                  {nba.impact && <Meter label="Expected impact" value={nba.impact} color="bg-emerald-400" />}
                  {nba.effort && <Meter label="Effort required" value={nba.effort} color="bg-sky-400" />}
                  <p className="pt-1 text-[11px] leading-snug text-zinc-500">Ranked by impact for the effort it takes. This is a hypothesis to test, not a guarantee.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader icon={Lightbulb} tone="accent" title="AI insights" sub={report ? 'What your data says, with the evidence behind it' : 'Analysing your data…'}
            right={report && <AiMark source={report.generatedBy} />} />
          {reportError && <ErrorState message={reportError} onRetry={retryReport} />}
          {!report && !reportError && <div className="grid gap-3 px-5 pb-5 sm:grid-cols-2" aria-busy="true"><Skeleton className="h-36" /><Skeleton className="h-36" /></div>}
          {report && report.chains.length === 0 && <EmptyState icon={Lightbulb} title="Not enough data for insights yet" hint="Log at least 10 applications with source and resume version." />}
          {report && report.chains.length > 0 && (
            <>
              <div className="grid gap-3 px-5 pb-4 sm:grid-cols-2">{report.chains.slice(0, 4).map((c) => <InsightCard key={c.id} chain={c} />)}</div>
              <p className="border-t border-zinc-100 px-5 py-3 text-xs text-zinc-500">Each insight follows Evidence → Inference → Gap → Recommendation → Experiment. <Link to="/experiments" className="font-medium text-indigo-600">See the full chains</Link></p>
            </>
          )}
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader icon={FlaskConical} tone="warn" title="Experiments" sub="Tests of the AI’s recommendations" right={<Link to="/experiments" className="text-xs font-medium text-indigo-600 hover:text-indigo-500">View all</Link>} />
          {outcomes.length === 0 ? <EmptyState icon={FlaskConical} title="No experiments yet" hint="Launch one from an AI insight." /> : <ul className="divide-y divide-zinc-100">{outcomes.map((e) => <ExperimentRow key={e.id} e={e} />)}</ul>}
        </Card>
      </div>

      <p className="mt-8 text-center text-[11px] text-zinc-400">Demo data: fictional persona, companies and results. Sample sizes are small; nothing here is a real-world performance claim.</p>
    </>
  )
}
