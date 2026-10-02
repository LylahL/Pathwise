import { aiConfig, config } from './config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { ZodError } from 'zod'
import { seedIfEmpty } from './db/seed'
import { HttpError } from './http'
import { analyze } from './routes/analyze'
import { data } from './routes/data'

seedIfEmpty()

export const app = new Hono()

app.get('/api/health', (c) => {
  const { provider, model, configured } = aiConfig()
  // Reports only whether a key is present, never the key itself.
  return c.json({ ok: true, ai: { provider, model, configured } })
})
app.route('/api', analyze)
app.route('/api', data)

app.notFound((c) => c.json({ error: 'not_found', message: 'No such route' }, 404))
app.onError((e, c) => {
  if (e instanceof HttpError) return c.json({ error: e.code, message: e.message }, e.status)
  if (e instanceof ZodError) return c.json({ error: 'invalid_data', message: e.issues[0]?.message ?? 'Invalid data' }, 400)
  console.error(e) // full detail stays in the server log, not the response
  return c.json({ error: 'internal', message: 'Something went wrong' }, 500)
})

if (process.env.PATHWISE_NO_LISTEN !== '1') {
  serve({ fetch: app.fetch, port: config.port }, (i) => {
    const ai = aiConfig()
    console.log(`Pathwise API on http://localhost:${i.port} (AI: ${ai.provider}/${ai.model}, db ${config.dbPath})`)
    if (!ai.configured) console.log(`${ai.keyVar} not set: /api/analyze-candidate will return 503 and the app will use its rules-based fallback.`)
  })
}
