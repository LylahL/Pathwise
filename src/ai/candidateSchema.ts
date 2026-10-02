/**
 * Contract for the candidate-analysis capability. Anything that produces a CandidateAnalysis
 * (rules engine or an LLM behind VITE_AI_ENDPOINT) must satisfy these schemas before the UI sees it.
 */
import { z } from 'zod'
import { PathIdSchema } from '../types'
import type { CareerPath } from '../types'

const level = z.number().min(0).max(5)
const named = z.object({ title: z.string(), organization: z.string().optional(), description: z.string(), skills: z.array(z.string()), evidence: z.array(z.string()) })

export const CandidateInputSchema = z.object({
  resume: z.object({ versions: z.array(z.object({ label: z.string(), focus: z.string() })) }),
  education: z.object({ school: z.string(), major: z.string(), gradYear: z.number().int(), coursework: z.array(z.string()) }),
  experience: z.array(named.extend({ kind: z.enum(['work', 'teaching']) })),
  projects: z.array(named),
  skills: z.array(z.object({ name: z.string(), level, evidence: z.array(z.string()) })),
  interests: z.array(z.string()),
})
export type CandidateInput = z.infer<typeof CandidateInputSchema>

export const CandidateAnalysisSchema = z.object({
  generatedBy: z.enum(['rules-engine', 'llm']),
  strengths: z.array(z.object({ title: z.string(), detail: z.string(), evidence: z.array(z.string()) })),
  skills: z.array(z.object({
    name: z.string(), level,
    /** proven = level ≥3 with linked evidence · claimed = level ≥3 without · developing = 1–2 · none = 0 */
    support: z.enum(['proven', 'claimed', 'developing', 'none']),
    evidence: z.array(z.string()),
  })),
  evidence: z.array(z.object({
    source: z.string(), kind: z.enum(['work', 'teaching', 'project', 'coursework']), demonstrates: z.array(z.string()), detail: z.string(),
  })),
  gaps: z.array(z.object({ area: z.string(), detail: z.string(), severity: z.enum(['high', 'medium', 'low']) })),
  interests: z.array(z.object({ label: z.string(), pathId: PathIdSchema.nullable() })),
  careerPaths: z.array(z.object({
    pathId: PathIdSchema,
    title: z.string(),
    fitScore: z.number().int().min(0).max(100),
    matchesInterest: z.boolean(),
    evidence: z.array(z.string()),
    missingSkills: z.array(z.object({ skill: z.string(), have: level, need: level })),
    risks: z.array(z.string()),
    nextSteps: z.array(z.string()),
  })).min(1),
  recommendations: z.array(z.object({
    title: z.string(), rationale: z.string(), pathIds: z.array(PathIdSchema), priority: z.number().int().min(1).max(3),
  })),
})
export type CandidateAnalysis = z.infer<typeof CandidateAnalysisSchema>
export type CareerPathAnalysis = CandidateAnalysis['careerPaths'][number]

/** JSON Schema of the output, sent with the request so a server can force structured output. */
export const candidateAnalysisJsonSchema = () => z.toJSONSchema(CandidateAnalysisSchema)

export class AnalysisValidationError extends Error {}

/** Checks zod can't express: known/unique path ids. Returns a normalized copy (paths sorted by fit). */
export function checkAnalysis(a: CandidateAnalysis, paths: CareerPath[]): CandidateAnalysis {
  const known = new Set(paths.map((p) => p.id))
  const seen = new Set<string>()
  for (const p of a.careerPaths) {
    if (!known.has(p.pathId)) throw new AnalysisValidationError(`unknown career path "${p.pathId}"`)
    if (seen.has(p.pathId)) throw new AnalysisValidationError(`duplicate career path "${p.pathId}"`)
    seen.add(p.pathId)
  }
  return { ...a, careerPaths: [...a.careerPaths].sort((x, y) => y.fitScore - x.fitScore) }
}
