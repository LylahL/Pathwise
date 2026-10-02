import { demoDb } from '../../src/data/demoDb'
import { tx } from './client'
import { repos } from './repo'

function load() {
  for (const k of Object.keys(repos) as (keyof typeof repos)[]) {
    for (const row of demoDb[k]) (repos[k].upsert as (r: unknown) => unknown)(row)
  }
}

/** Seed the demo persona on first run. */
export function seedIfEmpty() {
  if (repos.users.count() === 0) tx(load)
}

/** Wipe everything and reload the demo persona (dev only). */
export function resetSeed() {
  tx(() => {
    for (const r of Object.values(repos)) r.clear()
    load()
  })
}
