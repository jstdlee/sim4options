<script setup lang="ts">
import FoxSticker from '../components/FoxSticker.vue'
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

// radial graph: selected center, direct links ring 1, second-degree ring 2
const W = 640, H = 440, cx = W / 2, cy = H / 2
const graph = computed(() => {
  const c = TERM_MAP[sel.value]
  if (!c) return { nodes: [], edges: [] }
  const r1 = Array.from(new Set([...c.related, ...TERMS.filter((t) => t.related.includes(c.id)).map((t) => t.id)])).filter((id) => TERM_MAP[id] && id !== c.id).slice(0, 10)
  const r2 = Array.from(new Set(r1.flatMap((id) => TERM_MAP[id].related))).filter((id) => TERM_MAP[id] && id !== c.id && !r1.includes(id)).slice(0, 14)
  const place = (ids: string[], R: number, off = 0) => ids.map((id, k) => ({ id, x: cx + R * Math.cos((2 * Math.PI * k) / ids.length + off), y: cy + R * 0.78 * Math.sin((2 * Math.PI * k) / ids.length + off), ring: R }))
  const nodes = [{ id: c.id, x: cx, y: cy, ring: 0 }, ...place(r1, 140), ...place(r2, 255, 0.2)]
  const pos = Object.fromEntries(nodes.map((n) => [n.id, n]))
  const edges: [string, string][] = []
  for (const n of nodes) for (const r of TERM_MAP[n.id].related) if (pos[r] && n.id < r) edges.push([n.id, r])
  for (const n of nodes) for (const r of TERM_MAP[n.id].related) if (pos[r] && n.id > r && !TERM_MAP[r].related.includes(n.id)) edges.push([n.id, r])
  return { nodes, edges: edges.map(([a, b]) => ({ a: pos[a], b: pos[b], hot: a === c.id || b === c.id })) }
})
</script>

<template>
  <div class="wrap">
    <header class="phead"><h1>Term map</h1><FoxSticker pose="point" :size="96" /></header>
    <p class="muted">Word size shows how often a term appears in questions and moments. Color shows your mastery: green strong, amber shaky, red weak, grey unseen.</p>
    <div class="cloud">
      <button v-for="t in cloud" :key="t.id" class="word" :class="{ sel: t.id === sel }" :style="{ fontSize: t.size + 'rem', color: t.color }" @click="sel = t.id">{{ t.name }}</button>
    </div>

    <h2>How {{ TERM_MAP[sel]?.name }} connects</h2>
    <div class="graphbox">
      <svg :viewBox="`0 0 ${W} ${H}`" role="img" :aria-label="`Relationship graph for ${TERM_MAP[sel]?.name}`">
        <line v-for="(e, k) in graph.edges" :key="k" :x1="e.a.x" :y1="e.a.y" :x2="e.b.x" :y2="e.b.y" :stroke="e.hot ? 'var(--vol)' : 'var(--line)'" :stroke-width="e.hot ? 1.6 : 1" />
        <g v-for="n in graph.nodes" :key="n.id" class="node" tabindex="0" @click="n.ring ? (sel = n.id) : (app.openTerm = n.id)" @keydown.enter="n.ring ? (sel = n.id) : (app.openTerm = n.id)">
          <circle :cx="n.x" :cy="n.y" :r="n.ring === 0 ? 10 : n.ring < 200 ? 6 : 4" :fill="n.ring === 0 ? 'var(--vol)' : 'var(--paper)'" />
          <text :x="n.x" :y="n.y - 12" text-anchor="middle" :font-size="n.ring === 0 ? 16 : n.ring < 200 ? 13 : 11" :fill="n.ring > 200 ? 'var(--muted)' : 'var(--paper)'">{{ TERM_MAP[n.id].name }}</text>
        </g>
      </svg>
    </div>
    <div class="row"><button class="btn primary" @click="app.openTerm = sel">Open the {{ TERM_MAP[sel]?.name }} card</button></div>
  </div>
</template>

<style scoped>
.cloud { display: flex; flex-wrap: wrap; gap: .2rem .9rem; align-items: baseline; padding: 1rem 0 2rem; }
.word { background: none; border: 0; padding: 0; font-weight: 600; line-height: 1.2; }
.word.sel { text-decoration: underline; text-underline-offset: 4px; }
.graphbox { overflow-x: auto; margin-bottom: 1rem; background: var(--panel); border: 2px solid var(--edge); border-radius: 16px; box-shadow: var(--shadow); padding: .5rem; }
svg { width: 100%; min-width: 520px; height: auto; }
.node { cursor: pointer; }
.node:focus-visible circle { stroke: var(--vol); stroke-width: 3; }
</style>
