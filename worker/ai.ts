import type { Env, Byok, ChatMsg } from './env'

// ───────────────────────── Clef decision model
// Clef is Jev-API compatible: { state, questions } → typed answers with probabilities.
export type ClefQuestion =
  | { type: 'noul'; instructions: string }
  | { type: 'choice'; instructions: string; criteria: Record<string, string> }
  | { type: 'score'; instructions: string; criteria: string[] }

export interface ClefResult {
  ok: boolean
  model: string
  ms: number
  fields: Record<string, { value: unknown; probs?: Record<string, number> }>
  raw?: unknown
  error?: string
}

export async function clef(env: Env, state: string, questions: Record<string, ClefQuestion>, flash = false): Promise<ClefResult> {
  const model = flash ? env.CLEF_FLASH_MODEL : env.CLEF_MODEL
  const t0 = Date.now()
  try {
    const raw: any = await env.AI.run(model as any, { model: flash ? 'clef-flash' : 'clef', state, questions } as any, {
      gateway: { id: env.AI_GATEWAY_ID },
    } as any)
    return { ok: true, model, ms: Date.now() - t0, fields: normalizeClef(raw), raw }
  } catch (e: any) {
    return { ok: false, model, ms: Date.now() - t0, fields: {}, error: String(e?.message ?? e) }
  }
}

/** Tolerant parser: accepts {answers:{k:{value,probabilities}}}, {k:{...}}, or {k: value}. */
function normalizeClef(raw: any): ClefResult['fields'] {
  const body = raw?.result ?? raw?.answers ?? raw?.output ?? raw ?? {}
  const out: ClefResult['fields'] = {}
  for (const [k, v] of Object.entries<any>(body)) {
    if (v && typeof v === 'object' && typeof v.noul === 'number') {
      // Yes/no answer: `noul` is P(yes).
      out[k] = { value: v.noul >= 0.5, probs: { yes: v.noul, no: 1 - v.noul } }
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      const probs = v.probabilities ?? v.probs ?? v.distribution ?? v.scores
      let value = v.value ?? v.answer ?? v.choice ?? (probs ? argmax(probs) : undefined)
      // Score answer: show the criterion label, not its index.
      if (v.legend && typeof value === 'string' && value in v.legend) value = v.legend[value]
      out[k] = { value, probs: probs && typeof probs === 'object' ? probs : undefined }
    } else out[k] = { value: v }
  }
  return out
}
const argmax = (p: Record<string, number>) => Object.entries(p).sort((a, b) => b[1] - a[1])[0]?.[0]

// ───────────────────────── LLM (Workers AI default, BYOK via AI Gateway)
/** Which model answers, for cache records and the "answered by" line. */
export const modelName = (env: Env, byok?: Byok | null) => modelBase(env, byok) + (byok?.thinking && byok.thinking !== 'off' ? ` (thinking ${byok.thinking})` : '')
const modelBase = (env: Env, byok?: Byok | null) =>
  byok?.provider === 'openai-compatible' ? `compatible:${byok.model}` : byok?.key && byok.provider !== 'workers-ai' ? `${byok.provider}/${byok.model}` : byok?.provider === 'workers-ai' && byok.model ? byok.model : env.LLM_MODEL

/** Base URL for an OpenAI-compatible server: https only, no credentials, path ends without a slash. */
export function compatUrl(raw?: string) {
  let u: URL
  try { u = new URL(String(raw ?? '').trim()) } catch { throw new Error('Base URL is not a valid URL.') }
  if (u.protocol !== 'https:') throw new Error('Base URL must start with https:// (the Worker cannot reach http or local addresses).')
  if (u.username || u.password) throw new Error('Put the key in the API key field, not in the URL.')
  return `${u.origin}${u.pathname.replace(/\/+$/, '').replace(/\/chat\/completions$/, '')}/chat/completions`
}

/** Thinking settings for a Workers AI model family. Unknown families get nothing (strict input schemas). */
function workersThinking(model: string, t: 'off' | 'low' | 'high') {
  if (/deepseek-v4/i.test(model)) return { chat_template_kwargs: { enable_thinking: t !== 'off' }, reasoning_effort: t === 'off' ? 'none' : t }
  if (/kimi/i.test(model)) return { chat_template_kwargs: { thinking: t !== 'off' } }
  // Not verified per model: chat() retries without these if the model rejects them.
  if (/qwen3|glm-[45]/i.test(model)) return { chat_template_kwargs: { enable_thinking: t !== 'off' } }
  return {}
}

export async function chat(env: Env, messages: ChatMsg[], byok?: Byok | null, maxTokens = 700): Promise<string> {
  const thinking = byok?.thinking ?? 'off'
  // Reasoning spends tokens before the answer; give it room.
  if (thinking !== 'off') maxTokens = Math.max(maxTokens, thinking === 'high' ? 6000 : 2500)
  if (byok?.provider === 'openai-compatible') {
    const res = await fetch(compatUrl(byok.baseUrl), {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(byok.key ? { authorization: `Bearer ${byok.key}` } : {}) },
      body: JSON.stringify({ model: byok.model, messages, max_tokens: maxTokens, ...(thinking !== 'off' ? { reasoning_effort: thinking } : {}) }),
    })
    if (!res.ok) throw new Error(`OpenAI-compatible server ${res.status}: ${(await res.text()).slice(0, 300)}`)
    const j: any = await res.json()
    const text = j.choices?.[0]?.message?.content ?? ''
    if (!text) throw new Error('The OpenAI-compatible server returned no text.')
    return text
  }
  if (byok?.key && byok.provider !== 'workers-ai') {
    // Through the AI binding, so the gateway can require authentication without a separate token.
    // The learner's provider key goes in the provider headers; byok_only on the gateway blocks Unified Billing fallback.
    const res: Response = await (env.AI as any).gateway(env.AI_GATEWAY_ID).run({
      provider: 'compat',
      endpoint: 'chat/completions',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${byok.key}` },
      query: { model: `${byok.provider}/${byok.model}`, messages, max_tokens: maxTokens, ...(thinking !== 'off' && byok.provider === 'openai' ? { reasoning_effort: thinking } : {}) },
    })
    if (!res.ok) throw new Error(`BYOK ${byok.provider} ${res.status}: ${(await res.text()).slice(0, 300)}`)
    const j: any = await res.json()
    return j.choices?.[0]?.message?.content ?? ''
  }
  const model = byok?.provider === 'workers-ai' && byok.model ? byok.model : env.LLM_MODEL
  // Reasoning models think by default and can spend all of max_tokens first; the default here is off.
  const extra = workersThinking(model, thinking)
  const run = (x: object) => env.AI.run(model as any, { messages, max_tokens: maxTokens, ...x } as any, { gateway: { id: env.AI_GATEWAY_ID } } as any)
  let out: any
  try { out = await run(extra) }
  catch (e) { if (!Object.keys(extra).length) throw e; out = await run({}) } // model rejected the thinking options
  const text = out?.response || out?.choices?.[0]?.message?.content || (typeof out === 'string' ? out : '')
  if (!text) throw new Error(`${model} returned no text (finish_reason: ${out?.choices?.[0]?.finish_reason ?? 'unknown'})`)
  return text
}

export const TUTOR_SYSTEM = `You are an options-trading tutor inside "Options Quest", a learning app.
Explain clearly and briefly (under 180 words unless asked), using concrete numbers.
Reference terms the learner should review as [[term-id]] using ids like call, put, delta, gamma, theta, vega, iv, iv-rank, iv-crush, straddle, iron-condor, credit-spread, breakeven.
This is education, not financial advice. Never tell the user to make a specific real trade.`
