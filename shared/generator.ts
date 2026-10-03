// Parametric question generator. Same template + new numbers = fresh practice.
import type { Question, Step } from './types'
import { bs, expectedMove, payoffAtExpiry, round2 } from './bs'

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
const money = (x: number) => `${x < 0 ? '−' : ''}$${Math.abs(round2(x)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

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
  (r, id) => {
    const type = pick(r, ['call', 'put'] as const), K = int(r, 20, 200), ST = K + int(r, 1, 12) * pick(r, [1, -1])
    const p = round2(0.5 + r() * 4), n = int(r, 1, 3)
    const iv = type === 'call' ? Math.max(ST - K, 0) : Math.max(K - ST, 0)
    const pl = (iv - p) * 100 * n
    return { id, level: 1, title: 'Value at expiry', terms: ['expiration', 'intrinsic', type, 'multiplier'], tags: ['basics'], spot: ST, generated: true,
      legs: [{ type, side: 1, strike: K, premium: p, qty: n }],
      scenario: `You bought ${n} $${K} [[${type}]] contract(s) for ${money(p)} each. At [[expiration]] the stock closes at $${ST}.`,
      steps: [
        numStep(r, 'Value per share at expiry?', iv, [iv > 0 ? iv - p : Math.abs(ST - K), p, iv + p], iv > 0 ? `Only intrinsic is left: ${type === 'call' ? `${ST} − ${K}` : `${K} − ${ST}`}.` : 'OTM at expiry: it expires worthless.'),
        numStep(r, 'Total P&L?', pl, [iv * 100 * n, (iv - p) * 100, -pl, -p * 100 * n], `(${money(iv)} − ${money(p)}) × 100 × ${n}.`),
      ] }
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
  (r, id) => {
    const S = int(r, 30, 300), K = S + pick(r, [-10, -5, 0, 5, 10]), C = round2(Math.max(S - K, 0) + 1 + r() * 5)
    const P = C - S + K
    return { id, level: 2, title: 'Put-call parity drill', terms: ['put-call-parity'], tags: ['pricing'], spot: S, generated: true,
      scenario: `Stock $${S}. The $${K} call costs ${money(C)}. Ignore rates and dividends.`,
      steps: [numStep(r, `Fair price of the $${K} put?`, P, [C + S - K, C, C / 2 + Math.abs(S - K), C * 2], `Put = call − stock + strike = ${money(C)} − ${S} + ${K}.`)] }
  },
  (r, id) => {
    const v0 = round2(1.5 + r() * 6), th = round2(0.02 + r() * 0.1), n = pick(r, [3, 5, 7, 10])
    return { id, level: 2, title: 'Theta drill', terms: ['theta'], tags: ['greeks', 'time'], generated: true,
      scenario: `Long option worth ${money(v0)}, theta −${th.toFixed(2)} per day. Price and IV stay flat for ${n} days.`,
      steps: [numStep(r, 'Approximate value then (theta held constant)?', v0 - th * n, [v0 - th, v0 + th * n, th * n], `${money(v0)} − ${n} × ${th.toFixed(2)}. Real theta grows a little each day.`)] }
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
  (r, id) => {
    const E = int(r, 20, 200), K = E + pick(r, [2, 5, 10]), c = round2(0.3 + r() * 3)
    return { id, level: 3, title: 'Covered call drill', terms: ['covered-call', 'max-profit', 'breakeven'], tags: ['income'], spot: E, generated: true,
      legs: [{ type: 'stock', side: 1, premium: E }, { type: 'call', side: -1, strike: K, premium: c }],
      scenario: `You own 100 shares at $${E} and sell the $${K} call for ${money(c)}.`,
      steps: [
        numStep(r, 'Max profit per share if called away?', K - E + c, [c, K - E, K - E - c], `(${K} − ${E}) + ${money(c)}.`),
        numStep(r, 'Downside breakeven?', E - c, [E + c, E, K - c], 'Entry − premium.'),
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
  (r, id) => {
    const S = int(r, 50, 400), w = pick(r, [5, 10]), K1 = S - pick(r, [5, 10, 15]), K2 = K1 - w
    const cr = round2(w * (0.15 + r() * 0.25))
    return { id, level: 4, title: 'Bull put spread math', terms: ['bull-put-spread', 'credit-spread', 'breakeven'], tags: ['spread', 'bullish'], spot: S, generated: true,
      legs: [{ type: 'put', side: -1, strike: K1, premium: cr + 0.5 }, { type: 'put', side: 1, strike: K2, premium: 0.5 }],
      scenario: `Stock $${S}. Sell the ${K1}/${K2} put spread for a ${money(cr)} credit.`,
      steps: [
        numStep(r, 'Max profit (per share)?', cr, [w, w - cr, cr * 2], 'Credit received.'),
        numStep(r, 'Max loss?', w - cr, [w, cr, w + cr], 'Width − credit.'),
        numStep(r, 'Breakeven?', K1 - cr, [K2 + cr, K1, K1 + cr], 'Short strike − credit.'),
      ] }
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
  (r, id) => {
    const ev = pick(r, ['earnings', 'fomc', 'cpi'] as const), S = int(r, 50, 500)
    const pct = ev === 'earnings' ? pick(r, [3, 4, 5, 6, 8]) : pick(r, [1, 1.5, 2])
    const st = round2(S * pct / 100 * (0.9 + r() * 0.2)), m = st / S * 100
    const what = { earnings: 'Earnings are', fomc: 'The FOMC decision is', cpi: 'CPI prints' }[ev]
    return { id, level: 5, title: 'Event implied move', terms: [ev, 'expected-move', 'straddle'], tags: ['events'], spot: S, generated: true,
      scenario: `Stock $${S}. ${what} tomorrow. The nearest ATM [[straddle]] costs ${money(st)}.`,
      steps: [
        numStep(r, 'Lower edge of the implied range?', S - st, [S - st / 2, S - 2 * st, S + st], 'Spot − straddle price ≈ the market\'s expected move down.'),
        numStep(r, 'Implied move as % of spot?', m, [m / 2, m * 2, m + 1], `${money(st)} ÷ $${S}.`, (x) => `${x.toFixed(1)}%`),
        { prompt: 'You expect a smaller move than this. Lean?', choices: [{ id: 'sell', label: 'Sell premium with defined risk (iron condor)' }, { id: 'buy', label: 'Buy the straddle' }], answer: 'sell',
          why: 'If the real move is smaller than the price, straddle buyers lose and defined-risk sellers win.' },
      ] }
  },
  (r, id) => {
    const P = int(r, 30, 300), a = round2(P * (0.01 + r() * 0.03)), k = pick(r, [1.5, 2, 3])
    return { id, level: 5, title: 'ATR stop drill', terms: ['atr', 'stop-loss'], tags: ['indicator', 'risk'], spot: P, generated: true,
      scenario: `Bullish entry at $${P}. ATR(14) is ${money(a)}. Your rule: stop at ${k} × ATR below entry.`,
      steps: [numStep(r, 'Stop level?', P - k * a, [P - a, P + k * a, P - 2 * k * a], `${P} − ${k} × ${money(a)}.`)] }
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
  (r, id) => {
    const K = int(r, 30, 250), K2 = K - pick(r, [2, 5]), c0 = round2(0.8 + r() * 2), B = round2(1 + r() * 6)
    let N = round2(B + r() * 1.6 - 0.5)
    if (Math.abs(N - B) < 0.05) N = round2(N + 0.25)
    const net = N - B, fmtCD = (x: number) => (x >= 0 ? `${money(x)} credit` : `${money(-x)} debit`)
    return { id, level: 6, title: 'Roll math', terms: ['roll', 'cash-secured-put'], tags: ['management'], generated: true,
      scenario: `You sold the $${K} put for ${money(c0)}. It is tested. Roll down and out: buy it back for ${money(B)}, sell the later $${K2} put for ${money(N)}.`,
      steps: [
        numStep(r, 'Net of the roll?', net, [-net, N + B, N], `${money(N)} − ${money(B)}.`, fmtCD),
        numStep(r, 'New breakeven at expiry?', K2 - (c0 + net), [K2 - c0, K - (c0 + net), K2 + c0 + net], `New strike − total credits (${money(c0)} ${net >= 0 ? '+' : '−'} ${money(Math.abs(net))}).`),
      ] }
  },
  (r, id) => {
    const pop = pick(r, [60, 65, 70, 75, 80, 85]), win = pick(r, [100, 120, 150, 200]), loss = pick(r, [200, 300, 350, 400, 500])
    const evv = (pop / 100) * win - (1 - pop / 100) * loss
    const sign = Math.abs(evv) < 0.5 ? 'zero' : evv > 0 ? 'pos' : 'neg'
    return { id, level: 6, title: 'Expected value drill', terms: ['expected-value', 'probability-of-profit'], tags: ['risk'], generated: true,
      scenario: `A trade wins ${pop}% of the time. Win = +$${win}, loss = −$${loss}.`,
      steps: [
        numStep(r, 'Expected value per trade?', evv, [(pop / 100) * win, win - loss, -evv], `${pop / 100} × ${win} − ${round2(1 - pop / 100)} × ${loss}.`),
        { prompt: 'So the edge is…', choices: [{ id: 'pos', label: 'Positive' }, { id: 'zero', label: 'About zero' }, { id: 'neg', label: 'Negative' }], answer: sign,
          why: 'A high win rate is not enough: the size of losses matters as much.' },
      ] }
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
  (r, id) => {
    const S = int(r, 100, 500), w = pick(r, [5, 10]), gap = pick(r, [10, 15, 20]), cr = round2(w * (0.2 + r() * 0.25))
    const ps = S - gap, cs = S + gap
    const legs = [
      { type: 'put' as const, side: 1 as const, strike: ps - w, premium: 0.5 }, { type: 'put' as const, side: -1 as const, strike: ps, premium: 0.5 + cr / 2 },
      { type: 'call' as const, side: -1 as const, strike: cs, premium: 0.5 + cr / 2 }, { type: 'call' as const, side: 1 as const, strike: cs + w, premium: 0.5 },
    ]
    const ST = S + int(r, -(gap + w + 5), gap + w + 5)
    const pl = payoffAtExpiry(legs, ST)
    return { id, level: 7, title: 'Condor at expiry', terms: ['iron-condor'], tags: ['simulator', 'spread'], spot: S, generated: true, legs,
      scenario: `Simulator: ${ps - w}/${ps}/${cs}/${cs + w} iron condor on a $${S} stock for a ${money(cr)} credit. Advance to expiry: it closes at $${ST}.`,
      steps: [numStep(r, 'P&L per share?', pl, [cr, -(w - cr), -pl, pl - cr], 'Credit − value of any spread that finished ITM (capped at the width).')] }
  },
  (r, id) => {
    const S = int(r, 50, 400), K = S + pick(r, [-10, -5, 0, 5, 10]), iv = int(r, 20, 60) / 100, days = pick(r, [14, 30, 60]), n = int(r, 1, 10)
    const d = round2(bs({ S, K, T: days / 365, sigma: iv, type: 'call' }).delta)
    const sh = Math.round(n * d * 100)
    return { id, level: 7, title: 'Delta hedge drill', terms: ['delta-neutral', 'hedging', 'delta'], tags: ['simulator', 'greeks'], spot: S, generated: true,
      scenario: `Simulator: long ${n} × $${K} calls, stock $${S}, IV ${Math.round(iv * 100)}%, ${days} DTE. Model delta ${d.toFixed(2)} per share.`,
      steps: [numStep(r, 'Shares to short to be delta-neutral?', sh, [n * 100, Math.round(d * 100), Math.round(n * (1 - d) * 100)], `${n} × ${d.toFixed(2)} × 100.`, (x) => String(Math.round(x)))] }
  },
]

const BANK: Record<number, Tpl[]> = { 1: L1, 2: L2, 3: L3, 4: L4, 5: L5, 6: L6, 7: L7 }

export function generate(level: number, count: number, seed = 42): Question[] {
  const tpls = BANK[level] ?? []
  if (!tpls.length) return []
  const r = rng(seed * 1000 + level)
  return Array.from({ length: count }, (_, i) => tpls[i % tpls.length](r, `g${level}-${String(i + 1).padStart(3, '0')}`))
}
