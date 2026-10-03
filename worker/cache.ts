import type { Env } from './env'

// Answer cache: exact hit in D1 first, then a similar question on the same screen via Vectorize.
// Similar questions only match when the screen context is identical (metadata filter on ctx),
// so two different questions about one quiz card never share an answer by accident.
const EMBED_MODEL = '@cf/baai/bge-m3' // multilingual, 1024 dims
// bge-m3 cosine: paraphrases 0.89–0.95, closest different question (breakeven vs max loss) 0.79.
export const SIMILARITY_MIN = 0.86

export interface CachedAnswer { id: string; answer: string; sources: { title: string; url: string }[]; similarity: number; exact: boolean }

const enc = new TextEncoder()
async function sha(s: string) {
  const d = await crypto.subtle.digest('SHA-256', enc.encode(s))
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
const norm = (q: string) => q.toLowerCase().replace(/\s+/g, ' ').replace(/[?!.。？！]+$/u, '').trim()

export async function keys(kind: string, screen: string, question: string) {
  const ctx = await sha(`${kind}\n${screen}`)
  return { ctx, key: await sha(`${ctx}\n${norm(question)}`) }
}

async function embed(env: Env, text: string): Promise<number[] | null> {
  try {
    const out: any = await env.AI.run(EMBED_MODEL as any, { text: [text.slice(0, 2000)] } as any)
    return out?.data?.[0] ?? null
  } catch { return null }
}

export async function lookup(env: Env, kind: string, screen: string, question: string): Promise<CachedAnswer | null> {
  const { ctx, key } = await keys(kind, screen, question)
  const row = await env.DB.prepare('SELECT id, answer, sources FROM qa_cache WHERE key_hash = ? ORDER BY created_at DESC LIMIT 1').bind(key).first<any>()
  if (row) return hit(env, row, 1, true)
  if (!env.QA_INDEX) return null
  const v = await embed(env, question)
  if (!v) return null
  try {
    const res = await env.QA_INDEX.query(v, { topK: 1, filter: { ctx }, returnMetadata: 'none' })
    const m = res.matches?.[0]
    if (!m || m.score < SIMILARITY_MIN) return null
    const r = await env.DB.prepare('SELECT id, answer, sources FROM qa_cache WHERE id = ?').bind(m.id).first<any>()
    return r ? hit(env, r, m.score, false) : null
  } catch { return null }
}

async function hit(env: Env, row: any, similarity: number, exact: boolean): Promise<CachedAnswer> {
  await env.DB.prepare('UPDATE qa_cache SET hits = hits + 1 WHERE id = ?').bind(row.id).run()
  return { id: row.id, answer: row.answer, sources: row.sources ? JSON.parse(row.sources) : [], similarity, exact }
}

export async function store(env: Env, kind: string, screen: string, question: string, answer: string, sources: { title: string; url: string }[], model: string) {
  const { ctx, key } = await keys(kind, screen, question)
  const id = crypto.randomUUID()
  await env.DB.prepare('INSERT INTO qa_cache (id, kind, key_hash, ctx_hash, question, answer, sources, model) VALUES (?,?,?,?,?,?,?,?)')
    .bind(id, kind, key, ctx, question.slice(0, 4000), answer, sources.length ? JSON.stringify(sources) : null, model).run()
  if (!env.QA_INDEX) return id
  const v = await embed(env, question)
  if (v) await env.QA_INDEX.upsert([{ id, values: v, metadata: { ctx, kind } }]).catch(() => {})
  return id
}
