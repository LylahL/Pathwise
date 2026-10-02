import { createHash } from 'node:crypto'
import type { z } from 'zod'
import { aiConfig } from '../config'
import { generate as anthropic } from './providers/anthropic'
import { generate as gemini } from './providers/gemini'

/** Run the configured provider with schema-constrained output. Throws HttpError on any failure. */
export function runLlm<S extends z.ZodType>(system: string, user: string, schema: S): Promise<z.infer<S>> {
  const { provider, model } = aiConfig()
  return (provider === 'gemini' ? gemini : anthropic)(system, user, model, schema)
}

/** Small in-memory cache so repeated identical requests don't re-bill. Keyed on content + provider + model. */
export function makeCache<T>(max = 25) {
  const m = new Map<string, T>()
  const key = (payload: unknown) => {
    const { provider, model } = aiConfig()
    return createHash('sha256').update(JSON.stringify({ payload, provider, model })).digest('hex')
  }
  return {
    key,
    get: (k: string) => m.get(k),
    set(k: string, v: T) {
      if (m.size >= max) m.delete(m.keys().next().value!)
      m.set(k, v)
    },
  }
}
