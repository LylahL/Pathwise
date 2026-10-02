/** Deterministic scoring of a list of job requirements against a candidate. Shared by the rules engine and the LLM path. */
import type { CandidateInput } from './candidateSchema'
import type { JobFitAnalysis } from './jobFitSchema'

export type Importance = 'required' | 'preferred'
export interface Requirement { skill: string; importance: Importance; jobQuote: string }

/** Postings rarely state levels, so assume new-grad expectations: required ≈ L4, preferred ≈ L3. */
export const NEED: Record<Importance, number> = { required: 4, preferred: 3 }
export const WEIGHT: Record<Importance, number> = { required: 3, preferred: 1 }

const norm = (s: string) => s.trim().toLowerCase()

export function findSkill(c: CandidateInput, name: string) {
  return c.skills.find((s) => norm(s.name) === norm(name))
}

/** Concrete things the candidate can point to for a skill: recorded evidence plus projects/roles that list it. */
export function evidenceFor(c: CandidateInput, skill: string): string[] {
  const own = findSkill(c, skill)?.evidence ?? []
  const sources = [...c.projects, ...c.experience].filter((s) => s.skills.some((x) => norm(x) === norm(skill))).map((s) => s.title)
  return [...new Set([...sources, ...own])]
}

/** One entry per skill; "required" wins over "preferred". */
export function dedupe(reqs: Requirement[]): Requirement[] {
  const m = new Map<string, Requirement>()
  for (const r of reqs) {
    const cur = m.get(norm(r.skill))
    if (!cur || (cur.importance === 'preferred' && r.importance === 'required')) m.set(norm(r.skill), r)
  }
  return [...m.values()]
}

export type Scored = Pick<JobFitAnalysis, 'overallFit' | 'matchingSkills' | 'partialMatches' | 'missingSkills'>

/** match: meets the assumed level · partial: within one level (and at least L2) · missing: otherwise. */
export function scoreRequirements(c: CandidateInput, reqs: Requirement[]): Scored {
  const matching: Scored['matchingSkills'] = [], partial: Scored['partialMatches'] = [], missing: Scored['missingSkills'] = []
  let got = 0, total = 0
  for (const r of dedupe(reqs)) {
    const have = findSkill(c, r.skill)?.level ?? 0, need = NEED[r.importance], w = WEIGHT[r.importance]
    got += w * Math.min(have / need, 1)
    total += w
    const skill = findSkill(c, r.skill)?.name ?? r.skill
    if (have >= need) matching.push({ skill, have, need, importance: r.importance, evidence: evidenceFor(c, skill) })
    else if (have >= need - 1 && have >= 2) partial.push({ skill, have, need, importance: r.importance, evidence: evidenceFor(c, skill) })
    else missing.push({ skill, have, need, importance: r.importance })
  }
  const byWeight = <T extends { importance: Importance; need: number; have: number }>(a: T, b: T) =>
    WEIGHT[b.importance] * (b.need - b.have) - WEIGHT[a.importance] * (a.need - a.have)
  return {
    overallFit: total ? Math.round((got / total) * 100) : 0,
    matchingSkills: matching,
    partialMatches: partial.sort(byWeight),
    missingSkills: missing.sort(byWeight),
  }
}
