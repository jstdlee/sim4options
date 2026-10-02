<script setup lang="ts">
import { computed } from 'vue'
import type { Choice } from '@shared/types'

const props = defineProps<{ probs?: Record<string, number>; choices: Choice[]; answer: string; ms?: number; model?: string }>()
const rows = computed(() => {
  const p = props.probs ?? {}
  const total = Object.values(p).reduce((a, b) => a + b, 0) || 1
  return props.choices.map((c) => ({ ...c, pct: Math.round(((p[c.id] ?? 0) / total) * 100) })).sort((a, b) => b.pct - a.pct)
})
</script>

<template>
  <div class="clef">
    <h3>How the Clef trader decided</h3>
    <div v-for="r in rows" :key="r.id" class="bar">
      <span class="lbl">{{ r.label }}</span>
      <span class="track"><span class="fill" :class="{ right: r.id === answer }" :style="{ width: r.pct + '%' }" /></span>
      <span class="pct">{{ r.pct }}%</span>
    </div>
    <p class="muted small">{{ model }} answered in {{ ms }} ms. Probabilities, not text: a decision model scores each choice.</p>
  </div>
</template>

<style scoped>
.clef { margin-top: 1rem; }
.bar { display: grid; grid-template-columns: minmax(0, 1.4fr) 2fr 3rem; gap: .6rem; align-items: center; margin: .35rem 0; font-size: .92rem; }
.track { height: 10px; background: var(--ink); border-radius: 6px; overflow: hidden; }
.fill { display: block; height: 100%; background: var(--muted); transition: width .4s ease; }
.fill.right { background: var(--call); }
.pct { text-align: right; font-variant-numeric: tabular-nums; }
.small { font-size: .82rem; margin-top: .4rem; }
</style>
