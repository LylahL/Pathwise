import { useApp } from '../store'
import { Badge, Bar, Card, CardHeader, PageHeader, scoreColor, tierTone } from '../components/ui'
import { pct } from '../lib/analytics'

export default function CareerFit() {
  const { ranked, applications } = useApp()
  return (
    <>
      <PageHeader title="Career fit" sub="How your current skills map to each path’s typical requirements, next to what your applications show so far." />
      <div className="grid grid-cols-2 gap-4">
        {ranked.map((r, i) => (
          <Card key={r.path.id}>
            <CardHeader
              title={`${i + 1}. ${r.path.title}`}
              sub={r.path.blurb}
              right={<div className="text-right"><div className="tabular text-2xl font-semibold leading-none">{r.score}%</div><div className="mt-1.5"><Badge tone={tierTone(r.tier)}>{r.tier}</Badge></div></div>}
            />
            <div className="px-5"><Bar value={r.score} color={scoreColor(r.score)} /></div>
            <div className="grid grid-cols-2 gap-4 px-5 py-4 text-[13px]">
              <div>
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600">Meets</div>
                <div className="flex flex-wrap gap-1">{r.strengths.length ? r.strengths.map((s) => <Badge key={s.skill} tone="good">{s.skill}</Badge>) : <span className="text-zinc-400">None yet</span>}</div>
              </div>
              <div>
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-rose-600">Gaps</div>
                <div className="flex flex-wrap gap-1">{r.gaps.length ? r.gaps.map((g) => <Badge key={g.skill} tone="bad">{g.skill} L{g.have}/{g.need}</Badge>) : <span className="text-zinc-400">No gaps</span>}</div>
              </div>
            </div>
            <div className="border-t border-zinc-100 px-5 py-3 text-xs text-zinc-500">
              Your applications: <span className="font-medium text-zinc-800">{r.applications}</span> sent · <span className="font-medium text-zinc-800">{r.responded}</span> responded
              {r.applications > 0 && <> ({pct(r.responded / r.applications)})</>}
            </div>
          </Card>
        ))}
      </div>
      <p className="mt-4 text-xs text-zinc-400">Fit = Σ weight × min(your level ÷ required level, 1) ÷ Σ weight. Requirements are demo templates, not scraped market data. {applications.length} applications considered.</p>
    </>
  )
}
