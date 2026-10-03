import type { Moment } from '../shared/types'
import { s } from './helpers'

// Second batch of market moments. Prices and IV figures are approximate, reconstructed for teaching.
// Prices are as traded at the time (not adjusted for later splits: GME 4:1 2022, TSLA 3:1 2022, NFLX 10:1 2025).

export const MOMENTS_MORE: Moment[] = [
  {
    id: 'gme-2021-01', ticker: 'GME', title: 'The meme-stock squeeze', date: 'Jan 2021',
    summary: 'Retail call buying and ~140% short interest drove GME from ≈ $20 to a $483 intraday high in about two weeks.',
    terms: ['short-interest', 'gamma-squeeze', 'iv', 'open-interest', 'naked-call'], tags: ['squeeze', 'volatility', 'retail'],
    checkpoints: [
      { label: 'First spike', date: '2021-01-13', context: 'GME ≈ $20 → ≈ $31 (+57%) after new board seats. Short interest ≈ 140% of float.',
        step: s('You think the shorts are trapped. Which trade keeps your risk defined?', [['lc', 'Small long call or call spread'], ['nc', 'Sell naked calls, it must fall'], ['short', 'Short the stock']], 'lc', 'With this much short interest, short stock and naked calls have unlimited loss. A long call can only lose its premium.') },
      { label: 'The squeeze', date: '2021-01-27', context: 'Closed ≈ $148 (Jan 26) → ≈ $348 (Jan 27). Call open interest piled into OTM strikes. IV in the hundreds of %.',
        step: s('You want in now. Calls cost a fortune. Best choice?', [['tiny', 'Stay out, or risk only money you can lose in full'], ['otm', 'Buy many cheap OTM weeklies'], ['sell', 'Sell calls at this IV, no hedge']], 'tiny', 'Extreme IV makes calls expensive, and naked short calls face a squeeze. Size is the only real control here.') },
      { label: 'Broker limits', date: '2021-01-28', context: 'Intraday high ≈ $483. Brokers restricted buying. Closed ≈ $194 (−44%).',
        step: s('The dealer hedging that pushed GME up now does what?', [['unwind', 'Unwinds: dealers sell stock as call delta falls'], ['hold', 'Keeps supporting the price']], 'unwind', 'A gamma squeeze works in both directions. Falling price cuts call delta, so hedges get sold.') },
    ],
    outcome: 'A [[short-interest]] squeeze plus a [[gamma-squeeze]]. Naked short calls were ruinous; late call buyers paid peak IV. Defined risk and small size won.',
  },
  {
    id: 'spy-2020-03', ticker: 'SPY', title: 'The COVID crash', date: 'Mar 2020',
    summary: 'The S&P 500 fell ~34% in 23 trading days and VIX closed at a record ≈ 82.7.',
    terms: ['vix', 'protective-put', 'tail-risk', 'backwardation', 'term-structure'], tags: ['macro', 'crash', 'volatility'],
    checkpoints: [
      { label: 'Market top', date: '2020-02-19', context: 'SPY ≈ $338, record close. VIX ≈ 14. VIX term structure in normal upward slope.',
        step: s('You hold a large stock portfolio. When is index protection cheapest?', [['now', 'Now, while VIX is low: buy small OTM puts'], ['later', 'After a sell-off confirms the risk'], ['never', 'Never, the market always recovers']], 'now', 'Low IV means cheap insurance. Tail-risk hedges must be bought before the fear, not during it.') },
      { label: 'Record VIX', date: '2020-03-16', context: 'SPY ≈ $240 (−29% from top). SPX −12% in one day. VIX closed ≈ 82.7. Front VIX above later months: backwardation.',
        step: s('You did not hedge. Puts now price VIX ≈ 80. Best way to cut risk?', [['reduce', 'Sell some shares, or use a put spread or collar'], ['atm', 'Buy ATM puts at any price']], 'reduce', 'At peak IV, outright puts are very expensive. Cutting size or selling a leg against the put lowers the cost.') },
      { label: 'The low', date: '2020-03-23', context: 'SPY closed ≈ $223 (−34% from top). Fed announced unlimited QE that morning. VIX ≈ 62.',
        step: s('Your February puts are deep ITM and worth many times their cost. Next?', [['roll', 'Take profit on part; roll the rest to lower strikes'], ['hold', 'Hold all of them to expiry']], 'roll', 'Bank the hedge gain while IV is high. Rolling down keeps some protection if the fall resumes.') },
    ],
    outcome: 'A true [[tail-risk]] event. Puts bought at VIX ≈ 14 paid many times over; protection bought in [[backwardation]] cost the most.',
  },
  {
    id: 'meta-2022-02', ticker: 'META', title: 'The first user decline', date: 'Feb 2022',
    summary: 'The first-ever drop in daily users and weak guidance sent META down ~26% in a day.',
    terms: ['earnings', 'gap', 'iv-crush', 'expected-move', 'iron-condor'], tags: ['earnings', 'gap', 'mega-cap'],
    checkpoints: [
      { label: 'Before earnings', date: '2022-02-02', context: 'META ≈ $323. Options imply a high-single-digit % move (approximate). IV elevated pre-report.',
        step: s('You want to sell the rich pre-earnings IV. Safer structure?', [['ic', 'Iron condor outside the expected move'], ['ss', 'Naked short strangle'], ['sp', 'Short ATM straddle, large size']], 'ic', 'Both sell the IV crush, but the condor\'s long wings cap the loss on a big gap.') },
      { label: 'After hours', date: '2022-02-02', context: 'Daily users ≈ 1.93B, first quarterly decline ever. Weak Q1 guidance. Stock indicated −20% or more.',
        step: s('The put side of your iron condor is now far ITM. Your loss is…', [['cap', 'Capped: wing width minus credit'], ['open', 'Open-ended until you close']], 'cap', 'The long put wing defines the max loss. A naked short put would keep losing down to zero.') },
      { label: 'Next day', date: '2022-02-03', context: 'Opened ≈ $245, closed ≈ $238 (−26%). ≈ $230B of market value lost in a day.',
        step: s('The −26% move was far beyond the implied move. What is the expected move?', [['sd', 'About a one-SD estimate, not a limit'], ['max', 'The most the stock can move']], 'sd', 'Roughly one time in three the move is bigger. Tails like this are why short premium needs defined risk.') },
    ],
    outcome: 'IV crush helps premium sellers only inside the [[expected-move]]. A 26% [[gap]] made defined risk the difference between a loss and a blow-up.',
  },
  {
    id: 'nflx-2022-04', ticker: 'NFLX', title: 'The subscriber loss', date: 'Apr 2022',
    summary: 'Netflix lost subscribers for the first time in a decade; the stock gapped ~35% lower.',
    terms: ['earnings', 'gap', 'put-call-ratio', 'protective-put', 'stop-loss'], tags: ['earnings', 'gap', 'crash'],
    checkpoints: [
      { label: 'Before earnings', date: '2022-04-19', context: 'NFLX ≈ $349, already down ≈ 42% in 2022. Options imply roughly a ±10% move (approximate). Put demand heavy, sentiment gloomy.',
        step: s('You own shares. Puts are bid and sentiment is gloomy. Best move?', [['pp', 'Buy a protective put'], ['cc', 'Sell a covered call'], ['none', 'No hedge, the bad news is priced in']], 'pp', 'Heavy put demand shows fear, not a floor. Only a put defines your loss.') },
      { label: 'After hours', date: '2022-04-19', context: 'Lost ≈ 200K subscribers vs ≈ +2.5M expected. Guided ≈ −2M for Q2.',
        step: s('You also have a stop-loss on shares at $320. Where will it fill?', [['open', 'Near the open, far below $320'], ['stop', 'At $320']], 'open', 'A gap skips the stop. A put pays from its strike no matter where the stock opens.') },
      { label: 'Close', date: '2022-04-20', context: 'Opened ≈ $245, closed ≈ $226 (−35%). ≈ $50B of market value lost.',
        step: s('The heavy put buying before the print meant…', [['nosig', 'Fear can be right; sentiment is not a hedge'], ['buy', 'A sure contrarian buy signal']], 'nosig', 'Crowded fear is not a timing tool. Define risk before the event.') },
    ],
    outcome: 'Stops failed in the [[gap]]; [[protective-put]] holders had a known floor. The [[put-call-ratio]] showed fear but did not limit losses.',
  },
  {
    id: 'tsla-2020-11', ticker: 'TSLA', title: 'The S&P 500 run-up', date: 'Nov–Dec 2020',
    summary: 'News of S&P 500 inclusion started a ~70% run in five weeks as index funds had to buy.',
    terms: ['iv', 'trend', 'naked-call', 'short-strangle', 'bear-call-spread'], tags: ['index', 'trend', 'ev'],
    checkpoints: [
      { label: 'Inclusion news', date: '2020-11-17', context: 'S&P announced inclusion after the Nov 16 close. TSLA ≈ $408 → ≈ $442 (+8%). Prices as traded in 2020. IV elevated.',
        step: s('You think TSLA is overvalued. How do you express it?', [['bcs', 'Small bear call spread, defined risk'], ['nc', 'Sell naked calls for rich premium']], 'bcs', 'Index funds are forced buyers into the date. Never sell unlimited upside into forced demand.') },
      { label: 'Trend continues', date: '2020-12-08', context: 'TSLA ≈ $650 (+59% since Nov 16). IV still high.',
        step: s('A friend sold a short strangle ±15% wide in mid-November. The call side is far ITM. Best action?', [['close', 'Close or cut it at the planned max loss'], ['wait', 'Hold, it has to mean-revert']], 'close', 'Strong trends can run further. Undefined loss grows each day you wait.') },
      { label: 'Inclusion day', date: '2020-12-21', context: 'Dec 18 closed ≈ $695 on record volume. First day in the index: ≈ $650 (−6.5%).',
        step: s('Lesson for premium sellers?', [['trend', 'Do not fight a strong trend with undefined risk'], ['right', 'The bears were right, so the trade was fine']], 'trend', 'Being right later does not help if the position is stopped out or blown up first.') },
    ],
    outcome: 'A forced-buyer [[trend]]. Naked call sellers were run over; defined-risk bears could wait for the sell-the-news dip.',
  },
  {
    id: 'kre-2023-03', ticker: 'KRE', title: 'The SVB bank run', date: 'Mar 2023',
    summary: 'Silicon Valley Bank failed in two days; regional bank stocks fell together and KRE lost ~23% in three sessions.',
    terms: ['tail-risk', 'liquidity', 'correlation', 'protective-put', 'iv'], tags: ['banks', 'crash', 'contagion'],
    checkpoints: [
      { label: 'Capital raise', date: '2023-03-08', context: 'After the close SVB reports ≈ $1.8B loss on bond sales and seeks ≈ $2.25B of new capital. SIVB ≈ $268, KRE ≈ $58. VIX ≈ 19.',
        step: s('You own several regional bank stocks. Best hedge?', [['kre', 'Buy KRE puts'], ['cc', 'Sell covered calls on each bank'], ['none', 'No hedge, the problem is one bank']], 'kre', 'In a run, bank stocks are highly correlated. Liquid sector puts protect the whole basket.') },
      { label: 'Run and seizure', date: '2023-03-10', context: 'SIVB fell 60% to ≈ $106 on Mar 9. Mar 10: trading halted, FDIC seized the bank. KRE ≈ $51.',
        step: s('A trader holds SIVB options and the stock is halted. Lesson?', [['liq', 'Halts trap positions; prefer liquid hedges and small size'], ['fine', 'Options can still be traded normally']], 'liq', 'With no market, you cannot exit or adjust. Liquidity is a risk too.') },
      { label: 'Contagion Monday', date: '2023-03-13', context: 'Signature Bank closed Sunday; Fed launched a lending backstop. KRE closed ≈ $44.5 (−12%), low ≈ $42. VIX ≈ 26.5.',
        step: s('Your KRE puts are up a lot and put IV spiked. Next?', [['take', 'Take partial profit or roll down'], ['add', 'Buy more puts at peak IV']], 'take', 'A policy backstop can spark a snap-back. Bank part of the hedge while IV is rich.') },
    ],
    outcome: 'A [[tail-risk]] event that spread by [[correlation]]. Liquid sector puts worked; single-stock positions were stuck when [[liquidity]] vanished.',
  },
  {
    id: 'vix-2024-08', ticker: 'VIX', title: 'The yen carry unwind', date: 'Aug 2024',
    summary: 'A BoJ hike and weak US jobs data forced a carry-trade unwind; VIX hit ≈ 65 intraday from ≈ 12 in July.',
    terms: ['vix', 'contango', 'backwardation', 'short-straddle', 'position-sizing'], tags: ['macro', 'volatility', 'crash'],
    checkpoints: [
      { label: 'Summer calm', date: '2024-07-12', context: 'VIX ≈ 12.5. SPX ≈ 5,615 near record. VIX futures in contango.',
        step: s('Selling SPX straddles has paid all year. How do you size it?', [['small', 'Small size, with defined-risk wings'], ['big', 'Size up: VIX is low and calm']], 'small', 'Low VIX means little premium for the same gap risk. Size for the shock, not the calm.') },
      { label: 'Monday panic', date: '2024-08-05', context: 'Nikkei −12.4%. VIX ≈ 23 Friday close → ≈ 65 intraday, closed ≈ 38.6. SPX −3% to ≈ 5,186. Futures in steep backwardation.',
        step: s('You hold a short SPX straddle and it hit your max-loss level. Next?', [['cut', 'Close or reduce as planned'], ['double', 'Sell more straddles at the peak'], ['wait', 'Ignore the plan and wait']], 'cut', 'The plan exists for this day. Adding to a losing short-vol trade at peak stress is how accounts end.') },
      { label: 'Fast fade', date: '2024-08-16', context: 'VIX ≈ 14.8. SPX ≈ 5,554. Curve back in contango.',
        step: s('Spot VIX hit 65, but VIX calls gained far less. Why?', [['fut', 'VIX options price off futures, which were far below spot'], ['iv', 'VIX options had no IV']], 'fut', 'In backwardation, futures expect the spike to fade. VIX options follow the futures, not spot.') },
    ],
    outcome: 'Spike and fade in two weeks. [[position-sizing]] decided who survived; the [[backwardation]] curve showed the market expected a quick reset.',
  },
]
