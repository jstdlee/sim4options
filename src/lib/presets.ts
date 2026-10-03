import type { Leg } from '@shared/types'

// Simulator structures. Strikes are set relative to the entry spot s.
export const presets: Record<string, [string, (s: number) => Omit<Leg, 'premium'>[]]> = {
  'long-call': ['Long call', (s) => [{ type: 'call', side: 1, strike: s }]],
  'long-put': ['Long put', (s) => [{ type: 'put', side: 1, strike: s }]],
  'bull-call-spread': ['Bull call spread', (s) => [{ type: 'call', side: 1, strike: s }, { type: 'call', side: -1, strike: Math.round(s * 1.1) }]],
  'bear-put-spread': ['Bear put spread', (s) => [{ type: 'put', side: 1, strike: s }, { type: 'put', side: -1, strike: Math.round(s * 0.9) }]],
  'straddle': ['Long straddle', (s) => [{ type: 'call', side: 1, strike: s }, { type: 'put', side: 1, strike: s }]],
  'iron-condor': ['Iron condor', (s) => [{ type: 'put', side: 1, strike: Math.round(s * 0.85) }, { type: 'put', side: -1, strike: Math.round(s * 0.92) }, { type: 'call', side: -1, strike: Math.round(s * 1.08) }, { type: 'call', side: 1, strike: Math.round(s * 1.15) }]],
  'covered-call': ['Covered call', (s) => [{ type: 'stock', side: 1 }, { type: 'call', side: -1, strike: Math.round(s * 1.08) }]],
  'bear-call-spread': ['Bear call spread', (s) => [{ type: 'call', side: -1, strike: Math.round(s * 1.05) }, { type: 'call', side: 1, strike: Math.round(s * 1.12) }]],
  'bull-put-spread': ['Bull put spread', (s) => [{ type: 'put', side: -1, strike: Math.round(s * 0.95) }, { type: 'put', side: 1, strike: Math.round(s * 0.88) }]],
  'strangle': ['Long strangle', (s) => [{ type: 'put', side: 1, strike: Math.round(s * 0.93) }, { type: 'call', side: 1, strike: Math.round(s * 1.07) }]],
  'iron-butterfly': ['Iron butterfly', (s) => [{ type: 'put', side: 1, strike: Math.round(s * 0.9) }, { type: 'put', side: -1, strike: s }, { type: 'call', side: -1, strike: s }, { type: 'call', side: 1, strike: Math.round(s * 1.1) }]],
  'butterfly': ['Call butterfly (1 × 2 × 1)', (s) => [{ type: 'call', side: 1, strike: Math.round(s * 0.95) }, { type: 'call', side: -1, strike: s, qty: 2 }, { type: 'call', side: 1, strike: Math.round(s * 1.05) }]],
  'protective-put': ['Protective put', (s) => [{ type: 'stock', side: 1 }, { type: 'put', side: 1, strike: Math.round(s * 0.95) }]],
  'collar': ['Collar', (s) => [{ type: 'stock', side: 1 }, { type: 'put', side: 1, strike: Math.round(s * 0.93) }, { type: 'call', side: -1, strike: Math.round(s * 1.07) }]],
}

export const GROUPS: [string, string[]][] = [
  ['Bullish', ['long-call', 'bull-call-spread', 'bull-put-spread']],
  ['Bearish', ['long-put', 'bear-put-spread', 'bear-call-spread']],
  ['Neutral, earns time decay', ['iron-condor', 'iron-butterfly', 'butterfly']],
  ['Big move, long volatility', ['straddle', 'strangle']],
  ['With stock', ['covered-call', 'protective-put', 'collar']],
]
