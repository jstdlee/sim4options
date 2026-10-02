// Parametric question generator. Same template + new numbers = fresh practice.
import type { Question, Step } from './types'
import { bs, expectedMove, round2 } from './bs'

function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
type R = () => number
const pick = <T,>(r: R, a: T[]) => a[Math.floor(r() * a.length)]
const int = (r: R, lo: number, hi: number) => Math.floor(lo + r() * (hi - lo + 1))
const money = (x: number) => `${x < 0 ? '−' : ''}$${Math.abs(round2(x)).toFixed(2)}`

function shuffle<T>(r: R, a: T[]): T[] {
  const b = [...a]
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]] }
  return b
}

/** numeric multiple-choice step with plausible distractors */
function numStep(r: R, prompt: string, answer: number, distract: number[], why: string, fmt = money): Step {
  const vals = [answer, ...distract.filter((d) => Math.abs(d - answer) > 1e-6)].slice(0, 4)
  const uniq = Array.from(new Set(vals.map((v) => fmt(v))))
  const choices = shuffle(r, uniq).map((label, i) => ({ id: `c${i}`, label }))
  const ans = choices.find((c) => c.label === fmt(answer))!.id
  return { prompt, choices, answer: ans, why }
}

type Tpl = (r: R, id: string) => Question

const L1: Tpl[] = [
  (r, id) => {
    const S = int(r, 40, 300), K = S + pick(r, [-15, -5, 0, 5, 15]) * (S > 100 ? 2 : 1), type = pick(r, ['call', 'put'] as const)
    const itm = type === 'call' ? S > K : S < K, atm = S === K
    const ans = atm ? 'atm' : itm ? 'itm' : 'otm'
    return { id, level: 1, title: 'Moneyness drill', terms: ['moneyness', type], tags: ['basics'], spot: S, generated: true,
      scenario: `Stock at $${S}. Look at the $${K} [[${type}]].`,
      steps: [{ prompt: 'ITM, ATM or OTM?', choices: [{ id: 'itm', label: 'ITM' }, { id: 'atm', label: 'ATM' }, { id: 'otm', label: 'OTM' }], answer: ans,
        why: type === 'call' ? 'Calls are ITM when spot > strike.' : 'Puts are ITM when spot < strike.' }] }
  },
  (r, id) => {
    const S = int(r, 30, 250), K = S - int(r, 1, 12), prem = round2(S - K + 0.5 + r() * 4)
    return { id, level: 1, title: 'Intrinsic vs extrinsic', terms: ['intrinsic', 'extrinsic', 'premium'], tags: ['pricing'], spot: S, generated: true,
      scenario: `Stock $${S}. The $${K} call trades at ${money(prem)}.`,
      steps: [
        numStep(r, 'Intrinsic value?', S - K, [prem, prem - (S - K), 0], `${S} − ${K}.`),
        numStep(r, 'Extrinsic value?', prem - (S - K), [S - K, prem, (prem - (S - K)) * 2], 'Premium − intrinsic.'),
      ] }
  },
  (r, id) => {
    const q = round2(0.2 + r() * 9), n = int(r, 1, 5)
    return { id, level: 1, title: 'Contract cost', terms: ['multiplier'], tags: ['basics'], generated: true,
      scenario: `You buy ${n} contract(s) quoted at ${money(q)}.`,
      steps: [numStep(r, 'Total cost?', q * 100 * n, [q * n, q * 10 * n, q * 100], '× 100 shares per contract.')] }
  },
]

