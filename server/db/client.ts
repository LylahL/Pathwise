import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { config } from '../config'

if (config.dbPath !== ':memory:') mkdirSync(dirname(config.dbPath), { recursive: true })
export const db = new DatabaseSync(config.dbPath)

export const TABLES = ['users', 'experiences', 'skills', 'jobs', 'applications', 'experiments'] as const
export type Table = (typeof TABLES)[number]

db.exec('PRAGMA journal_mode = WAL')
// One table per entity: a validated JSON document per row, with user_id broken out for scoping.
for (const t of TABLES) {
  db.exec(`CREATE TABLE IF NOT EXISTS ${t} (id TEXT PRIMARY KEY, user_id TEXT, data TEXT NOT NULL);
           CREATE INDEX IF NOT EXISTS ${t}_user ON ${t}(user_id);`)
}

export function tx<T>(fn: () => T): T {
  db.exec('BEGIN')
  try {
    const out = fn()
    db.exec('COMMIT')
    return out
  } catch (e) {
    db.exec('ROLLBACK')
    throw e
  }
}
