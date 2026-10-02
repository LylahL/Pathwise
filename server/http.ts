import type { Context } from 'hono'
import type { z } from 'zod'

type Status = 400 | 401 | 403 | 404 | 422 | 429 | 500 | 502 | 503

export class HttpError extends Error {
  status: Status
  code: string
  constructor(status: Status, message: string, code = 'error') {
    super(message)
    this.status = status
    this.code = code
  }
}

/** Parse and validate a JSON body; throws HttpError(400) with the first problem. */
export async function body<S extends z.ZodType>(c: Context, schema: S): Promise<z.infer<S>> {
  const raw: unknown = await c.req.json().catch(() => { throw new HttpError(400, 'Body must be valid JSON', 'invalid_json') })
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    const i = parsed.error.issues[0]
    throw new HttpError(400, `Invalid body at "${i.path.join('.')}": ${i.message}`, 'invalid_body')
  }
  return parsed.data
}
