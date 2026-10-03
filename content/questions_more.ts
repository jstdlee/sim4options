import type { Question } from '../shared/types'
import { s } from './helpers'

// Second batch of hand-written questions (ids l<level>-<nn>, numbering continues after questions.ts).
export const AUTHORED_MORE: Question[] = [
  // ───────── L1
  { id: 'l1-07', level: 1, title: 'Split a put premium', terms: ['put', 'intrinsic', 'extrinsic'], tags: ['pricing'], spot: 47,
    scenario: 'Stock $47. The $50 [[put]] costs $4.10.',
    steps: [
      s('What is the [[intrinsic]] value?', [['a', '$0'], ['b', '$3.00'], ['c', '$4.10']], 'b', 'For a put: strike − spot = 50 − 47 = $3.'),
      s('What is the [[extrinsic]] value?', [['a', '$1.10'], ['b', '$3.00'], ['c', '$7.10']], 'a', '4.10 − 3.00 = $1.10 of time/volatility value.'),
    ] },
  { id: 'l1-08', level: 1, title: 'Seller obligation', terms: ['put', 'assignment', 'premium'], tags: ['basics'],
    scenario: 'You sell one $40 [[put]] and collect the [[premium]].',
    steps: [s('If you are [[assignment|assigned]], what must you do?', [['a', 'Buy 100 shares at $40'], ['b', 'Sell 100 shares at $40'], ['c', 'Nothing, you keep the premium']], 'a', 'The put buyer has the right to sell at $40, so the put seller must buy at $40.')] },
  { id: 'l1-09', level: 1, title: 'Exercise style', terms: ['american', 'european', 'exercise'], tags: ['basics'],
    scenario: 'Option A can be [[exercise|exercised]] on any trading day up to expiry. Option B only at expiry.',
    steps: [s('Which one is [[american|American]] style?', [['a', 'Option A'], ['b', 'Option B']], 'a', 'American options allow early exercise. [[european|European]] options (many index options) exercise only at expiry.')] },
  { id: 'l1-10', level: 1, title: 'Bid, ask and mid', terms: ['bid-ask', 'mid-price', 'limit-order'], tags: ['basics', 'execution'],
    scenario: 'A call shows bid $2.10 and ask $2.30.',
    steps: [
      s('What is the [[mid-price]]?', [['a', '$2.10'], ['b', '$2.20'], ['c', '$2.30']], 'b', '(2.10 + 2.30) ÷ 2 = $2.20.'),
      s('How do you try to buy near the mid?', [['lmt', 'Limit order at $2.20'], ['mkt', 'Market order'], ['hi', 'Limit order at $2.50']], 'lmt', 'A [[limit-order]] sets your maximum price. A market order usually fills at the ask or worse.'),
    ] },
  { id: 'l1-11', level: 1, title: 'Put at expiry', terms: ['put', 'expiration', 'intrinsic', 'multiplier'], tags: ['basics'], spot: 34,
    legs: [{ type: 'put', side: 1, strike: 40, premium: 2.5 }],
    scenario: 'You paid $2.50 for a $40 [[put]]. At [[expiration]] the stock closes at $34.',
    steps: [
      s('Value per share at expiry?', [['a', '$0'], ['b', '$6.00'], ['c', '$34.00']], 'b', 'Only [[intrinsic]] value is left: 40 − 34 = $6.'),
      s('Value of one contract?', [['a', '$6'], ['b', '$60'], ['c', '$600']], 'c', '$6 × 100-share [[multiplier]] = $600.'),
    ] },

  // ───────── L2
  { id: 'l2-07', level: 2, title: 'Theta over ten days', terms: ['theta', 'dte'], tags: ['greeks', 'time'],
    scenario: 'Your long call is worth $3.00 with [[theta]] −0.05 per day. Price and IV stay flat for 10 days.',
    steps: [s('Approximate value after 10 days?', [['a', '$2.50'], ['b', '$2.95'], ['c', '$3.50']], 'a', '10 × −0.05 = −$0.50, so about $2.50. In reality theta grows a little each day.')] },
  { id: 'l2-08', level: 2, title: 'Gamma moves delta', terms: ['gamma', 'delta'], tags: ['greeks'],
    scenario: 'A call has [[delta]] 0.50 and [[gamma]] 0.04. The stock rises $3.',
    steps: [
      s('Approximate new delta?', [['a', '0.54'], ['b', '0.62'], ['c', '0.70']], 'b', '0.50 + 0.04 × 3 = 0.62.'),
      s('Approximate option gain per share?', [['a', '$1.50'], ['b', '$1.68'], ['c', '$1.86']], 'b', 'Use the average delta: 3 × (0.50 + 0.62) ÷ 2 = $1.68. Delta alone (0.50 × 3) understates it.'),
    ] },
  { id: 'l2-09', level: 2, title: 'Parity check', terms: ['put-call-parity', 'call', 'put'], tags: ['pricing'], spot: 105,
    scenario: 'Stock $105. The $100 call costs $8. Ignore rates and dividends.',
    steps: [s('What should the $100 put cost by [[put-call-parity]]?', [['a', '$3'], ['b', '$8'], ['c', '$13']], 'a', 'Call − put = stock − strike, so put = 8 − 105 + 100 = $3.')] },
  { id: 'l2-10', level: 2, title: 'Shape of the curve', terms: ['term-structure', 'backwardation', 'contango', 'iv-crush'], tags: ['volatility'],
    scenario: 'Earnings are in 5 days. Front-week IV is 55%. The next three months show 38%, 35% and 34%.',
    steps: [
      s('What is this [[term-structure]] shape?', [['bw', 'Backwardation (front higher)'], ['ct', 'Contango (back higher)'], ['fl', 'Flat']], 'bw', 'Near-term IV above longer-term IV is [[backwardation]].'),
      s('After the report, front-week IV most likely…', [['dn', 'Drops toward the back months'], ['up', 'Rises further']], 'dn', 'The event premium leaves: [[iv-crush]].'),
    ] },
  { id: 'l2-11', level: 2, title: 'Delta as odds', terms: ['delta', 'probability-itm'], tags: ['greeks', 'probability'],
    scenario: 'An OTM call has [[delta]] 0.30. An OTM put on the same stock has delta −0.30.',
    steps: [
      s('Rough chance the call finishes ITM?', [['a', 'About 30%'], ['b', 'About 50%'], ['c', 'About 70%']], 'a', 'Delta is a common shortcut for [[probability-itm]].'),
      s('Rough chance the short put expires OTM?', [['a', 'About 30%'], ['b', 'About 70%'], ['c', 'About 95%']], 'b', '1 − 0.30 = about 70%. It is an approximation, not an exact figure.'),
    ] },
  { id: 'l2-12', level: 2, title: 'One and two sigma', terms: ['standard-deviation', 'expected-move'], tags: ['volatility', 'probability'], spot: 100,
    scenario: 'Stock $100. The 1σ [[expected-move|expected move]] for 30 days is ±$10.',
    steps: [
      s('Chance it closes between $90 and $110?', [['a', 'About 50%'], ['b', 'About 68%'], ['c', 'About 95%']], 'b', 'About 68% of outcomes fall inside 1 [[standard-deviation]].'),
      s('Chance it closes between $80 and $120?', [['a', 'About 68%'], ['b', 'About 95%'], ['c', '100%']], 'b', '2σ covers about 95%. Real markets have fatter tails.'),
    ] },

  // ───────── L3
  { id: 'l3-07', level: 3, title: 'Put pays off', terms: ['long-put', 'breakeven'], tags: ['strategy', 'bearish'], spot: 60,
    legs: [{ type: 'put', side: 1, strike: 58, premium: 2 }],
    scenario: 'Stock $60. You buy the $58 [[long-put|put]] for $2.',
    steps: [
      s('[[breakeven|Breakeven]] at expiry?', [['a', '$56'], ['b', '$58'], ['c', '$60']], 'a', 'Strike − premium = 58 − 2 = $56.'),
      s('Stock closes at $50. P&L per contract?', [['a', '+$200'], ['b', '+$600'], ['c', '+$800']], 'b', '(58 − 50) − 2 = $6 per share × 100 = $600.'),
    ] },
  { id: 'l3-08', level: 3, title: 'Stock substitute', terms: ['leaps', 'delta', 'leverage'], tags: ['strategy', 'bullish'], spot: 100,
    legs: [{ type: 'call', side: 1, strike: 75, premium: 28 }],
    scenario: 'Stock $100. You are bullish for over a year but do not want to tie up $10,000 in shares.',
    steps: [
      s('Which fits best?', [['leap', 'Deep ITM 18-month $75 call (Δ ≈ 0.85)'], ['wk', 'Weekly $110 call'], ['csp', 'Sell a $75 put']], 'leap', 'A deep ITM [[leaps|LEAPS]] call tracks the stock closely with little [[extrinsic]] value.'),
      s('It costs $28. Capital used vs 100 shares?', [['a', '$280 vs $10,000'], ['b', '$2,800 vs $10,000'], ['c', '$7,500 vs $10,000']], 'b', '$28 × 100 = $2,800. That is [[leverage]]: you can lose all $2,800 if the stock falls below $75.'),
    ] },
  { id: 'l3-09', level: 3, title: 'Covered call math', terms: ['covered-call', 'max-profit', 'breakeven'], tags: ['strategy', 'income'], spot: 50,
    legs: [{ type: 'stock', side: 1, premium: 50 }, { type: 'call', side: -1, strike: 55, premium: 1 }],
    scenario: 'You own 100 shares at $50 and sell the $55 call for $1.',
    steps: [
      s('[[max-profit|Max profit]] per share if called away?', [['a', '$1'], ['b', '$5'], ['c', '$6']], 'c', '(55 − 50) + 1 = $6.'),
      s('Downside [[breakeven]]?', [['a', '$49'], ['b', '$50'], ['c', '$54']], 'a', 'Entry − premium = 50 − 1 = $49.'),
    ] },
  { id: 'l3-10', level: 3, title: 'Buy with a floor', terms: ['married-put', 'max-loss'], tags: ['strategy', 'hedge'], spot: 30,
    legs: [{ type: 'stock', side: 1, premium: 30 }, { type: 'put', side: 1, strike: 28, premium: 1 }],
    scenario: 'You buy 100 shares at $30 and at the same time buy the $28 put for $1 (a [[married-put]]).',
    steps: [
      s('[[max-loss|Max loss]] per share?', [['a', '$1'], ['b', '$2'], ['c', '$3']], 'c', '(30 − 28) + 1 = $3, no matter how far the stock falls.'),
      s('Upside breakeven?', [['a', '$29'], ['b', '$31'], ['c', '$33']], 'b', 'Stock must rise by the put cost: 30 + 1 = $31.'),
    ] },
  { id: 'l3-11', level: 3, title: 'Naked call danger', terms: ['naked-call', 'max-loss', 'breakeven'], tags: ['strategy', 'risk'], spot: 110,
    legs: [{ type: 'call', side: -1, strike: 120, premium: 2 }],
    scenario: 'Stock $110. You sell the $120 call for $2 without owning shares (a [[naked-call]]).',
    steps: [
      s('[[max-loss|Max loss]]?', [['a', '$2 per share'], ['b', '$120 per share'], ['c', 'Unlimited']], 'c', 'The stock can rise without limit, and you must deliver shares at $120.'),
      s('[[breakeven|Breakeven]] at expiry?', [['a', '$118'], ['b', '$120'], ['c', '$122']], 'c', 'Strike + premium = $122.'),
    ] },

  // ───────── L4
  { id: 'l4-07', level: 4, title: 'Bull put spread', terms: ['bull-put-spread', 'credit-spread', 'breakeven'], tags: ['spread', 'bullish'], spot: 100,
    legs: [{ type: 'put', side: -1, strike: 95, premium: 2.4 }, { type: 'put', side: 1, strike: 90, premium: 1 }],
    scenario: 'Stock $100. You sell the $95 put for $2.40 and buy the $90 put for $1.00 (a [[bull-put-spread]]).',
    steps: [
      s('Net credit?', [['a', '$1.40'], ['b', '$2.40'], ['c', '$3.40']], 'a', '2.40 − 1.00 = $1.40.'),
      s('[[max-loss|Max loss]] per share?', [['a', '$1.40'], ['b', '$3.60'], ['c', '$5.00']], 'b', 'Width − credit = 5 − 1.40 = $3.60.'),
      s('[[breakeven|Breakeven]] at expiry?', [['a', '$91.40'], ['b', '$93.60'], ['c', '$96.40']], 'b', 'Short strike − credit = 95 − 1.40 = $93.60.'),
    ] },
  { id: 'l4-08', level: 4, title: 'Bear call spread', terms: ['bear-call-spread', 'iv-rank', 'credit-spread'], tags: ['spread', 'bearish'], spot: 200,
    legs: [{ type: 'call', side: -1, strike: 210, premium: 3.1 }, { type: 'call', side: 1, strike: 215, premium: 1.6 }],
    scenario: 'Stock $200 under resistance at $208. IV Rank 72. You sell the $210 call for $3.10 and buy the $215 call for $1.60.',
    steps: [
      s('Why a credit spread here?', [['a', 'Rich IV + bearish-to-neutral view'], ['b', 'Cheap IV + strong bullish view']], 'a', 'High [[iv-rank]] pays sellers. A [[bear-call-spread]] wins if the stock stays below $210.'),
      s('Max profit and max loss per share?', [['a', '$1.50 / $3.50'], ['b', '$3.10 / $1.90'], ['c', '$1.50 / $5.00']], 'a', 'Credit 3.10 − 1.60 = $1.50. Max loss = 5 − 1.50 = $3.50.'),
      s('Breakeven?', [['a', '$208.50'], ['b', '$211.50'], ['c', '$213.50']], 'b', 'Short strike + credit = 210 + 1.50.'),
    ] },
  { id: 'l4-09', level: 4, title: 'Iron butterfly', terms: ['iron-butterfly', 'short-straddle', 'breakeven'], tags: ['spread', 'neutral'], spot: 100,
    legs: [{ type: 'put', side: 1, strike: 90, premium: 1 }, { type: 'put', side: -1, strike: 100, premium: 4 }, { type: 'call', side: -1, strike: 100, premium: 4 }, { type: 'call', side: 1, strike: 110, premium: 1 }],
    scenario: 'Stock pinned at $100. Sell the $100 straddle for $8, buy the $90 put and $110 call for $1 each.',
    steps: [
      s('Net credit and max loss?', [['a', '$6 / $4'], ['b', '$8 / $2'], ['c', '$6 / unlimited']], 'a', 'Credit 8 − 2 = $6. Wing width 10 − 6 = $4 max loss. The wings turn a [[short-straddle]] into a defined-risk [[iron-butterfly]].'),
      s('Breakevens?', [['a', '$94 and $106'], ['b', '$92 and $108'], ['c', '$90 and $110']], 'a', '100 ± 6 credit.'),
    ] },
  { id: 'l4-10', level: 4, title: 'Poor man\'s covered call', terms: ['pmcc', 'leaps', 'diagonal'], tags: ['spread', 'income'], spot: 50,
    scenario: 'Stock $50. Buy an 18-month $40 [[leaps|LEAPS]] call for $13. Sell a 30-DTE $55 call for $1.',
    steps: [
      s('What is this structure?', [['pmcc', 'Poor man\'s covered call'], ['ic', 'Iron condor'], ['bcs', 'Bear call spread']], 'pmcc', 'A [[pmcc]] is a long-dated [[diagonal]] that copies a covered call with less capital.'),
      s('If the $55 call is assigned, is a loss locked in?', [['no', 'No: width $15 > net debit $12'], ['yes', 'Yes: assignment always locks a loss']], 'no', 'Net debit 13 − 1 = $12. Strike width 55 − 40 = $15 is larger, so you still profit at least $3.'),
    ] },
  { id: 'l4-11', level: 4, title: 'Butterfly payoff', terms: ['butterfly', 'max-profit', 'breakeven'], tags: ['spread', 'neutral'], spot: 100,
    legs: [{ type: 'call', side: 1, strike: 95, premium: 6.6 }, { type: 'call', side: -1, strike: 100, premium: 3.4, qty: 2 }, { type: 'call', side: 1, strike: 105, premium: 1.4 }],
    scenario: 'Stock $100. Buy the 95/100/105 call [[butterfly]] for a $1.20 debit.',
    steps: [
      s('[[max-profit|Max profit]] and where?', [['a', '$3.80 at $100'], ['b', '$5.00 at $100'], ['c', '$3.80 at $105']], 'a', 'Wing width − debit = 5 − 1.20 = $3.80, at the middle strike.'),
      s('Breakevens?', [['a', '$96.20 and $103.80'], ['b', '$95 and $105'], ['c', '$98.80 and $101.20']], 'a', '95 + 1.20 and 105 − 1.20.'),
    ] },

  // ───────── L5
  { id: 'l5-06', level: 5, title: 'FOMC tomorrow', terms: ['fomc', 'iv', 'iron-condor'], tags: ['events', 'market'],
    scenario: 'Index flat, IV Rank 40. The [[fomc|FOMC]] decision is tomorrow. You plan a 30-DTE iron condor.',
    steps: [
      s('What does the event usually do to short-dated [[iv|IV]]?', [['a', 'Lifts it before, drops it after'], ['b', 'No effect'], ['c', 'Drops it before, lifts it after']], 'a', 'Event risk is priced in ahead and released once the news is out.'),
      s('Best plan?', [['wait', 'Wait for the decision, then reassess'], ['all', 'Sell a full-size condor now'], ['0dte', 'Sell a naked 0DTE straddle into it']], 'wait', 'A big surprise can blow through your strikes. Entering after the event removes the gap risk.'),
    ] },
  { id: 'l5-07', level: 5, title: 'Bollinger squeeze', terms: ['bollinger', 'atr', 'iv-rank', 'straddle'], tags: ['indicator', 'volatility'],
    scenario: '[[bollinger|Bollinger Bands]] are the narrowest in 6 months, [[atr|ATR]] keeps falling and IV Rank is 8.',
    steps: [
      s('What often follows a squeeze?', [['exp', 'Volatility expansion'], ['more', 'Even lower volatility for sure']], 'exp', 'Quiet periods tend to end with a range break, but the direction is unknown.'),
      s('Structure?', [['ls', 'Long straddle'], ['ss', 'Short strangle'], ['ic', 'Iron condor']], 'ls', 'Cheap IV + expected expansion + no direction → own a [[straddle]].'),
    ] },
  { id: 'l5-08', level: 5, title: 'MACD in an uptrend', terms: ['macd', 'trend', 'iv-rank', 'bull-put-spread'], tags: ['indicator'],
    scenario: 'Price is above the 200-day MA. [[macd|MACD]] just crossed above its signal line. RSI 55, IV Rank 65.',
    steps: [
      s('Bias?', [['bull', 'Bullish'], ['bear', 'Bearish']], 'bull', 'Uptrend plus a fresh bullish momentum cross.'),
      s('Structure?', [['bps', 'Bull put spread below support'], ['lc', 'Long OTM calls'], ['bcs', 'Bear call spread']], 'bps', 'Bullish + rich IV → sell premium with a [[bull-put-spread]].'),
    ] },
  { id: 'l5-09', level: 5, title: 'ATR stop', terms: ['atr', 'stop-loss'], tags: ['indicator', 'risk'], spot: 80,
    scenario: 'You hold calls on a stock at $80. Its [[atr|ATR]] (14-day) is $2.50. Your rule: exit if it closes 2 ATR below entry.',
    steps: [
      s('[[stop-loss|Stop]] level on the stock?', [['a', '$77.50'], ['b', '$75.00'], ['c', '$72.50']], 'b', '80 − 2 × 2.50 = $75.'),
      s('Why use ATR rather than a fixed $1?', [['a', 'It fits the stop to normal daily noise'], ['b', 'It guarantees a profit']], 'a', 'A stop inside normal noise gets hit by random moves.'),
    ] },
  { id: 'l5-10', level: 5, title: 'CPI before the open', terms: ['cpi', 'expected-move', 'gap', 'iron-condor'], tags: ['events', 'market'], spot: 450,
    scenario: 'Index ETF $450. [[cpi|CPI]] prints before tomorrow\'s open. The weekly ATM straddle costs $9.',
    steps: [
      s('Range implied by the straddle?', [['a', '$441 to $459'], ['b', '$432 to $468'], ['c', '$445.50 to $454.50']], 'a', 'Straddle price ≈ [[expected-move|expected move]]: 450 ± 9.'),
      s('You expect a smaller move. Defined-risk choice?', [['ic', 'Iron condor with shorts outside $441–$459'], ['ss', 'Naked short straddle'], ['ls', 'Long straddle']], 'ic', 'Collect rich event premium, wings cap the damage from a [[gap]].'),
    ] },

  // ───────── L6
  { id: 'l6-06', level: 6, title: 'Dividend assignment', terms: ['early-exercise', 'ex-dividend', 'dividend-risk', 'assignment'], tags: ['management', 'risk'], spot: 55,
    scenario: 'You are short the $50 call of a covered call. Stock $55, call $5.20. [[ex-dividend|Ex-dividend]] tomorrow, dividend $0.80.',
    steps: [
      s('How likely is [[early-exercise]] tonight?', [['hi', 'Likely: extrinsic $0.20 < dividend $0.80'], ['lo', 'Unlikely: calls are never exercised early']], 'hi', 'The call holder gains more from the dividend than the $0.20 time value they give up.'),
      s('If assigned, what happens?', [['a', 'Shares sold at $50, you miss the dividend'], ['b', 'You keep shares and dividend']], 'a', 'This is [[dividend-risk]]. Buy back the call today if you want to keep the shares.'),
    ] },
  { id: 'l6-07', level: 6, title: 'Roll up and out', terms: ['roll', 'covered-call'], tags: ['management'], spot: 104,
    scenario: 'Covered call: short $100 call, stock $104, 7 DTE. Buy it back for $6.00 and sell the 37-DTE $105 call for $6.50.',
    steps: [
      s('Net credit or debit of the [[roll]]?', [['a', '$0.50 credit'], ['b', '$0.50 debit'], ['c', '$12.50 credit']], 'a', '6.50 − 6.00 = $0.50 credit.'),
      s('What else did you gain?', [['a', '$5 more upside room'], ['b', 'Unlimited upside'], ['c', 'Nothing']], 'a', 'The cap moved from $100 to $105, for 30 more days of exposure.'),
    ] },
  { id: 'l6-08', level: 6, title: 'Exit plan', terms: ['profit-target', 'stop-loss', 'risk-reward', 'credit-spread'], tags: ['management', 'risk'],
    scenario: 'You sold a $5-wide put [[credit-spread]] for $1.50. Plan: take 50% of max profit, stop when the loss equals the credit.',
    steps: [
      s('Buy-back price for the [[profit-target]]?', [['a', '$0.75'], ['b', '$1.00'], ['c', '$2.25']], 'a', '50% of $1.50 kept → buy back at $0.75.'),
      s('Buy-back price for the [[stop-loss]]?', [['a', '$1.50'], ['b', '$3.00'], ['c', '$5.00']], 'b', 'Loss = 1.50 when the spread costs 1.50 + 1.50 = $3.00.'),
      s('[[risk-reward|Reward : risk]] of this plan?', [['a', '$0.75 : $1.50'], ['b', '$1.50 : $3.50'], ['c', '$1.50 : $1.50']], 'a', 'You aim to make $0.75 and accept losing $1.50, so you need to win more than 2 of 3 trades.'),
    ] },
  { id: 'l6-09', level: 6, title: 'Kelly sizing', terms: ['kelly', 'position-sizing'], tags: ['management', 'risk'],
    scenario: 'A setup wins 60% of the time, and wins and losses are the same size.',
    steps: [
      s('Full [[kelly]] fraction?', [['a', '10%'], ['b', '20%'], ['c', '60%']], 'b', 'f = p − q/b = 0.60 − 0.40/1 = 0.20.'),
      s('Many traders use half Kelly. Fraction?', [['a', '10%'], ['b', '30%'], ['c', '40%']], 'a', 'Half of 20%. Your win rate is only an estimate, so bet less than full Kelly.'),
    ] },
  { id: 'l6-10', level: 6, title: 'High odds, no edge', terms: ['expected-value', 'probability-of-profit', 'slippage'], tags: ['management', 'risk'],
    scenario: 'A spread has a 70% [[probability-of-profit]]. Win = +$150, loss = −$350.',
    steps: [
      s('[[expected-value|Expected value]] per trade?', [['a', '+$105'], ['b', '$0'], ['c', '−$105']], 'b', '0.7 × 150 − 0.3 × 350 = 105 − 105 = $0.'),
      s('After commissions and [[slippage]]?', [['a', 'Slightly negative'], ['b', 'Still zero'], ['c', 'Positive']], 'a', 'A high win rate alone is not an edge. Costs push a zero-EV trade below zero.'),
    ] },
  { id: 'l6-11', level: 6, title: 'Next turn of the wheel', terms: ['wheel', 'covered-call', 'assignment'], tags: ['management', 'income'], spot: 44,
    scenario: 'You sold a $45 put for $1.20 and were [[assignment|assigned]]. Stock now $44.',
    steps: [
      s('Your cost basis per share?', [['a', '$43.80'], ['b', '$44.00'], ['c', '$45.00']], 'a', '45 − 1.20 = $43.80.'),
      s('Next step of the [[wheel]]?', [['cc', 'Sell a covered call'], ['csp', 'Sell another put'], ['lp', 'Buy a put']], 'cc', 'The wheel alternates: puts until assigned, then calls until called away.'),
      s('Sell the $45 call for $0.90. Profit per share if called away?', [['a', '$0.90'], ['b', '$1.20'], ['c', '$2.10']], 'c', '(45 − 43.80) + 0.90 = $2.10.'),
    ] },

  // ───────── L7 (prices from the simulator Black-Scholes model, r = 4%)
  { id: 'l7-01', level: 7, title: 'Build a put spread', terms: ['bull-put-spread', 'black-scholes', 'max-loss'], tags: ['simulator', 'spread'], spot: 100,
    legs: [{ type: 'put', side: -1, strike: 95, premium: 1.33 }, { type: 'put', side: 1, strike: 90, premium: 0.4 }],
    scenario: 'Simulator: stock $100, IV 30%, 30 DTE. Model prices: $95 put ≈ $1.33, $90 put ≈ $0.40.',
    steps: [
      s('Which legs build a [[bull-put-spread]]?', [['a', 'Sell $95 put, buy $90 put'], ['b', 'Buy $95 put, sell $90 put'], ['c', 'Sell $95 put only']], 'a', 'Sell the higher strike, buy the lower one as protection.'),
      s('Net credit?', [['a', 'About $0.40'], ['b', 'About $0.93'], ['c', 'About $1.73']], 'b', '1.33 − 0.40 = $0.93.'),
      s('[[max-loss|Max loss]] per share?', [['a', 'About $4.07'], ['b', 'About $5.00'], ['c', 'About $0.93']], 'a', '5 − 0.93 = $4.07.'),
    ] },
  { id: 'l7-02', level: 7, title: 'Advance 20 days', terms: ['theta', 'profit-target', 'bull-put-spread'], tags: ['simulator', 'management'], spot: 100,
    scenario: 'Same spread (credit $0.93). Advance 20 days, stock still $100, IV 30%. Model: $95 put ≈ $0.36, $90 put ≈ $0.03.',
    steps: [
      s('Cost to close the spread now?', [['a', 'About $0.33'], ['b', 'About $0.39'], ['c', 'About $0.60']], 'a', '0.36 − 0.03 = $0.33.'),
      s('Profit so far, as % of max?', [['a', 'About 35%'], ['b', 'About 65%'], ['c', 'About 100%']], 'b', '(0.93 − 0.33) ÷ 0.93 ≈ 65%. [[theta]] did the work.'),
      s('Your [[profit-target]] is 50%. Action?', [['close', 'Close the spread'], ['hold', 'Hold to expiry']], 'close', 'Target reached. The last $0.33 is not worth 10 more days of gamma risk.'),
    ] },
  { id: 'l7-03', level: 7, title: 'Flat stock, long call', terms: ['theta', 'long-call', 'dte'], tags: ['simulator', 'time'], spot: 100,
    scenario: 'Simulator: buy the $100 call, stock $100, IV 30%, 30 DTE, model ≈ $3.59. Advance 20 days with the stock flat: model ≈ $2.04.',
    steps: [
      s('Loss per share?', [['a', 'About $0.55'], ['b', 'About $1.55'], ['c', 'About $2.04']], 'b', '3.59 − 2.04 = $1.55, about 43% of the premium.'),
      s('How did daily [[theta]] change (≈ −0.06 at 30 DTE)?', [['grow', 'Grew to about −0.10 per day'], ['shrink', 'Shrank to about −0.03 per day']], 'grow', 'Theta on an ATM option speeds up as [[dte|DTE]] falls.'),
    ] },
  { id: 'l7-04', level: 7, title: 'Volatility shock', terms: ['short-strangle', 'vega', 'iron-condor'], tags: ['simulator', 'volatility'], spot: 200,
    legs: [{ type: 'put', side: -1, strike: 180, premium: 2.34 }, { type: 'call', side: -1, strike: 220, premium: 3.46 }],
    scenario: 'Simulator: short 180/220 [[short-strangle|strangle]] on a $200 stock, IV 35%, 45 DTE, credit ≈ $5.80. Position [[vega]] ≈ −0.40.',
    steps: [
      s('IV jumps to 45%, stock flat. P&L per share?', [['a', 'About −$4.30'], ['b', 'About +$4.30'], ['c', 'About −$0.40']], 'a', '−0.40 × 10 ≈ −$4; the model gives ≈ −$4.30 because vega grows as IV rises.'),
      s('Next time, how do you cap this risk?', [['ic', 'Buy wings: trade an iron condor'], ['more', 'Sell twice as many strangles'], ['far', 'Use 1-year expiry']], 'ic', 'An [[iron-condor]] has defined max loss and smaller short vega.'),
    ] },
  { id: 'l7-05', level: 7, title: '0DTE gamma', terms: ['0dte', 'gamma', 'delta'], tags: ['simulator', 'risk'], spot: 500,
    scenario: 'Simulator: index $500, IV 15%. Compare an ATM 30-DTE call with an ATM [[0dte|0DTE]] call with about 1 hour left. Both have delta ≈ 0.50.',
    steps: [
      s('Index rises $1. New delta of the 0DTE call?', [['a', 'About 0.52'], ['b', 'About 0.90'], ['c', 'Still 0.50']], 'b', 'With an hour left [[gamma]] is huge (≈ 0.5), so delta jumps. The 30-DTE call only moves to ≈ 0.56.'),
      s('What follows for 0DTE trades?', [['a', 'Small moves swing P&L hard: size small, keep risk defined'], ['b', 'They are low risk because they are cheap']], 'a', 'Cheap premium hides high gamma risk.'),
    ] },
  { id: 'l7-06', level: 7, title: 'Tested iron condor', terms: ['iron-condor', 'adjustment', 'roll'], tags: ['simulator', 'management'], spot: 400,
    legs: [{ type: 'put', side: 1, strike: 380, premium: 1 }, { type: 'put', side: -1, strike: 390, premium: 2.5 }, { type: 'call', side: -1, strike: 410, premium: 2.5 }, { type: 'call', side: 1, strike: 420, premium: 1 }],
    scenario: 'Simulator: 380/390/410/420 [[iron-condor]] on a $400 index for a $3.00 credit. Advance time: with 10 DTE the index reaches $410.',
    steps: [
      s('Standard [[adjustment]]?', [['a', 'Close or roll the tested call side'], ['b', 'Sell a second condor'], ['c', 'Sell the long $420 call']], 'a', 'Deal with the threatened side. Removing the long call makes the risk unlimited.'),
      s('You hold instead. Expiry at $415. P&L per share?', [['a', '+$3.00'], ['b', '−$2.00'], ['c', '−$7.00']], 'b', 'Call spread loses 415 − 410 = $5. Net: 3 − 5 = −$2.'),
      s('Expiry at $405 instead?', [['a', '+$3.00'], ['b', '+$1.00'], ['c', '−$2.00']], 'a', 'Between the short strikes all options expire worthless: keep the full credit.'),
    ] },
]
