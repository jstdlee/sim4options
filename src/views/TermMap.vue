<script setup lang="ts">
import { usePageContext } from '../lib/context'
import FoxSticker from '../components/FoxSticker.vue'
import TermGraph from '../components/TermGraph.vue'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { TERMS, TERM_MAP, TERM_WEIGHT } from '../lib/content'
import { useApp } from '../stores/app'

const app = useApp(), route = useRoute()
const sel = ref<string>((route.query.term as string) || 'iv')
watch(() => route.query.term, (t) => { if (t) sel.value = String(t) })

const maxW = Math.max(...Object.values(TERM_WEIGHT))
const cloud = computed(() => [...TERMS].sort((a, b) => a.name.localeCompare(b.name)).map((t) => {
  const w = TERM_WEIGHT[t.id] ?? 1, m = app.mastery(t.id)
  return { ...t, size: 0.85 + (w / maxW) * 1.6, color: m === null ? 'var(--muted)' : m >= 0.7 ? 'var(--call)' : m >= 0.4 ? 'var(--vol)' : 'var(--put)' }
}))

usePageContext(() => {
  const t = TERM_MAP[sel.value]
  return t ? { kind: 'term', label: `Term map · ${t.name}`, text: `Term map, selected term: ${t.name}. ${t.short} Connected terms: ${t.related.map((r) => TERM_MAP[r]?.name ?? r).join(', ')}.` } : null
})
</script>

<template>
  <div class="wrap">
    <header class="phead"><h1>Term map</h1><FoxSticker pose="point" :size="96" /></header>
    <p class="muted">Click a term in the map to open it in a larger map; from there, open its card. Word size shows how often a term appears in questions and moments. Color shows your mastery: green strong, amber shaky, red weak, grey unseen.</p>
    <div class="cloud">
      <button v-for="t in cloud" :key="t.id" class="word" :class="{ sel: t.id === sel }" :style="{ fontSize: t.size + 'rem', color: t.color }" @click="sel = t.id">{{ t.name }}</button>
    </div>

    <h2>How {{ TERM_MAP[sel]?.name }} connects</h2>
    <div class="graphbox"><TermGraph :center="sel" @pick="(id) => { sel = id; app.mapTerm = id }" /></div>
    <div class="row"><button class="btn primary" @click="app.openTerm = sel"><i class="fa-solid fa-id-card" aria-hidden="true" />Show the {{ TERM_MAP[sel]?.name }} card</button>
      <button class="btn" @click="app.mapTerm = sel"><i class="fa-solid fa-expand" aria-hidden="true" />Open the map larger</button></div>
  </div>
</template>

<style scoped>
.cloud { display: flex; flex-wrap: wrap; gap: .2rem .9rem; align-items: baseline; padding: 1rem 0 2rem; }
.word { background: none; border: 0; padding: 0; font-weight: 600; line-height: 1.2; }
.word.sel { text-decoration: underline; text-underline-offset: 4px; }
.graphbox { overflow-x: auto; margin-bottom: 1rem; background: var(--panel); border: 2px solid var(--edge); border-radius: 16px; box-shadow: var(--shadow); padding: .5rem; }
.graphbox :deep(svg) { min-width: 520px; }
</style>
