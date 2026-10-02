/**
 * Contract for job-specific fit analysis: compare one candidate to one pasted job description.
 * The score explains competitiveness against the posting's stated requirements. It does not predict hiring outcomes.
 */
import { z } from 'zod'
import { CandidateInputSchema } from './candidateSchema'

export const JOB_TEXT_MIN = 40
export const JOB_TEXT_MAX = 20_000

export const JobFitInputSchema = z.object({
  candidate: CandidateInputSchema,
  job: z.object({
    title: z.string().max(200).default(''),
    company: z.string().max(200).default(''),
    description: z.string().min(JOB_TEXT_MIN, `Paste at least ${JOB_TEXT_MIN} characters of the job description`).max(JOB_TEXT_MAX),
  }),
})
export type JobFitInput = z.infer<typeof JobFitInputSchema>

const importance = z.enum(['required', 'preferred'])
const level = z.number().min(0).max(5)

export const JobFitAnalysisSchema = z.object({
  generatedBy: z.enum(['rules-engine', 'llm']),
  job: z.object({ title: z.string(), company: z.string() }),
  /** 0–100, computed by the application from `requirements`; never taken from a model. */
  overallFit: z.number().int().min(0).max(100),
  /** Requirements found in the posting, each tied to a quote from it. */
  requirements: z.array(z.object({ skill: z.string(), importance, jobQuote: z.string() })).min(1),
  matchingSkills: z.array(z.object({ skill: z.string(), have: level, need: level, importance, evidence: z.array(z.string()) })),
  partialMatches: z.array(z.object({ skill: z.string(), have: level, need: level, importance, evidence: z.array(z.string()) })),
  missingSkills: z.array(z.object({ skill: z.string(), have: level, need: level, importance })),
  /** Why the candidate matches: posting quote paired with candidate evidence. */
  evidence: z.array(z.string()),
  concerns: z.array(z.string()),
  strategy: z.object({
    resume: z.array(z.string()),
    portfolio: z.array(z.string()),
    networking: z.array(z.string()),
    interview: z.array(z.string()),
  }),
  recommendedActions: z.array(z.object({ title: z.string(), rationale: z.string(), priority: z.number().int().min(1).max(3) })).min(1),
})
export type JobFitAnalysis = z.infer<typeof JobFitAnalysisSchema>

export class JobFitError extends Error {}
