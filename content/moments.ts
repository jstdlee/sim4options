import type { Moment } from '../shared/types'
import { s } from './helpers'

// Prices and IV figures are approximate, reconstructed for teaching. Verify before trading decisions.

const MOMENTS_BASE: Moment[] = [
  {
    id: 'nvda-2023-05', ticker: 'NVDA', title: 'The AI guidance gap', date: 'May 2023',
    summary: 'Data-center guidance blew past estimates and the stock gapped ~24% overnight.',
    terms: ['earnings', 'expected-move', 'iv-crush', 'long-call', 'bull-call-spread'], tags: ['earnings', 'gap', 'semis'],
    checkpoints: [
      { label: 'Day of earnings, before close', date: '2023-05-24', context: 'NVDA ≈ $305. Options imply roughly a ±7–8% move. IV elevated pre-report.',
        step: s('You are bullish on AI demand. Which structure balances upside and IV crush?', [['bcs', 'Call debit spread'], ['lc', 'Far-OTM weekly calls'], ['ss', 'Short straddle']], 'bcs', 'A spread offsets much of the vega you\'d lose to crush while keeping directional upside.') },
      { label: 'After hours', date: '2023-05-24', context: 'Q2 revenue guidance ≈ $11B vs ≈ $7B expected. Stock indicated +25%.',
        step: s('Your spread is now deep ITM, near max value. Next?', [['close', 'Close at the open, take max profit'], ['hold', 'Hold to expiry for the last cents']], 'close', 'Remaining upside is tiny; gap days can reverse.') },
      { label: 'Next day', date: '2023-05-25', context: 'Closed ≈ $380 (+24%). IV fell sharply despite the move.',
        step: s('A trader who bought the ATM straddle made money mainly because…', [['move', 'Move ≫ implied move'], ['iv', 'IV rose']], 'move', 'Realized move was ~3× the implied move, overwhelming IV crush.') },
    ],
    outcome: 'A 3× expected-move surprise. Defined-risk bullish structures paid; short premium was crushed.',
  },
  {
    id: 'intc-2024-08', ticker: 'INTC', title: 'Dividend suspended, 26% drop', date: 'Aug 2024',
    summary: 'Weak guidance, ~15% layoffs and a dividend suspension sent INTC down ~26% in a day.',
    terms: ['earnings', 'protective-put', 'cash-secured-put', 'skew'], tags: ['earnings', 'crash', 'semis'],
    checkpoints: [
      { label: 'Before earnings', date: '2024-08-01', context: 'INTC ≈ $29, long downtrend, below 200-day MA. Put skew steep.',
        step: s('You own shares. Cheapest meaningful hedge for the print?', [['pp', 'Buy a near-term OTM put'], ['cc', 'Sell an ATM covered call'], ['none', 'No hedge, it\'s cheap already']], 'pp', 'A protective put caps gap risk; covered calls barely hedge a 26% drop.') },
      { label: 'Gap open', date: '2024-08-02', context: 'Opened ≈ $22. Put IV spiked.',
        step: s('You want to buy shares but lower. With IV spiked, best entry tool?', [['csp', 'Sell cash-secured puts below'], ['lc', 'Buy calls']], 'csp', 'Elevated put premium pays you to wait for a lower entry.') },
      { label: 'Lesson', date: '2024-08-02', context: 'Closed ≈ $21.5 (−26%).',
        step: s('"It\'s already cheap" — what does this event show?', [['trend', 'Downtrends can gap lower; size and hedge'], ['buy', 'Always buy dips']], 'trend', 'Trend + event risk compounds. Hedge or size down.') },
    ],
    outcome: 'Unhedged long holders took a 26% gap. Put buyers and later put sellers were paid.',
  },
  {
    id: 'googl-2023-02', ticker: 'GOOGL', title: 'The Bard demo slip', date: 'Feb 2023',
    summary: 'A factual error in a promotional demo of Bard triggered a ~7–8% one-day drop.',
    terms: ['iv', 'vega', 'long-put', 'expected-move'], tags: ['news', 'gap', 'ai'],
    checkpoints: [
      { label: 'Morning', date: '2023-02-08', context: 'GOOGL ≈ $108. No earnings scheduled. IV moderate.',
        step: s('Unscheduled news risk is priced…', [['less', 'Less than earnings events'], ['more', 'More than earnings']], 'less', 'Options can\'t fully price surprises with no date attached.') },
      { label: 'Midday', date: '2023-02-08', context: 'Stock down ≈ 7%. IV jumped.',
        step: s('You think it\'s an overreaction. With IV up, best bullish tool?', [['bps', 'Put credit spread below the low'], ['lc', 'Buy ATM calls at high IV']], 'bps', 'Sell the inflated IV with defined risk.') },
      { label: 'Close', date: '2023-02-08', context: 'Closed ≈ $99.4 (−7.7%).',
        step: s('Which Greek hurt long call buyers on the bounce days after?', [['vega', 'Vega as IV normalized'], ['rho', 'Rho']], 'vega', 'IV mean-reverted, deflating option prices.') },
    ],
    outcome: 'Unscheduled shocks are under-priced; after the spike, selling elevated IV was favored.',
  },
  {
    id: 'aapl-2019-01', ticker: 'AAPL', title: 'The China guidance cut', date: 'Jan 2019',
    summary: 'Apple cut revenue guidance on weak China demand; stock fell ~10% the next day.',
    terms: ['protective-put', 'collar', 'iv'], tags: ['guidance', 'gap', 'mega-cap'],
    checkpoints: [
      { label: 'After close', date: '2019-01-02', context: 'Guidance ≈ $84B vs ≈ $89–93B prior. AAPL ≈ $158 at close.',
        step: s('You hold shares with a large gain. Fastest risk cut for tomorrow?', [['collar', 'Collar: buy put, sell call'], ['nothing', 'Do nothing']], 'collar', 'A collar sets a floor; the short call funds the put.') },
      { label: 'Open', date: '2019-01-03', context: 'Opens ≈ $143. VIX elevated after a rough December.',
        step: s('Put premiums now are…', [['rich', 'Rich'], ['cheap', 'Cheap']], 'rich', 'Market-wide fear plus single-name shock.') },
      { label: 'Close', date: '2019-01-03', context: 'Closed ≈ $142 (−10%).',
        step: s('Best long-term entry tool given rich puts?', [['csp', 'Cash-secured puts'], ['lc', 'Long calls']], 'csp', 'Sell the fear premium for an entry you\'d accept.') },
    ],
    outcome: 'Mega-caps can gap 10%. Hedges are cheapest before news, not after.',
  },
  {
    id: 'tsla-2018-08', ticker: 'TSLA', title: '"Funding secured"', date: 'Aug 2018',
    summary: 'A tweet about taking Tesla private at $420 spiked the stock ~11%; an SEC suit later reversed it.',
    terms: ['iv', 'gamma', 'bear-put-spread', 'skew'], tags: ['news', 'volatility', 'ev'],
    checkpoints: [
      { label: 'Tweet', date: '2018-08-07', context: 'TSLA ≈ $342 → halted, closes ≈ $380 (+11%). Call IV spikes.',
        step: s('A $420 deal price is credible only if financing is real. Skeptical play?', [['bps', 'Bear put spread, defined risk'], ['sc', 'Sell naked calls']], 'bps', 'Volatile, headline-driven: never naked short.') },
      { label: 'Doubts grow', date: '2018-08-24', context: 'Take-private plan abandoned. Stock ≈ $320s.',
        step: s('What happened to the deal premium in calls?', [['gone', 'Evaporated'], ['up', 'Grew']], 'gone', 'With no deal, the $420 anchor disappears.') },
      { label: 'SEC suit', date: '2018-09-28', context: 'SEC sues; stock ≈ −14% to ≈ $265.',
        step: s('Lesson about headline gaps?', [['def', 'Use defined-risk structures'], ['big', 'Size up on conviction']], 'def', 'Both directions gapped violently within weeks.') },
    ],
    outcome: 'Two-way headline volatility. Defined risk survived both gaps.',
  },
  {
    id: 'amd-2025-10', ticker: 'AMD', title: 'The OpenAI deal surge', date: 'Oct 2025',
    summary: 'A multi-year GPU supply deal with OpenAI sent AMD up ~24% in a day.',
    terms: ['gamma', 'gamma-squeeze', 'open-interest', 'roll'], tags: ['news', 'gap', 'semis', 'ai'],
    checkpoints: [
      { label: 'Premarket', date: '2025-10-06', context: 'AMD ≈ $165 prior close, indicated +25–30%.',
        step: s('You hold 30-DTE calls bought last week. They\'re deep ITM. Smart move?', [['roll', 'Roll up: lock gains, keep some upside'], ['add', 'Add more OTM calls at the open']], 'roll', 'Bank the windfall, keep exposure with less capital at risk.') },
      { label: 'Intraday', date: '2025-10-06', context: 'Heavy call volume; dealers buying stock to hedge.',
        step: s('This feedback loop is…', [['gs', 'Gamma squeeze dynamics'], ['crush', 'IV crush']], 'gs', 'Short-call dealers chase delta upward.') },
      { label: 'Close', date: '2025-10-06', context: 'Closed ≈ $204 (+24%).',
        step: s('Risk for late call buyers at the close?', [['iv', 'High IV + reversal risk'], ['none', 'None, trend is set']], 'iv', 'Post-gap IV is rich and momentum can fade.') },
    ],
    outcome: 'Holders who rolled locked gains; late chasers paid peak IV.',
  },
  {
    id: 'spx-2018-02', ticker: 'SPX', title: 'Volmageddon', date: 'Feb 2018',
    summary: 'VIX more than doubled in a day; short-volatility products like XIV collapsed.',
    terms: ['vix', 'vega', 'iv', 'position-sizing', 'max-loss'], tags: ['macro', 'volatility', 'crash'],
    checkpoints: [
      { label: 'Calm before', date: '2018-01-26', context: 'VIX ≈ 11. Short-vol trades crowded and very profitable for a year.',
        step: s('Short-vol strategy risk profile?', [['tail', 'Small steady gains, rare huge loss'], ['safe', 'Low risk']], 'tail', 'Selling insurance: negative skew of returns.') },
      { label: 'Feb 5 close', date: '2018-02-05', context: 'VIX ≈ 17 → ≈ 37 in one day.',
        step: s('A short-vega position with no defined max loss…', [['ruin', 'Can lose more than a year of gains'], ['ok', 'Recovers quickly']], 'ruin', 'Vega and gap risk compound.') },
      { label: 'Aftermath', date: '2018-02-06', context: 'XIV lost ≈ 90%+ and was terminated.',
        step: s('Key rule this teaches?', [['def', 'Define max loss and size small when selling premium'], ['lev', 'Use more leverage']], 'def', 'Survival beats yield.') },
    ],
    outcome: 'The classic short-volatility blow-up: define risk, size small.',
  },
]

import { MOMENTS_MORE } from './moments_more'
import { MOMENTS_B1 } from './moments_b1'
import { MOMENTS_B2 } from './moments_b2'
import { MOMENTS_B3 } from './moments_b3'
import { MOMENTS_B4 } from './moments_b4'
import { MOMENTS_B5 } from './moments_b5'
import { MOMENTS_B6 } from './moments_b6'
export const MOMENTS: Moment[] = [...MOMENTS_BASE, ...MOMENTS_MORE, ...MOMENTS_B1, ...MOMENTS_B2, ...MOMENTS_B3, ...MOMENTS_B4, ...MOMENTS_B5, ...MOMENTS_B6]
