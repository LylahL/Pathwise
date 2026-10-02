import { Hono } from 'hono'
import { z } from 'zod'
import { CandidateInputSchema } from '../../src/ai/candidateSchema'
import { JobFitInputSchema } from '../../src/ai/jobFitSchema'
import { CareerPathSchema } from '../../src/types'
import { analyzeWithLlm } from '../ai/analyze'
import { analyzeJobFitWithLlm } from '../ai/jobFit'
import { body } from '../http'

const Request = z.object({ input: CandidateInputSchema, paths: z.array(CareerPathSchema).min(1) })

export const analyze = new Hono()

// The client also sends `task` and `outputSchema`; the server uses its own schema and ignores them.
analyze.post('/analyze-candidate', async (c) => {
  const { input, paths } = await body(c, Request)
  return c.json(await analyzeWithLlm(input, paths))
})

analyze.post('/analyze-job-fit', async (c) => c.json(await analyzeJobFitWithLlm(await body(c, JobFitInputSchema))))
