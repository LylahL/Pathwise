/**
 * Normalized data model: one table per entity, linked by id.
 * UI-facing view shapes live in types.ts and are derived from these via data/selectors.ts.
 */
import { z } from 'zod'

const id = z.string().min(1)
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const UserSchema = z.object({
  id,
  name: z.string(),
  school: z.string(),
  major: z.string(),
  gradYear: z.number().int(),
  resume: z.object({ versions: z.array(z.object({ label: z.string(), focus: z.string() })).min(1) }),
  interests: z.array(z.string()),
})
export type User = z.infer<typeof UserSchema>

export const ExperienceSchema = z.object({
  id,
  userId: id,
  kind: z.enum(['work', 'teaching', 'project', 'coursework']),
  title: z.string(),
  organization: z.string(),
  description: z.string(),
  skills: z.array(z.string()),
  evidence: z.array(z.string()),
})
export type Experience = z.infer<typeof ExperienceSchema>

export const SkillSchema = z.object({
  id,
  userId: id,
  name: z.string(),
  /** 0 = none · 1 = exposure · 3 = project-proven · 5 = expert (self-rated) */
  level: z.number().min(0).max(5),
  evidence: z.array(z.string()),
})
export type Skill = z.infer<typeof SkillSchema>

export const JobSchema = z.object({
  id,
  company: z.string(),
  title: z.string(),
  description: z.string(),
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()),
  responsibilities: z.array(z.string()),
  location: z.string().optional(),
  postedOn: isoDate.optional(),
})
export type Job = z.infer<typeof JobSchema>

export const ApplicationSchema = z.object({
  id,
  userId: id,
  jobId: id,
  date: isoDate,
  /** Furthest stage reached. */
  status: z.enum(['applied', 'screen', 'interview', 'final', 'offer']),
  resumeVersion: z.string(),
  /** True if a person referred the candidate. */
  referral: z.boolean(),
  /** How the application was submitted. */
  strategy: z.enum(['easy_apply', 'company_site', 'career_fair', 'cold_email', 'warm_intro']),
  outcome: z.enum(['pending', 'rejected', 'offer']),
})
export type Application = z.infer<typeof ApplicationSchema>

const counts = z.object({ n: z.number().int(), responses: z.number().int() })

export const ExperimentSchema = z.object({
  id,
  userId: id,
  title: z.string(),
  hypothesis: z.string(),
  control: z.string(),
  change: z.string(),
  sampleSize: z.number().int().positive(),
  /** Observed counts so far; null until any data exists. */
  result: z.object({ control: counts, variant: counts }).nullable(),
  confidence: z.enum(['low', 'medium', 'high']),
  status: z.enum(['proposed', 'running', 'completed']),
})
export type Experiment = z.infer<typeof ExperimentSchema>

export const DbSchema = z
  .object({
    users: z.array(UserSchema),
    experiences: z.array(ExperienceSchema),
    skills: z.array(SkillSchema),
    jobs: z.array(JobSchema),
    applications: z.array(ApplicationSchema),
    experiments: z.array(ExperimentSchema),
  })
  .superRefine((db, ctx) => {
    const users = new Set(db.users.map((u) => u.id))
    const jobs = new Set(db.jobs.map((j) => j.id))
    const fk = (rows: { id: string; userId?: string; jobId?: string }[], table: string) =>
      rows.forEach((r) => {
        if (r.userId && !users.has(r.userId)) ctx.addIssue({ code: 'custom', message: `${table}.${r.id}: unknown userId ${r.userId}` })
        if (r.jobId && !jobs.has(r.jobId)) ctx.addIssue({ code: 'custom', message: `${table}.${r.id}: unknown jobId ${r.jobId}` })
      })
    fk(db.experiences, 'experiences'); fk(db.skills, 'skills'); fk(db.applications, 'applications'); fk(db.experiments, 'experiments')
  })
export type Db = z.infer<typeof DbSchema>
