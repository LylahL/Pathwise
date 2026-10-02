import { useApp } from '../store'
import { Badge, Bar, Card, CardHeader, EmptyState, ErrorState, PageHeader, Skeleton, scoreColor, tierTone } from '../components/ui'
import { pct, tier } from '../lib/analytics'
import type { CandidateAnalysis } from '../ai'

const sev = { high: 'bad', medium: 'warn', low: 'neutral' } as const
const List = ({ items, empty }: { items: string[]; empty?: string }) =>
  items.length ? <ul className="space-y-1">{items.map((i) => <li key={i} className="flex gap-2"><span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-zinc-300" />{i}</li>)}</ul> : <span className="text-zinc-400">{empty ?? 'None'}</span>
const Label = ({ children, tone }: { children: string; tone: string }) => <div className={`mb-1.5 text-[10px] font-semibold uppercase tracking-wider ${tone}`}>{children}</div>

function Overview({ a }: { a: CandidateAnalysis }) {
  return (
    <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader title="Strengths" sub="Skills at L3+ with linked evidence" />
        <div className="space-y-3 px-5 pb-5 text-[13px]">
          {a.strengths.length === 0 && <EmptyState title="No evidenced strengths yet" hint="Link skills to projects or roles." />}
          {a.strengths.map((s) => <div key={s.title}><div className="font-medium text-zinc-900">{s.title}</div><div className="text-xs text-zinc-500">{s.evidence.join(' · ')}</div></div>)}
        </div>
      </Card>
      <Card>
        <CardHeader title="Gaps" sub="Weighted over the paths you’re interested in" />
        <div className="space-y-3 px-5 pb-5 text-[13px]">
          {a.gaps.map((g) => <div key={g.area}><div className="flex items-center gap-2 font-medium text-zinc-900">{g.area}<Badge tone={sev[g.severity]}>{g.severity}</Badge></div><div className="text-xs text-zinc-500">{g.detail}</div></div>)}
        </div>
      </Card>
      <Card>
        <CardHeader title="Recommendations" sub="Ordered by impact on your gaps" />
        <ol className="space-y-3 px-5 pb-5 text-[13px]">
          {a.recommendations.map((r) => <li key={r.title}><div className="font-medium text-zinc-900">{r.priority}. {r.title}</div><div className="text-xs leading-snug text-zinc-500">{r.rationale}</div></li>)}
        </ol>
      </Card>
    </div>
  )
}

export default function CareerFit() {
  const { analysis, analysisError, retryAnalysis, ranked } = useApp()
  const a = analysis?.analysis
  return (
    <>
      <PageHeader
        title="Career fit"
        sub="How your skills, projects and experience map to each path — with the evidence, gaps and risks behind every score."
        right={a && <Badge tone={a.generatedBy === 'llm' ? 'accent' : 'neutral'}>{a.generatedBy === 'llm' ? 'AI analysis' : 'Rules-based analysis'}</Badge>}
      />
      {analysisError && <Card className="mb-4"><ErrorState message={analysisError} onRetry={retryAnalysis} /></Card>}
      {analysis?.fallbackReason && <p className="mb-4 rounded-lg bg-amber-50 px-4 py-2.5 text-xs text-amber-800">AI analysis unavailable ({analysis.fallbackReason}). Showing the deterministic rules-based analysis instead.</p>}
      {!a && !analysisError && <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-56" />)}</div>}

      {a && (
        <>
          <p className="mb-4 text-xs text-zinc-500">
            Interests: {a.interests.length ? a.interests.map((i) => i.label).join(', ') : 'none set'} · {a.skills.filter((s) => s.support === 'proven').length} evidenced skills · {a.skills.filter((s) => s.support === 'claimed').length} unevidenced
          </p>
          <Overview a={a} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {a.careerPaths.map((r, i) => {
              const t = tier(r.fitScore), mine = ranked.find((x) => x.path.id === r.pathId)
              return (
                <Card key={r.pathId}>
                  <CardHeader
                    title={`${i + 1}. ${r.title}`}
                    sub={r.matchesInterest ? 'Matches your stated interests' : undefined}
                    right={<div className="text-right"><div className="tabular text-2xl font-semibold leading-none">{r.fitScore}%</div><div className="mt-1.5"><Badge tone={tierTone(t)}>{t}</Badge></div></div>}
                  />
                  <div className="px-5"><Bar value={r.fitScore} color={scoreColor(r.fitScore)} /></div>
                  <div className="grid grid-cols-1 gap-4 px-5 py-4 text-[13px] text-zinc-700 sm:grid-cols-2">
                    <div><Label tone="text-emerald-600">Evidence</Label><List items={r.evidence} empty="No evidenced skills yet" /></div>
                    <div>
                      <Label tone="text-rose-600">Missing skills</Label>
                      {r.missingSkills.length ? <div className="flex flex-wrap gap-1">{r.missingSkills.map((m) => <Badge key={m.skill} tone="bad">{m.skill} L{m.have}/{m.need}</Badge>)}</div> : <span className="text-zinc-400">None</span>}
                    </div>
                    <div><Label tone="text-amber-600">Risks</Label><List items={r.risks} empty="No notable risks" /></div>
                    <div><Label tone="text-indigo-600">Next steps</Label><List items={r.nextSteps} /></div>
                  </div>
                  {mine && <div className="border-t border-zinc-100 px-5 py-3 text-xs text-zinc-500">Your applications: <span className="font-medium text-zinc-800">{mine.applications}</span> sent · <span className="font-medium text-zinc-800">{mine.responded}</span> responded{mine.applications > 0 && <> ({pct(mine.responded / mine.applications)})</>}</div>}
                </Card>
              )
            })}
          </div>
        </>
      )}
      <p className="mt-4 text-xs text-zinc-400">Fit = Σ weight × min(your level ÷ required level, 1) ÷ Σ weight. Requirements are demo templates, not scraped market data. Tiers are computed in the app, not by the AI.</p>
    </>
  )
}
