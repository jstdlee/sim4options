import { AUTHORED, LEVELS } from './questions'
import { generate } from '../shared/generator'
import type { Question } from '../shared/types'

// Target counts per level (420 total). Authored first, generated variants fill the rest.
export const TARGETS: Record<number, number> = { 1: 60, 2: 70, 3: 70, 4: 70, 5: 60, 6: 50, 7: 40 }

export function buildBank(seed = 42): Record<number, Question[]> {
  const out: Record<number, Question[]> = {}
  for (const { n } of LEVELS) {
    const a = AUTHORED.filter((q) => q.level === n)
    out[n] = [...a, ...generate(n, Math.max(0, TARGETS[n] - a.length), seed)]
  }
  return out
}

export { LEVELS }
export { TERMS, TERM_MAP } from './terms'
export { MOMENTS } from './moments'
