/**
 * DEMO / SEED DATA — fictional persona ("Alex Rivera") and fictional companies.
 * Nothing here is real user or market data. Tables follow src/model.ts; every
 * dashboard metric is derived from these rows via data/selectors.ts.
 */
import { DbSchema } from '../model'
import type { Application, Db, Experience, Job, Skill } from '../model'

export const DEMO_REF_DATE = '2026-10-02'
export const DEMO_USER_ID = 'u_demo'

const addDays = (iso: string, d: number) => new Date(new Date(iso + 'T00:00:00Z').getTime() - d * 864e5).toISOString().slice(0, 10)

// ---------- User ----------
const users: Db['users'] = [{
  id: DEMO_USER_ID,
  name: 'Alex Rivera',
  school: 'Demo State University',
  major: 'B.S. Statistics, minor in Computer Science',
  gradYear: 2027,
  resume: { versions: [
    { label: 'v1 General', focus: 'Broad: coursework, TA role, all projects' },
    { label: 'v2 Data-focused', focus: 'Leads with SQL/Python projects and analytics assistant impact' },
  ] },
  interests: ['Data Scientist', 'ML Engineer', 'Data Analyst'],
}]

// ---------- Skills (self-rated, 0–5) ----------
const sk = (name: string, level: number, evidence: string[]): Skill => ({ id: `s_${name.toLowerCase().replace(/\W+/g, '_')}`, userId: DEMO_USER_ID, name, level, evidence })
const skills: Skill[] = [
  sk('Python', 4, ['Housing price model', 'Text classifier', 'Stats 201 lab materials']),
  sk('SQL', 4, ['Weekly athletics reports', 'Campus dining dashboard', 'Database Systems course']),
  sk('Statistics', 3, ['B.S. Statistics coursework', 'Teaching Assistant, Stats 201']),
  sk('Machine Learning', 3, ['ML course', 'Housing price model (gradient boosting)']),
  sk('Data Visualization', 3, ['Campus dining dashboard (Tableau)']),
  sk('Excel', 3, ['Athletics reporting workbooks']),
  sk('Communication', 4, ['Ran weekly labs for ~40 students', 'Presented weekly reports to coaching staff']),
  sk('Experimentation', 2, ['Regression coursework; no live A/B tests yet']),
  sk('Product Sense', 2, []),
  sk('Software Engineering', 3, ['Data Structures course', 'Git-based class projects']),
  sk('System Design', 1, []),
  sk('Cloud', 1, ['Free-tier account created; nothing shipped']),
  sk('Production Deployment', 1, ['Dashboard published; no service deployed']),
]

// ---------- Experience (work, teaching, projects, coursework) ----------
const ex = (n: number, kind: Experience['kind'], title: string, organization: string, description: string, s: string[], evidence: string[]): Experience =>
  ({ id: `x${n}`, userId: DEMO_USER_ID, kind, title, organization, description, skills: s, evidence })
const experiences: Experience[] = [
  ex(1, 'work', 'Student Analytics Assistant', 'Demo State Athletics', 'Built weekly reports in SQL/Excel for coaching staff.', ['SQL', 'Excel', 'Data Visualization', 'Communication'], ['Reports used in weekly staff meetings']),
  ex(2, 'teaching', 'Teaching Assistant', 'Stats 201', 'Ran weekly labs for ~40 students.', ['Statistics', 'Communication'], ['~40 students per lab section']),
  ex(3, 'project', 'Housing price model', 'Personal project', 'Gradient-boosted regression on public housing data, notebook only.', ['Python', 'Machine Learning', 'Statistics'], ['GitHub repo (notebook only)']),
  ex(4, 'project', 'Campus dining dashboard', 'Student org', 'SQL + Tableau dashboard for a student org.', ['SQL', 'Data Visualization'], ['Deployed: public Tableau dashboard used by the org']),
  ex(5, 'project', 'Course-project text classifier', 'Class assignment', 'Sentiment classifier for a class assignment.', ['Python', 'Machine Learning'], ['Graded course submission']),
  ex(6, 'coursework', 'Machine Learning', 'Demo State University', 'Upper-division ML course.', ['Machine Learning', 'Python'], []),
  ex(7, 'coursework', 'Regression Analysis', 'Demo State University', 'Linear and generalized linear models.', ['Statistics'], []),
  ex(8, 'coursework', 'Database Systems', 'Demo State University', 'Relational design and SQL.', ['SQL'], []),
  ex(9, 'coursework', 'Data Structures', 'Demo State University', 'Core algorithms and data structures.', ['Software Engineering'], []),
  ex(10, 'coursework', 'Probability Theory', 'Demo State University', 'Probability foundations for statistics.', ['Statistics'], []),
]

