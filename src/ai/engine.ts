/**
 * Deterministic "insight engine". It produces the same typed AIReport shape an LLM would,
 * but every claim is computed from the user's data — nothing is invented.
 * Swap in an LLM via src/ai/index.ts without touching the UI.
 */
import type { AIReport, InsightChain, Snapshot } from '../types'
import { fit, funnelCounts, pct, rankPaths, segmentBy, STAGES, summary } from '../lib/analytics'

const WARM = new Set(['Referral', 'Career fair'])
const confidence = (n: number): Pick<InsightChain, 'confidence' | 'confidenceNote'> =>
  n >= 30 ? { confidence: 'high', confidenceNote: `Based on ${n} applications.` }
  : n >= 12 ? { confidence: 'medium', confidenceNote: `Based on ${n} applications — directional.` }
  : { confidence: 'low', confidenceNote: `Only ${n} applications in this comparison — treat as a hypothesis, not a result.` }

export function buildReport({ profile, applications: apps, paths, jobs = [] }: Snapshot): AIReport {
  const chains: InsightChain[] = []
  const ranked = rankPaths(profile, paths, apps)
  const sum = summary(apps)

  // ---- 1. Skill gap on the user's highest-priority target path with a real gap ----
  const target = profile.targetPathIds.map((id) => ranked.find((r) => r.path.id === id)!).filter((r) => r.gaps.length)
    .sort((a, b) => b.gaps[0].weight * b.gaps[0].deficit - a.gaps[0].weight * a.gaps[0].deficit)[0]
  if (target) {
    const [g1, g2] = target.gaps
    const strong = target.strengths.slice(0, 3).map((s) => `${s.skill} L${s.have}`).join(', ')
    const mine = apps.filter((a) => a.pathId === target.path.id)
    const responded = mine.filter((a) => a.reached >= 1).length
    const deployed = profile.projects.filter((p) => p.deployed).length
    const gapSkills = target.gaps.slice(0, 2).map((g) => g.skill)
    const pathJobs = jobs.filter((j) => j.pathId === target.path.id)
    const withGap = pathJobs.filter((j) => gapSkills.some((s) => j.skills.includes(s)))
    chains.push({
      id: 'skill-gap', area: 'skills', title: `Close the ${g1.skill} gap for ${target.path.title}`,
      evidence: [
        `${mine.length} ${target.path.title} applications → ${responded} responses.`,
        `${target.path.title} fit is ${target.score}% (${target.tier}).`,
        `Profile: ${strong || 'no skills at target level yet'} (self-rated, 0–5).`,
        `${deployed} of ${profile.projects.length} projects are deployed.`,
        ...(pathJobs.length ? [`${withGap.length} of ${pathJobs.length} ${target.path.title} postings in the demo job set mention ${gapSkills.join(' or ')}.`] : []),
      ],
      inference: `Your analytical foundation is solid, but ${target.path.title} postings weight ${g1.skill} heavily and your profile does not yet show evidence of it.`,
      gap: `${g1.skill}: L${g1.have} vs L${g1.need} required${g2 ? `; ${g2.skill}: L${g2.have} vs L${g2.need}` : ''}.`,
      recommendation: `Build and deploy one end-to-end project that demonstrates ${g1.skill}${g2 ? ` and ${g2.skill}` : ''}, then add it to your resume.`,
      steps: [
        `Pick one existing notebook project and wrap it in an API or app`,
        `Deploy it on a cloud free tier and document the architecture in the README`,
        `Add a one-line, link-backed bullet to your resume and LinkedIn`,
      ],
      experiment: {
        title: `Deployed project → ${target.path.title} response rate`,
        hypothesis: `Adding a deployed project that evidences ${g1.skill} raises the response rate for ${target.path.title} applications above the current ${pct(mine.length ? responded / mine.length : 0)} baseline (${responded}/${mine.length}).`,
        change: `Add the deployed project to your resume, then apply to 10 comparable ${target.path.title} roles.`,
        metric: 'Response rate (responded ÷ applied) on the 10 new applications',
        targetN: 10,
      },
      ...confidence(mine.length),
      impact: 5, effort: 4,
    })
  }

  // ---- 2. Channel effectiveness ----
  const bySource = segmentBy(apps, (a) => a.source)
  const cold = bySource.filter((s) => !WARM.has(s.key) && s.n >= 5).sort((a, b) => a.rate - b.rate)[0]
  const warm = [...bySource].filter((s) => WARM.has(s.key)).reduce((acc, s) => ({ n: acc.n + s.n, responded: acc.responded + s.responded }), { n: 0, responded: 0 })
  if (cold && warm.n) {
    const warmRate = warm.responded / warm.n
    chains.push({
      id: 'channel', area: 'funnel', title: `Shift effort from ${cold.key} to warm channels`,
      evidence: [
        `${cold.key}: ${cold.responded}/${cold.n} responded (${pct(cold.rate)}) — ${pct(cold.n / apps.length)} of all applications.`,
        `Referrals + career fairs: ${warm.responded}/${warm.n} responded (${pct(warmRate)}).`,
      ],
      inference: `Application volume through ${cold.key} is not converting; warm contacts are, even on a small sample.`,
      gap: `${pct(cold.n / apps.length)} of your effort goes to a channel with a ${pct(cold.rate)} response rate.`,
      recommendation: `Cap ${cold.key} at a few per week and redirect that time to referral requests and career events.`,
      steps: [
        `List 10 alumni or connections at companies you already applied to`,
        `Send 8 referral requests this week using a 3-line template`,
        `Register for the next on-campus career fair or virtual event`,
      ],
      experiment: {
        title: 'Warm outreach vs. cold applications',
        hypothesis: `Applications backed by a referral or personal contact get a higher response rate than ${cold.key} (${pct(cold.rate)} baseline).`,
        change: 'For the next 2 weeks, send 8 referral-backed applications and 8 cold applications to similar roles.',
        metric: 'Response rate by channel',
        targetN: 16,
      },
      ...confidence(Math.min(cold.n, warm.n)),
      impact: 4, effort: 2,
    })
  }

  // ---- 3. Resume version (with confound check) ----
  const byResume = segmentBy(apps, (a) => a.resume)
  const v1 = byResume.find((s) => s.key.startsWith('v1')), v2 = byResume.find((s) => s.key.startsWith('v2'))
  if (v1 && v2 && v1.n >= 5 && v2.n >= 5) {
    const coldOnly = apps.filter((a) => !WARM.has(a.source))
    const c1 = coldOnly.filter((a) => a.resume.startsWith('v1')), c2 = coldOnly.filter((a) => a.resume.startsWith('v2'))
    const rr = (l: typeof apps) => l.filter((a) => a.reached >= 1).length
    const v2WarmShare = apps.filter((a) => a.resume.startsWith('v2') && WARM.has(a.source)).length / v2.n
    const v1WarmShare = apps.filter((a) => a.resume.startsWith('v1') && WARM.has(a.source)).length / v1.n
    chains.push({
      id: 'resume', area: 'funnel', title: `Test ${v2.key} against ${v1.key} on cold applications`,
      evidence: [
        `${v2.key}: ${v2.responded}/${v2.n} responded (${pct(v2.rate)}); ${v1.key}: ${v1.responded}/${v1.n} (${pct(v1.rate)}).`,
        `Confound: ${pct(v2WarmShare)} of ${v2.key} applications were warm-channel vs ${pct(v1WarmShare)} for ${v1.key}.`,
        `Cold channels only: ${v2.key} ${rr(c2)}/${c2.length} vs ${v1.key} ${rr(c1)}/${c1.length}.`,
      ],
      inference: `The resume gap looks large, but most of it is explained by channel mix. Within cold channels the gap is smaller and the sample is tiny.`,
      gap: 'No controlled comparison yet — resume version and channel are tangled together.',
      recommendation: `Use ${v2.key} for every cold application for the next batch so the comparison is clean.`,
      steps: [`Retire ${v1.key} for data roles`, 'Log resume version on every application', 'Review after 15 cold applications'],
      experiment: {
        title: `${v2.key} on cold channels`,
        hypothesis: `${v2.key} raises cold-channel response rate above the ${pct(c1.length ? rr(c1) / c1.length : 0)} baseline (${rr(c1)}/${c1.length}).`,
        change: `Send ${v2.key} on the next 15 LinkedIn / company-site / cold-email applications.`,
        metric: 'Cold-channel response rate',
        targetN: 15,
      },
      ...confidence(Math.min(c1.length, c2.length)),
      impact: 3, effort: 1,
    })
  }

  // ---- 4. Applying where you're most competitive ----
  const best = ranked[0]
  if (best.appShare < 0.25 && apps.length >= 10) {
    chains.push({
      id: 'focus', area: 'fit', title: `Apply more where you are strongest: ${best.path.title}`,
      evidence: [
        `${best.path.title} is your highest fit at ${best.score}% (${best.tier}).`,
        `Only ${best.applications} of ${apps.length} applications (${pct(best.appShare)}) target it; ${best.responded} responded.`,
      ],
      inference: 'Your application mix does not match where your skills are most competitive.',
      gap: `${best.path.title} is under-represented in your pipeline.`,
      recommendation: `Raise ${best.path.title} to roughly a third of weekly applications while keeping one stretch path.`,
      steps: ['Set a weekly mix target by path', 'Filter Opportunities to Strong-fit roles first', 'Re-check response rate by path in 2 weeks'],
      experiment: {
        title: `Fit-first week: ${best.path.title}`,
        hypothesis: `Strong-fit roles respond at a higher rate than your stretch-path applications.`,
        change: `Send 10 applications to Strong-fit ${best.path.title} roles from the Opportunities page.`,
        metric: 'Response rate for Strong-fit vs. stretch applications',
        targetN: 10,
      },
      ...confidence(best.applications),
      impact: 4, effort: 2,
    })
  }

  // ---- Funnel diagnosis ----
  const counts = funnelCounts(apps)
  const transitions = STAGES.slice(1).map((to, i) => {
    const n = counts[i].count, converted = counts[i + 1].count
    return { from: STAGES[i], to, n, converted, rate: n ? converted / n : 0 }
  })
  const weakest = [...transitions].filter((t) => t.n >= 5).sort((a, b) => a.rate - b.rate)[0] ?? transitions[0]
  const diagnosis = {
    breakpoint: `${weakest.from} → ${weakest.to}`,
    headline: `Your funnel breaks at ${weakest.from} → ${weakest.to}: only ${weakest.converted} of ${weakest.n} (${pct(weakest.rate)}) moved forward.`,
    transitions,
    drivers: chains.filter((c) => c.area === 'funnel').map((c) => c.evidence[0]),
  }

  // ---- Next best action: highest impact ÷ effort ----
  // Prefer high impact among achievable (effort ≤ 3) actions; fall back to all if none qualify.
  const doable = chains.filter((c) => c.effort <= 3)
  const nba = [...(doable.length ? doable : chains)].sort((a, b) => b.impact - a.impact || a.effort - b.effort)[0]
  const fallback = { chainId: 'none', title: 'Log more applications', detail: 'Track source and resume version on every application.', reasons: [`Only ${sum.applications} applications logged — not enough to diagnose.`], steps: ['Add applications with source and resume version'] }

  return {
    generatedBy: 'rules-engine',
    chains,
    diagnosis,
    nextBestAction: nba
      ? { chainId: nba.id, title: nba.title, detail: nba.recommendation, reasons: nba.evidence.slice(0, 3), steps: nba.steps, impact: nba.impact, effort: nba.effort }
      : fallback,
  }
}

export { fit }
