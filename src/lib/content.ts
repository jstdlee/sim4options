import { buildBank, LEVELS, TERMS, TERM_MAP, MOMENTS } from '@content/index'

export const BANK = buildBank()
export const TOTAL = Object.values(BANK).reduce((n, a) => n + a.length, 0)
export { LEVELS, TERMS, TERM_MAP, MOMENTS }

export const ALL_TAGS = Array.from(new Set(TERMS.flatMap((t) => t.tags))).sort()

/** How many questions and moments reference each term — drives the cloud size. */
export const TERM_WEIGHT: Record<string, number> = (() => {
  const w: Record<string, number> = {}
  for (const qs of Object.values(BANK)) for (const q of qs) for (const t of q.terms) w[t] = (w[t] ?? 0) + 1
  for (const m of MOMENTS) for (const t of m.terms) w[t] = (w[t] ?? 0) + 2
  for (const t of TERMS) for (const r of t.related) w[r] = (w[r] ?? 0) + 0.5
  return w
})()
