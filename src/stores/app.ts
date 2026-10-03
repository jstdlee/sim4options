import { defineStore } from 'pinia'
import { load, save } from '../lib/storage'

export interface ByokCfg { provider: 'workers-ai' | 'openai' | 'anthropic' | 'google-ai-studio'; model: string; key: string }
type Result = { correct: number; total: number; at: number }

export const useApp = defineStore('app', {
  state: () => ({
    uid: load<string>('oq.uid', '') || (() => { const id = crypto.randomUUID(); save('oq.uid', id); return id })(),
    results: load<Record<string, Result>>('oq.results', {}),
    termStats: load<Record<string, { seen: number; correct: number }>>('oq.terms', {}),
    byok: load<ByokCfg>('oq.byok', { provider: 'workers-ai', model: '', key: '' }),
    openTerm: null as string | null,
    chatOpen: false,
    chatContext: '',
    /** null until /api/session has answered. */
    authed: null as boolean | null,
  }),
  getters: {
    levelProgress: (s) => (ids: string[]) => ids.filter((id) => s.results[id]).length,
    mastery: (s) => (term: string) => { const t = s.termStats[term]; return t ? t.correct / Math.max(t.seen, 1) : null },
    byokPayload: (s) => (s.byok.key || s.byok.provider === 'workers-ai' && s.byok.model ? { ...s.byok } : null),
  },
  actions: {
    record(qid: string, correct: number, total: number, terms: string[]) {
      this.results[qid] = { correct, total, at: Date.now() }
      for (const t of terms) {
        const cur = this.termStats[t] ?? { seen: 0, correct: 0 }
        this.termStats[t] = { seen: cur.seen + 1, correct: cur.correct + (correct === total ? 1 : 0) }
      }
      save('oq.results', this.results); save('oq.terms', this.termStats)
    },
    setByok(cfg: ByokCfg) { this.byok = cfg; save('oq.byok', cfg) },
    reset() { this.results = {}; this.termStats = {}; save('oq.results', {}); save('oq.terms', {}) },
  },
})
