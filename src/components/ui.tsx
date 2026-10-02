import type { ReactNode } from 'react'

export const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ')

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cx('rounded-xl border border-zinc-200 bg-white', className)}>{children}</section>
}

export function CardHeader({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <header className="flex items-start justify-between gap-4 px-5 pt-4 pb-3">
      <div>
        <h3 className="text-[13px] font-semibold tracking-tight text-zinc-900">{title}</h3>
        {sub && <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>}
      </div>
      {right}
    </header>
  )
}

export function PageHeader({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-zinc-900">{title}</h1>
        {sub && <p className="mt-1 text-sm text-zinc-500">{sub}</p>}
      </div>
      {right}
    </div>
  )
}

export function Stat({ label, value, sub, children }: { label: string; value: ReactNode; sub?: ReactNode; children?: ReactNode }) {
  return (
    <Card className="p-4">
      <div className="text-xs font-medium text-zinc-500">{label}</div>
      <div className="tabular mt-1.5 text-[28px] font-semibold leading-none tracking-tight text-zinc-900">{value}</div>
      {sub && <div className="mt-2 text-xs text-zinc-500">{sub}</div>}
      {children}
    </Card>
  )
}

const tones = {
  neutral: 'bg-zinc-100 text-zinc-600',
  accent: 'bg-indigo-50 text-indigo-700',
  good: 'bg-emerald-50 text-emerald-700',
  warn: 'bg-amber-50 text-amber-700',
  bad: 'bg-rose-50 text-rose-700',
}
export type Tone = keyof typeof tones
export const Badge = ({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) => (
  <span className={cx('inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium', tones[tone])}>{children}</span>
)

export const tierTone = (t: string): Tone => (t === 'Strong' ? 'good' : t === 'Reachable' ? 'accent' : 'warn')
export const scoreColor = (s: number) => (s >= 80 ? 'bg-emerald-500' : s >= 65 ? 'bg-indigo-500' : 'bg-amber-500')

export function Bar({ value, max = 100, color = 'bg-indigo-500', className }: { value: number; max?: number; color?: string; className?: string }) {
  return (
    <div className={cx('h-1.5 w-full overflow-hidden rounded-full bg-zinc-100', className)}>
      <div className={cx('h-full rounded-full', color)} style={{ width: `${Math.min(value / max, 1) * 100}%` }} />
    </div>
  )
}

export const Button = ({ children, onClick, variant = 'primary', disabled }: { children: ReactNode; onClick?: () => void; variant?: 'primary' | 'ghost'; disabled?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cx(
      'inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:cursor-default disabled:opacity-50',
      variant === 'primary' ? 'bg-zinc-900 text-white hover:bg-zinc-700' : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50',
    )}
  >
    {children}
  </button>
)
