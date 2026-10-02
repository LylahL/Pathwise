/** Typed client for the Pathwise backend. Enabled only when VITE_API_BASE is set (see `npm run dev:full`). */
import type { Experiment, Skill } from './model'

const BASE = import.meta.env.VITE_API_BASE as string | undefined
export const apiEnabled = Boolean(BASE)

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${method} ${path} failed (${res.status})`)
  return res.json() as Promise<T>
}

export type ExperimentInput = Omit<Experiment, 'userId'>

export const api = {
  bootstrap: () => call<{ skills: Skill[]; experiments: Experiment[] }>('GET', '/bootstrap'),
  putSkill: (name: string, level: number) => call<Skill>('PUT', `/skills/${encodeURIComponent(name)}`, { level }),
  createExperiment: (e: ExperimentInput) => call<Experiment>('POST', '/experiments', e),
  patchExperiment: (id: string, patch: Partial<Pick<Experiment, 'status' | 'result' | 'confidence'>>) => call<Experiment>('PATCH', `/experiments/${id}`, patch),
  reset: () => call<{ ok: true }>('POST', '/reset'),
}
