import type { Step } from '../shared/types'

/** Build a step: s(prompt, [[id, label], ...], answerId, why). */
export const s = (prompt: string, choices: [string, string][], answer: string, why: string): Step => ({
  prompt, choices: choices.map(([id, label]) => ({ id, label })), answer, why,
})
