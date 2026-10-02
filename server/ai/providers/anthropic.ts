import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { HttpError } from '../../http'
import { LlmAnalysisSchema } from '../llmSchema'
import type { Generate } from '../llmSchema'

const notConfigured = () => new HttpError(503, 'AI is not configured on the server (missing or invalid ANTHROPIC_API_KEY)', 'ai_not_configured')

function mapError(e: unknown): HttpError {
  if (e instanceof HttpError) return e
  // With no credentials at all the SDK throws a plain Error rather than AuthenticationError.
  if (e instanceof Anthropic.AuthenticationError || (e instanceof Error && /could not resolve authentication/i.test(e.message))) return notConfigured()
  if (e instanceof Anthropic.RateLimitError) return new HttpError(429, 'AI provider rate limit reached; try again shortly', 'ai_rate_limited')
  if (e instanceof Anthropic.APIConnectionError) return new HttpError(502, 'Could not reach the AI provider', 'ai_unreachable')
  if (e instanceof Error && /failed to parse structured output/i.test(e.message)) return new HttpError(502, 'AI response did not match the expected structure', 'ai_invalid')
  if (e instanceof Anthropic.APIError) return new HttpError(502, `AI provider error (${e.status})`, 'ai_error')
  return new HttpError(502, 'AI analysis failed', 'ai_error')
}

export const generate: Generate = async (system, user, model) => {
  try {
    // Built per call: cheap, and picks up credentials that appear after startup (e.g. `ant auth login`).
    const res = await new Anthropic({ maxRetries: 1 }).messages.parse({
      model,
      max_tokens: 8000,
      system,
      messages: [{ role: 'user', content: user }],
      output_config: { effort: 'low', format: zodOutputFormat(LlmAnalysisSchema) },
    })
    if (res.stop_reason === 'refusal') throw new HttpError(502, 'The AI provider declined this request', 'ai_refused')
    if (res.stop_reason === 'max_tokens') throw new HttpError(502, 'AI response was cut off', 'ai_truncated')
    if (!res.parsed_output) throw new HttpError(502, 'AI response did not match the expected structure', 'ai_invalid')
    return res.parsed_output
  } catch (e) {
    const mapped = mapError(e)
    if (!(e instanceof HttpError) && mapped.code !== 'ai_not_configured') console.error('[analyze:anthropic] provider call failed:', e instanceof Error ? `${e.name}: ${e.message.split('\n')[0]}` : e)
    throw mapped
  }
}
