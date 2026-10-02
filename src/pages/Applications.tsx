import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useApp } from '../store'
import { Badge, Card, CardHeader, PageHeader } from '../components/ui'
import type { Tone } from '../components/ui'
import SegmentChart from '../components/SourceChart'
import { STAGE_LABELS, weekly } from '../lib/analytics'

const tip = { fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7', boxShadow: 'none' }

export default function Applications() {
  const { applications } = useApp()
  const [source, setSource] = useState('All')
  const sources = ['All', ...new Set(applications.map((a) => a.source))]
  const rows = useMemo(() => applications.filter((a) => source === 'All' || a.source === source).sort((a, b) => b.appliedOn.localeCompare(a.appliedOn)), [applications, source])
  const stageTone = (r: number, o: string): Tone => (o === 'offer' ? 'good' : r >= 3 ? 'accent' : r >= 1 ? 'warn' : 'neutral')

  return (
    <>
      <PageHeader title="Applications" sub="Volume, response and conversion by the dimensions you can actually change." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Weekly activity" sub="Applied vs. responded" />
          <div className="h-[190px] px-3 pb-4">
            <ResponsiveContainer>
              <BarChart data={weekly(applications)} margin={{ left: -24, right: 8, top: 4 }}>
                <CartesianGrid vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#71717a' }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#71717a' }} />
                <Tooltip cursor={{ fill: '#f4f4f5' }} contentStyle={tip} />
                <Bar dataKey="applied" name="Applied" isAnimationActive={false} fill="#c7d2fe" radius={[3, 3, 0, 0]} />
                <Bar dataKey="responded" name="Responded" isAnimationActive={false} fill="#4f46e5" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card><CardHeader title="Response rate by source" /><SegmentChart apps={applications} by={(a) => a.source} /></Card>
        <Card><CardHeader title="Response rate by resume" /><SegmentChart apps={applications} by={(a) => a.resume} /></Card>
      </div>

      <Card className="mt-4 overflow-hidden">
        <CardHeader
          title="All applications"
          sub={`${rows.length} shown`}
          right={
            <select value={source} onChange={(e) => setSource(e.target.value)} className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700">
              {sources.map((s) => <option key={s}>{s}</option>)}
            </select>
          }
        />
        <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-[13px]">
          <thead className="border-y border-zinc-100 bg-zinc-50/60 text-[11px] uppercase tracking-wider text-zinc-500">
            <tr>{['Company', 'Role', 'Source', 'Resume', 'Applied', 'Stage reached'].map((h) => <th key={h} className="px-5 py-2 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((a) => (
              <tr key={a.id} className="hover:bg-zinc-50/60">
                <td className="px-5 py-2.5 font-medium text-zinc-900">{a.company}</td>
                <td className="px-5 py-2.5 text-zinc-600">{a.role}</td>
                <td className="px-5 py-2.5 text-zinc-600">{a.source}</td>
                <td className="px-5 py-2.5 text-zinc-600">{a.resume}</td>
                <td className="tabular px-5 py-2.5 text-zinc-500">{a.appliedOn}</td>
                <td className="px-5 py-2.5"><Badge tone={stageTone(a.reached, a.outcome)}>{a.reached === 0 ? (a.outcome === 'rejected' ? 'No response' : 'Waiting') : STAGE_LABELS[a.reached]}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </Card>
    </>
  )
}