const L2: Tpl[] = [
  (r, id) => {
    const d = round2(0.15 + r() * 0.7), mv = int(r, 1, 6) * pick(r, [1, -1])
    return { id, level: 2, title: 'Delta drill', terms: ['delta'], tags: ['greeks'], generated: true,
      scenario: `Call delta ${d}. Stock moves ${mv > 0 ? '+' : ''}$${mv}.`,
      steps: [numStep(r, 'Approximate option change (per share)?', d * mv, [mv, d, -d * mv], 'Δ × move.')] }
  },
  (r, id) => {
    const v = round2(0.05 + r() * 0.3), dv = int(r, -10, 10) || 4
    return { id, level: 2, title: 'Vega drill', terms: ['vega', 'iv'], tags: ['greeks', 'volatility'], generated: true,
      scenario: `Long option, vega ${v}. IV changes by ${dv > 0 ? '+' : ''}${dv} points.`,
      steps: [numStep(r, 'Approximate change?', v * dv, [-v * dv, v, dv], 'Vega × vol-point change.')] }
  },
  (r, id) => {
    const lo = int(r, 15, 35), hi = lo + int(r, 20, 60), cur = int(r, lo, hi)
    const ivr = Math.round(((cur - lo) / (hi - lo)) * 100)
    return { id, level: 2, title: 'IV Rank drill', terms: ['iv-rank'], tags: ['volatility', 'indicator'], generated: true,
      scenario: `IV 52-week range ${lo}%–${hi}%. Current IV ${cur}%.`,
      steps: [numStep(r, 'IV Rank?', ivr, [cur, 100 - ivr, Math.round(cur / hi * 100)], '(IV − low)/(high − low) × 100.', (x) => String(Math.round(x)))] }
  },
  (r, id) => {
    const S = int(r, 50, 600), iv = int(r, 20, 90) / 100, days = pick(r, [7, 14, 30, 45])
    const em = expectedMove(S, iv, days)
    return { id, level: 2, title: 'Expected move drill', terms: ['expected-move'], tags: ['volatility'], spot: S, generated: true,
      scenario: `Stock $${S}, IV ${Math.round(iv * 100)}%, ${days} days.`,
      steps: [numStep(r, '1σ expected move ≈ ±', em, [S * iv, em * 2, S * iv * days / 365], 'S × IV × √(days/365).')] }
  },
]

const L3: Tpl[] = [
  (r, id) => {
    const S = int(r, 40, 400), K = S + int(r, 0, 10), p = round2(1 + r() * 8), type = pick(r, ['call', 'put'] as const)
    const be = type === 'call' ? K + p : K - p
    return { id, level: 3, title: 'Breakeven drill', terms: ['breakeven', `long-${type}`], tags: ['strategy'], spot: S, generated: true,
      legs: [{ type, side: 1, strike: K, premium: p }],
      scenario: `Buy the $${K} ${type} for ${money(p)}.`,
      steps: [numStep(r, 'Breakeven at expiry?', be, [type === 'call' ? K - p : K + p, K, K + 2 * p], type === 'call' ? 'Strike + premium.' : 'Strike − premium.')] }
  },
  (r, id) => {
    const S = int(r, 30, 200), K = S - int(r, 2, 15), p = round2(0.4 + r() * 3)
    return { id, level: 3, title: 'Cash-secured put drill', terms: ['cash-secured-put'], tags: ['income'], spot: S, generated: true,
      legs: [{ type: 'put', side: -1, strike: K, premium: p }],
      scenario: `Stock $${S}. Sell the $${K} put for ${money(p)}.`,
      steps: [
        numStep(r, 'Effective purchase price if assigned?', K - p, [K, K + p, S - p], 'Strike − premium received.'),
        numStep(r, 'Cash to reserve per contract?', K * 100, [K, S * 100, p * 100], 'Strike × 100.'),
      ] }
  },
]

