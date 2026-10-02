/**
 * DEMO / SEED DATA — fictional persona and fictional companies.
 * Nothing here is real user or market data. All derived metrics in the app
 * are computed from these rows, so replacing this file with real data
 * (or a loader) changes every chart.
 */
import { ApplicationSchema, CareerPathSchema, OpportunitySchema, ProfileSchema, ExperimentSchema } from '../types'
import type { Application, CareerPath, Experiment, Opportunity, PathId, Profile, Source } from '../types'

export const DEMO_REF_DATE = '2026-10-02'

export const SKILLS = [
  'Python', 'SQL', 'Statistics', 'Machine Learning', 'Data Visualization', 'Excel', 'Communication',
  'Experimentation', 'Product Sense', 'Software Engineering', 'System Design', 'Cloud', 'Production Deployment',
] as const

export const demoProfile: Profile = ProfileSchema.parse({
  name: 'Alex Rivera',
  school: 'Demo State University',
  major: 'B.S. Statistics, minor in Computer Science',
  gradYear: 2027,
  targetPathIds: ['ds', 'mle', 'da'],
  skills: {
    Python: 4, SQL: 4, Statistics: 3, 'Machine Learning': 3, 'Data Visualization': 3, Excel: 3, Communication: 4,
    Experimentation: 2, 'Product Sense': 2, 'Software Engineering': 3, 'System Design': 1, Cloud: 1, 'Production Deployment': 1,
  },
  coursework: ['Machine Learning', 'Regression Analysis', 'Database Systems', 'Data Structures', 'Probability Theory'],
  projects: [
    { name: 'Housing price model', summary: 'Gradient-boosted regression on public housing data, notebook only.', skills: ['Python', 'Machine Learning', 'Statistics'], deployed: false },
    { name: 'Campus dining dashboard', summary: 'SQL + Tableau dashboard for a student org.', skills: ['SQL', 'Data Visualization'], deployed: true },
    { name: 'Course-project text classifier', summary: 'Sentiment classifier for a class assignment.', skills: ['Python', 'Machine Learning'], deployed: false },
  ],
  experience: [
    { org: 'Demo State Athletics', title: 'Student Analytics Assistant', summary: 'Built weekly reports in SQL/Excel for coaching staff.' },
    { org: 'Teaching Assistant, Stats 201', title: 'Teaching Assistant', summary: 'Ran weekly labs for ~40 students.' },
  ],
})

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

// [company, role, path, source, resume, daysAgo, reached, outcome]
type Row = [string, string, PathId, Source, 'v1 General' | 'v2 Data-focused', number, number, 'pending' | 'rejected' | 'offer']
const LI: Source = 'LinkedIn Easy Apply', CS: Source = 'Company site', CF: Source = 'Career fair', RF: Source = 'Referral', CE: Source = 'Cold email'
const V1 = 'v1 General', V2 = 'v2 Data-focused'

