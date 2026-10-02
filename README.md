# Options Quest (sim4options)

Options-trading learning journey on Cloudflare Workers: Vue 3 + Vite (Vite+ compatible), Hono API,
Agents SDK tutor (Durable Object), D1 progress, Workers AI with **Clef** decision models, BYOK via AI Gateway.

## What's in phase 1
- 210 questions across 7 levels (34 authored + parametric variants recomputed with Black-Scholes)
- 65 linked terms: skill cards, tag filters, term cloud sized by usage and colored by mastery, relationship graph
- Inline `[[term]]` links open a review sheet from any question
- Multi-step decisions with forward/back, swipe and ← → navigation
- **Clef** sparring trader (`/api/clef/spar`), rationale grading (`/api/clef/grade`), Clef-flash chat routing
- LLM explanations (`/api/explain`) and floating tutor chat via the Agents SDK
- Simulator: presets, Greeks, P&L, time and IV changes
- 7 market moments as the final test (54 planned)

## Setup
```bash
cd ~/dev/sim4options
npm install            # or: vp install
npx wrangler login

# 1. create the database, paste the id into wrangler.jsonc → d1_databases[0].database_id
npx wrangler d1 create sim4options
npm run db:migrate

# 2. create an AI Gateway named "sim4options" in the dashboard (AI → AI Gateway)
#    and set CF_ACCOUNT_ID in wrangler.jsonc (needed for BYOK)

# 3. run locally / deploy
npm run db:migrate:local
npm run dev            # or: vp dev
npm run deploy
```

## Notes
- Model ids live in `wrangler.jsonc` vars. `CLEF_FLASH_MODEL` is `@cf/cloudflare/clef-flash`; confirm the id in the Workers AI catalog.
- Clef's response shape is normalized in `worker/ai.ts → normalizeClef`; adjust if the docs differ.
- BYOK keys are kept in the browser's localStorage and forwarded per request through AI Gateway; the server never stores them.
- Historical prices in `content/moments.ts` are approximate reconstructions for teaching.
- Education only, not financial advice.

## Layout
```
worker/    Hono API, Clef + LLM client, TutorAgent
shared/    types, Black-Scholes, question generator
content/   terms, authored questions, moments
src/       Vue app (views, components, Pinia store)
migrations/ D1 schema
```