// ---------- Jobs ----------
type Track = 'da' | 'ds' | 'mle' | 'swe' | 'pa'
const TRACKS: Record<Track, { team: string; required: string[]; preferred: string[]; responsibilities: string[] }> = {
  da: { team: 'analytics', required: ['SQL', 'Data Visualization', 'Communication'], preferred: ['Excel', 'Python', 'Statistics'],
    responsibilities: ['Write SQL to answer business questions', 'Build and maintain dashboards', 'Present findings to non-technical stakeholders'] },
  ds: { team: 'data science', required: ['Python', 'Statistics', 'Machine Learning'], preferred: ['SQL', 'Experimentation', 'Cloud'],
    responsibilities: ['Develop and evaluate predictive models', 'Design and analyze experiments', 'Partner with product to turn analyses into decisions'] },
  mle: { team: 'machine learning platform', required: ['Python', 'Machine Learning', 'Production Deployment'], preferred: ['Cloud', 'Software Engineering', 'System Design'],
    responsibilities: ['Train and ship models to production', 'Build monitoring and retraining pipelines', 'Collaborate with data scientists on model serving'] },
  swe: { team: 'engineering', required: ['Software Engineering', 'Python', 'System Design'], preferred: ['Cloud', 'Production Deployment'],
    responsibilities: ['Design, build and test product features', 'Participate in code review and on-call', 'Improve service reliability and performance'] },
  pa: { team: 'product analytics', required: ['SQL', 'Experimentation', 'Product Sense'], preferred: ['Data Visualization', 'Communication', 'Statistics'],
    responsibilities: ['Define and track product metrics', 'Analyze experiments and feature launches', 'Recommend roadmap priorities with data'] },
}
const trackOf = (title: string): Track =>
  /ml engineer|machine learning/i.test(title) ? 'mle'
  : /product analyst|growth/i.test(title) ? 'pa'
  : /data scientist/i.test(title) ? 'ds'
  : /analyst|business intelligence/i.test(title) ? 'da' : 'swe'

const job = (id: string, company: string, title: string, extra: Partial<Job> = {}): Job => {
  const t = TRACKS[trackOf(title)]
  return {
    id, company, title,
    description: `${company} is hiring a ${title} to join its ${t.team} team. You will work with cross-functional partners to turn data and code into decisions and products. New graduates are encouraged to apply.`,
    requiredSkills: t.required, preferredSkills: t.preferred, responsibilities: t.responsibilities, ...extra,
  }
}

// ---------- Applications ----------
type Src = 'LinkedIn Easy Apply' | 'Company site' | 'Career fair' | 'Referral' | 'Cold email'
const LI: Src = 'LinkedIn Easy Apply', CS: Src = 'Company site', CF: Src = 'Career fair', RF: Src = 'Referral', CE: Src = 'Cold email'
const V1 = 'v1 General', V2 = 'v2 Data-focused'
const STRATEGY: Record<Src, Pick<Application, 'strategy' | 'referral'>> = {
  'LinkedIn Easy Apply': { strategy: 'easy_apply', referral: false },
  'Company site': { strategy: 'company_site', referral: false },
  'Career fair': { strategy: 'career_fair', referral: false },
  Referral: { strategy: 'warm_intro', referral: true },
  'Cold email': { strategy: 'cold_email', referral: false },
}
const STATUS = ['applied', 'responded', 'screen', 'interview', 'final', 'offer'] as const

