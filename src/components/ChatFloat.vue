<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { AgentClient } from 'agents/client'
import MdText from './MdText.vue'
import FoxSticker from './FoxSticker.vue'
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
  <button v-if="!app.chatOpen" class="fab" aria-label="Ask Kon, the tutor" @click="app.chatOpen = true"><img src="/fox/head.webp" alt="" /><span>Ask Kon</span></button>
  <aside v-else class="chat" aria-label="Tutor chat">
    <header class="row"><img class="av" src="/fox/head.webp" alt="" /><strong class="grow">Kon · tutor</strong>
      <button class="btn" @click="clear">Clear</button>
      <button class="btn" @click="app.chatOpen = false">Close</button></header>
    <p v-if="app.chatContext" class="ctx muted">Using the current question as context.</p>
    <div ref="log" class="log">
      <FoxSticker v-if="!msgs.length" class="empty" pose="point" :size="110" say="Ask me anything! “Why a spread and not a call?” “What does vega mean here?”" />
      <div v-for="(m, i) in msgs" :key="i" :class="['line', m.role]">
        <img v-if="m.role === 'assistant'" class="av" src="/fox/head.webp" alt="" />
        <div :class="['msg', m.role]"><MdText v-if="m.role === 'assistant'" :text="m.text" /><template v-else>{{ m.text }}</template></div>
      </div>
      <FoxSticker v-if="pending" class="pending" pose="think" :size="56" say="Thinking…" />
    </div>
    <form class="row" @submit.prevent="send">
      <input v-model="input" class="grow" placeholder="Ask about this decision…" aria-label="Message" />
      <button class="btn primary" :disabled="pending">Send</button>
    </form>
  </aside>
</template>

<style scoped>
.fab { position: fixed; right: 1rem; bottom: calc(1rem + env(safe-area-inset-bottom, 0px)); z-index: 30; display: inline-flex; align-items: center; gap: .3rem; background: var(--pop); color: var(--paper); border: 2px solid var(--edge); border-radius: 999px; padding: .25rem 1rem .25rem .3rem; font-weight: 800; box-shadow: var(--shadow); transition: transform .12s ease; }
.fab img { width: 46px; height: 46px; margin: -10px 0 -4px; transition: transform .2s ease; }
.fab:hover img { transform: rotate(-12deg) scale(1.1); }
.fab:active { transform: translate(2px, 2px); box-shadow: 0 0 0 var(--edge); }
.chat { position: fixed; right: 1rem; bottom: calc(1rem + env(safe-area-inset-bottom, 0px)); z-index: 35; width: min(420px, calc(100vw - 2rem)); height: min(580px, 78vh); display: flex; flex-direction: column; gap: .6rem; background: var(--panel); border: 2px solid var(--edge); border-radius: 18px; padding: .8rem; box-shadow: 5px 5px 0 var(--edge); }
header .av { width: 34px; height: 34px; }
.ctx { font-size: .82rem; margin: 0; }
.log { flex: 1; overflow: auto; display: flex; flex-direction: column; gap: .6rem; padding: .2rem .3rem .2rem 0; }
.empty { margin: auto 0; align-items: flex-end; }
.empty :deep(.bubble) { font-weight: 700; font-size: .88rem; }
.line { display: flex; gap: .45rem; align-items: flex-start; }
.line.user { justify-content: flex-end; }
.line .av { width: 30px; height: 30px; flex: none; margin-top: .1rem; }
.msg { padding: .55rem .8rem; border-radius: 14px; font-family: var(--read); border: 2px solid var(--edge); min-width: 0; }
.msg.user, .msg.error { white-space: pre-wrap; }
.msg.user { background: var(--pop); border-bottom-right-radius: 4px; }
.msg.assistant { background: var(--panel); border-top-left-radius: 4px; box-shadow: var(--shadow-sm); }
.msg.error { color: var(--put); border-color: var(--put); }
.pending :deep(.bubble) { font-size: .85rem; font-weight: 700; }
form { flex-wrap: nowrap; }
</style>
