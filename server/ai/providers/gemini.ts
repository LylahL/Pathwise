import { ApiError, FinishReason, GoogleGenAI } from '@google/genai'
import { z } from 'zod'
import { HttpError } from '../../http'
import type { Generate } from '../llmSchema'

const notConfigured = () => new HttpError(503, 'AI is not configured on the server (missing or invalid GEMINI_API_KEY)', 'ai_not_configured')

// Gemini takes plain JSON Schema; drop the draft marker zod adds.
function jsonSchema(schema: z.ZodType): Record<string, unknown> {
  const { $schema: _draft, ...rest } = z.toJSONSchema(schema) as Record<string, unknown>
  return rest
}

function mapError(e: unknown): HttpError {
  if (e instanceof HttpError) return e
  if (e instanceof ApiError) {
    // Google reports a bad key as HTTP 400 "API key not valid", not 401.
    if (e.status === 401 || e.status === 403 || /api key/i.test(e.message)) return notConfigured()
    if (e.status === 429) return new HttpError(429, 'AI provider rate limit reached; try again shortly', 'ai_rate_limited')
    return new HttpError(502, `AI provider error (${e.status})`, 'ai_error')
  }
  if (e instanceof TypeError) return new HttpError(502, 'Could not reach the AI provider', 'ai_unreachable')
  return new HttpError(502, 'AI analysis failed', 'ai_error')
}

export const generate: Generate = async (system, user, model, schema) => {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY
  if (!apiKey) throw notConfigured()
  try {
    const ai = new GoogleGenAI({ apiKey, httpOptions: process.env.GEMINI_BASE_URL ? { baseUrl: process.env.GEMINI_BASE_URL } : undefined })
    const res = await ai.models.generateContent({
      model,
      contents: user,
      config: { systemInstruction: system, responseMimeType: 'application/json', responseJsonSchema: jsonSchema(schema), temperature: 0.3 },
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
    const mapped = mapError(e)
    if (!(e instanceof HttpError) && mapped.code !== 'ai_not_configured') console.error('[analyze:gemini] provider call failed:', e instanceof Error ? `${e.name}: ${e.message.split('\n')[0]}` : e)
    throw mapped
  }
}
