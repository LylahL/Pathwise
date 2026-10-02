/** The PDF layout. Pure presentation: every number and sentence arrives in `data` (see reportData.ts). */
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { ReactNode } from 'react'
import type { ReportData } from './reportData'

const C = {
  ink: '#18181b', body: '#3f3f46', mute: '#71717a', faint: '#a1a1aa', line: '#e4e4e7', track: '#eef0f4', page: '#ffffff',
  indigo: '#4f46e5', indigoSoft: '#eef2ff', good: '#059669', goodSoft: '#ecfdf5', warn: '#d97706', warnSoft: '#fffbeb',
  bad: '#e11d48', badSoft: '#fff1f2', sky: '#0284c7', skySoft: '#f0f9ff', dark: '#18181b',
}
const TONE = { indigo: [C.indigo, C.indigoSoft], good: [C.good, C.goodSoft], warn: [C.warn, C.warnSoft], bad: [C.bad, C.badSoft], sky: [C.sky, C.skySoft] } as const
const HEAD = { good: C.good, bad: C.bad, accent: C.indigo, muted: C.faint } as const

const s = StyleSheet.create({
  page: { paddingTop: 34, paddingBottom: 46, paddingHorizontal: 36, fontFamily: 'Helvetica', fontSize: 9, color: C.body, lineHeight: 1.4, backgroundColor: C.page },
  row: { flexDirection: 'row' },
  card: { borderWidth: 1, borderColor: C.line, borderRadius: 6, padding: 10 },
  h2: { fontFamily: 'Helvetica-Bold', fontSize: 12, color: C.ink },
  h3: { fontFamily: 'Helvetica-Bold', fontSize: 9.5, color: C.ink },
  small: { fontSize: 8, color: C.mute },
  label: { fontFamily: 'Helvetica-Bold', fontSize: 7, letterSpacing: 0.8, textTransform: 'uppercase', color: C.mute },
  num: { fontFamily: 'Helvetica-Bold', color: C.ink },
})

const Bar = ({ pct, color, h = 6, faded }: { pct: number; color: string; h?: number; faded?: boolean }) => (
  <View style={{ height: h, backgroundColor: C.track, borderRadius: h / 2 }}>
    <View style={{ height: h, width: `${Math.min(Math.max(pct, 0), 100)}%`, backgroundColor: color, borderRadius: h / 2, opacity: faded ? 0.45 : 1 }} />
  </View>
)

/** Five segments: filled = your level; outlined = the level roles ask for. */
const Levels = ({ have, need }: { have: number; need: number }) => {
  const color = have >= need ? C.good : have >= need - 1 && have >= 2 ? '#f59e0b' : '#fb7185'
  return (
    <View style={s.row}>
      {[1, 2, 3, 4, 5].map((n) => (
        <View key={n} style={{ width: 13, height: 6, marginRight: 2, borderRadius: 2, backgroundColor: n <= have ? color : C.track, borderWidth: n === need ? 1 : 0, borderColor: C.mute }} />
      ))}
    </View>
  )
}

const Chip = ({ children, tone }: { children: string; tone: keyof typeof TONE }) => (
  <Text style={{ fontSize: 7.5, color: TONE[tone][0], backgroundColor: TONE[tone][1], paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3, marginRight: 4, marginTop: 3 }}>{children}</Text>
)

function Section({ n, title, hint, color, children, newPage, minAhead = 80 }: { n: number; title: string; hint?: string; color: string; children: ReactNode; newPage?: boolean; minAhead?: number }) {
  return (
    <View break={newPage} style={{ marginTop: newPage ? 0 : 16 }}>
      <View style={[s.row, { alignItems: 'center', marginBottom: 8 }]} minPresenceAhead={minAhead}>
        <View style={{ width: 15, height: 15, borderRadius: 8, backgroundColor: color, alignItems: 'center', justifyContent: 'center', marginRight: 7 }}>
          <Text style={{ color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 8 }}>{n}</Text>
        </View>
        <Text style={s.h2}>{title}</Text>
        {hint && <Text style={[s.small, { marginLeft: 8 }]}>{hint}</Text>}
      </View>
      {children}
    </View>
  )
}

