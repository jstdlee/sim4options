export type OptType = 'call' | 'put' | 'stock'

export interface Leg {
  type: OptType
  side: 1 | -1        // 1 = long, -1 = short
  strike?: number     // ignored for stock
  premium?: number    // per share; for stock = entry price
  qty?: number        // contracts (default 1); stock in 100-share lots
}

export interface Choice { id: string; label: string }

export interface Step {
  prompt: string          // may contain [[term]] or [[term|label]] links
  choices: Choice[]
  answer: string          // choice id
  why: string             // short static explanation (AI expands on demand)
  brief?: Brief           // moments: what the learner knows at this checkpoint
}

/** Situation at a market-moment checkpoint: only facts known at that time. */
export interface Brief { label: string; date: string; facts: string[]; note?: string }

export interface Question {
  id: string
  level: number           // 1..7
  title: string
  scenario: string        // markdown-lite with [[term]] links
  terms: string[]
  tags: string[]
  steps: Step[]           // multi-step decision chain
  spot?: number
  legs?: Leg[]            // optional payoff chart of the "right" answer
  generated?: boolean
}

export interface Term {
  id: string
  name: string
  short: string
  tags: string[]
  related: string[]
  formula?: string
  example?: string
}

export interface Checkpoint {
  label: string           // e.g. "Day before earnings"
  date: string
  context: string         // market facts (approximate, reconstructed)
  step: Step
}

export interface Moment {
  id: string
  ticker: string
  title: string
  date: string
  summary: string
  terms: string[]
  tags: string[]
  checkpoints: Checkpoint[]
  outcome: string
}

export interface Level { n: number; name: string; blurb: string }
