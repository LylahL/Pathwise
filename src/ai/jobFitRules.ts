/**
 * Deterministic job-fit analysis: extracts requirements from the pasted posting with a keyword vocabulary,
 * scores them, and builds an evidence-based narrative. It is the default path and the fallback for the LLM path.
 * Everything it says is derived from the posting text and the candidate profile.
 */
import { stepFor } from './analyzeRules'
import type { CandidateInput } from './candidateSchema'
import { JobFitAnalysisSchema, JobFitError } from './jobFitSchema'
import type { JobFitAnalysis, JobFitInput } from './jobFitSchema'
import { dedupe, findSkill, scoreRequirements, WEIGHT } from './jobFitScoring'
import type { Requirement, Scored } from './jobFitScoring'

// ---------- Requirement extraction ----------
const VOCAB: [skill: string, pattern: RegExp][] = [
  ['Python', /\bpython\b|\bpandas\b|\bnumpy\b/i],
  ['SQL', /\bsql\b|\bpostgres(ql)?\b|\bmysql\b|\bbigquery\b|\bsnowflake\b|\bredshift\b/i],
  ['Statistics', /\bstatistic(s|al)?\b|\bregression\b|\bhypothesis test|\bprobability\b|\bconfidence interval/i],
  ['Machine Learning', /\bmachine[- ]learning\b|\bscikit|\btensorflow\b|\bpytorch\b|\bdeep learning\b|\bpredictive model|\bml\b/i],
  ['Data Visualization', /\btableau\b|\bpower ?bi\b|\blooker\b|\bdashboards?\b|\bdata viz|\bvisuali[sz]ation/i],
  ['Excel', /\bexcel\b|\bspreadsheets?\b/i],
  ['Communication', /\bcommunicat|\bstakeholders?\b|\bpresent(ing|ations?)?\b|\bstorytelling\b|\bcross-functional\b/i],
  ['Experimentation', /\ba\/b\b|\bab test|\bexperiment(s|ation|ing)?\b|\bcausal inference\b/i],
  ['Product Sense', /\bproduct (sense|thinking|metrics|analytics|intuition)\b|\broadmaps?\b/i],
  ['Software Engineering', /\bsoftware (engineering|development)\b|\bdata structures?\b|\balgorithms?\b|\bunit tests?\b|\bcode review|\bobject[- ]oriented\b|\bversion control\b|\bgit\b/i],
  ['System Design', /\bsystem design\b|\bdistributed systems?\b|\bscalab(le|ility)\b|\bmicroservices?\b|\barchitecture\b/i],
  ['Cloud', /\baws\b|\bazure\b|\bgcp\b|\bgoogle cloud\b|\bcloud\b|\bkubernetes\b|\blambda\b/i],
  ['Production Deployment', /\bproduction\b|\bdeploy(ed|ing|ment|s)?\b|\bmlops\b|\bci\/cd\b|\bcontainer(s|ize|ized|ization)?\b|\bdocker\b|\bmodel serving\b|\bmonitoring\b/i],
]
const PREFERRED_WORDS = /\b(preferred|nice[- ]to[- ]have|a plus|bonus|ideally|desirable|familiarity with|exposure to)\b/i
const PREFERRED_HEADING = /^(preferred|nice[- ]to[- ]have|bonus|desirable|extra|plus)\b/i
const isHeading = (line: string) => line.length < 60 && (/:\s*$/.test(line) || (line === line.toUpperCase() && /[A-Z]/.test(line)) || /^(about|responsibilities|requirements|qualifications|preferred|what you)/i.test(line))
const clean = (line: string) => line.replace(/^[\s\-*•·•\d.)]+/, '').trim().slice(0, 200)

/** Map a posting's wording (e.g. "PostgreSQL", "Kubernetes") to one of the candidate's skill names, if it is equivalent. */
export function canonicalSkill(candidate: CandidateInput, name: string): string | undefined {
  const exact = findSkill(candidate, name)
  if (exact) return exact.name
  return VOCAB.find(([skill, pattern]) => pattern.test(name) && findSkill(candidate, skill))?.[0]
}

