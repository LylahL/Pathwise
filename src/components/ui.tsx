import { Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ')

// ---------- Color system ----------
// Indigo is the brand color. Emerald / amber / rose are reserved for meaning (good / watch / bad); sky is a calm
// secondary data hue. AI-derived content is marked with <AiMark/>, never with a color of its own.
const tones = {
  neutral: 'bg-zinc-100 text-zinc-600',
  accent: 'bg-indigo-50 text-indigo-700',
  good: 'bg-emerald-50 text-emerald-700',
  warn: 'bg-amber-50 text-amber-700',
  bad: 'bg-rose-50 text-rose-700',
  info: 'bg-sky-50 text-sky-700',
}
const chipTones = {
  neutral: 'bg-zinc-100 text-zinc-600',
  accent: 'bg-indigo-100 text-indigo-600',
  good: 'bg-emerald-100 text-emerald-600',
  warn: 'bg-amber-100 text-amber-600',
  bad: 'bg-rose-100 text-rose-600',
  info: 'bg-sky-100 text-sky-600',
}
export type Tone = keyof typeof tones

export const tierTone = (t: string): Tone => (t === 'Strong' ? 'good' : t === 'Reachable' ? 'accent' : 'warn')
export const scoreColor = (s: number) => (s >= 80 ? 'bg-emerald-500' : s >= 65 ? 'bg-indigo-500' : 'bg-amber-500')

// ---------- Layout primitives ----------
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cx('rounded-xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]', className)}>{children}</section>
}

export function CardHeader({ title, sub, right, icon: Icon, tone = 'accent' }: { title: string; sub?: string; right?: ReactNode; icon?: LucideIcon; tone?: Tone }) {
  return (
    <header className="flex items-start justify-between gap-4 px-5 pb-3 pt-4">
      <div className="flex min-w-0 items-start gap-2.5">
        {Icon && <span className={cx('mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md', chipTones[tone])}><Icon size={13} strokeWidth={2} /></span>}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
          {sub && <p className="mt-0.5 text-xs leading-snug text-zinc-500">{sub}</p>}
        </div>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </header>
  )
}

