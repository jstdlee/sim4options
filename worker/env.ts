export interface Env {
  AI: Ai
  DB: D1Database
  TutorAgent: DurableObjectNamespace
  ASSETS: Fetcher
  LLM_MODEL: string
  CLEF_MODEL: string
  CLEF_FLASH_MODEL: string
  AI_GATEWAY_ID: string
  CF_ACCOUNT_ID: string
  /** Secret. One or more login tokens, comma-separated. */
  ACCESS_TOKEN?: string
  /** Answer cache vectors (bge-m3, 1024 dims, metadata index on ctx). */
  QA_INDEX?: VectorizeIndex
  /** Cloudflare Web Search provider: ceramic | exa | linkup. */
  SEARCH_PROVIDER?: string
  /** Secret. Exa key for the backup web search. */
  EXA_API_KEY?: string
}

export interface Byok {
  provider: 'openai' | 'anthropic' | 'google-ai-studio' | 'workers-ai' | 'openai-compatible'
  model: string
  key: string
  /** openai-compatible only: base URL that serves /chat/completions, e.g. https://api.example.com/v1 */
  baseUrl?: string
  /** Reasoning: off (default, fast) | low | high. */
  thinking?: 'off' | 'low' | 'high'
}

/** Per-learner web search options from Settings (sent with each tutor question). */
export interface SearchOpts {
  mode?: 'auto' | 'always' | 'off'
  cfProvider?: 'ceramic' | 'exa' | 'linkup'
  exaKey?: string
  numResults?: number
  exaType?: 'auto' | 'fast' | 'neural' | 'keyword'
}

export type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string }
