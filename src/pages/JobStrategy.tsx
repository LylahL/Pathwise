import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowRight, Check, Minus, X } from 'lucide-react'
import { analyzeJobFit, JobFitError } from '../ai'
import type { JobFitResult } from '../ai'
import { JOB_TEXT_MIN, JOB_TEXT_MAX } from '../ai/jobFitSchema'
import { sampleJobs } from '../data/sampleJobs'
import { tier } from '../lib/analytics'
import { useApp } from '../store'
import { AiMark, Badge, Bar, Button, Card, CardHeader, EmptyState, ErrorState, LevelMeter, PageHeader, Skeleton, scoreColor, tierTone } from '../components/ui'

const verdict = { Strong: 'Strong match', Reachable: 'Partial match', Stretch: 'Stretch' } as const

const Bullets = ({ items }: { items: string[] }) => (
  <ul className="space-y-2 px-5 pb-5 text-[13px] leading-snug text-zinc-700">
    {items.map((i) => <li key={i} className="flex gap-2"><span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-zinc-300" />{i}</li>)}
  </ul>
)

const Chip = ({ children, tone, icon }: { children: React.ReactNode; tone: 'good' | 'warn' | 'bad'; icon: React.ReactNode }) => (
  <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${tone === 'good' ? 'bg-emerald-50 text-emerald-700' : tone === 'warn' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>{icon}{children}</span>
)

export default function JobStrategy() {
  const { candidateInput } = useApp()
  const [title, setTitle] = useState('')
  const [company, setCompany] = useState('')
  const [description, setDescription] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'error' | 'done'>('idle')
  const [error, setError] = useState('')
  const [result, setResult] = useState<JobFitResult | null>(null)
  const latest = useRef(0)

  const tooShort = description.trim().length < JOB_TEXT_MIN
  async function run(job = { title, company, description }) {
    const id = ++latest.current
    setState('loading'); setError('')
    try {
      const r = await analyzeJobFit({ candidate: candidateInput, job })
      if (id === latest.current) { setResult(r); setState('done') }
    } catch (e) {
      if (id !== latest.current) return
      setError(e instanceof JobFitError ? e.message : 'Something went wrong while analysing this posting. Please try again.')
      setState('error')
    }
  }

  // Deep link for demos: /job-strategy?sample=0 loads a demo posting and analyses it immediately.
  const [params] = useSearchParams()
  const autorun = useRef(false)
  useEffect(() => {
    const sample = sampleJobs[Number(params.get('sample'))]
    if (!sample || autorun.current) return
    autorun.current = true
    setTitle(sample.title); setCompany(sample.company); setDescription(sample.description)
    void run(sample)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const a = result?.analysis
  const t = a ? tier(a.overallFit) : null
  const gaps = a ? [...a.missingSkills.map((m) => ({ ...m, kind: 'missing' as const })), ...a.partialMatches.map((m) => ({ ...m, kind: 'partial' as const }))] : []
  const quote = (skill: string) => a?.requirements.find((r) => r.skill === skill)?.jobQuote

  return (
    <>
      <PageHeader kicker="2 · What fits you → 4 · What to do next" title="Job strategy" sub="Paste a job description to see how your profile compares, where the gaps are, and what to do about them." />

      <Card>
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Job title (optional)" maxLength={200} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" />
          <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company (optional)" maxLength={200} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" />
          <textarea
            value={description} onChange={(e) => setDescription(e.target.value)} maxLength={JOB_TEXT_MAX}
            placeholder="Paste the full job description, including the requirements section…"
            className="min-h-[220px] rounded-lg border border-zinc-200 px-3 py-2 text-sm leading-relaxed outline-none focus:border-indigo-400 sm:col-span-2"
          />
          <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
            <Button onClick={() => void run()} disabled={tooShort || state === 'loading'}>{state === 'loading' ? 'Analysing…' : 'Analyse fit'} <ArrowRight size={12} /></Button>
            <span className="text-xs text-zinc-400">{tooShort ? `${description.trim().length}/${JOB_TEXT_MIN} characters minimum` : `${description.length.toLocaleString()} characters`}</span>
            <span className="ml-auto flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
              Try a demo posting:
              {sampleJobs.map((j) => <button key={j.label} onClick={() => { setTitle(j.title); setCompany(j.company); setDescription(j.description); setState('idle'); setResult(null) }} className="cursor-pointer rounded-md border border-zinc-200 px-2 py-1 font-medium text-zinc-700 hover:bg-zinc-50">{j.label}</button>)}
            </span>
          </div>
        </div>
      </Card>

      {state === 'idle' && (
        <Card className="mt-4"><div className="pt-4"><EmptyState title="Paste a posting to get a job-specific strategy" hint="You’ll get a fit score, the evidence behind it, your biggest gaps, and tailored resume, portfolio, networking and interview advice." /></div></Card>
      )}
      {state === 'loading' && (
        <div className="mt-4" aria-busy="true">
          <p className="mb-3 text-sm text-zinc-500">Reading the posting, matching it against your evidence, then drafting your strategy…</p>
          <div className="grid gap-4 lg:grid-cols-2"><Skeleton className="h-48" /><Skeleton className="h-48" /><Skeleton className="h-40" /><Skeleton className="h-40" /></div>
        </div>
      )}
      {state === 'error' && <Card className="mt-4"><div className="pt-3"><ErrorState prefix="Couldn’t analyse this posting:" message={error} onRetry={tooShort ? undefined : () => void run()} /></div></Card>}

      {state === 'done' && a && t && (
        <div className="mt-4 space-y-4">
          {result?.fallbackReason && <p className="rounded-lg bg-amber-50 px-4 py-2.5 text-xs text-amber-800">AI analysis unavailable: {result.fallbackReason}. Showing the deterministic rules-based analysis instead.</p>}

          {/* 1. Fit score + skill breakdown */}
          <Card>
            <div className="grid gap-6 p-5 lg:grid-cols-[220px_1fr]">
              <div>
                <div className="text-xs font-medium text-zinc-500">{a.job.title}{a.job.company ? ` · ${a.job.company}` : ''}</div>
                <div className="tabular mt-2 text-5xl font-semibold leading-none tracking-tight">{a.overallFit}%</div>
                <div className="mt-3 flex items-center gap-2"><Badge tone={tierTone(t)}>{verdict[t]}</Badge><AiMark source={a.generatedBy} /></div>
                <Bar value={a.overallFit} color={scoreColor(a.overallFit)} className="mt-4" />
                <p className="mt-3 text-xs leading-snug text-zinc-500">{a.matchingSkills.length} of {a.requirements.length} requirements met at the level this posting seems to assume.</p>
              </div>
              <div className="space-y-4 text-[13px]">
                {([['Strong matches', a.matchingSkills, 'good', <Check size={12} key="c" />], ['Partial matches', a.partialMatches, 'warn', <Minus size={12} key="m" />], ['Missing', a.missingSkills, 'bad', <X size={12} key="x" />]] as const).map(([label, items, tone, icon]) => (
                  <div key={label}>
                    <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {items.length === 0 ? <span className="text-zinc-400">None</span> : items.map((s) => <Chip key={s.skill} tone={tone} icon={icon}>{s.skill} <span className="font-normal opacity-70">L{s.have}{s.have < s.need ? `/${s.need}` : ''}{s.importance === 'preferred' ? ' · preferred' : ''}</span></Chip>)}
                    </div>
                  </div>
                ))}
                <p className="border-t border-zinc-100 pt-3 text-[11px] leading-snug text-zinc-400">This compares your documented skills with the posting’s stated requirements. It explains competitiveness; it does not predict a hiring decision, which depends on many things not captured here.</p>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* 2. Why you match */}
            <Card>
              <CardHeader title="Why you match" sub="Posting wording paired with your evidence" right={<AiMark source={a.generatedBy} />} />
              {a.evidence.length ? <Bullets items={a.evidence} /> : <EmptyState title="No evidenced matches yet" hint="Link skills to projects or roles on your profile." />}
              <details className="border-t border-zinc-100 px-5 py-3 text-xs text-zinc-500">
                <summary className="cursor-pointer font-medium text-zinc-700">What the posting asks for ({a.requirements.length})</summary>
                <ul className="mt-2 space-y-1.5">
                  {a.requirements.map((r) => <li key={r.skill}><span className="font-medium text-zinc-800">{r.skill}</span> <Badge tone={r.importance === 'required' ? 'accent' : 'neutral'}>{r.importance}</Badge> <span className="italic">“{r.jobQuote}”</span></li>)}
                </ul>
              </details>
            </Card>

            {/* 3. Biggest gaps */}
            <Card>
              <CardHeader title="Biggest gaps" sub="Where the posting asks for more than your profile shows" />
              {gaps.length === 0 ? <EmptyState title="No gaps against the detected requirements" /> : (
                <div className="space-y-3 px-5 pb-4">
                  {gaps.slice(0, 5).map((g) => (
                    <div key={g.skill} className="text-[13px]">
                      <div className="mb-1.5 flex items-center justify-between gap-3"><span className="font-medium text-zinc-800">{g.skill} <Badge tone={g.kind === 'missing' ? 'bad' : 'warn'}>{g.kind}</Badge></span><span className="flex items-center gap-2"><LevelMeter have={g.have} need={g.need} /><span className="num w-14 text-right text-xs text-zinc-500">L{g.have} → ~{g.need}</span></span></div>
                      {quote(g.skill) && <p className="mt-1 text-[11px] italic text-zinc-400">“{quote(g.skill)}”</p>}
                    </div>
                  ))}
                </div>
              )}
              {a.concerns.length > 0 && <div className="border-t border-zinc-100 pt-3"><div className="px-5 pb-2 text-[10px] font-semibold uppercase tracking-wider text-amber-600">Concerns</div><Bullets items={a.concerns} /></div>}
            </Card>

            {/* 4–7. Strategy */}
            <Card><CardHeader title="Resume strategy" /><Bullets items={a.strategy.resume} /></Card>
            <Card><CardHeader title="Portfolio and project strategy" /><Bullets items={a.strategy.portfolio} /></Card>
            <Card><CardHeader title="Networking strategy" /><Bullets items={a.strategy.networking} /></Card>
            <Card><CardHeader title="Interview preparation" /><Bullets items={a.strategy.interview} /></Card>
          </div>

          {/* 8. Recommended next action */}
          <div className="rounded-xl bg-zinc-900 p-5 text-white sm:p-6">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300">Recommended next action</div>
            <p className="mt-2 text-xl font-semibold leading-snug tracking-tight">{a.recommendedActions[0].title}</p>
            <p className="mt-2 max-w-3xl text-sm text-zinc-400">{a.recommendedActions[0].rationale}</p>
            {a.recommendedActions.length > 1 && (
              <ul className="mt-4 space-y-1.5 border-t border-white/10 pt-4">
                {a.recommendedActions.slice(1).map((x) => <li key={x.title} className="flex gap-2.5 text-[13px] text-zinc-300"><span className="tabular mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/10 text-[11px]">{x.priority}</span><span><span className="font-medium text-white">{x.title}.</span> {x.rationale}</span></li>)}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  )
}