const L4: Tpl[] = [
  (r, id) => {
    const S = int(r, 50, 300), w = pick(r, [5, 10, 20]), K1 = S, K2 = S + w
    const debit = round2(w * (0.3 + r() * 0.35))
    return { id, level: 4, title: 'Spread math', terms: ['bull-call-spread', 'max-profit', 'max-loss'], tags: ['spread'], spot: S, generated: true,
      legs: [{ type: 'call', side: 1, strike: K1, premium: debit + 1 }, { type: 'call', side: -1, strike: K2, premium: 1 }],
      scenario: `${K1}/${K2} bull call spread for a ${money(debit)} debit.`,
      steps: [
        numStep(r, 'Max loss (per share)?', debit, [w, w - debit, 0], 'Debit paid.'),
        numStep(r, 'Max profit?', w - debit, [w, debit, w + debit], 'Width − debit.'),
        numStep(r, 'Breakeven?', K1 + debit, [K2 - debit, K1, K2], 'Long strike + debit.'),
      ] }
  },
  (r, id) => {
    const S = int(r, 100, 500), w = pick(r, [5, 10]), gap = pick(r, [15, 20, 30]), cr = round2(w * (0.2 + r() * 0.25))
    return { id, level: 4, title: 'Iron condor math', terms: ['iron-condor', 'credit-spread'], tags: ['spread', 'neutral'], spot: S, generated: true,
      scenario: `Iron condor: ${S - gap - w}/${S - gap}/${S + gap}/${S + gap + w} for ${money(cr)} credit.`,
      steps: [
        numStep(r, 'Max profit?', cr, [w, w - cr, cr * 2], 'Credit received.'),
        numStep(r, 'Max loss?', w - cr, [w, cr, w + cr], 'Wing width − credit.'),
      ] }
  },
  (r, id) => {
    const S = int(r, 40, 300), c = round2(S * 0.03 + r() * S * 0.05)
    return { id, level: 4, title: 'Straddle breakevens', terms: ['straddle', 'breakeven'], tags: ['volatility'], spot: S, generated: true,
      legs: [{ type: 'call', side: 1, strike: S, premium: c / 2 }, { type: 'put', side: 1, strike: S, premium: c / 2 }],
      scenario: `Buy the $${S} straddle for ${money(c)} total.`,
      steps: [numStep(r, 'Upper breakeven?', S + c, [S + c / 2, S, S + 2 * c], 'Strike + total premium.')] }
  },
]

// Rule matrix: (trend, IV rank, event) → structure
const L5: Tpl[] = [
  (r, id) => {
    const trend = pick(r, ['up', 'down', 'flat'] as const), ivr = pick(r, [10, 25, 60, 85]), rsi = pick(r, [28, 45, 55, 74])
    const high = ivr >= 50
    const table: Record<string, [string, string]> = {
      'up-h': ['Sell a put credit spread', 'Bullish + rich IV → collect premium below support.'],
      'up-l': ['Buy a call or call debit spread', 'Bullish + cheap IV → own premium.'],
      'down-h': ['Sell a call credit spread', 'Bearish + rich IV → collect premium above resistance.'],
      'down-l': ['Buy a put or put debit spread', 'Bearish + cheap IV → own premium.'],
      'flat-h': ['Iron condor', 'Range + rich IV → sell both wings, defined risk.'],
      'flat-l': ['Calendar spread', 'Range + cheap IV → own back-month vega, sell front decay.'],
    }
    const key = `${trend}-${high ? 'h' : 'l'}`
    const all = Object.values(table).map((v) => v[0])
    const right = table[key][0]
    const choices = shuffle(r, [right, ...shuffle(r, all.filter((a) => a !== right)).slice(0, 3)]).map((label, i) => ({ id: `c${i}`, label }))
    const tdesc = { up: 'above its 50 and 200-day MAs', down: 'below its 50 and 200-day MAs', flat: 'chopping between support and resistance' }[trend]
    return { id, level: 5, title: 'Signal combo', terms: ['iv-rank', 'rsi', 'moving-average'], tags: ['indicator'], generated: true,
      scenario: `Stock is ${tdesc}. IV Rank ${ivr}, RSI ${rsi}. No earnings for 6 weeks.`,
      steps: [
        { prompt: 'Is premium rich or cheap?', choices: [{ id: 'rich', label: 'Rich' }, { id: 'cheap', label: 'Cheap' }], answer: high ? 'rich' : 'cheap', why: `IV Rank ${ivr} is ${high ? 'above' : 'below'} 50.` },
        { prompt: 'Best-fit structure?', choices, answer: choices.find((c) => c.label === right)!.id, why: table[key][1] + (rsi > 70 || rsi < 30 ? ` RSI ${rsi} is stretched: size smaller.` : '') },
      ] }
  },
]

