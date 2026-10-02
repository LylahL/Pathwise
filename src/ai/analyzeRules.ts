/**
 * Deterministic candidate analysis. This is both the default implementation and the fallback when an
 * LLM endpoint fails. Every statement is derived from the input; nothing is invented.
 */
import { fit } from '../lib/analytics'
import type { CareerPath } from '../types'
import type { CandidateAnalysis, CandidateInput } from './candidateSchema'

type Skill = CandidateInput['skills'][number]

/** Concrete next step per skill gap, grouped so related gaps merge into one recommendation. */
export const REMEDY: Record<string, { group: string; step: string }> = {
  Cloud: { group: 'deploy', step: 'Deploy a small service on a cloud free tier and document the architecture' },
  'Production Deployment': { group: 'deploy', step: 'Wrap a model or app in an API, containerize it and deploy it with basic monitoring' },
  'System Design': { group: 'deploy', step: 'Write a one-page design doc (components, data flow, failure modes) for an existing project' },
  'Software Engineering': { group: 'swe', step: 'Add tests, CI and code review practices to a project, or contribute to an open-source repo' },
  Experimentation: { group: 'exp', step: 'Run and write up an A/B-style analysis on a public dataset, including power and effect size' },
  Statistics: { group: 'exp', step: 'Complete a statistics-heavy project (inference, uncertainty) and publish the write-up' },
  'Product Sense': { group: 'product', step: 'Write a product teardown: pick a metric, propose a change, define how you would measure it' },
  'Machine Learning': { group: 'ml', step: 'Build an end-to-end ML project with a proper train/validation split and error analysis' },
  'Data Visualization': { group: 'viz', step: 'Publish an interactive dashboard on a public dataset' },
  SQL: { group: 'sql', step: 'Practice window functions and joins on realistic schemas; document a query portfolio' },
  Python: { group: 'py', step: 'Build a packaged Python project with tests' },
  Excel: { group: 'viz', step: 'Build a reporting workbook with pivots and lookups' },
  Communication: { group: 'comm', step: 'Present a project to a non-technical audience and record the walkthrough' },
}
const GROUP_TITLE: Record<string, string> = {
  deploy: 'Build and deploy one production-style project', swe: 'Strengthen software engineering practice',
  exp: 'Add experimentation and statistics depth', product: 'Practice product thinking',
  ml: 'Deepen applied machine learning', viz: 'Strengthen data visualization', sql: 'Sharpen SQL', py: 'Strengthen Python', comm: 'Practice communicating results',
}
export const stepFor = (skill: string) => REMEDY[skill]?.step ?? `Build a project that demonstrates ${skill}`
const isDeployed = (input: CandidateInput) => input.projects.some((p) => p.evidence.some((e) => /deployed/i.test(e)))

