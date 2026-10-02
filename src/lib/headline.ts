import type { FunnelDiagnosis } from '../types'
import { tier } from './analytics'

export interface HeadlinePart { text: string; tone?: 'good' | 'bad' | 'accent' | 'muted' }

const TIER_PHRASE = { Strong: 'a strong fit for', Reachable: 'a reasonable fit for', Stretch: 'still a stretch for' } as const
const OUTCOME_PHRASE: Record<string, string> = {
  Responses: 'got a response', 'Recruiter screens': 'led to a recruiter screen', Interviews: 'led to an interview', 'Final rounds': 'reached a final round',
}
const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)

/**
 * The one-sentence answer to "where do I fit, where does it break, what next". Used by the dashboard and the PDF
 * so the two can never disagree. Every clause is computed from the user's data.
 */
export function headlineParts(top: { title: string; score: number }, drop: FunnelDiagnosis['transitions'][number] | undefined, nextTitle: string | undefined): HeadlinePart[] {
  const t = tier(top.score)
  const parts: HeadlinePart[] = [
    { text: t === 'Stretch' ? 'Your closest fit is ' : 'You’re ' },
    { text: `${t === 'Stretch' ? top.title : `${TIER_PHRASE[t]} ${top.title}`} (${top.score}%)`, tone: 'good' },
  ]
  if (drop) {
    parts.push({ text: t === 'Stretch' ? ', and ' : ', but ' })
    parts.push({ text: `only ${drop.converted} of ${drop.n} ${drop.from.toLowerCase()} ${OUTCOME_PHRASE[drop.to] ?? `reached ${drop.to.toLowerCase()}`}`, tone: 'bad' })
  }
  parts.push({ text: '.' })
  if (nextTitle) parts.push({ text: ' Next: ', tone: 'muted' }, { text: lowerFirst(nextTitle), tone: 'accent' }, { text: '.', tone: 'muted' })
  return parts
}
