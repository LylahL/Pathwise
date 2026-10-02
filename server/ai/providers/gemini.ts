import { ApiError, FinishReason, GoogleGenAI } from '@google/genai'
import { z } from 'zod'
import { HttpError } from '../../http'
import type { Generate } from '../llmSchema'

const ATTEMPT_TIMEOUT_MS = 20_000

const notConfigured = () => new HttpError(503, 'AI is not configured on the server (missing or invalid GEMINI_API_KEY)', 'ai_not_configured')

// Gemini takes plain JSON Schema; drop the draft marker zod adds.
function jsonSchema(schema: z.ZodType): Record<string, unknown> {
  const { $schema: _draft, ...rest } = z.toJSONSchema(schema) as Record<string, unknown>
  return rest
}

/** Model problems worth trying the next configured model for: retired/unknown (404) or overloaded (503). */
const isModelProblem = (e: unknown) => e instanceof ApiError && (e.status === 404 || e.status === 503)

function mapError(e: unknown, model: string): HttpError {
  if (e instanceof HttpError) return e
  if (e instanceof ApiError) {
    // Google reports a bad key as HTTP 400 "API key not valid", not 401.
    if (e.status === 401 || e.status === 403 || /api key/i.test(e.message)) return notConfigured()
    if (e.status === 429) return new HttpError(429, 'AI provider rate limit reached; try again shortly', 'ai_rate_limited')
    if (e.status === 404) return new HttpError(502, `The AI model "${model}" is not available to this key. Set GEMINI_MODEL to a current model.`, 'ai_model_unavailable')
    if (e.status === 503) return new HttpError(502, 'The AI provider is busy right now; try again in a moment', 'ai_busy')
    return new HttpError(502, `AI provider error (${e.status})`, 'ai_error')
  }
  if (e instanceof DOMException && e.name === 'AbortError') return new HttpError(502, 'The AI provider took too long to respond', 'ai_timeout')
  if (e instanceof TypeError) return new HttpError(502, 'Could not reach the AI provider', 'ai_unreachable')
  return new HttpError(502, 'AI analysis failed', 'ai_error')
}

/** `model` may be a comma-separated list: later entries are tried only if an earlier one is unavailable or overloaded. */
export const generate: Generate = async (system, user, model, schema) => {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY
  if (!apiKey) throw notConfigured()
  const ai = new GoogleGenAI({ apiKey, httpOptions: process.env.GEMINI_BASE_URL ? { baseUrl: process.env.GEMINI_BASE_URL } : undefined })
  const models = model.split(',').map((m) => m.trim()).filter(Boolean)
  const responseJsonSchema = jsonSchema(schema)

  let last: unknown
  for (const m of models) {
    const ctl = new AbortController()
    const timer = setTimeout(() => ctl.abort(), ATTEMPT_TIMEOUT_MS)
    try {
      const res = await ai.models.generateContent({
        model: m,
        contents: user,
        config: { systemInstruction: system, responseMimeType: 'application/json', responseJsonSchema, temperature: 0.3, abortSignal: ctl.signal },
      })
      if (res.promptFeedback?.blockReason) throw new HttpError(502, 'The AI provider declined this request', 'ai_refused')
      const reason = res.candidates?.[0]?.finishReason
      if (reason === FinishReason.MAX_TOKENS) throw new HttpError(502, 'AI response was cut off', 'ai_truncated')
      if (reason && reason !== FinishReason.STOP) throw new HttpError(502, 'The AI provider declined this request', 'ai_refused')

      let raw: unknown
      try { raw = JSON.parse(res.text ?? '') } catch { throw new HttpError(502, 'AI response was not valid JSON', 'ai_invalid') }
      const parsed = schema.safeParse(raw)
      if (!parsed.success) throw new HttpError(502, 'AI response did not match the expected structure', 'ai_invalid')
      return parsed.data as never
    } catch (e) {
      last = e
      const timedOut = e instanceof DOMException && e.name === 'AbortError'
      if (m !== models[models.length - 1] && (isModelProblem(e) || timedOut)) {
        console.warn(`[analyze:gemini] ${m} unavailable (${e instanceof ApiError ? e.status : 'timeout'}); trying next model`)
        continue
      }
      break
    } finally {
      clearTimeout(timer)
    }
  }
  const mapped = mapError(last, models[models.length - 1])
  if (!(last instanceof HttpError) && mapped.code !== 'ai_not_configured') console.error('[analyze:gemini] provider call failed:', last instanceof Error ? `${last.name}: ${last.message.split('\n')[0].slice(0, 200)}` : last)
  throw mapped
}
