import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts'
import { useApp } from '../store'
import { Badge, Bar, Card, CardHeader, PageHeader } from '../components/ui'
import { SKILLS } from '../data/seed'

export default function Skills() {
  const { profile, ranked } = useApp()
  const lead = ranked.find((r) => r.path.id === profile.targetPathIds[0]) ?? ranked[0]
  const need = Object.fromEntries(lead.path.requirements.map((q) => [q.skill, q.level]))
  const data = SKILLS.map((s) => ({ skill: s, You: profile.skills[s] ?? 0, Required: need[s] ?? 0 }))
  const gaps = ranked.flatMap((r) => r.gaps.map((g) => ({ ...g, path: r.path.title }))).reduce<Record<string, { skill: string; score: number; paths: string[]; have: number; need: number }>>((m, g) => {
    const cur = m[g.skill] ?? { skill: g.skill, score: 0, paths: [], have: g.have, need: 0 }
    cur.score += g.weight * g.deficit; cur.paths.push(g.path); cur.need = Math.max(cur.need, g.need)
    return { ...m, [g.skill]: cur }
  }, {})
  const ordered = Object.values(gaps).sort((a, b) => b.score - a.score)

  return (
    <>
      <PageHeader title="Skills" sub={`Your self-rated skills against ${lead.path.title} requirements. Edit levels on the Profile page and everything recomputes.`} />
      <div className="grid grid-cols-5 gap-4">
        <Card className="col-span-2">
          <CardHeader title="Skill profile" sub={`You vs. ${lead.path.title}`} />
          <div className="h-[340px] px-2 pb-4">
            <ResponsiveContainer>
              <RadarChart data={data} outerRadius="68%">
                <PolarGrid stroke="#e4e4e7" />
                <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10, fill: '#52525b' }} />
                <Radar isAnimationActive={false} dataKey="Required" stroke="#a1a1aa" fill="#a1a1aa" fillOpacity={0.1} strokeDasharray="4 3" />
                <Radar isAnimationActive={false} dataKey="You" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="col-span-3">
          <CardHeader title="Gap priority" sub="Weighted deficit summed across all paths (higher = closes more doors)" />
          <div className="divide-y divide-zinc-100">
            {ordered.map((g) => (
              <div key={g.skill} className="grid grid-cols-[150px_1fr_auto] items-center gap-4 px-5 py-3 text-[13px]">
                <div><div className="font-medium text-zinc-900">{g.skill}</div><div className="tabular text-xs text-zinc-500">L{g.have} → L{g.need}</div></div>
                <div><Bar value={g.score} max={ordered[0].score} color="bg-rose-400" /><div className="mt-1.5 flex flex-wrap gap-1">{[...new Set(g.paths)].map((p) => <Badge key={p}>{p}</Badge>)}</div></div>
                <span className="tabular w-8 text-right font-semibold text-zinc-700">{g.score}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}
