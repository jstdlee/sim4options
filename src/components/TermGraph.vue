<script setup lang="ts">
import { computed } from 'vue'
import { TERMS, TERM_MAP } from '../lib/content'

// Radial knowledge map: the center term, its direct links (ring 1) and second-degree links (ring 2).
const props = defineProps<{ center: string }>()
const emit = defineEmits<{ pick: [id: string] }>()

const W = 640, H = 440, cx = W / 2, cy = H / 2
const graph = computed(() => {
  const c = TERM_MAP[props.center]
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
  <svg :viewBox="`0 0 ${W} ${H}`" role="img" :aria-label="`Knowledge map around ${TERM_MAP[center]?.name}`">
    <line v-for="(e, k) in graph.edges" :key="k" :x1="e.a.x" :y1="e.a.y" :x2="e.b.x" :y2="e.b.y" :stroke="e.hot ? 'var(--teal)' : 'var(--line)'" :stroke-width="e.hot ? 2 : 1.2" />
    <g v-for="n in graph.nodes" :key="n.id" class="node" :class="{ center: n.ring === 0 }" tabindex="0" role="button"
      :aria-label="TERM_MAP[n.id].name" @click="emit('pick', n.id)" @keydown.enter="emit('pick', n.id)">
      <circle :cx="n.x" :cy="n.y" :r="n.ring === 0 ? 12 : n.ring < 200 ? 7 : 5" :fill="n.ring === 0 ? 'var(--fox)' : n.ring < 200 ? 'var(--pop)' : 'var(--panel)'" stroke="var(--edge)" stroke-width="2" />
      <text :x="n.x" :y="n.y - 15" text-anchor="middle" :font-size="n.ring === 0 ? 17 : n.ring < 200 ? 13 : 11" :font-weight="n.ring === 0 ? 800 : 700" :fill="n.ring > 200 ? 'var(--muted)' : 'var(--paper)'">{{ TERM_MAP[n.id].name }}</text>
    </g>
  </svg>
</template>

<style scoped>
svg { width: 100%; height: auto; display: block; }
.node { cursor: pointer; outline: none; }
.node text { paint-order: stroke; stroke: var(--panel); stroke-width: 4px; }
.node:hover circle, .node:focus-visible circle { stroke: var(--teal); stroke-width: 3.5; }
.node:focus-visible text { text-decoration: underline; }
</style>