export function extractRequirements(description: string): Requirement[] {
  const found: Requirement[] = []
  let section: 'required' | 'preferred' = 'required'
  for (const raw of description.split(/\r?\n/)) {
    const line = clean(raw)
    if (!line) continue
    if (isHeading(line)) { section = PREFERRED_HEADING.test(line) ? 'preferred' : 'required'; continue }
    const importance = section === 'preferred' || PREFERRED_WORDS.test(line) ? 'preferred' : 'required'
    for (const [skill, pattern] of VOCAB) if (pattern.test(line)) found.push({ skill, importance, jobQuote: line })
  }
  return dedupe(found)
}

// ---------- Narrative ----------
const INTERVIEW: Record<string, string> = {
  SQL: 'Practice joins, window functions and aggregation on a realistic schema, and be ready to walk through a query you wrote.',
  Python: 'Practice a small data-manipulation exercise and be ready to explain one project end to end.',
  Statistics: 'Review hypothesis tests, confidence intervals and regression assumptions, and explain a result in plain language.',
  'Machine Learning': 'Be ready to justify model choice, validation and error analysis on one of your projects.',
  'Data Visualization': 'Prepare to critique a chart and explain why you picked a visual for a given question.',
  Excel: 'Be ready to describe a workbook you built: lookups, pivots and who used the output.',
  Communication: 'Prepare a two-minute walkthrough of a project for a non-technical audience.',
  Experimentation: 'Review A/B test design: hypothesis, metric, sample size and common pitfalls such as peeking.',
  'Product Sense': 'Practice defining success metrics for a feature and diagnosing a metric drop.',
  'Software Engineering': 'Practice data-structure and algorithm problems, and be ready to discuss testing and version control.',
  'System Design': 'Practice sketching components and data flow for a simple service and naming the trade-offs.',
  Cloud: 'Be ready to explain what you have run in the cloud and be honest about the depth of that experience.',
  'Production Deployment': 'Be ready to describe how you would take a project to production: packaging, monitoring, rollback.',
}

