import type { Application, CareerPath, Profile, SkillReq } from '../types'

export const STAGES = ['Applied', 'Responded', 'Interview', 'Final round', 'Offer'] as const
/** Reference response rate used only to scale the readiness score; tune freely. */
export const RESPONSE_RATE_TARGET = 0.25

export const pct = (x: number, digits = 0) => `${(x * 100).toFixed(digits)}%`
const safeDiv = (a: number, b: number) => (b === 0 ? 0 : a / b)

export function funnelCounts(apps: Application[]) {
  return STAGES.map((stage, i) => ({ stage, count: i === 0 ? apps.length : apps.filter((a) => a.reached >= i).length }))
}

export function summary(apps: Application[]) {
  const f = funnelCounts(apps)
  return {
    applications: apps.length,
    responses: f[1].count,
    interviews: f[2].count,
    finals: f[3].count,
    offers: f[4].count,
    responseRate: safeDiv(f[1].count, apps.length),
  }
}

export interface Segment { key: string; n: number; responded: number; interviews: number; rate: number }

export function segmentBy(apps: Application[], keyFn: (a: Application) => string): Segment[] {
  const m = new Map<string, Application[]>()
  for (const a of apps) m.set(keyFn(a), [...(m.get(keyFn(a)) ?? []), a])
  return [...m.entries()]
    .map(([key, list]) => {
      const responded = list.filter((a) => a.reached >= 1).length
      return { key, n: list.length, responded, interviews: list.filter((a) => a.reached >= 2).length, rate: safeDiv(responded, list.length) }
    })
    .sort((a, b) => b.n - a.n)
}

export function weekly(apps: Application[]) {
  const monday = (iso: string) => {
    const d = new Date(iso + 'T00:00:00Z')
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
    return d.toISOString().slice(0, 10)
  }
  const m = new Map<string, { applied: number; responded: number }>()
  for (const a of apps) {
    const k = monday(a.appliedOn)
    const cur = m.get(k) ?? { applied: 0, responded: 0 }
    cur.applied++
    if (a.reached >= 1) cur.responded++
    m.set(k, cur)
  }
  return [...m.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => ({
    week: new Date(k + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
    ...v,
  }))
}

// ---------- Fit ----------
export interface SkillGap { skill: string; have: number; need: number; weight: number; deficit: number }

export function fit(skills: Profile['skills'], reqs: SkillReq[]) {
  const total = reqs.reduce((s, q) => s + q.weight, 0)
  let got = 0
  const gaps: SkillGap[] = []
  const strengths: SkillGap[] = []
  for (const q of reqs) {
    const have = skills[q.skill] ?? 0
    got += q.weight * Math.min(have / q.level, 1)
    const row = { skill: q.skill, have, need: q.level, weight: q.weight, deficit: Math.max(q.level - have, 0) }
    ;(row.deficit > 0 ? gaps : strengths).push(row)
  }
  gaps.sort((a, b) => b.weight * b.deficit - a.weight * a.deficit)
  return { score: Math.round(safeDiv(got, total) * 100), gaps, strengths }
}

export type FitTier = 'Strong' | 'Reachable' | 'Stretch'
export const tier = (score: number): FitTier => (score >= 80 ? 'Strong' : score >= 65 ? 'Reachable' : 'Stretch')

export function rankPaths(profile: Profile, paths: CareerPath[], apps: Application[]) {
  return paths
    .map((p) => {
      const f = fit(profile.skills, p.requirements)
      const mine = apps.filter((a) => a.pathId === p.id)
      const responded = mine.filter((a) => a.reached >= 1).length
      return { path: p, ...f, tier: tier(f.score), applications: mine.length, responded, appShare: safeDiv(mine.length, apps.length) }
    })
    .sort((a, b) => b.score - a.score)
}

/** Transparent composite: 50% best-two fit, 30% response rate vs target, 20% project depth. */
export function readiness(profile: Profile, paths: CareerPath[], apps: Application[]) {
  const ranked = rankPaths(profile, paths, apps)
  const fitPart = (ranked[0].score + ranked[1].score) / 2
  const respPart = Math.min(summary(apps).responseRate / RESPONSE_RATE_TARGET, 1) * 100
  const projPart = Math.min(profile.projects.filter((p) => p.deployed).length / 2, 1) * 100
  return {
    score: Math.round(0.5 * fitPart + 0.3 * respPart + 0.2 * projPart),
    parts: [
      { label: 'Career fit (top 2 paths)', weight: 0.5, value: Math.round(fitPart) },
      { label: 'Response rate vs target', weight: 0.3, value: Math.round(respPart) },
      { label: 'Deployed projects (2 = full)', weight: 0.2, value: Math.round(projPart) },
    ],
  }
}
