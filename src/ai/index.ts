import { AIReportSchema } from '../types'
import type { AIReport, Snapshot } from '../types'
import { buildReport } from './engine'

/**
 * Single entry point for AI output. If VITE_AI_ENDPOINT is set, POST the snapshot to it
 * (expected to return JSON matching AIReportSchema, e.g. a server wrapping an LLM).
 * Any failure or schema mismatch falls back to the deterministic engine.
 */
export async function generateReport(snapshot: Snapshot): Promise<AIReport> {
  const endpoint = import.meta.env.VITE_AI_ENDPOINT as string | undefined
  if (endpoint) {
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(snapshot) })
      if (res.ok) return AIReportSchema.parse({ ...(await res.json()), generatedBy: 'llm' })
    } catch {
      /* fall through to local engine */
    }
  }
  return AIReportSchema.parse(buildReport(snapshot))
}

export { analyzeCandidate } from './analyzeCandidate'
export type { AnalysisResult } from './analyzeCandidate'
export type { CandidateAnalysis, CandidateInput, CareerPathAnalysis } from './candidateSchema'

export { analyzeJobFit } from './analyzeJobFit'
export type { JobFitResult } from './analyzeJobFit'
export { JobFitError } from './jobFitSchema'
export type { JobFitAnalysis, JobFitInput } from './jobFitSchema'
