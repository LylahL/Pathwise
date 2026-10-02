# Pathwise
2026 BYU Homecoming Hackathon

AI-powered career intelligence dashboard: turns the job search into a data problem.
All data in the repo is **demo data** (fictional persona and companies).

## Run

```
npm install
npm run dev        # frontend only, in-memory, rules-based analysis
npm run dev:full   # frontend + API (http://localhost:8787), persisted to SQLite
```

To enable LLM-powered candidate analysis, copy `.env.example` to `.env.local` and set `GEMINI_API_KEY`
(or `ANTHROPIC_API_KEY`, optionally with `AI_PROVIDER`). Keys are read only by the server; never prefix them with
`VITE_`. Without a key the app still works: the API returns 503 and the UI falls back to the deterministic rules
engine, saying why.

`npm run db:reset` deletes the local database; it is re-seeded on next start.

## Structure
- `src/model.ts` – zod schemas for the data model (shared by server and frontend)
- `src/types.ts` – UI view shapes; `src/data/selectors.ts` derives them from the model tables
- `src/data/demoDb.ts` – **demo seed data**
- `src/lib/analytics.ts` – funnel, segments, fit, readiness (pure functions)
- `src/ai/` – AI contracts and fallbacks. `candidateSchema.ts` is the validated contract for candidate analysis,
  `analyzeRules.ts` is the deterministic implementation, `analyzeCandidate.ts` calls the backend and falls back
  to the rules engine on any failure
- `src/ai/jobFit*.ts` – job-specific fit. `jobFitSchema.ts` is the contract, `jobFitScoring.ts` computes the score and
  match/partial/missing split from extracted requirements (shared by both paths), `jobFitRules.ts` extracts
  requirements from pasted text and builds the evidence-based strategy, `analyzeJobFit.ts` calls the backend with fallback.
  Demo link: `/job-strategy?sample=0`
- `src/api.ts` – typed client for the backend (enabled when `VITE_API_BASE` is set)
- `server/` – Hono API on Node
  - `routes/data.ts` – skills, experiments, jobs, applications (validated writes), `/api/bootstrap`, `/api/reset` (dev only)
  - `routes/analyze.ts` + `ai/analyze.ts` – `POST /api/analyze-candidate`: Gemini or Claude (`ai/providers/`)
    with schema-constrained JSON output. The model writes the narrative; the server owns the numbers (fit scores, missing skills, skill support)
    and drops evidence that cites a source not in the profile
  - `ai/jobFit.ts` – `POST /api/analyze-job-fit`: the model extracts requirements (with verbatim quotes) and writes the
    narrative; the server drops requirements whose quote is not in the posting, computes the score itself, and strips
    hiring-prediction language
  - `db/` – SQLite via `node:sqlite`; one table per entity holding zod-validated JSON