// [company, role, source, resume, daysAgo, stage reached (0 applied … 5 offer), outcome]
type Row = [string, string, Src, string, number, number, Application['outcome']]
const rows: Row[] = [
  // LinkedIn Easy Apply — v1 (14 apps, 0 responses)
  ['Northwind Labs', 'ML Engineer I', LI, V1, 44, 0, 'rejected'],
  ['Helio Systems', 'Machine Learning Engineer', LI, V1, 43, 0, 'rejected'],
  ['Brightpath AI', 'ML Engineer, New Grad', LI, V1, 41, 0, 'rejected'],
  ['Cobalt Robotics', 'ML Engineer', LI, V1, 38, 0, 'rejected'],
  ['Quanta Cloud', 'Applied ML Engineer', LI, V1, 36, 0, 'pending'],
  ['Fernbank Software', 'Software Engineer I', LI, V1, 40, 0, 'rejected'],
  ['Lattice Works', 'Associate Software Engineer', LI, V1, 35, 0, 'rejected'],
  ['Orbit Commerce', 'Software Engineer, New Grad', LI, V1, 33, 0, 'pending'],
  ['Pinecrest Health', 'Backend Engineer I', LI, V1, 30, 0, 'pending'],
  ['Marlow Retail', 'Data Scientist I', LI, V1, 34, 0, 'rejected'],
  ['Sable Logistics', 'Junior Data Scientist', LI, V1, 29, 0, 'pending'],
  ['Tidewater Energy', 'Data Scientist, New Grad', LI, V1, 27, 0, 'pending'],
  ['Juniper Bank', 'Data Analyst', LI, V1, 31, 0, 'rejected'],
  ['Aster Media', 'Junior Data Analyst', LI, V1, 26, 0, 'pending'],
  // LinkedIn Easy Apply — v2 (6 apps, 1 response)
  ['Verdant Foods', 'Data Scientist I', LI, V2, 22, 2, 'rejected'],
  ['Ironleaf Analytics', 'Associate Data Scientist', LI, V2, 20, 0, 'pending'],
  ['Zephyr Mobility', 'Product Analyst', LI, V2, 19, 0, 'pending'],
  ['Kestrel Edge', 'ML Engineer I', LI, V2, 18, 0, 'pending'],
  ['Birchline Software', 'Software Engineer I', LI, V2, 16, 0, 'pending'],
  ['Opal Insights', 'Data Analyst', LI, V2, 14, 0, 'pending'],
  // Company site — v1 (8 apps, 1 response)
  ['Meridian Group', 'Business Data Analyst', CS, V1, 42, 1, 'rejected'],
  ['Acadia Partners', 'Data Analyst', CS, V1, 37, 0, 'rejected'],
  ['Westbrook Labs', 'Data Analyst I', CS, V1, 32, 0, 'pending'],
  ['Evergreen Tech', 'Data Scientist I', CS, V1, 28, 0, 'pending'],
  ['Solstice Health', 'Associate Data Scientist', CS, V1, 25, 0, 'pending'],
  ['Granite Software', 'Software Engineer I', CS, V1, 24, 0, 'pending'],
  ['Redwood Systems', 'Software Engineer, New Grad', CS, V1, 23, 0, 'pending'],
  ['Plover Commerce', 'Product Analyst', CS, V1, 21, 0, 'pending'],
  // Company site — v2 (4 apps, 1 response)
  ['Harbor Analytics', 'Data Scientist, New Grad', CS, V2, 17, 3, 'rejected'],
  ['Lumen Retail', 'Data Scientist I', CS, V2, 13, 0, 'pending'],
  ['Foxglove Insurance', 'Data Analyst', CS, V2, 11, 0, 'pending'],
  ['Cinder Games', 'Product Analyst', CS, V2, 9, 0, 'pending'],
  // Career fair — v1 (2 apps, 1 response)
  ['Ridgeway Software', 'Software Engineer I', CF, V1, 39, 1, 'rejected'],
  ['Alder Systems', 'Software Engineer, New Grad', CF, V1, 39, 0, 'rejected'],
  // Career fair — v2 (3 apps, 2 responses)
  ['Summit Analytics', 'Data Analyst', CF, V2, 15, 4, 'pending'],
  ['Larkspur Media', 'Product Analyst', CF, V2, 15, 3, 'pending'],
  ['Basalt Energy', 'Data Scientist I', CF, V2, 15, 0, 'rejected'],
  // Referral — v2 (4 apps, 3 responses)
  ['Cardinal Health Tech', 'Data Scientist I', RF, V2, 12, 3, 'rejected'],
  ['Windmere Labs', 'Data Analyst', RF, V2, 10, 3, 'pending'],
  ['Tamarack Software', 'Product Analyst', RF, V2, 8, 4, 'pending'],
  ['Prairie Data Co', 'Data Scientist, New Grad', RF, V2, 6, 0, 'pending'],
  // Cold email — v1 (3 apps, 0 responses)
  ['Cascade Robotics', 'ML Engineer Intern→FT', CE, V1, 45, 0, 'rejected'],
  ['Mosaic Analytics', 'Data Scientist I', CE, V1, 40, 0, 'rejected'],
  ['Thistle Software', 'Software Engineer I', CE, V1, 36, 0, 'rejected'],
]

