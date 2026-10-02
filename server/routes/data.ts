import { randomUUID } from 'node:crypto'
import { Hono } from 'hono'
import { z } from 'zod'
import { ApplicationSchema, ExperimentSchema, JobSchema } from '../../src/model'
import { config } from '../config'
import { repos } from '../db/repo'
import { resetSeed } from '../db/seed'
import { tx } from '../db/client'
import { body, HttpError } from '../http'

const U = config.userId
const slug = (s: string) => s.toLowerCase().replace(/\W+/g, '_')
const id = (prefix: string) => `${prefix}_${randomUUID().slice(0, 8)}`
const safeId = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/)

export const data = new Hono()

/** Everything the UI can edit, in one request. Static reference data stays in the frontend bundle. */
data.get('/bootstrap', (c) => c.json({
  skills: repos.skills.list(U),
  experiments: repos.experiments.list(U, { newestFirst: true }),
}))

// ---- Skills ----
data.get('/skills', (c) => c.json(repos.skills.list(U)))

data.put('/skills/:name', async (c) => {
  const { level } = await body(c, z.object({ level: z.number().min(0).max(5) }))
  const name = decodeURIComponent(c.req.param('name'))
  const existing = repos.skills.list(U).find((s) => s.name === name)
  const row = existing ?? { id: `s_${slug(name)}`, userId: U, name, level, evidence: [] }
  return c.json(repos.skills.upsert({ ...row, level }))
})

// ---- Experiments ----
data.get('/experiments', (c) => c.json(repos.experiments.list(U, { newestFirst: true })))

const ExperimentCreate = ExperimentSchema.omit({ userId: true }).extend({ id: safeId })
data.post('/experiments', async (c) => {
  const e = await body(c, ExperimentCreate)
  return c.json(repos.experiments.upsert({ ...e, userId: U }), 201)
})

const ExperimentPatch = ExperimentSchema.pick({ status: true, result: true, confidence: true }).partial()
data.patch('/experiments/:id', async (c) => {
  const cur = repos.experiments.get(c.req.param('id'))
  if (!cur || cur.userId !== U) throw new HttpError(404, 'Experiment not found', 'not_found')
  return c.json(repos.experiments.upsert({ ...cur, ...(await body(c, ExperimentPatch)) }))
})

// ---- Jobs and applications ----
data.get('/jobs', (c) => c.json(repos.jobs.list()))
data.get('/applications', (c) => c.json(repos.applications.list(U)))

const ApplicationCreate = ApplicationSchema.omit({ id: true, userId: true, jobId: true }).extend({
  job: JobSchema.omit({ id: true }).partial({ description: true, requiredSkills: true, preferredSkills: true, responsibilities: true }),
})
data.post('/applications', async (c) => {
  const { job, ...app } = await body(c, ApplicationCreate)
  const user = repos.users.get(U)!
  if (!user.resume.versions.some((v) => v.label === app.resumeVersion)) {
    throw new HttpError(400, `Unknown resume version "${app.resumeVersion}"`, 'invalid_body')
  }
  return c.json(tx(() => {
    const j = repos.jobs.upsert({ description: '', requiredSkills: [], preferredSkills: [], responsibilities: [], ...job, id: id('j') })
    return repos.applications.upsert({ ...app, id: id('a'), userId: U, jobId: j.id })
  }), 201)
})

const ApplicationPatch = ApplicationSchema.pick({ status: true, outcome: true }).partial()
data.patch('/applications/:id', async (c) => {
  const cur = repos.applications.get(c.req.param('id'))
  if (!cur || cur.userId !== U) throw new HttpError(404, 'Application not found', 'not_found')
  return c.json(repos.applications.upsert({ ...cur, ...(await body(c, ApplicationPatch)) }))
})

// ---- Dev utilities ----
data.post('/reset', (c) => {
  if (config.isProd) throw new HttpError(403, 'Disabled in production', 'forbidden')
  resetSeed()
  return c.json({ ok: true })
})
