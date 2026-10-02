import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Application } from '../types'
import { pct, segmentBy } from '../lib/analytics'

/** Response rate by an arbitrary grouping, with n shown so small samples are visible. */
export default function SegmentChart({ apps, by, height = 190 }: { apps: Application[]; by: (a: Application) => string; height?: number }) {
  const data = segmentBy(apps, by).map((s) => ({ ...s, label: `${s.key}`, pctv: Math.round(s.rate * 100) }))
  return (
    <div className="px-3 pb-4" style={{ height }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 56, top: 0, bottom: 0 }}>
          <XAxis type="number" hide domain={[0, 100]} />
          <YAxis type="category" dataKey="label" width={132} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#52525b' }} />
          <Tooltip cursor={{ fill: '#f4f4f5' }} formatter={(_v, _n, p) => [`${p.payload.responded}/${p.payload.n} responded (${pct(p.payload.rate)})`, 'Response']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7', boxShadow: 'none' }} />
          <Bar dataKey="pctv" radius={4} barSize={14} isAnimationActive={false} background={{ fill: '#f4f4f5', radius: 4 }}>
            {data.map((d) => <Cell key={d.key} fill={d.pctv >= 30 ? '#10b981' : d.pctv >= 12 ? '#6366f1' : '#f43f5e'} />)}
            <LabelList dataKey="pctv" position="right" formatter={(v: unknown) => `${v}%`} style={{ fontSize: 12, fill: '#18181b', fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
