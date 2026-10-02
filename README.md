# Pathwise
2026 BYU Homecoming Hackathon

AI-powered career intelligence dashboard: turns the job search into a data problem.

```
npm install && npm run dev
```

## Structure
- `src/types.ts` – zod schemas for domain data and AI output (`AIReportSchema`)
- `src/data/seed.ts` – **demo data only** (fictional persona and companies)
- `src/lib/analytics.ts` – funnel, segments, fit, readiness (pure functions)
- `src/ai/` – insight generation, separate from UI. `engine.ts` is a deterministic rules engine that emits the
  Evidence → Inference → Gap → Recommendation → Experiment shape. Set `VITE_AI_ENDPOINT` to POST the snapshot to an
  LLM-backed service instead; responses are validated with zod and fall back to the engine on failure.
- `src/components/`, `src/pages/` – reusable UI and the seven views