export default function ReportDocument({ data }: { data: ReportData }) {
  return (
    <Document title={data.title} author="Pathwise" subject="Career intelligence report" creator="Pathwise">
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={[s.row, { justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }]}>
          <View style={s.row}>
            <View style={{ width: 20, height: 20, borderRadius: 5, backgroundColor: C.indigo, alignItems: 'center', justifyContent: 'center', marginRight: 7 }}>
              <Text style={{ color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 10 }}>P</Text>
            </View>
            <View>
              <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10, color: C.ink }}>Pathwise</Text>
              <Text style={{ fontSize: 7, color: C.faint }}>Career intelligence report</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9.5, color: C.ink }}>{data.meta.name}</Text>
            <Text style={s.small}>{data.meta.subtitle}</Text>
            <Text style={s.small}>Generated {data.meta.generated}</Text>
          </View>
        </View>

        {/* The 10-second answer */}
        <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 19, lineHeight: 1.3, color: C.ink, marginBottom: 6 }}>
          {data.headline.map((p, i) => <Text key={i} style={p.tone ? { color: HEAD[p.tone] } : undefined}>{p.text}</Text>)}
        </Text>
        {data.meta.isDemo && <Text style={[s.small, { marginBottom: 4 }]}>Demo data: fictional persona, companies and results.</Text>}

        {/* 1 · Where you stand */}
        <Section n={1} title="Where you stand" hint="Computed from your applications and skills" color={C.indigo}>
          <View wrap={false} style={s.row}>
            {data.kpis.map((k, i) => (
              <View key={k.label} style={[s.card, { flex: i === 0 ? 1.7 : 1, marginRight: i < 3 ? 8 : 0 }]}>
                <Text style={s.label}>{k.label}</Text>
                <View style={{ height: 30, marginTop: 4, justifyContent: 'center' }}>
                  <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 20, lineHeight: 1, color: TONE[k.tone][0] }}>{k.value}</Text>
                </View>
                <Text style={s.small}>{k.sub}</Text>
                {i === 0 && (
                  <View style={{ marginTop: 7 }}>
                    {data.readiness.parts.map((p) => (
                      <View key={p.label} style={{ marginBottom: 4 }}>
                        <View style={[s.row, { justifyContent: 'space-between', marginBottom: 2 }]}><Text style={{ fontSize: 7, color: C.mute }}>{p.label.split(' (')[0]}</Text><Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.ink }}>{p.value}</Text></View>
                        <Bar pct={p.value} color={p.value >= 75 ? C.good : p.value >= 50 ? C.indigo : '#f59e0b'} h={4} />
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        </Section>

        {/* 2 · What fits you */}
        <Section n={2} title="What careers fit you" hint="Your skills against each path's typical requirements" color={C.good}>
          {data.fit.map((f) => (
            <View key={f.title} wrap={false} style={[s.card, { marginBottom: 6 }]}>
              <View style={[s.row, { justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }]}>
                <Text style={s.h3}>{f.title}</Text>
                <View style={[s.row, { alignItems: 'center' }]}>
                  <Text style={{ fontSize: 7.5, color: f.tier === 'Strong' ? C.good : f.tier === 'Reachable' ? C.indigo : C.warn, marginRight: 8 }}>{f.tier}</Text>
                  <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 13, color: C.ink }}>{f.score}%</Text>
                </View>
              </View>
              <Bar pct={f.score} color={f.score >= 80 ? C.good : f.score >= 65 ? C.indigo : '#f59e0b'} h={7} />
              <View style={[s.row, { flexWrap: 'wrap', alignItems: 'center' }]}>
                {f.strengths.map((x) => <Chip key={x} tone="good">{x}</Chip>)}
                {f.gaps.map((x) => <Chip key={x} tone="bad">{`Gap: ${x}`}</Chip>)}
                <Text style={[s.small, { marginLeft: 'auto', marginTop: 3 }]}>{f.applied} applied · {f.replies} {f.replies === 1 ? 'reply' : 'replies'}</Text>
              </View>
            </View>
          ))}

          <View wrap={false} style={[s.row, { marginTop: 8 }]}>
            {([['Strongest skills', data.skills.strongest, C.good], ['Biggest skill gaps', data.skills.weakest, C.bad]] as const).map(([title, list, color], idx) => (
              <View key={title} style={[s.card, { flex: 1, marginRight: idx === 0 ? 8 : 0 }]}>
                <Text style={[s.label, { color, marginBottom: 6 }]}>{title}</Text>
                {list.length === 0 && <Text style={s.small}>None at this level.</Text>}
                {list.map((k) => (
                  <View key={k.skill} style={[s.row, { justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }]}>
                    <Text style={{ width: 104 }}>{k.skill}</Text><Levels have={k.have} need={k.need} /><Text style={[s.small, { width: 36, textAlign: 'right' }]}>{k.have < k.need ? `L${k.have} to ${k.need}` : `L${k.have}`}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
          <Text style={[s.small, { marginTop: 4 }]}>Filled segments = your level. The outlined segment = the level roles ask for.</Text>
        </Section>

        {/* 3 · What's breaking */}
        <Section n={3} title="Where your search is breaking" hint="Stage by stage, and by channel" color={C.bad}>
          <View wrap={false} style={s.card}>
            <Text style={[s.label, { marginBottom: 8 }]}>Application funnel</Text>
            {data.funnel.map((f, idx) => (
              <View key={f.stage}>
                {idx > 0 && (
                  <Text style={{ fontSize: 7.5, marginLeft: 92, marginVertical: 3, color: f.isBreak ? C.bad : C.faint, fontFamily: f.isBreak ? 'Helvetica-Bold' : 'Helvetica' }}>
                    {f.lost} dropped · {f.movedOnPct}% moved on{f.isBreak ? '  (biggest drop)' : ''}
                  </Text>
                )}
                <View style={[s.row, { alignItems: 'center' }]}>
                  <Text style={{ width: 86, fontFamily: 'Helvetica-Bold', color: C.body }}>{f.stage}</Text>
                  <View style={{ flex: 1, height: 15, backgroundColor: C.track, borderRadius: 4, marginHorizontal: 6 }}>
                    <View style={{ height: 15, width: `${f.widthPct}%`, borderRadius: 4, backgroundColor: f.isBreak ? C.bad : ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'][idx] }} />
                  </View>
                  <Text style={[s.num, { width: 22, textAlign: 'right' }]}>{f.count}</Text>
                </View>
              </View>
            ))}
            <Text style={{ marginTop: 9, paddingTop: 7, borderTopWidth: 1, borderTopColor: C.line }}><Text style={s.num}>Diagnosis · </Text>{data.diagnosis}</Text>
          </View>

          <View style={[s.row, { marginTop: 8 }]}>
            <View wrap={false} style={[s.card, { flex: 1, marginRight: 8 }]}>
              <Text style={[s.label, { marginBottom: 8 }]}>Response rate by channel</Text>
              {data.channels.map((c) => (
                <View key={c.label} style={{ marginBottom: 7 }}>
                  <View style={[s.row, { justifyContent: 'space-between', marginBottom: 2 }]}>
                    <Text style={{ fontFamily: 'Helvetica-Bold' }}>{c.label}</Text>
                    <Text style={s.small}><Text style={s.num}>{c.pct}%</Text> · {c.responded}/{c.n}{c.lowSample ? ' · small sample' : ''}</Text>
                  </View>
                  <Bar pct={c.pct} color={c.pct >= 30 ? C.good : c.pct >= 12 ? C.indigo : C.bad} faded={c.lowSample} />
                </View>
              ))}
              <Text style={s.small}>Faded bars have fewer than 8 applications.</Text>
            </View>
            <View wrap={false} style={[s.card, { flex: 1 }]}>
              <Text style={[s.label, { marginBottom: 8 }]}>Weekly activity</Text>
              <View style={[s.row, { alignItems: 'flex-end', height: 90 }]}>
                {data.weekly.map((w) => {
                  const max = Math.max(...data.weekly.map((x) => x.applied), 1)
                  return (
                    <View key={w.week} style={{ flex: 1, alignItems: 'center', marginHorizontal: 2 }}>
                      <View style={[s.row, { alignItems: 'flex-end', height: 74 }]}>
                        <View style={{ width: 8, height: Math.max((w.applied / max) * 70, 2), backgroundColor: '#bae6fd', borderRadius: 2, marginRight: 1 }} />
                        <View style={{ width: 8, height: Math.max((w.responded / max) * 70, w.responded ? 2 : 0), backgroundColor: C.indigo, borderRadius: 2 }} />
                      </View>
                      <Text style={{ fontSize: 6.5, color: C.faint, marginTop: 3 }}>{w.week}</Text>
                    </View>
                  )
                })}
              </View>
              <View style={[s.row, { marginTop: 6 }]}>
                <Text style={[s.small, { marginRight: 10 }]}>Light = applied</Text><Text style={s.small}>Dark = got a response</Text>
              </View>
            </View>
          </View>
        </Section>

        {/* 4 · What to do next */}
        <Section n={4} title="What to do next" hint="The recommendation, the reasoning behind it, and tests you can run" color={C.dark} minAhead={240}>
          {data.nba && (
            <View wrap={false} style={{ backgroundColor: C.dark, borderRadius: 8, padding: 14 }}>
              <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 7, letterSpacing: 1, color: '#a5b4fc', textTransform: 'uppercase' }}>Next best action</Text>
              <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 14, lineHeight: 1.3, color: '#fff', marginTop: 5 }}>{data.nba.title}</Text>
              <Text style={{ color: '#a1a1aa', marginTop: 4 }}>{data.nba.detail}</Text>
              <View style={[s.row, { marginTop: 10 }]}>
                <View style={{ flex: 1.1, marginRight: 14 }}>
                  <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 7, letterSpacing: 0.8, color: '#a1a1aa', textTransform: 'uppercase', marginBottom: 4 }}>Steps</Text>
                  {data.nba.steps.map((st, i) => <Text key={st} style={{ color: '#e4e4e7', marginBottom: 3 }}>{i + 1}.  {st}</Text>)}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 7, letterSpacing: 0.8, color: '#a1a1aa', textTransform: 'uppercase', marginBottom: 4 }}>Why this first</Text>
                  {data.nba.reasons.map((r) => <Text key={r} style={{ color: '#e4e4e7', marginBottom: 3 }}>-  {r}</Text>)}
                  {(data.nba.impact || data.nba.effort) && (
                    <Text style={{ color: '#a1a1aa', marginTop: 4, fontSize: 8 }}>Impact {data.nba.impact ?? '-'}/5 · Effort {data.nba.effort ?? '-'}/5. A hypothesis to test, not a guarantee.</Text>
                  )}
                </View>
              </View>
            </View>
          )}

          <Text minPresenceAhead={90} style={[s.h3, { marginTop: 14, marginBottom: 6 }]}>AI insights: evidence, inference, gap, recommendation</Text>
          {data.insights.map((c) => (
            <View key={c.title} wrap={false} style={[s.card, { marginBottom: 6 }]}>
              <View style={[s.row, { justifyContent: 'space-between', marginBottom: 3 }]}>
                <Text style={s.h3}>{c.title}</Text><Text style={{ fontSize: 7.5, color: C.mute }}>{c.area} · {c.confidence}</Text>
              </View>
              {c.evidence.map((e) => <Text key={e}><Text style={[s.num, { color: C.mute }]}>Evidence  </Text>{e}</Text>)}
              <Text><Text style={[s.num, { color: C.indigo }]}>Inference  </Text>{c.inference}</Text>
              <Text><Text style={[s.num, { color: C.bad }]}>Gap  </Text>{c.gap}</Text>
              <Text><Text style={[s.num, { color: C.good }]}>Recommendation  </Text>{c.recommendation}</Text>
            </View>
          ))}

          <Text minPresenceAhead={80} style={[s.h3, { marginTop: 12, marginBottom: 6 }]}>Experiments</Text>
          {data.experiments.length === 0 && <Text style={s.small}>No experiments yet.</Text>}
          {data.experiments.map((e) => (
            <View key={e.title} wrap={false} style={[s.card, { marginBottom: 6 }]}>
              <View style={[s.row, { justifyContent: 'space-between' }]}><Text style={s.h3}>{e.title}</Text><Text style={{ fontSize: 7.5, color: C.indigo }}>{e.status}</Text></View>
              <Text style={[s.small, { marginTop: 2 }]}>{e.hypothesis}</Text>
              {e.before && e.after && (
                <View style={{ marginTop: 6 }}>
                  {([['Before', e.before, C.faint], ['After', e.after, C.indigo]] as const).map(([lab, v, col]) => (
                    <View key={lab} style={[s.row, { alignItems: 'center', marginBottom: 3 }]}>
                      <Text style={[s.small, { width: 34 }]}>{lab}</Text><View style={{ flex: 1, marginRight: 8 }}><Bar pct={v.pct} color={col} h={5} /></View><Text style={[s.small, { width: 52, textAlign: 'right' }]}><Text style={s.num}>{v.pct}%</Text> · {v.label}</Text>
                    </View>
                  ))}
                  <Text style={[s.small, { color: C.faint }]}>Directional only: samples are too small to call a winner.</Text>
                </View>
              )}
            </View>
          ))}

          <View wrap={false} style={{ marginTop: 12, padding: 10, backgroundColor: '#f8f8fa', borderRadius: 6 }}>
            <Text style={[s.label, { marginBottom: 4 }]}>How to read this report</Text>
            {data.notes.map((n) => <Text key={n} style={{ fontSize: 7.5, color: C.mute, marginBottom: 2 }}>-  {n}</Text>)}
          </View>
        </Section>

      </Page>
    </Document>
  )
}
