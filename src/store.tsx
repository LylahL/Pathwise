import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { generateReport } from './ai'
import { careerPaths, demoApplications, demoExperiments, demoJobSkills, demoOpportunities, demoProfile } from './data/seed'
import { fit, readiness, rankPaths, summary } from './lib/analytics'
import type { AIReport, Experiment, InsightChain } from './types'

function useStore() {
  const [profile, setProfile] = useState(demoProfile)
  const [applications] = useState(demoApplications)
  const [experiments, setExperiments] = useState<Experiment[]>(demoExperiments)
  const [report, setReport] = useState<AIReport | null>(null)
  const [reportError, setReportError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const modified = profile !== demoProfile

  // AI report is re-derived whenever the underlying data changes.
  useEffect(() => {
    let live = true
    setReportError(null)
    generateReport({ profile, applications, paths: careerPaths, jobs: demoJobSkills })
      .then((r) => live && setReport(r))
      .catch((e: unknown) => live && setReportError(e instanceof Error ? e.message : 'Could not generate insights'))
    return () => { live = false }
  }, [profile, applications, attempt])

  const derived = useMemo(() => ({
    summary: summary(applications),
    ranked: rankPaths(profile, careerPaths, applications),
    readiness: readiness(profile, careerPaths, applications),
    opportunities: demoOpportunities
      .map((o) => ({ ...o, ...fit(profile.skills, o.requirements) }))
      .sort((a, b) => b.score - a.score),
  }), [profile, applications])

  /** AI-proposed experiments that haven't been launched yet. */
  const proposals: Experiment[] = (report?.chains ?? [])
    .filter((c) => !experiments.some((e) => e.chainId === c.id))
    .map((c) => chainToExperiment(c))

  return {
    profile, applications, experiments, report, reportError, modified, proposals, ...derived,
    retryReport: () => { setReport(null); setAttempt((n) => n + 1) },
    setSkill: (skill: string, level: number) => setProfile((p) => ({ ...p, skills: { ...p.skills, [skill]: level } })),
    resetDemo: () => { setProfile(demoProfile); setExperiments(demoExperiments) },
    launch: (e: Experiment) => setExperiments((xs) => [{ ...e, status: 'running' }, ...xs]),
    complete: (id: string) => setExperiments((xs) => xs.map((e) => (e.id === id ? { ...e, status: 'completed' } : e))),
  }
}

export function chainToExperiment(c: InsightChain): Experiment {
  return { id: `e-${c.id}`, chainId: c.id, ...c.experiment, status: 'proposed', origin: 'ai-proposed' }
}

type Store = ReturnType<typeof useStore>
const Ctx = createContext<Store | null>(null)
export const StoreProvider = ({ children }: { children: ReactNode }) => <Ctx.Provider value={useStore()}>{children}</Ctx.Provider>
export const useApp = () => {
  const s = useContext(Ctx)
  if (!s) throw new Error('StoreProvider missing')
  return s
}
