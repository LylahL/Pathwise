/** Derive the UI view shapes (types.ts) from the normalized tables (model.ts). */
import { ApplicationSchema, ExperimentSchema, OpportunitySchema, ProfileSchema } from '../types'
import type { Application as AppView, Experiment as ExpView, Opportunity, PathId, Profile, Source } from '../types'
import type { Db } from '../model'
import type { CandidateInput } from '../ai/candidateSchema'
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
const STAGE = ['applied', 'responded', 'screen', 'interview', 'final', 'offer']

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

/** Minimal job view used for market evidence in AI insights. */
export function toJobSkills(db: Db) {
  return db.jobs.map((j) => ({ pathId: pathForTitle(j.title), skills: [...j.requiredSkills, ...j.preferredSkills] }))
}

/** UI view of one stored experiment. */
export function experimentView(e: Db['experiments'][number]): ExpView {
  return ExperimentSchema.parse({
    id: e.id, chainId: e.chainId, title: e.title, hypothesis: e.hypothesis, change: e.change,
    metric: 'Response rate (responded ÷ applied)', targetN: e.sampleSize, status: e.status, origin: e.origin,
    control: e.result?.control, variant: e.result?.variant,
  })
}

export const toExperiments = (db: Db, userId: string): ExpView[] => db.experiments.filter((e) => e.userId === userId).map(experimentView)

/** Candidate-analysis input for one user. `levels` overrides stored skill levels (e.g. live edits on the Profile page). */
export function toCandidateInput(db: Db, userId: string, levels?: Record<string, number>): CandidateInput {
  const user = db.users.find((u) => u.id === userId)!
  const mine = db.experiences.filter((e) => e.userId === userId)
  const shape = (e: (typeof mine)[number]) => ({ title: e.title, organization: e.organization, description: e.description, skills: e.skills, evidence: e.evidence })
  return {
    resume: user.resume,
    education: { school: user.school, major: user.major, gradYear: user.gradYear, coursework: mine.filter((e) => e.kind === 'coursework').map((e) => e.title) },
    experience: mine.flatMap((e) => (e.kind === 'work' || e.kind === 'teaching' ? [{ ...shape(e), kind: e.kind }] : [])),
    projects: mine.filter((e) => e.kind === 'project').map(shape),
    skills: db.skills.filter((s) => s.userId === userId).map((s) => ({ name: s.name, level: levels?.[s.name] ?? s.level, evidence: s.evidence })),
    interests: user.interests,
  }
}
