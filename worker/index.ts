import { Hono } from 'hono'
import { routeAgentRequest } from 'agents'
import type { Env, Byok, SearchOpts } from './env'
import { chat, clef, modelName, TUTOR_SYSTEM } from './ai'
import { lookup, store } from './cache'
import { webSearch } from './search'
import { listModels } from './models'
import { isAuthed, isConfigured, login, logoutCookie } from './auth'
export { TutorAgent } from './agent'

const app = new Hono<{ Bindings: Env }>()

app.get('/api/health', (c) => c.json({ ok: true, llm: c.env.LLM_MODEL, clef: c.env.CLEF_MODEL }))

/** Login with an access token; sets the session cookie. */
app.post('/api/login', async (c) => {
  if (!isConfigured(c.env)) return c.json({ ok: false, error: 'No access token is set on the server.' }, 503)
  const { token } = await c.req.json<{ token?: string }>().catch(() => ({ token: '' }))
  const cookie = await login(token ?? '', c.env)
  if (!cookie) return c.json({ ok: false, error: 'That access token is not valid.' }, 401)
  c.header('set-cookie', cookie)
  return c.json({ ok: true })
})
app.post('/api/logout', (c) => { c.header('set-cookie', logoutCookie); return c.json({ ok: true }) })
app.get('/api/session', async (c) => c.json({ ok: await isAuthed(c.req.raw, c.env) }))

/** Clef sparring trader: picks its own answer for a decision step, with probabilities. */
app.post('/api/clef/spar', async (c) => {
  const { scenario, prompt, choices, flash } = await c.req.json<{ scenario: string; prompt: string; choices: { id: string; label: string }[]; flash?: boolean }>()
  const criteria = Object.fromEntries(choices.map((ch) => [ch.id, ch.label]))
  const r = await clef(c.env, `Options trading scenario: ${scenario}`, {
    pick: { type: 'choice', instructions: `As an experienced options trader: ${prompt}`, criteria },
    confidence: { type: 'score', instructions: 'How clear-cut is this decision?', criteria: ['Coin flip', 'Leaning', 'Clear', 'Textbook'] },
  }, !!flash)
  return c.json(r)
})

/** Grade a written rationale with Clef (typed, calibrated). */
app.post('/api/clef/grade', async (c) => {
  const { scenario, decision, rationale } = await c.req.json<{ scenario: string; decision: string; rationale: string }>()
  const r = await clef(c.env, `Scenario: ${scenario}\nLearner decision: ${decision}\nLearner rationale: ${rationale}`, {
    direction: { type: 'noul', instructions: 'Does the rationale state a clear directional or neutral view?' },
    volatility: { type: 'noul', instructions: 'Does it consider implied volatility or IV crush?' },
    risk: { type: 'noul', instructions: 'Does it identify the max loss or main risk?' },
    quality: { type: 'score', instructions: 'Overall reasoning quality', criteria: ['Weak', 'Partial', 'Solid', 'Expert'] },
  })
  return c.json(r)
})

/** LLM explanation of a step, optionally informed by Clef's probabilities. */
app.post('/api/explain', async (c) => {
  const b = await c.req.json<{ scenario: string; prompt: string; choices: string[]; correct: string; picked: string; why: string; clef?: unknown; byok?: Byok }>()
  const user = `Scenario: ${b.scenario}
Question: ${b.prompt}
Choices: ${b.choices.join(' | ')}
Correct: ${b.correct}. Learner picked: ${b.picked}.
Short key: ${b.why}
${b.clef ? `Clef decision model probabilities: ${JSON.stringify(b.clef)}` : ''}
Explain why the correct answer wins, why the learner's pick ${b.picked === b.correct ? 'is right' : 'falls short'}, and one way the answer would change if a variable changed.`
  try {
    // Same step, same pick → same explanation: serve it from the cache unless a fresh one is asked for.
    const fresh = c.req.query('fresh') === '1'
    if (!fresh) {
      const hit = await lookup(c.env, 'explain', user, 'explain')
      if (hit) return c.json({ ok: true, text: hit.answer, cached: { similarity: hit.similarity, exact: hit.exact } })
    }
    const text = await chat(c.env, [{ role: 'system', content: TUTOR_SYSTEM }, { role: 'user', content: user }], b.byok)
    c.executionCtx.waitUntil(store(c.env, 'explain', user, 'explain', text, [], modelName(c.env, b.byok)).catch(() => {}))
    return c.json({ ok: true, text })
  } catch (e: any) {
    return c.json({ ok: false, error: String(e?.message ?? e) }, 502)
  }
})

