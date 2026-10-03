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
}

export interface Byok {
  provider: 'openai' | 'anthropic' | 'google-ai-studio' | 'workers-ai'
  model: string
  key: string
}

export type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string }
