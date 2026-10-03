# Options Quest (sim4options)

<img src="public/fox/wave.webp" alt="Kon the fox" width="120" align="right" />

A learning journey for options trading, one decision at a time. Kon the fox is your tutor.

Built on Cloudflare Workers: Vue 3 + Vite, a Hono API, an Agents SDK tutor (Durable Object), D1 for progress,
and Workers AI with the **Clef** decision models. Bring-your-own-key models go through AI Gateway.

> Education only. Not financial advice. Historical prices in the market moments are approximate reconstructions.

## Gallery

| | |
|---|---|
| ![Journey: the home banner with Kon and the seven levels](docs/screenshots/journey.webp) | ![A question card: Kon reacts to a wrong pick, Clef shows its probabilities](docs/screenshots/question.webp) |
| **Journey** — seven levels, 420 questions | **Questions** — Kon reacts; Clef scores every choice |
| ![A market moment checkpoint with its situation brief](docs/screenshots/moment.webp) | ![The knowledge-map modal centered on Iron condor](docs/screenshots/map.webp) |
| **Market moments** — decide from the brief, story revealed at the end | **Knowledge map** — explore links, then open the card |
| ![Ask Kon: the tutor sees the current question as context](docs/screenshots/kon.webp) | ![Search everything with Ctrl+K](docs/screenshots/search.webp) |
| **Ask Kon** — the tutor sees what is on screen | **Search** — terms, questions, moments, structures |

<p align="center"><img src="docs/screenshots/phone.webp" alt="Options Quest on a phone" width="260" /><br /><sub>On a phone: the nav moves into a drawer.</sub></p>

## What is inside

- **Journey:** 420 questions in 7 levels (72 hand-written, the rest generated and priced with Black–Scholes).
  Multi-step decisions, payoff charts, swipe and ← → navigation.
- **Skill cards and term map:** 130 linked terms with tag filters, a term cloud sized by use and coloured by
  mastery, and a relationship graph. `[[term]]` links open a term card from any text.
- **Market moments:** 100 real events (earnings gaps, Fed and CPI shocks, crashes, squeezes, deals and biotech, commodities and rates),
  three checkpoints each.
- **Simulator:** 14 structures (spreads, condors, butterflies, straddles, collars …). Move spot and IV, let time pass,
  watch P&L and the Greeks.
- **Clef:** a sparring trader that scores each choice (`/api/clef/spar`) and grades your written reasoning
  (`/api/clef/grade`).
- **Ask Kon:** a floating tutor chat. It sees what is on screen (question, term card, moment, simulator position),
  offers one-tap questions, and answers in Markdown.
- **Search everything:** Ctrl+K searches pages, terms, questions, moments and simulator structures.
- **Knowledge map modal:** click a term in the map to explore its links, then open the full card.
- **Answer cache:** repeated or similar questions on the same screen come from Kon's notes (D1 + Vectorize, bge-m3).
- **Web search:** Cloudflare Web Search API first, Exa as backup (`EXA_API_KEY` secret), when Clef says a question needs fresh facts.
- **BYOK:** OpenAI, Anthropic, Google, Workers AI models, or any OpenAI-compatible HTTPS endpoint.
- **Languages:** a globe menu translates the page with Google Translate, with Google Fonts for each script.
- **Private by default:** an access-token login protects every API route and the tutor.

## Setup

```bash
npm install
npx wrangler login

# 1. Create the database and put its id in wrangler.jsonc → d1_databases[0].database_id
npx wrangler d1 create sim4options
npm run db:migrate

# 2. Create an AI Gateway named "sim4options" and set CF_ACCOUNT_ID in wrangler.jsonc (needed for BYOK)

# 3. Answer cache index (bge-m3 = 1024 dims) + metadata filter
npx wrangler vectorize create sim4options-qa --dimensions 1024 --metric cosine
npx wrangler vectorize create-metadata-index sim4options-qa --propertyName ctx --type string

# 4. Optional backup web search
npx wrangler secret put EXA_API_KEY

# 5. Set one or more login tokens (comma-separated)
npx wrangler secret put ACCESS_TOKEN
cp .dev.vars.example .dev.vars   # local token for `npm run dev`

# 6. Run locally, then deploy
npm run db:migrate:local
npm run dev
npm run deploy
```

Check content after edits: `npx -y tsx scripts/check-content.ts` (term links, answers, ids).

## Notes

- Model ids live in `wrangler.jsonc` vars. The Kimi model runs with thinking off so answers are not empty.
- BYOK keys stay in the browser's localStorage and are sent per request through AI Gateway; the server never stores them.
- Kon's poses were made with Grok (`design/edit.sh`) from one master design and cut out with `design/cutout.py`.
  `design/` also holds the prompts, the style picker and the character sheet.

## Layout

```
worker/     Hono API, auth, Clef + LLM client, TutorAgent
shared/     types, Black–Scholes, question generator
content/    terms, hand-written questions, market moments (+ *_more.ts second batch)
src/        Vue app: views, components (FoxSticker, StepPlayer, ChatFloat …), Pinia store
public/fox/ Kon's poses (transparent WebP)
migrations/ D1 schema
scripts/    content checker
design/     image generation scripts and design pages
```
