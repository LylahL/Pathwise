import { useApp } from '../store'
import { Badge, Card, CardHeader, PageHeader } from '../components/ui'
import { SKILLS } from '../data/seed'
import { careerPaths } from '../data/seed'

export default function Profile() {
  const { profile, setSkill } = useApp()
  return (
    <>
      <PageHeader title="Profile" sub="Demo persona. Adjust skill levels to see fit, gaps and insights update live." right={<Badge tone="warn">Demo data</Badge>} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title={profile.name} sub={`${profile.major} · ${profile.school} · Class of ${profile.gradYear}`} />
            <div className="px-5 pb-5">
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Target paths</div>
              <div className="flex flex-wrap gap-1">{profile.targetPathIds.map((id) => <Badge key={id} tone="accent">{careerPaths.find((p) => p.id === id)?.title}</Badge>)}</div>
              <div className="mb-1.5 mt-4 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Coursework</div>
              <div className="flex flex-wrap gap-1">{profile.coursework.map((c) => <Badge key={c}>{c}</Badge>)}</div>
            </div>
          </Card>
          <Card>
            <CardHeader title="Projects" />
            <ul className="divide-y divide-zinc-100">
              {profile.projects.map((p) => (
                <li key={p.name} className="px-5 py-3 text-[13px]">
                  <div className="flex items-center justify-between"><span className="font-medium">{p.name}</span><Badge tone={p.deployed ? 'good' : 'neutral'}>{p.deployed ? 'deployed' : 'not deployed'}</Badge></div>
                  <p className="mt-0.5 text-xs text-zinc-500">{p.summary}</p>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardHeader title="Experience" />
            <ul className="divide-y divide-zinc-100">
              {profile.experience.map((x) => (
                <li key={x.org} className="px-5 py-3 text-[13px]"><div className="font-medium">{x.title} <span className="font-normal text-zinc-500">· {x.org}</span></div><p className="mt-0.5 text-xs text-zinc-500">{x.summary}</p></li>
              ))}
            </ul>
          </Card>
        </div>
        <Card className="self-start lg:col-span-3">
          <CardHeader title="Skill levels" sub="0 = none · 1 = exposure · 3 = project-proven · 5 = expert (self-rated)" />
          <div className="divide-y divide-zinc-100">
            {SKILLS.map((s) => (
              <label key={s} className="grid grid-cols-[170px_1fr_28px] items-center gap-4 px-5 py-2.5 text-[13px]">
                <span className="font-medium text-zinc-800">{s}</span>
                <input type="range" min={0} max={5} step={1} value={profile.skills[s] ?? 0} onChange={(e) => setSkill(s, Number(e.target.value))} />
                <span className="tabular text-right font-semibold">{profile.skills[s] ?? 0}</span>
              </label>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}
