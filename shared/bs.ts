// Black-Scholes pricing, Greeks and payoff helpers (no dividends).
import type { Leg } from './types'

const SQRT2PI = Math.sqrt(2 * Math.PI)
export const pdf = (x: number) => Math.exp(-0.5 * x * x) / SQRT2PI

// Abramowitz-Stegun approximation of the normal CDF
export function cdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x))
  const d = 0.3989423 * Math.exp((-x * x) / 2)
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
  return x > 0 ? 1 - p : p
}

export interface BSInput { S: number; K: number; T: number; r?: number; sigma: number; type: 'call' | 'put' }

export function bs({ S, K, T, r = 0.04, sigma, type }: BSInput) {
  if (T <= 1e-6 || sigma <= 1e-6) {
    const intrinsic = type === 'call' ? Math.max(S - K, 0) : Math.max(K - S, 0)
    const itm = type === 'call' ? S > K : S < K
    return { price: intrinsic, delta: itm ? (type === 'call' ? 1 : -1) : 0, gamma: 0, theta: 0, vega: 0, rho: 0 }
  }
  const sqT = Math.sqrt(T)
  const d1 = (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) / (sigma * sqT)
  const d2 = d1 - sigma * sqT
  const disc = Math.exp(-r * T)
  const gamma = pdf(d1) / (S * sigma * sqT)
  const vega = (S * pdf(d1) * sqT) / 100 // per 1 vol point
  if (type === 'call') {
    const price = S * cdf(d1) - K * disc * cdf(d2)
    const theta = (-(S * pdf(d1) * sigma) / (2 * sqT) - r * K * disc * cdf(d2)) / 365
    return { price, delta: cdf(d1), gamma, theta, vega, rho: (K * T * disc * cdf(d2)) / 100 }
  }
  const price = K * disc * cdf(-d2) - S * cdf(-d1)
  const theta = (-(S * pdf(d1) * sigma) / (2 * sqT) + r * K * disc * cdf(-d2)) / 365
  return { price, delta: cdf(d1) - 1, gamma, theta, vega, rho: (-K * T * disc * cdf(-d2)) / 100 }
}

/** P&L per share at expiry for a set of legs at underlying price S. */
export function payoffAtExpiry(legs: Leg[], S: number): number {
  return legs.reduce((sum, l) => {
    const q = l.qty ?? 1
    const prem = l.premium ?? 0
    if (l.type === 'stock') return sum + l.side * q * (S - prem)
    const k = l.strike ?? 0
    const intrinsic = l.type === 'call' ? Math.max(S - k, 0) : Math.max(k - S, 0)
    return sum + l.side * q * (intrinsic - prem)
  }, 0)
}

/** Mark-to-model P&L before expiry. */
export function pnlNow(legs: Leg[], S: number, T: number, sigma: number, r = 0.04): number {
  return legs.reduce((sum, l) => {
    const q = l.qty ?? 1
    const prem = l.premium ?? 0
    if (l.type === 'stock') return sum + l.side * q * (S - prem)
    const v = bs({ S, K: l.strike ?? 0, T, r, sigma, type: l.type }).price
    return sum + l.side * q * (v - prem)
  }, 0)
}

export function breakevens(legs: Leg[], lo: number, hi: number, steps = 800): number[] {
  const out: number[] = []
  let prev = payoffAtExpiry(legs, lo)
  for (let i = 1; i <= steps; i++) {
    const s = lo + ((hi - lo) * i) / steps
    const v = payoffAtExpiry(legs, s)
    if ((prev < 0 && v >= 0) || (prev > 0 && v <= 0)) out.push(Math.round(s * 100) / 100)
    prev = v
  }
  return out
}

/** Expected 1-sigma move over `days` given annualized IV. */
export const expectedMove = (S: number, iv: number, days: number) => S * iv * Math.sqrt(days / 365)

export const round2 = (x: number) => Math.round(x * 100) / 100