const L6: Tpl[] = [
  (r, id) => {
    const acct = pick(r, [10000, 25000, 50000, 100000]), pct = pick(r, [1, 2, 3]), risk = pick(r, [150, 250, 400, 600])
    const n = Math.floor((acct * pct) / 100 / risk)
    return { id, level: 6, title: 'Sizing drill', terms: ['position-sizing'], tags: ['risk'], generated: true,
      scenario: `$${acct.toLocaleString()} account, ${pct}% risk per trade, $${risk} max loss per contract.`,
      steps: [numStep(r, 'Max contracts?', n, [n + 1, n * 2, Math.max(n - 1, 0) === n ? n + 2 : Math.max(n - 1, 0)], 'floor(account × % ÷ risk per contract).', (x) => String(x))] }
  },
]

const L7: Tpl[] = [
  (r, id) => {
    const S = int(r, 80, 300), K = S + pick(r, [-10, 0, 10]), iv = int(r, 20, 70) / 100, days = pick(r, [14, 30, 60])
    const p = bs({ S, K, T: days / 365, sigma: iv, type: 'call' }).price
    const p2 = bs({ S, K, T: (days - 7) / 365, sigma: iv, type: 'call' }).price
    return { id, level: 7, title: 'Model the decay', terms: ['black-scholes', 'theta'], tags: ['simulator'], spot: S, generated: true,
      scenario: `Stock $${S}, $${K} call, IV ${Math.round(iv * 100)}%, ${days} DTE. Model price ≈ ${money(p)}.`,
      steps: [numStep(r, 'Price stays flat for 7 days. Option value ≈ ?', p2, [p, p * 0.5, p + (p - p2)], 'Black-Scholes with 7 fewer days: that gap is theta.')] }
  },
  (r, id) => {
    const S = int(r, 80, 300), iv1 = int(r, 60, 110) / 100, iv2 = iv1 * pick(r, [0.45, 0.55, 0.65]), mv = pick(r, [0.03, 0.05, 0.08])
    const T1 = 3 / 365, T2 = 1 / 365
    const before = bs({ S, K: S, T: T1, sigma: iv1, type: 'call' }).price + bs({ S, K: S, T: T1, sigma: iv1, type: 'put' }).price
    const S2 = S * (1 + mv)
    const after = bs({ S: S2, K: S, T: T2, sigma: iv2, type: 'call' }).price + bs({ S: S2, K: S, T: T2, sigma: iv2, type: 'put' }).price
    return { id, level: 7, title: 'Earnings straddle sim', terms: ['iv-crush', 'straddle'], tags: ['simulator', 'events'], spot: S, generated: true,
      scenario: `ATM $${S} straddle costs ${money(before)} (IV ${Math.round(iv1 * 100)}%). After earnings stock moves +${Math.round(mv * 100)}% and IV drops to ${Math.round(iv2 * 100)}%.`,
      steps: [numStep(r, 'Straddle P&L per share?', after - before, [S * mv, before, -before], 'New value (intrinsic + crushed extrinsic) − cost.')] }
  },
]

const BANK: Record<number, Tpl[]> = { 1: L1, 2: L2, 3: L3, 4: L4, 5: L5, 6: L6, 7: L7 }

export function generate(level: number, count: number, seed = 42): Question[] {
  const tpls = BANK[level] ?? []
  if (!tpls.length) return []
  const r = rng(seed * 1000 + level)
  return Array.from({ length: count }, (_, i) => tpls[i % tpls.length](r, `g${level}-${String(i + 1).padStart(3, '0')}`))
}