const rows: Row[] = [
  // LinkedIn Easy Apply — v1 (14 apps, 0 responses)
  ['Northwind Labs', 'ML Engineer I', 'mle', LI, V1, 44, 0, 'rejected'],
  ['Helio Systems', 'Machine Learning Engineer', 'mle', LI, V1, 43, 0, 'rejected'],
  ['Brightpath AI', 'ML Engineer, New Grad', 'mle', LI, V1, 41, 0, 'rejected'],
  ['Cobalt Robotics', 'ML Engineer', 'mle', LI, V1, 38, 0, 'rejected'],
  ['Quanta Cloud', 'Applied ML Engineer', 'mle', LI, V1, 36, 0, 'pending'],
  ['Fernbank Software', 'Software Engineer I', 'swe', LI, V1, 40, 0, 'rejected'],
  ['Lattice Works', 'Associate Software Engineer', 'swe', LI, V1, 35, 0, 'rejected'],
  ['Orbit Commerce', 'Software Engineer, New Grad', 'swe', LI, V1, 33, 0, 'pending'],
  ['Pinecrest Health', 'Backend Engineer I', 'swe', LI, V1, 30, 0, 'pending'],
  ['Marlow Retail', 'Data Scientist I', 'ds', LI, V1, 34, 0, 'rejected'],
  ['Sable Logistics', 'Junior Data Scientist', 'ds', LI, V1, 29, 0, 'pending'],
  ['Tidewater Energy', 'Data Scientist, New Grad', 'ds', LI, V1, 27, 0, 'pending'],
  ['Juniper Bank', 'Data Analyst', 'da', LI, V1, 31, 0, 'rejected'],
  ['Aster Media', 'Junior Data Analyst', 'da', LI, V1, 26, 0, 'pending'],
  // LinkedIn Easy Apply — v2 (6 apps, 1 response)
  ['Verdant Foods', 'Data Scientist I', 'ds', LI, V2, 22, 1, 'rejected'],
  ['Ironleaf Analytics', 'Associate Data Scientist', 'ds', LI, V2, 20, 0, 'pending'],
  ['Zephyr Mobility', 'Product Analyst', 'pa', LI, V2, 19, 0, 'pending'],
  ['Kestrel Edge', 'ML Engineer I', 'mle', LI, V2, 18, 0, 'pending'],
  ['Birchline Software', 'Software Engineer I', 'swe', LI, V2, 16, 0, 'pending'],
  ['Opal Insights', 'Data Analyst', 'da', LI, V2, 14, 0, 'pending'],
  // Company site — v1 (8 apps, 1 response)
  ['Meridian Group', 'Business Data Analyst', 'da', CS, V1, 42, 1, 'rejected'],
  ['Acadia Partners', 'Data Analyst', 'da', CS, V1, 37, 0, 'rejected'],
  ['Westbrook Labs', 'Data Analyst I', 'da', CS, V1, 32, 0, 'pending'],
  ['Evergreen Tech', 'Data Scientist I', 'ds', CS, V1, 28, 0, 'pending'],
  ['Solstice Health', 'Associate Data Scientist', 'ds', CS, V1, 25, 0, 'pending'],
  ['Granite Software', 'Software Engineer I', 'swe', CS, V1, 24, 0, 'pending'],
  ['Redwood Systems', 'Software Engineer, New Grad', 'swe', CS, V1, 23, 0, 'pending'],
  ['Plover Commerce', 'Product Analyst', 'pa', CS, V1, 21, 0, 'pending'],
  // Company site — v2 (4 apps, 1 response)
  ['Harbor Analytics', 'Data Scientist, New Grad', 'ds', CS, V2, 17, 2, 'rejected'],
  ['Lumen Retail', 'Data Scientist I', 'ds', CS, V2, 13, 0, 'pending'],
  ['Foxglove Insurance', 'Data Analyst', 'da', CS, V2, 11, 0, 'pending'],
  ['Cinder Games', 'Product Analyst', 'pa', CS, V2, 9, 0, 'pending'],
  // Career fair — v1 (2 apps, 1 response)
  ['Ridgeway Software', 'Software Engineer I', 'swe', CF, V1, 39, 1, 'rejected'],
  ['Alder Systems', 'Software Engineer, New Grad', 'swe', CF, V1, 39, 0, 'rejected'],
  // Career fair — v2 (3 apps, 2 responses)
  ['Summit Analytics', 'Data Analyst', 'da', CF, V2, 15, 3, 'pending'],
  ['Larkspur Media', 'Product Analyst', 'pa', CF, V2, 15, 2, 'pending'],
  ['Basalt Energy', 'Data Scientist I', 'ds', CF, V2, 15, 0, 'rejected'],
  // Referral — v2 (4 apps, 3 responses)
  ['Cardinal Health Tech', 'Data Scientist I', 'ds', RF, V2, 12, 2, 'rejected'],
  ['Windmere Labs', 'Data Analyst', 'da', RF, V2, 10, 2, 'pending'],
  ['Tamarack Software', 'Product Analyst', 'pa', RF, V2, 8, 3, 'pending'],
  ['Prairie Data Co', 'Data Scientist, New Grad', 'ds', RF, V2, 6, 0, 'pending'],
  // Cold email — v1 (3 apps, 0 responses)
  ['Cascade Robotics', 'ML Engineer Intern→FT', 'mle', CE, V1, 45, 0, 'rejected'],
  ['Mosaic Analytics', 'Data Scientist I', 'ds', CE, V1, 40, 0, 'rejected'],
  ['Thistle Software', 'Software Engineer I', 'swe', CE, V1, 36, 0, 'rejected'],
]

