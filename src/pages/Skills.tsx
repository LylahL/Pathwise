import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts'
import { Radar as RadarIcon, Target } from 'lucide-react'
import { useApp } from '../store'
import { Badge, Card, CardHeader, LevelMeter, PageHeader } from '../components/ui'
import { SKILLS } from '../data/seed'

const severity = (score: number, top: number) => {
  const r = top ? score / top : 0
  return r >= 0.6 ? { label: 'High', tone: 'bad' as const } : r >= 0.25 ? { label: 'Medium', tone: 'warn' as const } : { label: 'Low', tone: 'info' as const }
}

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
      <PageHeader kicker="2 · What fits you" title="Skills" sub={`Your self-rated skills against ${lead.path.title} requirements. Edit levels on the Profile page and everything recomputes.`} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="self-start lg:col-span-2">
          <CardHeader icon={RadarIcon} tone="accent" title="Skill profile" sub={`You vs. ${lead.path.title}`} />
          <div className="h-[340px] px-2">
            <ResponsiveContainer>
              <RadarChart data={data} outerRadius="68%">
                <PolarGrid stroke="#e4e4e7" />
                <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10, fill: '#52525b' }} />
                <Radar isAnimationActive={false} dataKey="Required" stroke="#a1a1aa" fill="#a1a1aa" fillOpacity={0.08} strokeDasharray="4 3" />
                <Radar isAnimationActive={false} dataKey="You" stroke="#4f46e5" strokeWidth={2} fill="#6366f1" fillOpacity={0.22} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 border-t border-zinc-100 px-5 py-3 text-[11px] text-zinc-500">
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-500" />You</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-0 w-3 border-t border-dashed border-zinc-400" />Required for {lead.path.title}</span>
          </div>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader icon={Target} tone="warn" title="Gap priority" sub="Weighted deficit summed across all paths. Higher means the gap closes more doors." />
          <ul className="divide-y divide-zinc-100">
            {ordered.map((g) => {
              const sev = severity(g.score, ordered[0].score)
              return (
                <li key={g.skill} className="grid grid-cols-1 gap-x-4 gap-y-2 px-5 py-3.5 text-[13px] sm:grid-cols-[10rem_1fr_auto] sm:items-center">
                  <div>
                    <div className="font-medium text-zinc-900">{g.skill}</div>
                    <div className="num text-xs text-zinc-500">L{g.have} → needs L{g.need}</div>
                  </div>
                  <div>
                    <LevelMeter have={g.have} need={g.need} />
                    <div className="mt-2 flex flex-wrap gap-1">{[...new Set(g.paths)].map((p) => <Badge key={p}>{p}</Badge>)}</div>
                  </div>
                  <Badge tone={sev.tone}>{sev.label} · {g.score}</Badge>
                </li>
              )
            })}
          </ul>
          <p className="border-t border-zinc-100 px-5 py-3 text-[11px] text-zinc-400">Filled segments = your level. The outlined segment = the level roles ask for.</p>
        </Card>
      </div>
    </>
  )
}
