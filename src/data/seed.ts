/**
 * DEMO / SEED DATA — see demoDb.ts for the normalized tables (fictional persona and companies).
 * This module exposes them in the shapes the UI consumes, plus static career-path templates.
 */
import { CareerPathSchema } from '../types'
import type { CareerPath } from '../types'
import { DEMO_REF_DATE, DEMO_USER_ID, demoDb } from './demoDb'
import { toApplications, toExperiments, toOpportunities, toProfile } from './selectors'

export { DEMO_REF_DATE, DEMO_USER_ID, demoDb }

export const SKILLS = demoDb.skills.map((s) => s.name)

export const demoProfile = toProfile(demoDb, DEMO_USER_ID)
export const demoApplications = toApplications(demoDb, DEMO_USER_ID)
export const demoOpportunities = toOpportunities(demoDb, DEMO_USER_ID)
export const demoExperiments = toExperiments(demoDb, DEMO_USER_ID)

const r = (skill: string, level: number, weight: number) => ({ skill, level, weight })

export const careerPaths: CareerPath[] = [
  {
    id: 'da', title: 'Data Analyst', blurb: 'Turn business questions into SQL, dashboards and recommendations.',
    requirements: [r('SQL', 4, 3), r('Data Visualization', 4, 2), r('Statistics', 3, 2), r('Communication', 4, 2), r('Excel', 3, 1), r('Python', 3, 1)],
  },
  {
    id: 'ds', title: 'Data Scientist', blurb: 'Model, experiment and ship analyses that change product decisions.',
    requirements: [r('Python', 4, 3), r('Statistics', 4, 3), r('Machine Learning', 3, 3), r('SQL', 3, 2), r('Experimentation', 3, 2), r('Communication', 3, 1), r('Cloud', 2, 1)],
  },
  {
    id: 'mle', title: 'ML Engineer', blurb: 'Build and operate machine-learning systems in production.',
    requirements: [r('Python', 4, 3), r('Machine Learning', 4, 3), r('Production Deployment', 4, 3), r('Cloud', 3, 3), r('Software Engineering', 4, 2), r('System Design', 3, 2)],
  },
  {
    id: 'swe', title: 'Software Engineer', blurb: 'Design, build and ship software products.',
    requirements: [r('Software Engineering', 4, 3), r('System Design', 3, 3), r('Python', 4, 2), r('Production Deployment', 3, 2), r('Cloud', 2, 1)],
  },
  {
    id: 'pa', title: 'Product Analyst', blurb: 'Measure product behaviour and guide roadmap decisions.',
    requirements: [r('SQL', 4, 3), r('Product Sense', 3, 3), r('Experimentation', 3, 2), r('Data Visualization', 3, 2), r('Communication', 4, 2), r('Statistics', 3, 1)],
  },
].map((p) => CareerPathSchema.parse(p))
