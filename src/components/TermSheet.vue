<script setup lang="ts">
import { computed, watch } from 'vue'
import { useApp } from '../stores/app'
import { TERM_MAP } from '../lib/content'

const app = useApp()
const term = computed(() => (app.openTerm ? TERM_MAP[app.openTerm] : null))
const mastery = computed(() => (term.value ? app.mastery(term.value.id) : null))
watch(() => app.openTerm, (v) => { if (v) document.body.style.overflow = 'hidden'; else document.body.style.overflow = '' })

// While the card is open, Kon talks about this term. "Ask Kon" keeps it after the card closes.
let keep = false
watch(term, (t) => {
  if (t) {
    app.pinnedContext = { kind: 'term', label: `Term: ${t.name}`, text: [`Term card: ${t.name}`, t.short, t.formula && `Formula: ${t.formula}`, t.example && `Example: ${t.example}`].filter(Boolean).join('\n') }
  } else if (!keep && app.pinnedContext?.kind === 'term') app.pinnedContext = null
  keep = false
})
function askKon() { keep = true; app.openTerm = null; app.chatOpen = true }
const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') app.openTerm = null }
</script>

<template>
  <Transition name="sheet">
    <div v-if="app.openTerm" class="scrim" @click.self="app.openTerm = null" @keydown="onKey">
      <section class="sheet" role="dialog" aria-modal="true" :aria-label="term?.name ?? app.openTerm">
        <template v-if="term">
          <div class="row"><h2 class="grow">{{ term.name }}</h2><button class="icon-btn" aria-label="Close" title="Close (Esc)" @click="app.openTerm = null"><i class="fa-solid fa-xmark" /></button></div>
          <p class="read">{{ term.short }}</p>
          <p v-if="term.formula" class="formula">{{ term.formula }}</p>
          <p v-if="term.example" class="read muted">{{ term.example }}</p>
          <div class="row tags"><span v-for="t in term.tags" :key="t" class="chip">{{ t }}</span>
            <span v-if="mastery !== null" class="chip">mastery {{ Math.round(mastery * 100) }}%</span></div>
          <h3>Connected terms</h3>
          <div class="row"><button v-for="r in term.related" :key="r" class="chip" @click="app.openTerm = r">{{ TERM_MAP[r]?.name ?? r }}</button></div>
          <div class="row foot">
            <RouterLink class="btn" :to="`/map?term=${term.id}`" @click="app.openTerm = null"><i class="fa-solid fa-diagram-project" aria-hidden="true" />See on the term map</RouterLink>
            <button class="btn" @click="askKon"><img class="ico" src="/fox/head.webp" alt="" />Ask Kon about it</button>
          </div>
        </template>
        <p v-else>Term “{{ app.openTerm }}” isn’t in the glossary yet.</p>
      </section>
    </div>
  </Transition>
</template>

<style scoped>
.scrim { position: fixed; inset: 0; background: rgb(26 23 18 / .35); z-index: 40; display: flex; align-items: flex-end; justify-content: center; }
.sheet { width: min(640px, 100%); max-height: 80vh; overflow: auto; background: var(--panel); border: 2px solid var(--edge); border-bottom: 0; border-radius: 18px 18px 0 0; padding: 1.2rem 1.2rem calc(1.2rem + env(safe-area-inset-bottom, 0px)); }
.formula { font-family: ui-monospace, 'SF Mono', Menlo, monospace; color: var(--teal); background: color-mix(in srgb, var(--teal) 8%, transparent); border-radius: 8px; padding: .3rem .6rem; }
.tags { margin: .5rem 0 1rem; }
.foot { margin-top: 1.2rem; }
.sheet-enter-active, .sheet-leave-active { transition: opacity .18s; }
.sheet-enter-active .sheet, .sheet-leave-active .sheet { transition: transform .22s ease; }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }
.sheet-enter-from .sheet, .sheet-leave-to .sheet { transform: translateY(40px); }
</style>
