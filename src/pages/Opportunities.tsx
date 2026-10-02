import { useApp } from '../store'
import { Badge, Bar, Card, PageHeader, scoreColor, tierTone } from '../components/ui'
import { careerPaths } from '../data/seed'
import { tier } from '../lib/analytics'

export default function Opportunities() {
  const { opportunities } = useApp()
  return (
    <>
      <PageHeader title="Opportunities" sub="Roles ranked by how well your current skills match their requirements. Demo listings — fictional companies." />
      <Card className="divide-y divide-zinc-100">
        {opportunities.map((o) => {
          const t = tier(o.score)
          return (
            <div key={o.id} className="grid grid-cols-[1fr_130px_1.2fr] items-center gap-6 px-5 py-4">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold tracking-tight">{o.title}</div>
                <div className="mt-0.5 text-xs text-zinc-500">{o.company} · {o.location} · {o.postedDaysAgo}d ago</div>
                <div className="mt-1.5"><Badge>{careerPaths.find((p) => p.id === o.pathId)?.title}</Badge></div>
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between"><span className="tabular text-lg font-semibold">{o.score}%</span><Badge tone={tierTone(t)}>{t}</Badge></div>
                <Bar value={o.score} color={scoreColor(o.score)} />
              </div>
              <div className="flex flex-wrap gap-1 text-[11px]">
                {o.strengths.map((s) => <Badge key={s.skill} tone="good">✓ {s.skill}</Badge>)}
                {o.gaps.map((g) => <Badge key={g.skill} tone="bad">{g.skill} L{g.have}/{g.need}</Badge>)}
              </div>
            </div>
          )
        })}
      </Card>
    </>
  )
}
