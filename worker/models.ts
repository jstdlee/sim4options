import type { Env, Byok } from './env'
import { compatUrl } from './ai'

export interface ModelInfo { id: string; note?: string }

/**
 * List chat models from the learner's provider. Runs on the server so browser CORS rules do not matter;
 * the key is used for this one request and not stored.
 */
export async function listModels(env: Env, b: Pick<Byok, 'provider' | 'key' | 'baseUrl'>): Promise<ModelInfo[]> {
  switch (b.provider) {
    case 'workers-ai': {
      const ms: any[] = await (env.AI as any).models({ task: 'Text Generation', per_page: 200, hide_experimental: false })
      const prop = (m: any, k: string) => m.properties?.find((p: any) => p.property_id === k)?.value
      return ms
        .filter((m) => !/\/clef/.test(m.name)) // Clef is a decision model, not a chat model
        .filter((m) => !prop(m, 'planned_deprecation_date') || new Date(prop(m, 'planned_deprecation_date')) > new Date())
        .sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')))
        .map((m) => ({ id: m.name, note: [m.name === env.LLM_MODEL ? 'default' : '', prop(m, 'reasoning') === 'true' || prop(m, 'reasoning') === true ? 'reasoning' : '', prop(m, 'context_window') ? `${Math.round(Number(prop(m, 'context_window')) / 1000)}K ctx` : ''].filter(Boolean).join(' · ') }))
    }
    case 'openai': {
      const j = await get('https://api.openai.com/v1/models', { authorization: `Bearer ${need(b.key)}` })
      return (j.data ?? []).map((m: any) => ({ id: m.id })).filter((m: ModelInfo) => /^(gpt|o\d|chatgpt)/i.test(m.id)).sort(byId)
    }
    case 'anthropic': {
      const j = await get('https://api.anthropic.com/v1/models?limit=100', { 'x-api-key': need(b.key), 'anthropic-version': '2023-06-01' })
      return (j.data ?? []).map((m: any) => ({ id: m.id, note: m.display_name }))
    }
    case 'google-ai-studio': {
      const j = await get(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=${encodeURIComponent(need(b.key))}`, {})
      return (j.models ?? [])
        .filter((m: any) => (m.supportedGenerationMethods ?? []).includes('generateContent'))
        .map((m: any) => ({ id: String(m.name).replace(/^models\//, ''), note: m.displayName }))
    }
    case 'openai-compatible': {
      const url = compatUrl(b.baseUrl).replace(/\/chat\/completions$/, '/models')
      const j = await get(url, b.key ? { authorization: `Bearer ${b.key}` } : {})
      return (j.data ?? j.models ?? []).map((m: any) => ({ id: String(m.id ?? m.name) })).sort(byId)
    }
  }
  throw new Error('Unknown provider.')
}

const byId = (a: ModelInfo, b: ModelInfo) => a.id.localeCompare(b.id)
function need(key?: string) { if (!key) throw new Error('Enter the API key first.'); return key }
async function get(url: string, headers: Record<string, string>) {
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`The provider answered ${res.status}: ${(await res.text()).slice(0, 200)}`)
  return res.json<any>()
}
