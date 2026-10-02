<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { AgentClient } from 'agents/client'
import TermText from './TermText.vue'
import { useApp } from '../stores/app'

const app = useApp()
type Msg = { role: 'user' | 'assistant' | 'error'; text: string }
const msgs = ref<Msg[]>([])
const input = ref('')
const pending = ref(false)
const log = ref<HTMLElement>()
let client: AgentClient | null = null

function connect() {
  if (client) return
  client = new AgentClient({ agent: 'tutor-agent', name: app.uid, host: location.host })
  client.addEventListener('message', (ev: MessageEvent) => {
    let d: any
    try { d = JSON.parse(String(ev.data)) } catch { return }
    if (d.type === 'answer') { msgs.value.push({ role: 'assistant', text: d.text }); pending.value = false }
    else if (d.type === 'error') { msgs.value.push({ role: 'error', text: d.text }); pending.value = false }
    scroll()
  })
}
const scroll = () => nextTick(() => log.value?.scrollTo({ top: log.value.scrollHeight }))

watch(() => app.chatOpen, (open) => {
  if (!open) return
  connect()
  if (app.chatContext && !input.value) input.value = app.chatContext.startsWith('Explain the term') ? app.chatContext : 'Why is this the right decision here?'
})

function send() {
  const text = input.value.trim()
  if (!text || pending.value) return
  connect()
  msgs.value.push({ role: 'user', text })
  pending.value = true
  client!.send(JSON.stringify({ type: 'ask', id: crypto.randomUUID(), text, context: app.chatContext, byok: app.byokPayload }))
  input.value = ''
  scroll()
}
function clear() { msgs.value = []; client?.send(JSON.stringify({ type: 'reset' })) }
onBeforeUnmount(() => client?.close())
</script>

<template>
  <button v-if="!app.chatOpen" class="fab" aria-label="Open the tutor" @click="app.chatOpen = true">Ask tutor</button>
  <aside v-else class="chat" aria-label="Tutor chat">
    <header class="row"><strong class="grow">Tutor</strong>
      <button class="btn" @click="clear">Clear</button>
      <button class="btn" @click="app.chatOpen = false">Close</button></header>
    <p v-if="app.chatContext" class="ctx muted">Using the current question as context.</p>
    <div ref="log" class="log">
      <p v-if="!msgs.length" class="muted">Ask anything: “Why a spread instead of a call?”, “What does vega mean here?”</p>
      <div v-for="(m, i) in msgs" :key="i" :class="['msg', m.role]"><TermText :text="m.text" /></div>
      <p v-if="pending" class="muted">Thinking…</p>
    </div>
    <form class="row" @submit.prevent="send">
      <input v-model="input" class="grow" placeholder="Ask about this decision…" aria-label="Message" />
      <button class="btn primary" :disabled="pending">Send</button>
    </form>
  </aside>
</template>

<style scoped>
.fab { position: fixed; right: 1rem; bottom: calc(1rem + env(safe-area-inset-bottom, 0px)); z-index: 30; background: var(--vol); color: var(--ink); border: 0; border-radius: 999px; padding: .8rem 1.15rem; font-weight: 700; box-shadow: 0 8px 24px rgb(0 0 0 / .35); }
.chat { position: fixed; right: 1rem; bottom: calc(1rem + env(safe-area-inset-bottom, 0px)); z-index: 35; width: min(420px, calc(100vw - 2rem)); height: min(560px, 75vh); display: flex; flex-direction: column; gap: .6rem; background: var(--panel); border: 1px solid var(--line); border-radius: 16px; padding: .9rem; box-shadow: 0 16px 40px rgb(0 0 0 / .45); }
.ctx { font-size: .82rem; margin: 0; }
.log { flex: 1; overflow: auto; display: flex; flex-direction: column; gap: .5rem; }
.msg { padding: .55rem .75rem; border-radius: 12px; white-space: pre-wrap; font-family: var(--read); }
.msg.user { align-self: flex-end; background: var(--ink); }
.msg.assistant { background: color-mix(in srgb, var(--vol) 10%, var(--panel)); border: 1px solid var(--line); }
.msg.error { color: var(--put); }
form { flex-wrap: nowrap; }
</style>
