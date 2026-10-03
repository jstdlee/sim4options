<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount, computed } from 'vue'
import { useRoute } from 'vue-router'
import { AgentClient } from 'agents/client'
import MdText from './MdText.vue'
import FoxSticker from './FoxSticker.vue'
import { useApp } from '../stores/app'

const app = useApp()
const route = useRoute()
type Msg = {
  role: 'user' | 'assistant' | 'error'; text: string; ctx?: string
  sources?: { title: string; url: string }[]; cached?: { similarity: number; exact: boolean }; ask?: { q: string; ctx: string }
}
const msgs = ref<Msg[]>([])
const input = ref('')
const pending = ref(false)
const statusText = ref('Thinking…')
let lastAsk: { q: string; ctx: string } | null = null
const log = ref<HTMLElement>()
let client: AgentClient | null = null

// What is on screen right now. A term card (or a question asked from one) wins over the page.
const ctx = computed(() => app.pinnedContext ?? app.pageContext)
const share = ref(true)
watch(() => ctx.value?.label, () => (share.value = true))
// Leaving the page drops a term that was pinned from a card.
watch(() => route.fullPath, () => { if (!app.openTerm) app.pinnedContext = null })

// One-tap questions for what is on screen, so nothing needs typing.
const quick = computed<string[]>(() => {
  const c = share.value ? ctx.value : null
  if (!c) return ['What should I learn next?', 'Explain calls and puts simply', 'What is implied volatility?']
  if (c.kind === 'question') return c.answered
    ? ['Why is this the right answer?', 'Why is my pick weaker?', 'What if one number changed?']
    : ['Give me a hint', 'Explain the terms here', 'What should I look at first?']
  if (c.kind === 'term') return ['Explain it simply', 'Give me a worked example', 'How do traders use it?']
  if (c.kind === 'simulator') return ['What are my main risks now?', 'Which Greek matters most here?', 'How would you manage this?']
  return ['What should I do next here?', 'Summarize where I am', 'Quiz me on this']
})

function connect() {
  if (client) return
  client = new AgentClient({ agent: 'tutor-agent', name: app.uid, host: location.host })
  client.addEventListener('message', (ev: MessageEvent) => {
    let d: any
    try { d = JSON.parse(String(ev.data)) } catch { return }
    if (d.type === 'status') { statusText.value = d.text; return }
    if (d.type === 'answer') { msgs.value.push({ role: 'assistant', text: d.text, sources: d.sources, cached: d.cached, ask: lastAsk ?? undefined }); pending.value = false }
    else if (d.type === 'error') { msgs.value.push({ role: 'error', text: d.text }); pending.value = false }
    scroll()
  })
}
const scroll = () => nextTick(() => log.value?.scrollTo({ top: log.value.scrollHeight }))
watch(() => app.chatOpen, (open) => { if (open) connect() })

function send(q?: string, fresh = false, ctxText?: string) {
  const text = (q ?? input.value).trim()
  if (!text || pending.value) return
  connect()
  const c = share.value ? ctx.value : null
  const context = ctxText ?? c?.text ?? ''
  if (!fresh) msgs.value.push({ role: 'user', text, ctx: c?.label })
  pending.value = true
  statusText.value = fresh ? 'Asking again…' : 'Checking Kon’s notes…'
  lastAsk = { q: text, ctx: context }
  client!.send(JSON.stringify({ type: 'ask', id: crypto.randomUUID(), text, context, byok: app.byokPayload, search: app.searchPayload, fresh }))
  if (!q) input.value = ''
  scroll()
}
/** The answer came from the cache; ask the model again on the same screen. */
function again(m: Msg) { if (m.ask) send(m.ask.q, true, m.ask.ctx) }
function clear() { msgs.value = []; client?.send(JSON.stringify({ type: 'reset' })) }
onBeforeUnmount(() => client?.close())
</script>

