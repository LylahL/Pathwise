import { z } from 'zod'

// ---------- Domain data ----------
export const PathIdSchema = z.enum(['da', 'ds', 'mle', 'swe', 'pa'])
export type PathId = z.infer<typeof PathIdSchema>

export const SourceSchema = z.enum(['LinkedIn Easy Apply', 'Company site', 'Career fair', 'Referral', 'Cold email'])
export type Source = z.infer<typeof SourceSchema>

export const ApplicationSchema = z.object({
  id: z.string(),
  company: z.string(),
  role: z.string(),
  pathId: PathIdSchema,
  source: SourceSchema,
  resume: z.enum(['v1 General', 'v2 Data-focused']),
  appliedOn: z.string(), // ISO date
  /** 0 = no response, 1 = responded/screen, 2 = interview, 3 = final round, 4 = offer */
  reached: z.number().int().min(0).max(4),
  outcome: z.enum(['pending', 'rejected', 'offer']),
})
export type Application = z.infer<typeof ApplicationSchema>

export const SkillReqSchema = z.object({ skill: z.string(), level: z.number(), weight: z.number() })
export type SkillReq = z.infer<typeof SkillReqSchema>

export const CareerPathSchema = z.object({
  id: PathIdSchema,
  title: z.string(),
  blurb: z.string(),
  requirements: z.array(SkillReqSchema),
})
export type CareerPath = z.infer<typeof CareerPathSchema>

export const ProfileSchema = z.object({
  name: z.string(),
  school: z.string(),
  major: z.string(),
  gradYear: z.number(),
  targetPathIds: z.array(PathIdSchema),
  skills: z.record(z.string(), z.number().min(0).max(5)),
  projects: z.array(z.object({ name: z.string(), summary: z.string(), skills: z.array(z.string()), deployed: z.boolean() })),
  coursework: z.array(z.string()),
  experience: z.array(z.object({ org: z.string(), title: z.string(), summary: z.string() })),
})
export type Profile = z.infer<typeof ProfileSchema>

export const OpportunitySchema = z.object({
  id: z.string(),
  company: z.string(),
  title: z.string(),
  pathId: PathIdSchema,
  location: z.string(),
  postedDaysAgo: z.number(),
  requirements: z.array(SkillReqSchema),
})
export type Opportunity = z.infer<typeof OpportunitySchema>

export const ExperimentSchema = z.object({
  id: z.string(),
  chainId: z.string().optional(),
  title: z.string(),
  hypothesis: z.string(),
  change: z.string(),
  metric: z.string(),
  targetN: z.number(),
  status: z.enum(['proposed', 'running', 'completed']),
  origin: z.enum(['demo-seed', 'ai-proposed']),
  /** Observed counts; only present once the experiment has data. */
  control: z.object({ n: z.number(), responses: z.number() }).optional(),
  variant: z.object({ n: z.number(), responses: z.number() }).optional(),
})
export type Experiment = z.infer<typeof ExperimentSchema>

// ---------- AI output (validated) ----------
export const InsightChainSchema = z.object({
  id: z.string(),
  area: z.enum(['fit', 'funnel', 'skills']),
  title: z.string(),
  evidence: z.array(z.string()).min(1),
  inference: z.string(),
  gap: z.string(),
  recommendation: z.string(),
  steps: z.array(z.string()).min(1),
  experiment: z.object({
    title: z.string(),
    hypothesis: z.string(),
    change: z.string(),
    metric: z.string(),
    targetN: z.number().int().positive(),
  }),
  confidence: z.enum(['low', 'medium', 'high']),
  confidenceNote: z.string(),
  impact: z.number().min(1).max(5),
  effort: z.number().min(1).max(5),
})
export type InsightChain = z.infer<typeof InsightChainSchema>

export const FunnelDiagnosisSchema = z.object({
  breakpoint: z.string(),
  headline: z.string(),
  transitions: z.array(z.object({ from: z.string(), to: z.string(), n: z.number(), converted: z.number(), rate: z.number() })),
  drivers: z.array(z.string()),
})
export type FunnelDiagnosis = z.infer<typeof FunnelDiagnosisSchema>

export const AIReportSchema = z.object({
  generatedBy: z.enum(['rules-engine', 'llm']),
  chains: z.array(InsightChainSchema),
  diagnosis: FunnelDiagnosisSchema,
  nextBestAction: z.object({ chainId: z.string(), title: z.string(), why: z.string(), steps: z.array(z.string()) }),
})
export type AIReport = z.infer<typeof AIReportSchema>

export interface Snapshot {
  profile: Profile
  applications: Application[]
  paths: CareerPath[]
}
