import { Agent, type Connection, type WSMessage } from 'agents'
import type { Env, Byok, ChatMsg } from './env'
import { chat, clef, TUTOR_SYSTEM } from './ai'

interface TutorState { history: ChatMsg[] }

/** One Durable Object per learner: persistent tutor memory. */
export class TutorAgent extends Agent<Env, TutorState> {
  initialState: TutorState = { history: [] }

  async onMessage(conn: Connection, message: WSMessage) {
    let data: any
    try { data = JSON.parse(String(message)) } catch { return }

    if (data.type === 'reset') { this.setState({ history: [] }); return }
    if (data.type !== 'ask') return

    const ctx: string = data.context ? `\n\nCurrent screen context:\n${String(data.context).slice(0, 4000)}` : ''
    const history: ChatMsg[] = [...this.state.history, { role: 'user' as const, content: String(data.text).slice(0, 4000) }].slice(-16)

    try {
      // Fast intent routing with Clef-flash: decide which term card to surface alongside the answer.
      const route = await clef(this.env, `${data.text}${ctx}`.slice(0, 6000), {
        topic: {
          type: 'choice', instructions: 'Which concept is the learner mainly asking about?',
          criteria: { greeks: 'delta, gamma, theta, vega, rho', volatility: 'IV, IV rank, IV crush, VIX, skew', strategy: 'spreads, straddles, condors, covered calls', basics: 'calls, puts, strikes, premium, moneyness', management: 'rolling, assignment, sizing, exits', other: 'anything else' },
        },
      }, true)

      const reply = await chat(this.env, [{ role: 'system', content: TUTOR_SYSTEM + ctx }, ...history], data.byok as Byok | undefined)
      this.setState({ history: [...history, { role: 'assistant' as const, content: reply }].slice(-16) })
      conn.send(JSON.stringify({ type: 'answer', id: data.id, text: reply, topic: route.ok ? route.fields.topic?.value : null }))
    } catch (e: any) {
      conn.send(JSON.stringify({ type: 'error', id: data.id, text: String(e?.message ?? e) }))
    }
  }
}