export function PageHeader({ kicker, title, sub, right }: { kicker?: string; title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
      <div className="min-w-0">
        {kicker && <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-indigo-600">{kicker}</div>}
        <h1 className="text-2xl font-semibold text-zinc-900">{title}</h1>
        {sub && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-zinc-500">{sub}</p>}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  )
}

/** Numbered section marker. The numbers tie the page to the four questions the product answers. */
export function SectionLabel({ n, title, hint, color, id }: { n: number; title: string; hint?: string; color: string; id?: string }) {
  return (
    <div id={id} className="mb-3 mt-10 flex scroll-mt-6 flex-wrap items-baseline gap-x-3 gap-y-0.5 first:mt-0">
      <span className={cx('grid h-5 w-5 place-items-center self-center rounded-full text-[11px] font-semibold text-white', color)}>{n}</span>
      <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
      {hint && <span className="text-xs text-zinc-500">{hint}</span>}
    </div>
  )
}

export function Kpi({ label, value, sub, icon: Icon, tone = 'accent', children }: { label: string; value: ReactNode; sub?: ReactNode; icon: LucideIcon; tone?: Tone; children?: ReactNode }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
        <span className={cx('grid h-6 w-6 place-items-center rounded-md', chipTones[tone])}><Icon size={14} strokeWidth={2} /></span>
        {label}
      </div>
      <div className="num mt-3 text-[30px] font-semibold leading-none tracking-tight text-zinc-900">{value}</div>
      {sub && <div className="mt-2 text-xs leading-snug text-zinc-500">{sub}</div>}
      {children}
    </Card>
  )
}

export const Badge = ({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) => (
  <span className={cx('inline-flex items-center whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-medium', tones[tone])}>{children}</span>
)

/** Marks anything derived by the intelligence layer, and says honestly what produced it. */
export function AiMark({ source = 'rules-engine', className, onDark }: { source?: 'llm' | 'rules-engine'; className?: string; onDark?: boolean }) {
  const llm = source === 'llm'
  return (
    <span
      title={llm ? 'Written by an AI model. Scores and counts are computed by the app.' : 'Computed by the built-in rules engine from your data.'}
      className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide', onDark ? 'bg-white/10 text-zinc-100 ring-1 ring-inset ring-white/15' : llm ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-600 ring-1 ring-inset ring-zinc-200', className)}
    >
      <Sparkles size={10} strokeWidth={2.2} />{llm ? 'AI' : 'Rules'}
    </span>
  )
}

// ---------- Data display ----------
export function Bar({ value, max = 100, color = 'bg-indigo-500', className }: { value: number; max?: number; color?: string; className?: string }) {
  return (
    <div className={cx('h-1.5 w-full overflow-hidden rounded-full bg-zinc-100', className)}>
      <div className={cx('anim-grow h-full rounded-full transition-[width] duration-500', color)} style={{ width: `${Math.min(Math.max(value / max, 0), 1) * 100}%` }} />
    </div>
  )
}

/** Five-segment skill level. Filled = your level; the ringed segment = the level the role needs. */
export function LevelMeter({ have, need, max = 5 }: { have: number; need: number; max?: number }) {
  const color = have >= need ? 'bg-emerald-500' : have >= need - 1 && have >= 2 ? 'bg-amber-400' : 'bg-rose-400'
  return (
    <div className="flex items-center gap-[3px]" role="img" aria-label={`Your level ${have} of ${max}; needed ${need}`} title={`You: L${have} · needed: L${need}`}>
      {Array.from({ length: max }, (_, i) => {
        const n = i + 1
        return <span key={n} className={cx('h-2 w-4 rounded-[3px]', n <= have ? color : 'bg-zinc-200/70', n === need && 'outline outline-1 outline-offset-1 outline-zinc-500')} />
      })}
    </div>
  )
}

export const Button = ({ children, onClick, variant = 'primary', disabled }: { children: ReactNode; onClick?: () => void; variant?: 'primary' | 'ghost'; disabled?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cx(
      'inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:cursor-default disabled:opacity-50',
      variant === 'primary' ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-500' : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50',
    )}
  >
    {children}
  </button>
)

// ---------- States ----------
export const Skeleton = ({ className }: { className?: string }) => <div className={cx('animate-pulse rounded-md bg-zinc-200/60', className)} />

export function EmptyState({ title, hint, icon: Icon }: { title: string; hint?: string; icon?: LucideIcon }) {
  return (
    <div className="px-5 pb-6 pt-2 text-center">
      <div className="mx-auto rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 px-4 py-6">
        {Icon && <Icon size={18} className="mx-auto mb-2 text-zinc-400" />}
        <p className="text-sm font-medium text-zinc-700">{title}</p>
        {hint && <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-zinc-500">{hint}</p>}
      </div>
    </div>
  )
}

export function ErrorState({ message, onRetry, prefix = 'Couldn’t generate insights:' }: { message: string; onRetry?: () => void; prefix?: string }) {
  return (
    <div className="px-5 pb-5 pt-1" role="alert">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-800">
        <span>{prefix} {message}</span>
        {onRetry && <Button variant="ghost" onClick={onRetry}>Retry</Button>}
      </div>
    </div>
  )
}

/** Tiny bar sparkline; values are real counts, no smoothing. */
export function Spark({ values, className }: { values: number[]; className?: string }) {
  const max = Math.max(...values, 1)
  return (
    <div className={cx('flex h-8 items-end gap-[3px]', className)} aria-hidden>
      {values.map((v, i) => <div key={i} className="w-full rounded-sm bg-sky-200" style={{ height: `${Math.max((v / max) * 100, 6)}%` }} />)}
    </div>
  )
}