<template>
  <button v-if="!app.chatOpen" class="kon-fab" aria-label="Ask Kon, the tutor" @click="app.chatOpen = true"><img src="/fox/head.webp" alt="" /><span>Ask Kon</span></button>
  <aside v-else class="chat" aria-label="Tutor chat">
    <header class="row"><img class="av" src="/fox/head.webp" alt="" /><strong class="grow">Kon · tutor</strong>
      <button class="icon-btn" aria-label="New chat" title="New chat" @click="clear"><i class="fa-solid fa-rotate-left" /></button>
      <button class="icon-btn" aria-label="Close the chat" title="Close" @click="app.chatOpen = false"><i class="fa-solid fa-xmark" /></button></header>
    <div v-if="ctx" class="ctx" :class="{ off: !share }">
      <i :class="['fa-solid', share ? 'fa-eye' : 'fa-eye-slash']" aria-hidden="true" />
      <span class="grow"><b>{{ share ? 'Kon sees' : 'Not shared' }}:</b> {{ ctx.label }}</span>
      <button class="icon-btn sm" :aria-label="share ? 'Stop sharing this screen' : 'Share this screen'" :title="share ? 'Stop sharing this screen' : 'Share this screen'" @click="share = !share">
        <i :class="['fa-solid', share ? 'fa-xmark' : 'fa-plus']" /></button>
    </div>
    <div ref="log" class="log">
      <FoxSticker v-if="!msgs.length" class="empty" pose="point" :size="110" :say="share && ctx ? 'I can see what you are looking at. Tap a question below or type your own.' : 'Ask me anything about options.'" />
      <div v-for="(m, i) in msgs" :key="i" :class="['line', m.role]">
        <img v-if="m.role === 'assistant'" class="av" src="/fox/head.webp" alt="" />
        <div :class="['msg', m.role]"><MdText v-if="m.role === 'assistant'" :text="m.text" />
          <ol v-if="m.sources?.length" class="sources" aria-label="Sources">
            <li v-for="(src, k) in m.sources" :key="k"><a :href="src.url" target="_blank" rel="noopener noreferrer">{{ src.title }}</a></li>
          </ol>
          <p v-if="m.cached" class="memo"><i class="fa-solid fa-bookmark" aria-hidden="true" />
            From Kon’s notes{{ m.cached.exact ? '' : ` · ${Math.round(m.cached.similarity * 100)}% match` }}
            <button v-if="m.ask" class="linkish" :disabled="pending" @click="again(m)">Ask again fresh</button></p><template v-else>{{ m.text }}<small v-if="m.ctx" class="about"><i class="fa-solid fa-eye" aria-hidden="true" /> {{ m.ctx }}</small></template></div>
      </div>
      <FoxSticker v-if="pending" class="pending" :pose="statusText.startsWith('Searching') ? 'study' : 'think'" :size="56" :say="statusText" />
    </div>
    <div v-if="!pending" class="quick" aria-label="Suggested questions">
      <button v-for="qq in quick" :key="qq" class="chip" @click="send(qq)">{{ qq }}</button>
    </div>
    <form class="row" @submit.prevent="send()">
      <input id="kon-input" v-model="input" class="grow" placeholder="Ask Kon…" aria-label="Message" autocomplete="off" />
      <button class="btn primary" :disabled="pending || !input.trim()" aria-label="Send"><i class="fa-solid fa-paper-plane" /></button>
    </form>
  </aside>
</template>

<style scoped>
.kon-fab { position: fixed; right: 1rem; bottom: calc(1rem + env(safe-area-inset-bottom, 0px)); z-index: 30; display: inline-flex; align-items: center; gap: .3rem; background: var(--pop); color: var(--paper); border: 2px solid var(--edge); border-radius: 999px; padding: .25rem 1rem .25rem .3rem; font-weight: 800; box-shadow: var(--shadow); transition: transform .12s ease; }
.kon-fab img { width: 46px; height: 46px; margin: -10px 0 -4px; transition: transform .2s ease; }
.kon-fab:hover img { transform: rotate(-12deg) scale(1.1); }
.kon-fab:active { transform: translate(2px, 2px); box-shadow: 0 0 0 var(--edge); }
.chat { position: fixed; right: 1rem; bottom: calc(1rem + env(safe-area-inset-bottom, 0px)); z-index: 35; width: min(420px, calc(100vw - 2rem)); height: min(580px, 78vh); display: flex; flex-direction: column; gap: .6rem; background: var(--panel); border: 2px solid var(--edge); border-radius: 18px; padding: .8rem; box-shadow: 5px 5px 0 var(--edge); }
header .av { width: 34px; height: 34px; }
.ctx { display: flex; align-items: center; gap: .45rem; font-size: .82rem; padding: .3rem .3rem .3rem .65rem; border: 1.5px dashed var(--teal); border-radius: 10px; color: var(--teal); background: color-mix(in srgb, var(--teal) 6%, var(--panel)); }
.ctx b { font-weight: 800; }
.ctx span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--paper); }
.ctx.off { border-color: var(--line); color: var(--muted); background: var(--panel); }
.ctx.off span { color: var(--muted); }
.quick { display: flex; flex-wrap: wrap; gap: .35rem; padding: 2px; }
.quick .chip { white-space: nowrap; font-size: .8rem; }
.sources { margin: .5rem 0 0; padding-left: 1.2rem; font-family: var(--ui); font-size: .78rem; }
.sources a { color: var(--teal); word-break: break-word; }
.memo { display: flex; flex-wrap: wrap; align-items: center; gap: .35rem; margin: .45rem 0 0; font-family: var(--ui); font-size: .75rem; color: var(--muted); }
.memo i { color: var(--teal); }
.linkish { border: 0; background: none; padding: 0; color: var(--teal); font-weight: 800; text-decoration: underline; }
.about { display: block; margin-top: .25rem; font-size: .75rem; opacity: .7; font-family: var(--ui); }
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
