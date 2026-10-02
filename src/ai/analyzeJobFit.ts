import { analyzeJobFitWithRules } from './jobFitRules'
import { JobFitAnalysisSchema, JobFitError, JobFitInputSchema } from './jobFitSchema'
import type { JobFitAnalysis } from './jobFitSchema'

export interface JobFitResult {
  analysis: JobFitAnalysis
  /** Set when the backend was configured but failed, so the UI can say the rules engine answered instead. */
  fallbackReason?: string
}

const DEFAULT_TIMEOUT_MS = 30_000

async function callBackend(url: string, input: unknown, timeoutMs: number): Promise<JobFitAnalysis> {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, signal: ctl.signal, body: JSON.stringify(input) })
    if (!res.ok) {
      const detail = await res.json().then((j: { message?: unknown }) => (typeof j.message === 'string' ? j.message : '')).catch(() => '')
      throw new Error(detail || `endpoint returned HTTP ${res.status}`)
    }
    const body: unknown = await res.json().catch(() => { throw new Error('response was not valid JSON') })
    const parsed = JobFitAnalysisSchema.safeParse({ ...(body as object), generatedBy: 'llm' })
    if (!parsed.success) throw new Error(`response failed validation at "${parsed.error.issues[0].path.join('.')}"`)
    return parsed.data
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw new Error('request timed out')
    throw e
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Compare a candidate with one pasted job description. Output is always schema-validated.
 * With a backend configured (VITE_API_BASE) the LLM answers; on any failure we fall back to the
 * deterministic rules engine and report why. Invalid input, or a posting with no recognizable
 * requirements, throws a JobFitError with a message safe to show the user.
 */
export async function analyzeJobFit(rawInput: unknown, ctx: { timeoutMs?: number; endpoint?: string } = {}): Promise<JobFitResult> {
  const checked = JobFitInputSchema.safeParse(rawInput)
  if (!checked.success) throw new JobFitError(checked.error.issues[0].message)
  const input = checked.data
  const apiBase = import.meta.env?.VITE_API_BASE as string | undefined
  const endpoint = ctx.endpoint ?? (apiBase ? `${apiBase}/analyze-job-fit` : undefined)
  let fallbackReason: string | undefined
  if (endpoint) {
    try {
      return { analysis: await callBackend(endpoint, input, ctx.timeoutMs ?? DEFAULT_TIMEOUT_MS) }
    } catch (e) {
      fallbackReason = e instanceof Error ? e.message : 'unknown error'
    }
  }
  return { analysis: analyzeJobFitWithRules(input), fallbackReason }
}