const jobs: Job[] = []
const applications: Application[] = rows.map(([company, title, source, resumeVersion, daysAgo, reached, outcome], i) => {
  const jobId = `j${i + 1}`
  jobs.push(job(jobId, company, title))
  return { id: `a${i + 1}`, userId: DEMO_USER_ID, jobId, date: addDays(DEMO_REF_DATE, daysAgo), status: STATUS[reached], resumeVersion, ...STRATEGY[source], outcome }
})

// Open roles the user has not applied to (feed the Opportunities page).
const openRoles: [string, string, string, number, string[], string[]][] = [
  ['Bluefin Analytics', 'Data Analyst, New Grad', 'Remote (US)', 2, ['SQL', 'Data Visualization', 'Communication'], ['Statistics']],
  ['Ashford Health', 'Associate Data Scientist', 'Chicago, IL', 3, ['Python', 'Statistics', 'Machine Learning'], ['SQL']],
  ['Crescent Commerce', 'Product Analyst I', 'Austin, TX', 4, ['SQL', 'Experimentation', 'Product Sense'], ['Communication']],
  ['Delta Ridge', 'Data Scientist, Experimentation', 'Remote (US)', 5, ['Statistics', 'Experimentation', 'Python', 'SQL'], []],
  ['Eastgate Robotics', 'ML Engineer, New Grad', 'Boston, MA', 6, ['Python', 'Machine Learning', 'Production Deployment'], ['Cloud']],
  ['Finch & Co', 'Business Intelligence Analyst', 'Denver, CO', 6, ['SQL', 'Data Visualization', 'Communication'], ['Excel']],
  ['Glacier Systems', 'Applied ML Engineer', 'Seattle, WA', 8, ['Machine Learning', 'Cloud', 'Production Deployment'], ['Software Engineering']],
  ['Hollis Software', 'Software Engineer I', 'Remote (US)', 9, ['Software Engineering', 'System Design'], ['Python']],
  ['Indigo Media', 'Growth Data Analyst', 'New York, NY', 10, ['SQL', 'Experimentation'], ['Data Visualization', 'Product Sense']],
  ['Juniper Labs', 'Data Scientist I', 'Salt Lake City, UT', 12, ['Python', 'Machine Learning', 'Statistics'], ['Cloud']],
]
openRoles.forEach(([company, title, location, posted, required, preferred], i) =>
  jobs.push(job(`j${rows.length + i + 1}`, company, title, { location, postedOn: addDays(DEMO_REF_DATE, posted), requiredSkills: required, preferredSkills: preferred })),
)

// ---------- Experiments ----------
const experiments: Db['experiments'] = [
  {
    id: 'e1', userId: DEMO_USER_ID, title: 'Tailor resume headline to the job description',
    hypothesis: 'Mirroring the posting’s top 3 keywords in the resume summary raises recruiter response.',
    control: 'Generic resume summary', change: 'Rewrite summary per posting for company-site applications.',
    sampleSize: 12, result: { control: { n: 8, responses: 1 }, variant: { n: 4, responses: 1 } }, confidence: 'low', status: 'completed',
  },
  {
    id: 'e2', userId: DEMO_USER_ID, title: 'Attend one career fair per month',
    hypothesis: 'In-person contact converts to recruiter responses more than online applications.',
    control: 'Online-only applications', change: 'Attend fair, follow up within 48 hours, apply with v2 resume.',
    sampleSize: 10, result: { control: { n: 20, responses: 1 }, variant: { n: 5, responses: 3 } }, confidence: 'low', status: 'running',
  },
]

export const demoDb: Db = DbSchema.parse({ users, experiences, skills, jobs, applications, experiments })
