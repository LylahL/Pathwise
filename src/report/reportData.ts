/**
 * Everything the PDF report shows, as plain data. Built from the same values the dashboard uses, so the two cannot
 * drift apart. No React here: it is unit-testable and the renderer stays dumb.
 */
import type { CandidateAnalysis } from '../ai/candidateSchema'
import { FIT_PATH_IDS, funnelCounts, pct, RESPONSE_RATE_TARGET, readiness as readinessFn, rankPaths, segmentBy, skillStanding, summary as summaryFn, tier, weekly } from '../lib/analytics'
import { headlineParts } from '../lib/headline'
import type { HeadlinePart } from '../lib/headline'
import type { AIReport, Application, CareerPath, Experiment, Profile } from '../types'

export interface ReportInput {
  profile: Profile
  applications: Application[]
  summary: ReturnType<typeof summaryFn>
  readiness: ReturnType<typeof readinessFn>
  ranked: ReturnType<typeof rankPaths>
  report: AIReport
  /** Optional: richer career-fit evidence when the analysis has finished. Falls back to the rules-derived ranking. */
  analysis?: CandidateAnalysis
  experiments: Experiment[]
  paths: CareerPath[]
  isDemo: boolean
  generatedAt: Date
}

export interface ReportData {
  fileName: string
  title: string
  meta: { name: string; subtitle: string; generated: string; isDemo: boolean; source: string }
  headline: HeadlinePart[]
  kpis: { label: string; value: string; sub: string; tone: 'indigo' | 'sky' | 'good' | 'warn' | 'bad' }[]
  readiness: { score: number; parts: { label: string; value: number }[] }
  fit: { title: string; score: number; tier: string; strengths: string[]; gaps: string[]; applied: number; replies: number }[]
  skills: { strongest: SkillRow[]; weakest: SkillRow[] }
  funnel: { stage: string; count: number; widthPct: number; lost?: number; movedOnPct?: number; isBreak: boolean }[]
  diagnosis: string
  channels: { label: string; pct: number; responded: number; n: number; lowSample: boolean }[]
  weekly: { week: string; applied: number; responded: number }[]
  nba?: { title: string; detail: string; steps: string[]; reasons: string[]; impact?: number; effort?: number }
  insights: { title: string; area: string; evidence: string[]; inference: string; gap: string; recommendation: string; confidence: string }[]
  experiments: { title: string; status: string; hypothesis: string; before?: { pct: number; label: string }; after?: { pct: number; label: string } }[]
  notes: string[]
}
interface SkillRow { skill: string; have: number; need: number }

/**
 * The PDF uses built-in Helvetica, which has no glyphs for arrows, check marks and the like. Map the few we use and
 * drop anything else outside Latin-1 so a missing glyph can never print as garbage.
 */
export function pdfText(s: string): string {
  return s
    .replace(/\s*→\s*/g, ' to ').replace(/↓|✓|✕|✗/g, '').replace(/≥/g, '>=').replace(/≤/g, '<=').replace(/↔/g, ' and ')
    // eslint-disable-next-line no-control-regex
    .replace(/[^ -~ -ÿ–—‘’“”•…]/g, '')
    // Collapse runs of spaces but keep edge spaces: headline segments rely on them to join into one sentence.
    .replace(/ {2,}/g, ' ')
}

const MIN_SAMPLE = 8
const trunc = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s)
const dateLabel = (d: Date) => d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
const fileDate = (d: Date) => d.toISOString().slice(0, 10)

