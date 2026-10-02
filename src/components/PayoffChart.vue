<script setup lang="ts">
import { computed } from 'vue'
import type { Leg } from '@shared/types'
import { payoffAtExpiry, pnlNow, breakevens } from '@shared/bs'

const props = defineProps<{ legs: Leg[]; spot?: number; now?: { T: number; sigma: number } }>()
const W = 640, H = 260, P = 28

const strikes = computed(() => props.legs.map((l) => l.strike ?? l.premium ?? 0).filter(Boolean))
const center = computed(() => props.spot ?? (strikes.value.reduce((a, b) => a + b, 0) / Math.max(strikes.value.length, 1)))
const lo = computed(() => Math.max(0, Math.min(...strikes.value, center.value) * 0.75))
const hi = computed(() => Math.max(...strikes.value, center.value) * 1.25)
const pts = computed(() => Array.from({ length: 161 }, (_, i) => { const s = lo.value + ((hi.value - lo.value) * i) / 160; return [s, payoffAtExpiry(props.legs, s)] as const }))
const nowPts = computed(() => props.now ? pts.value.map(([s]) => [s, pnlNow(props.legs, s, props.now!.T, props.now!.sigma)] as const) : [])
const yMax = computed(() => Math.max(1, ...pts.value.map((p) => Math.abs(p[1])), ...nowPts.value.map((p) => Math.abs(p[1]))) * 1.1)
const x = (s: number) => P + ((s - lo.value) / (hi.value - lo.value)) * (W - 2 * P)
const y = (v: number) => H / 2 - (v / yMax.value) * (H / 2 - P)
const path = (a: readonly (readonly [number, number])[]) => a.map(([s, v], i) => `${i ? 'L' : 'M'}${x(s).toFixed(1)},${y(v).toFixed(1)}`).join('')
const area = computed(() => `${path(pts.value)}L${x(hi.value)},${y(0)}L${x(lo.value)},${y(0)}Z`)
const be = computed(() => breakevens(props.legs, lo.value, hi.value))
</script>

<template>
  <figure class="payoff">
    <svg :viewBox="`0 0 ${W} ${H}`" role="img" aria-label="Profit and loss at expiry by underlying price">
      <defs>
        <clipPath id="above"><rect x="0" y="0" :width="W" :height="y(0)" /></clipPath>
        <clipPath id="below"><rect x="0" :y="y(0)" :width="W" :height="H - y(0)" /></clipPath>
      </defs>
      <path :d="area" fill="var(--call)" opacity=".22" clip-path="url(#above)" />
      <path :d="area" fill="var(--put)" opacity=".22" clip-path="url(#below)" />
      <line :x1="P" :x2="W - P" :y1="y(0)" :y2="y(0)" stroke="var(--line)" />
      <path :d="path(pts)" fill="none" stroke="var(--paper)" stroke-width="2.5" />
      <path v-if="nowPts.length" :d="path(nowPts)" fill="none" stroke="var(--vol)" stroke-width="2" stroke-dasharray="5 4" />
      <g v-if="spot"><line :x1="x(spot)" :x2="x(spot)" :y1="P / 2" :y2="H - P / 2" stroke="var(--muted)" stroke-dasharray="2 4" />
        <text :x="x(spot) + 4" :y="P" fill="var(--muted)" font-size="12">spot {{ spot }}</text></g>
      <g v-for="b in be" :key="b"><circle :cx="x(b)" :cy="y(0)" r="4" fill="var(--vol)" />
        <text :x="x(b)" :y="y(0) + 18" fill="var(--vol)" font-size="12" text-anchor="middle">{{ b }}</text></g>
      <text :x="P" :y="H - 6" fill="var(--muted)" font-size="11">{{ lo.toFixed(0) }}</text>
      <text :x="W - P" :y="H - 6" fill="var(--muted)" font-size="11" text-anchor="end">{{ hi.toFixed(0) }}</text>
    </svg>
    <figcaption class="muted">P&amp;L per share at expiry<span v-if="nowPts.length"> · dashed: today’s model value</span>. Dots mark breakevens.</figcaption>
  </figure>
</template>

<style scoped>
.payoff { margin: 0 0 1rem; }
svg { width: 100%; height: auto; display: block; }
figcaption { font-size: .85rem; }
</style>
