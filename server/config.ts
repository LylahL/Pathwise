import { existsSync } from 'node:fs'

// Load .env files (existing environment variables win). Import this module first.
for (const f of ['.env.local', '.env']) if (existsSync(f)) process.loadEnvFile(f)

export type ProviderName = 'gemini' | 'anthropic'

export const config = {
  port: Number(process.env.PORT ?? 8787),
  dbPath: process.env.PATHWISE_DB ?? 'data/pathwise.db',
  isProd: process.env.NODE_ENV === 'production',
  /** The single demo user until auth exists. */
  userId: 'u_demo',
}

const has = (...names: string[]) => names.some((n) => Boolean(process.env[n]))

/** Which LLM answers /api/analyze-candidate. Read per call so env changes (and tests) take effect. */
export function aiConfig() {
  const requested = process.env.AI_PROVIDER
  const provider: ProviderName =
    requested === 'gemini' || requested === 'anthropic' ? requested
    : has('GEMINI_API_KEY', 'GOOGLE_API_KEY') ? 'gemini'
    : has('ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN') ? 'anthropic'
    : 'gemini'
  return {
    provider,
    model: provider === 'gemini' ? (process.env.GEMINI_MODEL ?? 'gemini-2.5-flash') : (process.env.ANTHROPIC_MODEL ?? 'claude-opus-5-5'),
    configured: provider === 'gemini' ? has('GEMINI_API_KEY', 'GOOGLE_API_KEY') : has('ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN'),
    keyVar: provider === 'gemini' ? 'GEMINI_API_KEY' : 'ANTHROPIC_API_KEY',
  }
}
