/** Derive the UI view shapes (types.ts) from the normalized tables (model.ts). */
import { ApplicationSchema, ExperimentSchema, OpportunitySchema, ProfileSchema } from '../types'
import type { Application as AppView, Experiment as ExpView, Opportunity, PathId, Profile, Source } from '../types'
import type { Db } from '../model'
import { DEMO_REF_DATE } from './demoDb'

const PATH_TITLES: Record<PathId, string> = { da: 'data analyst', ds: 'data scientist', mle: 'ml engineer', swe: 'software engineer', pa: 'product analyst' }

/** Jobs carry no explicit career path; infer it from the title. */
export function pathForTitle(title: string): PathId {
  if (/ml engineer|machine learning/i.test(title)) return 'mle'
  if (/product analyst|growth/i.test(title)) return 'pa'
  if (/data scientist/i.test(title)) return 'ds'
  if (/analyst|business intelligence/i.test(title)) return 'da'
  return 'swe'
}

const SOURCE: Record<string, Source> = { easy_apply: 'LinkedIn Easy Apply', company_site: 'Company site', career_fair: 'Career fair', cold_email: 'Cold email', warm_intro: 'Referral' }
const STAGE = ['applied', 'screen', 'interview', 'final', 'offer']

export function toProfile(db: Db, userId: string): Profile {
  const user = db.users.find((u) => u.id === userId)!
  const mine = db.experiences.filter((e) => e.userId === userId)
  return ProfileSchema.parse({
    name: user.name, school: user.school, major: user.major, gradYear: user.gradYear,
    targetPathIds: user.interests.flatMap((i) => (Object.keys(PATH_TITLES) as PathId[]).filter((p) => PATH_TITLES[p] === i.toLowerCase())),
    skills: Object.fromEntries(db.skills.filter((s) => s.userId === userId).map((s) => [s.name, s.level])),
    coursework: mine.filter((e) => e.kind === 'coursework').map((e) => e.title),
    projects: mine.filter((e) => e.kind === 'project').map((e) => ({ name: e.title, summary: e.description, skills: e.skills, deployed: e.evidence.some((x) => /deployed/i.test(x)) })),
    experience: mine.filter((e) => e.kind === 'work' || e.kind === 'teaching').map((e) => ({ org: e.organization, title: e.title, summary: e.description })),
  })
}

export function toApplications(db: Db, userId: string): AppView[] {
  return db.applications.filter((a) => a.userId === userId).map((a) => {
    const job = db.jobs.find((j) => j.id === a.jobId)!
    return ApplicationSchema.parse({
      id: a.id, company: job.company, role: job.title, pathId: pathForTitle(job.title),
      source: a.referral ? 'Referral' : SOURCE[a.strategy], resume: a.resumeVersion, appliedOn: a.date,
      reached: STAGE.indexOf(a.status), outcome: a.outcome,
    })
  })
}

/** Jobs the user has not applied to. Required skills map to level 4 / weight 3, preferred to level 3 / weight 1. */
export function toOpportunities(db: Db, userId: string): Opportunity[] {
  const applied = new Set(db.applications.filter((a) => a.userId === userId).map((a) => a.jobId))
  const ref = new Date(DEMO_REF_DATE).getTime()
  return db.jobs.filter((j) => !applied.has(j.id)).map((j) =>
    OpportunitySchema.parse({
      id: j.id, company: j.company, title: j.title, pathId: pathForTitle(j.title), location: j.location ?? 'Unspecified',
      postedDaysAgo: j.postedOn ? Math.round((ref - new Date(j.postedOn).getTime()) / 864e5) : 0,
      requirements: [
        ...j.requiredSkills.map((skill) => ({ skill, level: 4, weight: 3 })),
        ...j.preferredSkills.map((skill) => ({ skill, level: 3, weight: 1 })),
      ],
    }),
  )
}

export function toExperiments(db: Db, userId: string): ExpView[] {
  return db.experiments.filter((e) => e.userId === userId).map((e) =>
    ExperimentSchema.parse({
      id: `e-seed-${e.id}`, title: e.title, hypothesis: e.hypothesis, change: e.change,
      metric: 'Response rate (responded ÷ applied)', targetN: e.sampleSize, status: e.status, origin: 'demo-seed',
      control: e.result?.control, variant: e.result?.variant,
    }),
  )
}
