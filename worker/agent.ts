import { Agent, type Connection, type WSMessage } from 'agents'
import type { Env, Byok, ChatMsg, SearchOpts } from './env'
import { chat, clef, modelName, TUTOR_SYSTEM } from './ai'
import { lookup, store } from './cache'
import { asContext, webSearch } from './search'

interface TutorState { history: ChatMsg[] }

/** One Durable Object per learner: persistent tutor memory. */
export class TutorAgent extends Agent<Env, TutorState> {
  initialState: TutorState = { history: [] }

  async onMessage(conn: Connection, message: WSMessage) {
    let data: any
    try { data = JSON.parse(String(message)) } catch { return }

    if (data.type === 'reset') { this.setState({ history: [] }); return }
    if (data.type !== 'ask') return

    // The screen context travels inside the user turn, so each question keeps its own context in history
    // and the newest one always wins over older chats.
    const screen = data.context ? String(data.context).slice(0, 4000) : ''
    const question = String(data.text).slice(0, 4000)
    const userTurn = screen ? `(Background: what I see on screen now)\n${screen}\n\nMy question: ${question}` : question
    const history: ChatMsg[] = [...this.state.history, { role: 'user' as const, content: userTurn }].slice(-16)
    const byok = data.byok as Byok | undefined
    const status = (text: string) => conn.send(JSON.stringify({ type: 'status', id: data.id, text }))

    try {
      // 1. Asked before on this screen? Answer from the cache (exact, then similar question).
      if (!data.fresh) {
        const hit = await lookup(this.env, 'tutor', screen, question)
        if (hit) {
          this.setState({ history: [...history, { role: 'assistant' as const, content: hit.answer }].slice(-16) })
          conn.send(JSON.stringify({ type: 'answer', id: data.id, text: hit.answer, sources: hit.sources, cached: { similarity: hit.similarity, exact: hit.exact } }))
          return
        }
      }

      // 2. Clef-flash routes the question: topic for the term card, and whether it needs fresh web facts.
      const route = await clef(this.env, `${question}\n\n${screen}`.slice(0, 6000), {
        topic: {
          type: 'choice', instructions: 'Which concept is the learner mainly asking about?',
          criteria: { greeks: 'delta, gamma, theta, vega, rho', volatility: 'IV, IV rank, IV crush, VIX, skew', strategy: 'spreads, straddles, condors, covered calls', basics: 'calls, puts, strikes, premium, moneyness', management: 'rolling, assignment, sizing, exits', other: 'anything else' },
        },
        web: { type: 'noul', instructions: 'Does answering need recent or real-world facts (current prices, news, dates, company events, rules that change) that a textbook would not contain?' },
      }, true)
      const pWeb = Number(route.fields.web?.probs?.yes ?? 0)
      const search = (data.search ?? {}) as SearchOpts
      const wantWeb = search.mode === 'always' || (search.mode !== 'off' && pWeb >= 0.5)

      // 3. Web search when needed: Cloudflare Web Search first, Exa as backup.
      let sources: { title: string; url: string }[] = []
      let searchBlock = ''
      if (wantWeb) {
        status('Searching the web…')
        const found = await webSearch(this.env, question, search)
        if (found?.results.length) {
          sources = found.results.map((r) => ({ title: r.title, url: r.url }))
          searchBlock = asContext(found)
        }
      }

      status('Thinking…')
      const sys = TUTOR_SYSTEM + '\nThe screen context is background. Answer the latest question; use the screen when the question refers to it ("this", "here", "my pick"). Any options or markets question is welcome. Earlier messages may be about other screens.' + (searchBlock ? `\n\n${searchBlock}` : '')
      const reply = await chat(this.env, [{ role: 'system', content: sys }, ...history], byok)
      this.setState({ history: [...history, { role: 'assistant' as const, content: reply }].slice(-16) })
      conn.send(JSON.stringify({ type: 'answer', id: data.id, text: reply, sources, topic: route.ok ? route.fields.topic?.value : null, model: modelName(this.env, byok) }))

      // 4. Remember the answer for the next learner who asks the same thing here.
      await store(this.env, 'tutor', screen, question, reply, sources, modelName(this.env, byok)).catch(() => {})
    } catch (e: any) {
      conn.send(JSON.stringify({ type: 'error', id: data.id, text: String(e?.message ?? e) }))
    }
  }
}