/** Web search (signed-in): which provider answered, or why each one failed. Settings uses it as "Test search". */
app.post('/api/websearch', async (c) => {
  const b = await c.req.json<{ q?: string; search?: SearchOpts }>().catch(() => ({} as { q?: string; search?: SearchOpts }))
  const q = String(b.q ?? '').trim()
  if (!q) return c.json({ ok: false, error: 'Enter a search query.' }, 400)
  const r = await webSearch(c.env, q, b.search ?? {})
  return c.json({ ok: !!r?.results.length, ...r })
})

/** What search the server offers by default (no search is run). */
app.get('/api/search/config', (c) => c.json({
  ok: true, default: 'cloudflare-web-search', cfProvider: c.env.SEARCH_PROVIDER || 'ceramic', gateway: c.env.AI_GATEWAY_ID,
  exaServerKey: !!c.env.EXA_API_KEY, defaultModel: c.env.LLM_MODEL,
}))

/** Model list from the learner's provider (key used once, never stored). */
app.post('/api/models', async (c) => {
  const b = await c.req.json<Pick<Byok, 'provider' | 'key' | 'baseUrl'>>()
  try { return c.json({ ok: true, models: await listModels(c.env, b) }) }
  catch (e: any) { return c.json({ ok: false, error: String(e?.message ?? e) }, 400) }
})

/** Progress */
app.post('/api/attempts', async (c) => {
  const a = await c.req.json<{ userId: string; questionId: string; step: number; choice: string; correct: boolean; terms: string[]; rationale?: string; clefScore?: number }>()
  if (!a.userId || a.userId.length > 64) return c.json({ ok: false }, 400)
  const now = Math.floor(Date.now() / 1000)
  const stmts = [
    c.env.DB.prepare('INSERT INTO attempts (user_id, question_id, step, choice, correct, rationale, clef_score) VALUES (?,?,?,?,?,?,?)')
      .bind(a.userId, a.questionId, a.step, a.choice, a.correct ? 1 : 0, a.rationale ?? null, a.clefScore ?? null),
    ...(a.terms ?? []).slice(0, 10).map((t) =>
      c.env.DB.prepare(`INSERT INTO mastery (user_id, term_id, seen, correct, due_at) VALUES (?,?,1,?,?)
        ON CONFLICT(user_id, term_id) DO UPDATE SET seen = seen + 1, correct = correct + excluded.correct, due_at = excluded.due_at`)
        .bind(a.userId, t, a.correct ? 1 : 0, now + (a.correct ? 3 * 86400 : 3600))),
  ]
  await c.env.DB.batch(stmts)
  return c.json({ ok: true })
})

app.get('/api/mastery/:uid', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT term_id, seen, correct, due_at FROM mastery WHERE user_id = ?').bind(c.req.param('uid')).all()
  return c.json({ ok: true, mastery: results })
})

const PUBLIC = new Set(['/api/health', '/api/login', '/api/logout', '/api/session'])

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(req.url)
    const isApi = url.pathname.startsWith('/api/') || url.pathname.startsWith('/agents/')
    if (isApi && !PUBLIC.has(url.pathname) && !(await isAuthed(req, env))) {
      return Response.json({ ok: false, error: 'Sign in with your access token.' }, { status: 401 })
    }
    const agentRes = await routeAgentRequest(req, env)
    if (agentRes) return agentRes
    if (url.pathname.startsWith('/api/')) return app.fetch(req, env, ctx)
    return env.ASSETS.fetch(req)
  },
} satisfies ExportedHandler<Env>
