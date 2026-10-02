import type { z } from 'zod'
import { DbSchema } from '../../src/model'
import { db } from './client'
import type { Table } from './client'

/** Typed document repository: every read and write passes through the zod schema. */
export function makeRepo<S extends z.ZodType<{ id: string; userId?: string }>>(table: Table, schema: S) {
  type T = z.infer<S>
  const parse = (r: Record<string, unknown>): T => schema.parse(JSON.parse(r.data as string))
  return {
    list(userId?: string, opts: { newestFirst?: boolean } = {}): T[] {
      const order = opts.newestFirst ? 'DESC' : 'ASC'
      const rows = userId
        ? db.prepare(`SELECT data FROM ${table} WHERE user_id = ? ORDER BY rowid ${order}`).all(userId)
        : db.prepare(`SELECT data FROM ${table} ORDER BY rowid ${order}`).all()
      return rows.map(parse)
    },
    get(id: string): T | undefined {
      const row = db.prepare(`SELECT data FROM ${table} WHERE id = ?`).get(id)
      return row ? parse(row) : undefined
    },
    upsert(row: T): T {
      const valid = schema.parse(row)
      db.prepare(`INSERT INTO ${table} (id, user_id, data) VALUES (?, ?, ?)
                  ON CONFLICT(id) DO UPDATE SET user_id = excluded.user_id, data = excluded.data`)
        .run(valid.id, valid.userId ?? null, JSON.stringify(valid))
      return valid
    },
    count: () => (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n,
    clear: () => void db.exec(`DELETE FROM ${table}`),
  }
}

const shape = DbSchema.shape
export const repos = {
  users: makeRepo('users', shape.users.element),
  experiences: makeRepo('experiences', shape.experiences.element),
  skills: makeRepo('skills', shape.skills.element),
  jobs: makeRepo('jobs', shape.jobs.element),
  applications: makeRepo('applications', shape.applications.element),
  experiments: makeRepo('experiments', shape.experiments.element),
}