const addDays = (iso: string, d: number) => new Date(new Date(iso + 'T00:00:00Z').getTime() - d * 864e5).toISOString().slice(0, 10)

export const demoApplications: Application[] = rows.map(([company, role, pathId, source, resume, daysAgo, reached, outcome], i) =>
  ApplicationSchema.parse({ id: `a${i + 1}`, company, role, pathId, source, resume, appliedOn: addDays(DEMO_REF_DATE, daysAgo), reached, outcome }),
)

const o = (id: string, company: string, title: string, pathId: PathId, location: string, postedDaysAgo: number, reqs: [string, number, number][]): Opportunity =>
  OpportunitySchema.parse({ id, company, title, pathId, location, postedDaysAgo, requirements: reqs.map(([s, l, w]) => r(s, l, w)) })

export const demoOpportunities: Opportunity[] = [
  o('o1', 'Bluefin Analytics', 'Data Analyst, New Grad', 'da', 'Remote (US)', 2, [['SQL', 4, 3], ['Data Visualization', 3, 2], ['Communication', 3, 2], ['Statistics', 3, 1]]),
  o('o2', 'Ashford Health', 'Associate Data Scientist', 'ds', 'Chicago, IL', 3, [['Python', 4, 3], ['Statistics', 4, 3], ['Machine Learning', 3, 2], ['SQL', 3, 2]]),
  o('o3', 'Crescent Commerce', 'Product Analyst I', 'pa', 'Austin, TX', 4, [['SQL', 4, 3], ['Experimentation', 3, 3], ['Product Sense', 3, 2], ['Communication', 4, 1]]),
  o('o4', 'Delta Ridge', 'Data Scientist, Experimentation', 'ds', 'Remote (US)', 5, [['Statistics', 4, 3], ['Experimentation', 4, 3], ['Python', 4, 2], ['SQL', 4, 2]]),
  o('o5', 'Eastgate Robotics', 'ML Engineer, New Grad', 'mle', 'Boston, MA', 6, [['Python', 4, 3], ['Machine Learning', 4, 3], ['Production Deployment', 3, 3], ['Cloud', 3, 2]]),
  o('o6', 'Finch & Co', 'Business Intelligence Analyst', 'da', 'Denver, CO', 6, [['SQL', 4, 3], ['Data Visualization', 4, 3], ['Excel', 3, 1], ['Communication', 4, 2]]),
  o('o7', 'Glacier Systems', 'Applied ML Engineer', 'mle', 'Seattle, WA', 8, [['Machine Learning', 4, 3], ['Cloud', 4, 3], ['Production Deployment', 4, 3], ['Software Engineering', 4, 2]]),
  o('o8', 'Hollis Software', 'Software Engineer I', 'swe', 'Remote (US)', 9, [['Software Engineering', 4, 3], ['System Design', 3, 2], ['Python', 3, 2]]),
  o('o9', 'Indigo Media', 'Growth Data Analyst', 'pa', 'New York, NY', 10, [['SQL', 4, 3], ['Experimentation', 3, 2], ['Data Visualization', 3, 2], ['Product Sense', 3, 2]]),
  o('o10', 'Juniper Labs', 'Data Scientist I', 'ds', 'Salt Lake City, UT', 12, [['Python', 4, 3], ['Machine Learning', 3, 3], ['Statistics', 3, 2], ['Cloud', 2, 1]]),
]

export const demoExperiments: Experiment[] = [
  {
    id: 'e-seed-1', title: 'Tailor resume headline to the job description',
    hypothesis: 'Mirroring the posting’s top 3 keywords in the resume summary raises recruiter response.',
    change: 'Rewrite summary per posting for company-site applications.', metric: 'Response rate (responded ÷ applied)',
    targetN: 12, status: 'completed', origin: 'demo-seed', control: { n: 8, responses: 1 }, variant: { n: 4, responses: 1 },
  },
  {
    id: 'e-seed-2', title: 'Attend one career fair per month',
    hypothesis: 'In-person contact converts to recruiter responses more than online applications.',
    change: 'Attend fair, follow up within 48 hours, apply with v2 resume.', metric: 'Response rate by source',
    targetN: 10, status: 'running', origin: 'demo-seed', control: { n: 20, responses: 1 }, variant: { n: 5, responses: 3 },
  },
].map((e) => ExperimentSchema.parse(e))
