import { z } from 'zod'
import { CandidateAnalysisSchema } from '../../src/ai/candidateSchema'
import { PathIdSchema } from '../../src/types'

const Shape = CandidateAnalysisSchema.shape

/** What we ask the model for: no scores, no skill levels, nothing numeric it could get wrong. */
export const LlmAnalysisSchema = z.object({
  strengths: Shape.strengths,
  evidence: Shape.evidence,
  gaps: Shape.gaps,
  careerPaths: z.array(z.object({
    pathId: PathIdSchema,
    evidence: z.array(z.string()),
    risks: z.array(z.string()),
    nextSteps: z.array(z.string()),
  })),
  recommendations: Shape.recommendations,
})
export type LlmAnalysis = z.infer<typeof LlmAnalysisSchema>

/** A provider turns (system prompt, user JSON) into output validated against `schema`, or throws HttpError. */
export type Generate = <S extends z.ZodType>(system: string, user: string, model: string, schema: S) => Promise<z.infer<S>>