export function buildReportData(i: ReportInput): ReportData {
  const { profile, applications, summary, readiness, ranked, report, analysis, experiments, paths } = i
  const top = ranked[0]
  const drop = report.diagnosis.transitions.find((t) => `${t.from} → ${t.to}` === report.diagnosis.breakpoint)
  const rateTone = summary.responseRate >= RESPONSE_RATE_TARGET ? 'good' : summary.responseRate >= RESPONSE_RATE_TARGET / 2 ? 'warn' : 'bad'
  const nba = report.nextBestAction
  const source = (analysis?.generatedBy ?? report.generatedBy) === 'llm' ? 'AI model (scores and counts computed by the app)' : 'Built-in rules engine'

  // Career fit: prefer the analysis (evidence text), but scores are always the app's own.
  const fitFromAnalysis = (analysis?.careerPaths ?? []).filter((p) => FIT_PATH_IDS.includes(p.pathId))
  const fit = (fitFromAnalysis.length
    ? fitFromAnalysis.map((p) => ({ id: p.pathId, title: p.title, score: p.fitScore, strengths: p.evidence.slice(0, 3).map((e) => e.split(' — ')[0]), gaps: p.missingSkills.slice(0, 3).map((m) => m.skill) }))
    : ranked.filter((r) => FIT_PATH_IDS.includes(r.path.id)).map((r) => ({ id: r.path.id as string, title: r.path.title, score: r.score, strengths: r.strengths.slice(0, 3).map((s) => `${s.skill} L${s.have}`), gaps: r.gaps.slice(0, 3).map((g) => g.skill) }))
  ).sort((a, b) => b.score - a.score).map((p) => {
    const mine = ranked.find((r) => r.path.id === p.id)
    return { title: p.title, score: p.score, tier: tier(p.score), strengths: p.strengths, gaps: p.gaps, applied: mine?.applications ?? 0, replies: mine?.responded ?? 0 }
  })

  const counts = funnelCounts(applications)
  const topCount = counts[0].count || 1
  const funnel = counts.map((c, idx) => {
    const prev = counts[idx - 1]
    return {
      stage: c.stage, count: c.count, widthPct: Math.max((c.count / topCount) * 100, c.count ? 2 : 0),
      lost: prev ? prev.count - c.count : undefined, movedOnPct: prev && prev.count ? Math.round((c.count / prev.count) * 100) : undefined,
      isBreak: Boolean(prev) && report.diagnosis.breakpoint === `${prev.stage} → ${c.stage}`,
    }
  })

  const standing = skillStanding(profile, paths.filter((p) => FIT_PATH_IDS.includes(p.id)))
  const row = (s: { skill: string; have: number; need: number }) => ({ skill: s.skill, have: s.have, need: s.need })
  const exp = experiments.slice(0, 5).map((e) => ({
    title: e.title, status: e.status === 'proposed' ? 'AI proposed' : e.status, hypothesis: trunc(e.hypothesis, 150),
    before: e.control && e.control.n ? { pct: Math.round((e.control.responses / e.control.n) * 100), label: `${e.control.responses}/${e.control.n}` } : undefined,
    after: e.variant && e.variant.n ? { pct: Math.round((e.variant.responses / e.variant.n) * 100), label: `${e.variant.responses}/${e.variant.n}` } : undefined,
  }))

  const data: ReportData = {
    fileName: `Pathwise-report-${profile.name.replace(/\s+/g, '-')}-${fileDate(i.generatedAt)}.pdf`,
    title: `Career intelligence report: ${profile.name}`,
    meta: { name: profile.name, subtitle: `${profile.major} · ${profile.school} · Class of ${profile.gradYear}`, generated: dateLabel(i.generatedAt), isDemo: i.isDemo, source },
    headline: headlineParts({ title: top.path.title, score: top.score }, drop, nba.title),
    kpis: [
      { label: 'Career readiness', value: `${readiness.score}/100`, sub: 'fit, response rate and projects combined', tone: readiness.score >= 75 ? 'good' : readiness.score >= 50 ? 'indigo' : 'warn' },
      { label: 'Applications', value: String(summary.applications), sub: applications.length ? `since ${applications.map((a) => a.appliedOn).sort()[0]}` : 'none logged', tone: 'sky' },
      { label: 'Response rate', value: applications.length ? pct(summary.responseRate, 1) : '-', sub: `${summary.responses} of ${summary.applications} replied`, tone: rateTone },
      { label: 'Interviews', value: String(summary.interviews), sub: `${summary.screens} screens · ${summary.finals} finals · ${summary.offers} offers`, tone: 'good' },
    ],
    readiness: { score: readiness.score, parts: readiness.parts.map((p) => ({ label: p.label, value: p.value })) },
    fit,
    skills: { strongest: standing.strongest.map(row), weakest: standing.weakest.map(row) },
    funnel,
    diagnosis: report.diagnosis.headline,
    channels: segmentBy(applications, (a) => a.source).map((s) => ({ label: s.key, pct: Math.round(s.rate * 100), responded: s.responded, n: s.n, lowSample: s.n < MIN_SAMPLE })),
    weekly: weekly(applications),
    nba: { title: nba.title, detail: nba.detail, steps: nba.steps, reasons: nba.reasons, impact: nba.impact, effort: nba.effort },
    insights: report.chains.slice(0, 4).map((c) => ({
      title: c.title, area: c.area === 'fit' ? 'Career fit' : c.area === 'funnel' ? 'Funnel' : 'Skills',
      evidence: c.evidence.slice(0, 2), inference: c.inference, gap: c.gap, recommendation: c.recommendation, confidence: `${c.confidence} confidence`,
    })),
    experiments: exp,
    notes: [
      'Career fit = sum of weight x min(your level / required level, 1), divided by the sum of weights. Required levels come from demo templates, not scraped market data. Skill levels are self-rated (0 to 5).',
      `Readiness = 50% career fit (top two paths) + 30% response rate against a ${pct(RESPONSE_RATE_TARGET)} reference rate + 20% deployed projects (two or more is full marks).`,
      `Response rates on fewer than ${MIN_SAMPLE} applications are marked "small sample". Treat them as hints, not results. Experiment samples are small and directional only.`,
      'This report explains competitiveness from documented skills and logged applications. It does not predict hiring outcomes.',
      `Analysis source: ${source}.`,
      ...(i.isDemo ? ['Demo data: the persona, companies and results in this report are fictional. Nothing here is a real-world performance claim.'] : []),
    ],
  }
  return sanitize(data)
}

/** Apply pdfText to every string in the structure. */
function sanitize<T>(v: T): T {
  if (typeof v === 'string') return pdfText(v) as T
  if (Array.isArray(v)) return v.map(sanitize) as T
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, k === 'fileName' ? x : sanitize(x)])) as T
  return v
}
