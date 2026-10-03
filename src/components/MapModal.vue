<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { TERM_MAP } from '../lib/content'
import { useApp } from '../stores/app'
import TermGraph from './TermGraph.vue'

// Knowledge map in a modal, centered on app.mapTerm. Clicking a node moves the center there;
// "Show card detail" opens the full term card.
const app = useApp()
const term = computed(() => (app.mapTerm ? TERM_MAP[app.mapTerm] : null))
const box = ref<HTMLElement>()
let returnTo: HTMLElement | null = null

watch(() => app.mapTerm, async (v, old) => {
  document.body.style.overflow = v || app.openTerm ? 'hidden' : ''
  if (v && !old) { returnTo = document.activeElement as HTMLElement | null; await nextTick(); box.value?.focus() }
  if (!v && old) returnTo?.focus?.()
})
function close() { app.mapTerm = null }
function details() { const id = app.mapTerm; app.mapTerm = null; app.openTerm = id }
</script>

<template>
  <div v-if="term" class="scrim" @pointerdown.self="close" @keydown.esc="close">
    <section ref="box" class="modal" role="dialog" aria-modal="true" :aria-label="`Knowledge map: ${term.name}`" tabindex="-1">
      <header class="head">
        <div class="grow">
          <p class="eyebrow"><i class="fa-solid fa-diagram-project" aria-hidden="true" /> Knowledge map</p>
          <h2>{{ term.name }}</h2>
          <p class="short read">{{ term.short }}</p>
        </div>
        <button class="icon-btn" aria-label="Close" title="Close (Esc)" @click="close"><i class="fa-solid fa-xmark" /></button>
      </header>
      <div class="graph"><TermGraph :center="term.id" @pick="(id) => (id === term!.id ? details() : (app.mapTerm = id))" /></div>
      <footer class="foot">
        <span class="muted hint">Click a term to move the map. Click the center to open its card.</span>
        <button class="btn primary" @click="details"><i class="fa-solid fa-id-card" aria-hidden="true" />Show card detail</button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.scrim { position: fixed; inset: 0; z-index: 45; background: rgb(26 23 18 / .35); display: grid; place-items: center; padding: 16px; }
.modal { width: min(820px, 100%); max-height: calc(100dvh - 32px); overflow: auto; display: grid; gap: .6rem; padding: 1.2rem 1.3rem; background: var(--panel); border: 2px solid var(--edge); border-radius: 20px; box-shadow: 6px 6px 0 var(--edge); outline: none; }
.head { display: flex; gap: 1rem; align-items: flex-start; }
.eyebrow { margin: 0; font-size: .75rem; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; color: var(--teal); }
h2 { font-size: 1.7rem; margin: .1rem 0 .2rem; }
.short { margin: 0; color: var(--muted); }
.graph { border: 2px dashed var(--line); border-radius: 14px; background: var(--ink); overflow-x: auto; }
.graph :deep(svg) { min-width: 520px; }
.foot { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; justify-content: space-between; }
.hint { font-size: .85rem; }
@media (max-width: 600px) { .modal { padding: 1rem; } h2 { font-size: 1.35rem; } }
</style>