export function analyzeWithRules(input: CandidateInput, paths: CareerPath[]): CandidateAnalysis {
  const levels = Object.fromEntries(input.skills.map((s) => [s.name, s.level]))
  const byName = new Map<string, Skill>(input.skills.map((s) => [s.name, s]))
  const sources = [...input.projects.map((p) => ({ ...p, kind: 'project' as const })), ...input.experience]
  const sourceFor = (skill: string) => sources.find((s) => s.skills.includes(skill))
  const deployed = isDeployed(input)

  // ---- Interests → paths ----
  const interests = input.interests.map((label) => ({
    label, pathId: paths.find((p) => p.title.toLowerCase() === label.toLowerCase() || label.toLowerCase().includes(p.title.toLowerCase()))?.id ?? null,
  }))
  const interestIds = new Set(interests.flatMap((i) => (i.pathId ? [i.pathId] : [])))

  // ---- Skills ----
  const skills = input.skills.map((s) => ({
    name: s.name, level: s.level, evidence: s.evidence,
    support: s.level >= 3 ? (s.evidence.length ? 'proven' : 'claimed') : s.level >= 1 ? 'developing' : 'none',
  } as const))

  // ---- Career paths ----
  const scored = paths.map((p) => ({ p, ...fit(levels, p.requirements) }))
  const careerPaths = scored.map(({ p, score, gaps, strengths }) => ({
    pathId: p.id, title: p.title, fitScore: score, matchesInterest: interestIds.has(p.id),
    evidence: strengths.slice(0, 4).map((s) => {
      const src = sourceFor(s.skill)
      return src ? `${s.skill} L${s.have} — ${src.title}` : byName.get(s.skill)?.evidence[0] ? `${s.skill} L${s.have} — ${byName.get(s.skill)!.evidence[0]}` : `${s.skill} L${s.have} (self-rated, no linked evidence)`
    }),
    missingSkills: gaps.map((g) => ({ skill: g.skill, have: g.have, need: g.need })),
    risks: [
      ...gaps.filter((g) => g.weight >= 3).slice(0, 2).map((g) => `${g.skill} is heavily weighted for ${p.title} (L${g.need} expected) and you are at L${g.have}.`),
      ...(!deployed && p.requirements.some((r) => r.skill === 'Production Deployment' || r.skill === 'Cloud') ? ['No deployed project yet, which these roles tend to look for.'] : []),
      ...strengths.filter((s) => s.have >= 3 && !(byName.get(s.skill)?.evidence.length)).slice(0, 1).map((s) => `${s.skill} is self-rated L${s.have} with no linked evidence.`),
    ].slice(0, 3),
    nextSteps: gaps.length ? [...new Set(gaps.slice(0, 3).map((g) => stepFor(g.skill)))] : ['Requirements are met on paper: prioritise applications and referrals for this path.'],
  }))

  // ---- Gaps and recommendations, weighted over the paths the candidate cares about ----
  const relevant = scored.filter((s) => interestIds.has(s.p.id))
  const focus = relevant.length ? relevant : [...scored].sort((a, b) => b.score - a.score).slice(0, 3)
  const agg = new Map<string, { skill: string; have: number; need: number; wd: number; paths: Set<CareerPath['id']> }>()
  for (const s of focus) for (const g of s.gaps) {
    const cur = agg.get(g.skill) ?? { skill: g.skill, have: g.have, need: 0, wd: 0, paths: new Set() }
    cur.need = Math.max(cur.need, g.need); cur.wd += g.weight * g.deficit; cur.paths.add(s.p.id); agg.set(g.skill, cur)
  }
  const ranked = [...agg.values()].sort((a, b) => b.wd - a.wd)
  const claimed = skills.filter((s) => s.support === 'claimed')

  const gaps = [
    ...ranked.slice(0, 4).map((g) => ({
      area: g.skill, detail: `L${g.have} vs L${g.need} expected across ${[...g.paths].map((id) => paths.find((p) => p.id === id)!.title).join(', ')}.`,
      severity: g.wd >= 9 ? 'high' as const : g.wd >= 4 ? 'medium' as const : 'low' as const,
    })),
    ...(deployed ? [] : [{ area: 'Deployed work', detail: 'None of your projects shows evidence of being deployed.', severity: 'medium' as const }]),
    ...(claimed.length ? [{ area: 'Unevidenced skills', detail: `${claimed.map((c) => c.name).join(', ')} rated L3+ without linked evidence.`, severity: 'low' as const }] : []),
  ]

  const groups = new Map<string, { wd: number; skills: string[]; paths: Set<CareerPath['id']> }>()
  for (const g of ranked) {
    const key = REMEDY[g.skill]?.group ?? g.skill
    const cur = groups.get(key) ?? { wd: 0, skills: [], paths: new Set() }
    cur.wd += g.wd; cur.skills.push(g.skill); g.paths.forEach((x) => cur.paths.add(x)); groups.set(key, cur)
  }
  const recommendations = [...groups.entries()].sort((a, b) => b[1].wd - a[1].wd).slice(0, 3).map(([key, g], i) => ({
    title: GROUP_TITLE[key] ?? `Build evidence for ${g.skills[0]}`,
    rationale: `${g.skills.join(' and ')} ${g.skills.length > 1 ? 'are' : 'is'} among your largest gaps for ${[...g.paths].map((id) => paths.find((p) => p.id === id)!.title).join(', ')}. ${stepFor(g.skills[0])}.`,
    pathIds: [...g.paths], priority: Math.min(i + 1, 3),
  }))
  if (claimed.length) recommendations.push({
    title: 'Back up your strong skills with visible evidence',
    rationale: `${claimed.map((c) => c.name).join(', ')} ${claimed.length > 1 ? 'are' : 'is'} rated L3+ but not tied to any project or role. Link each to a repo, write-up or result on your resume.`,
    pathIds: [], priority: 3,
  })

  // ---- Strengths and evidence ----
  const strengths = skills.filter((s) => s.support === 'proven').sort((a, b) => b.level - a.level || b.evidence.length - a.evidence.length).slice(0, 4)
    .map((s) => ({ title: `${s.name} (L${s.level})`, detail: `Backed by ${s.evidence.length} piece${s.evidence.length === 1 ? '' : 's'} of evidence.`, evidence: s.evidence }))
  const evidence = [
    ...sources.map((s) => ({ source: s.title, kind: s.kind, demonstrates: s.skills, detail: s.evidence[0] ?? s.description })),
    ...(input.education.coursework.length ? [{ source: 'Coursework', kind: 'coursework' as const, demonstrates: [], detail: input.education.coursework.join(', ') }] : []),
  ]

  return { generatedBy: 'rules-engine', strengths, skills, evidence, gaps, interests, careerPaths, recommendations }
}