const list = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`)

export type Narrative = Pick<JobFitAnalysis, 'evidence' | 'concerns' | 'strategy' | 'recommendedActions'>

export function buildNarrative(c: CandidateInput, job: { title: string; company: string; description: string }, reqs: Requirement[], s: Scored): Narrative {
  const quote = (skill: string) => reqs.find((r) => r.skill.toLowerCase() === skill.toLowerCase())?.jobQuote ?? ''
  const weight = (x: { importance: 'required' | 'preferred'; need: number; have: number }) => WEIGHT[x.importance] * (x.need - x.have)
  const gaps = [...s.missingSkills, ...s.partialMatches].sort((a, b) => weight(b) - weight(a))
  const topGap = gaps[0]
  const where = job.company ? ` at ${job.company}` : ''
  const deployed = c.projects.some((p) => p.evidence.some((e) => /deployed/i.test(e)))

  // Why the candidate matches: posting quote paired with candidate evidence.
  const evidence = [...s.matchingSkills, ...s.partialMatches].filter((m) => m.evidence.length).slice(0, 5).map((m) => {
    const q = quote(m.skill)
    return `${q ? `Posting: "${q}" → ` : ''}${m.skill} L${m.have}${m.have < m.need ? ` (partial, posting assumes about L${m.need})` : ''} — ${m.evidence.slice(0, 2).join('; ')}`
  })

  // Concerns, each tied to the posting or the profile.
  const concerns: string[] = []
  for (const g of gaps.filter((x) => x.importance === 'required').slice(0, 3)) {
    concerns.push(`${g.skill} is a requirement ("${quote(g.skill)}"). Your profile shows L${g.have}; the posting seems to assume about L${g.need}.`)
  }
  for (const m of s.matchingSkills.filter((x) => x.evidence.length === 0).slice(0, 2)) {
    concerns.push(`${m.skill} is self-rated L${m.have} with no linked project or role, so it is hard to back up.`)
  }
  if ([...s.missingSkills, ...s.partialMatches].some((g) => ['Production Deployment', 'Cloud'].includes(g.skill)) && !deployed) {
    concerns.push('None of your projects shows a deployment, which this posting touches on.')
  }
  const years = Math.max(0, ...[...job.description.matchAll(/\b(\d{1,2})\s*\+?\s*(?:-\s*\d{1,2}\s*)?years?\b/gi)].map((m) => Number(m[1])))
  if (years >= 3) concerns.push(`The posting mentions ${years}+ years of experience, which is above a typical early-career profile; check whether the level is a fit.`)
  if (/\b(senior|staff|principal)\b/i.test(job.title || job.description.slice(0, 120))) concerns.push('The title suggests a senior-level role, which may not match an early-career profile.')
  if (reqs.length < 3) concerns.push(`Only ${reqs.length} requirement${reqs.length === 1 ? '' : 's'} could be detected; paste the full posting for a more reliable comparison.`)

  // Strategy
  const strongest = s.matchingSkills.filter((m) => m.importance === 'required').slice(0, 3)
  const firstName = (m: { skill: string; evidence: string[] }) => `${m.skill}${m.evidence[0] ? ` (${m.evidence[0]})` : ''}`
  const words = (v: { focus: string }) => s.matchingSkills.concat(s.partialMatches).filter((m) => v.focus.toLowerCase().includes(m.skill.toLowerCase())).length
  const version = [...c.resume.versions].sort((a, b) => words(b) - words(a))[0]
  const unsupported = s.missingSkills.map((m) => m.skill)

  const resume = [
    strongest.length ? `Lead with what the posting asks for and you can prove: ${list(strongest.map(firstName))}.` : 'None of the posting\'s required skills is yet backed by evidence in your profile; lead with your strongest projects and say what you are building toward.',
    version && words(version) > 0 ? `Start from your "${version.label}" resume (${version.focus}); it overlaps most with this posting.` : 'Use the resume version that best matches the posting and mirror its wording only where it is true.',
    ...(unsupported.length ? [`Do not list ${list(unsupported)} unless you can point to something real; adjacent evidence or an in-progress project is more credible.`] : []),
  ]
  const portfolio = gaps.slice(0, 2).map((g) => `${g.skill}: ${stepFor(g.skill)}. Aim for a link, a README and one measurable result.`)
  if (portfolio.length === 0) portfolio.push('No project gap detected against the stated requirements; make sure your strongest project has a clear README and a link.')
  const networking = [
    `Find two or three people${where} in similar roles, or alumni of ${c.education.school}, and ask for a 15-minute conversation about the work.`,
    topGap ? `Ask how much ${topGap.skill} the role really uses day to day; the posting alone cannot tell you.` : 'Ask what the team values most beyond the listed skills.',
    'Ask about a referral only after a real conversation, not in the first message.',
  ]
  const interview = [...new Set([...s.matchingSkills, ...s.partialMatches, ...s.missingSkills].filter((x) => x.importance === 'required').map((x) => x.skill))]
    .slice(0, 5).map((skill) => INTERVIEW[skill] ? `${skill}: ${INTERVIEW[skill]}` : `${skill}: prepare one concrete example.`)

  const recommendedActions = [
    topGap
      ? { title: `Close the ${topGap.skill} gap with one visible piece of work`, rationale: `${topGap.skill} is ${topGap.importance === 'required' ? 'a requirement' : 'listed as preferred'} in this posting and your profile shows L${topGap.have} (about L${topGap.need} assumed). ${stepFor(topGap.skill)}.`, priority: 1 }
      : { title: 'Tailor your resume and apply', rationale: 'Every detected requirement is met or close on your profile, so the remaining lever is how clearly your resume shows it.', priority: 1 },
    { title: 'Tailor your resume to this posting', rationale: `${s.matchingSkills.length} of ${reqs.length} detected requirements are met at the assumed level.`, priority: 2 },
    { title: `Start a conversation${where || ' with someone in this role'}`, rationale: 'A short conversation tells you what the role really needs, which a posting cannot.', priority: 3 },
  ]
  return { evidence, concerns, strategy: { resume, portfolio, networking, interview }, recommendedActions }
}

// ---------- Rules entry point ----------
export function analyzeJobFitWithRules(input: JobFitInput): JobFitAnalysis {
  const { candidate, job } = input
  const requirements = extractRequirements(job.description)
  if (requirements.length === 0) {
    throw new JobFitError('No recognizable skill requirements were found. Paste the full job description, including the requirements section.')
  }
  const scored = scoreRequirements(candidate, requirements)
  const title = job.title.trim() || (() => { const l = clean(job.description.split(/\r?\n/).find((x) => x.trim()) ?? ''); return l.length > 0 && l.length <= 90 && !isHeading(l) ? l : 'Untitled role' })()
  const meta = { title, company: job.company.trim() }
  return JobFitAnalysisSchema.parse({
    generatedBy: 'rules-engine', job: meta, requirements, ...scored,
    ...buildNarrative(candidate, { ...meta, description: job.description }, requirements, scored),
  })
}

