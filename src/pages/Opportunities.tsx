import { useApp } from '../store'
import { BriefcaseBusiness } from 'lucide-react'
import { Badge, Bar, Card, EmptyState, PageHeader, scoreColor, tierTone } from '../components/ui'
import { careerPaths } from '../data/seed'
import { tier } from '../lib/analytics'

export default function Opportunities() {
  const { opportunities } = useApp()
  return (
    <>
      <PageHeader kicker="2 · What fits you" title="Opportunities" sub="Roles ranked by how well your current skills match their requirements. Demo listings — fictional companies." />
      {opportunities.length === 0 && <Card><div className="pt-4"><EmptyState icon={BriefcaseBusiness} title="No open roles to rank" hint="Roles you haven’t applied to appear here, ranked by how well your skills match." /></div></Card>}
      <Card className="divide-y divide-zinc-100">
        {opportunities.map((o) => {
          const t = tier(o.score)
          return (
            <div key={o.id} className="grid items-center gap-3 px-5 py-4 md:grid-cols-[1fr_130px_1.2fr] md:gap-6">
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
                {o.gaps.map((g) => <Badge key={g.skill} tone="bad">✕ {g.skill} <span className="font-normal opacity-70">L{g.have}/{g.need}</span></Badge>)}
              </div>
            </div>
          )
        })}
      </Card>
    </>
  )
}
