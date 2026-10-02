import type { CareerPath } from '../types'
import { AnalysisValidationError, CandidateAnalysisSchema, CandidateInputSchema, candidateAnalysisJsonSchema, checkAnalysis } from './candidateSchema'
import type { CandidateAnalysis } from './candidateSchema'
import { analyzeWithRules } from './analyzeRules'

export interface AnalysisResult {
  analysis: CandidateAnalysis
  /** Set when an LLM endpoint was configured but failed, so the UI can say the rules engine answered instead. */
  fallbackReason?: string
}

const DEFAULT_TIMEOUT_MS = 15_000

async function callEndpoint(url: string, input: unknown, paths: CareerPath[], timeoutMs: number): Promise<CandidateAnalysis> {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      method: 'POST', headers: { 'content-type': 'application/json' }, signal: ctl.signal,
      // The JSON Schema lets the server force structured output; paths are the reference requirements to score against.
      body: JSON.stringify({ task: 'analyzeCandidate', input, paths, outputSchema: candidateAnalysisJsonSchema() }),
    })
    if (!res.ok) throw new Error(`endpoint returned HTTP ${res.status}`)
    const body: unknown = await res.json().catch(() => { throw new Error('response was not valid JSON') })
    const parsed = CandidateAnalysisSchema.safeParse({ ...(body as object), generatedBy: 'llm' })
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      throw new AnalysisValidationError(`response failed validation at "${issue.path.join('.')}": ${issue.message}`)
    }
    return checkAnalysis(parsed.data, paths)
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw new Error('request timed out')
    throw e
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Analyze a candidate profile into strengths, skills, evidence, gaps, interests, ranked career paths
 * and recommendations. Output is always schema-validated.
 *
 * - No VITE_AI_ENDPOINT: the deterministic rules engine answers.
 * - Endpoint set: its response must validate; on timeout, HTTP error, bad JSON or schema/semantic
 *   violation we fall back to the rules engine and report `fallbackReason`.
 * - Invalid *input* is a caller bug and throws (nothing sensible to fall back to).
 */
export async function analyzeCandidate(rawInput: unknown, ctx: { paths: CareerPath[]; timeoutMs?: number; /** Overrides VITE_AI_ENDPOINT (used in tests). */ endpoint?: string }): Promise<AnalysisResult> {
  const input = CandidateInputSchema.parse(rawInput)
  const endpoint = ctx.endpoint ?? (import.meta.env?.VITE_AI_ENDPOINT as string | undefined)
  let fallbackReason: string | undefined

  if (endpoint) {
    try {
      return { analysis: await callEndpoint(endpoint, input, ctx.paths, ctx.timeoutMs ?? DEFAULT_TIMEOUT_MS) }
    } catch (e) {
      fallbackReason = e instanceof Error ? e.message : 'unknown error'
    }
  }
  const analysis = checkAnalysis(CandidateAnalysisSchema.parse(analyzeWithRules(input, ctx.paths)), ctx.paths)
  return { analysis, fallbackReason }
}
