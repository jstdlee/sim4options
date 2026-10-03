import type { Choice } from '@shared/types'
import { useApp } from '../stores/app'
import { router } from '../router'

async function post<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  if (r.status === 401) {
    useApp().authed = false
    router.push({ path: '/login', query: { next: router.currentRoute.value.fullPath } })
    throw new Error('Signed out')
  }
  return r.json() as Promise<T>
}

export interface ClefOut { ok: boolean; model: string; ms: number; error?: string; fields: Record<string, { value: unknown; probs?: Record<string, number> }> }

export const api = {
  spar: (scenario: string, prompt: string, choices: Choice[], flash = false) => post<ClefOut>('/api/clef/spar', { scenario, prompt, choices, flash }),
  grade: (scenario: string, decision: string, rationale: string) => post<ClefOut>('/api/clef/grade', { scenario, decision, rationale }),
  explain: (b: Record<string, unknown>) => post<{ ok: boolean; text?: string; error?: string }>('/api/explain', b),
  attempt: (b: Record<string, unknown>) => post('/api/attempts', b).catch(() => null),
}

/** Turn [[id|label]] markup into plain text for prompts. */
export const plain = (s: string) => s.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, id, label) => label ?? id)
