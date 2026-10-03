import type { Env, SearchOpts } from './env'

export interface WebResult { title: string; url: string; snippet: string }
export interface WebSearch { provider: string; results: WebResult[]; errors?: string[] }

/**
 * Web search: Cloudflare Web Search API first (built in, through our AI Gateway),
 * then Exa directly with our own key (EXA_API_KEY secret) as the backup.
 */
const CF_PROVIDERS = ['ceramic', 'exa', 'linkup'] as const
const EXA_TYPES = ['auto', 'fast', 'neural', 'keyword'] as const

export async function webSearch(env: Env, query: string, opts: SearchOpts = {}): Promise<WebSearch | null> {
  const limit = Math.min(10, Math.max(1, Math.round(Number(opts.numResults) || 5)))
  const cfProvider = CF_PROVIDERS.includes(opts.cfProvider as any) ? opts.cfProvider! : (env.SEARCH_PROVIDER || 'ceramic')
  const exaType = EXA_TYPES.includes(opts.exaType as any) ? opts.exaType! : 'auto'
  // A learner's own Exa key (from Settings) wins over the server key.
  const exaKey = (typeof opts.exaKey === 'string' && opts.exaKey.trim()) || env.EXA_API_KEY
  const q = query.replace(/\s+/g, ' ').trim().slice(0, 400)
  if (!q) return null
  const errors: string[] = []
  try {
    const res: Response = await (env.AI as any).websearch({ gatewayId: env.AI_GATEWAY_ID, query: q, provider: cfProvider, limit })
    if (res.ok) {
      const j: any = await res.json()
      const results = (j.items ?? []).map((i: any) => ({ title: String(i.title || i.url), url: String(i.url), snippet: String(i.description ?? '').slice(0, 400) }))
      if (results.length) return { provider: `cloudflare/${cfProvider}`, results }
      errors.push('cloudflare: no results')
    } else errors.push(`cloudflare: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`)
  } catch (e: any) { errors.push(`cloudflare: ${String(e?.message ?? e).slice(0, 200)}`) }

  if (!exaKey) { errors.push('exa: no key (server EXA_API_KEY or your own in Settings)'); return { provider: 'none', results: [], errors } }
  try {
    const res = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': exaKey },
      body: JSON.stringify({ query: q, numResults: limit, type: exaType, contents: { text: { maxCharacters: 500 } } }),
    })
    if (!res.ok) { errors.push(`exa: HTTP ${res.status}`); return { provider: 'none', results: [], errors } }
    const j: any = await res.json()
    const results = (j.results ?? []).map((r: any) => ({ title: String(r.title || r.url), url: String(r.url), snippet: String(r.text ?? '').replace(/\s+/g, ' ').slice(0, 400) }))
    return { provider: results.length ? `exa${opts.exaKey ? ' (your key)' : ''}` : 'none', results, errors }
  } catch (e: any) { errors.push(`exa: ${String(e?.message ?? e).slice(0, 200)}`); return { provider: 'none', results: [], errors } }
}

/** Search results as a block the model can cite as [1], [2] … */
export const asContext = (s: WebSearch) =>
  `Web search results (${s.provider}). Use them for recent facts and cite them as [1], [2]…\n` +
  s.results.map((r, i) => `[${i + 1}] ${r.title} — ${r.url}\n${r.snippet}`).join('\n\n')
