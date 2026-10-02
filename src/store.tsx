import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { analyzeCandidate, generateReport } from './ai'
import type { AnalysisResult } from './ai'
import { careerPaths, demoApplications, demoDb, demoExperiments, demoJobSkills, demoOpportunities, demoProfile, DEMO_USER_ID } from './data/seed'
import { experimentView, toCandidateInput } from './data/selectors'
import { api, apiEnabled } from './api'
import { fit, readiness, rankPaths, summary } from './lib/analytics'
import type { AIReport, Experiment, InsightChain } from './types'

function useStore() {
  const [profile, setProfile] = useState(demoProfile)
  const [applications] = useState(demoApplications)
  const [experiments, setExperiments] = useState<Experiment[]>(demoExperiments)
  const [report, setReport] = useState<AIReport | null>(null)
  const [reportError, setReportError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [analysisAttempt, setAnalysisAttempt] = useState(0)
  const analysed = useRef(false)
  const [apiStatus, setApiStatus] = useState<'off' | 'connecting' | 'online' | 'offline'>(apiEnabled ? 'connecting' : 'off')
  const modified = Object.keys(demoProfile.skills).some((k) => profile.skills[k] !== demoProfile.skills[k])
  const offline = () => setApiStatus('offline')

  // Load persisted edits from the backend when one is configured; otherwise stay in-memory.
  useEffect(() => {
    if (!apiEnabled) return
    let live = true
    api.bootstrap()
      .then((b) => {
        if (!live) return
        setProfile((p) => ({ ...p, skills: { ...p.skills, ...Object.fromEntries(b.skills.map((s) => [s.name, s.level])) } }))
        setExperiments(b.experiments.map(experimentView))
        setApiStatus('online')
      })
      .catch(() => live && offline())
    return () => { live = false }
  }, [])

  // AI report is re-derived whenever the underlying data changes.
  useEffect(() => {
    let live = true
    setReportError(null)
    generateReport({ profile, applications, paths: careerPaths, jobs: demoJobSkills })
      .then((r) => live && setReport(r))
      .catch((e: unknown) => live && setReportError(e instanceof Error ? e.message : 'Could not generate insights'))
    return () => { live = false }
  }, [profile, applications, attempt])

  // Candidate analysis re-runs when skills change (debounced after the first run so slider drags don't spam an LLM endpoint).
  useEffect(() => {
    let live = true
    setAnalysisError(null)
    const timer = setTimeout(() => {
      analyzeCandidate(toCandidateInput(demoDb, DEMO_USER_ID, profile.skills), { paths: careerPaths })
        .then((r) => { analysed.current = true; if (live) setAnalysis(r) })
        .catch((e: unknown) => live && setAnalysisError(e instanceof Error ? e.message : 'Could not analyse profile'))
    }, analysed.current ? 400 : 0)
    return () => { live = false; clearTimeout(timer) }
  }, [profile, analysisAttempt])

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
    profile, applications, experiments, report, reportError, analysis, analysisError, apiStatus,
    retryAnalysis: () => { setAnalysis(null); setAnalysisAttempt((n) => n + 1) },
    modified, proposals, ...derived,
    retryReport: () => { setReport(null); setAttempt((n) => n + 1) },
    setSkill: (skill: string, level: number) => {
      setProfile((p) => ({ ...p, skills: { ...p.skills, [skill]: level } }))
      if (apiEnabled) api.putSkill(skill, level).catch(offline)
    },
    resetDemo: () => {
      setProfile(demoProfile); setExperiments(demoExperiments)
      if (apiEnabled) api.reset().catch(offline)
    },
    launch: (e: Experiment) => {
      setExperiments((xs) => [{ ...e, status: 'running' }, ...xs])
      if (apiEnabled) {
        api.createExperiment({ id: e.id, chainId: e.chainId, title: e.title, hypothesis: e.hypothesis, control: 'Current approach', change: e.change, sampleSize: e.targetN, result: null, confidence: 'low', status: 'running', origin: e.origin }).catch(offline)
      }
    },
    complete: (id: string) => {
      setExperiments((xs) => xs.map((e) => (e.id === id ? { ...e, status: 'completed' } : e)))
      if (apiEnabled) api.patchExperiment(id, { status: 'completed' }).catch(offline)
    },
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
