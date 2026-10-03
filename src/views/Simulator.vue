<script setup lang="ts">
import { usePageContext } from '../lib/context'
import FoxSticker from '../components/FoxSticker.vue'
import { computed, ref, watch } from 'vue'
import type { Leg } from '@shared/types'
import { bs, round2 } from '@shared/bs'
import PayoffChart from '../components/PayoffChart.vue'

const S0 = ref(100), iv0 = ref(35), dte0 = ref(45)
const S = ref(100), iv = ref(35), day = ref(0)
const preset = ref('bull-call-spread')
const presets: Record<string, [string, (s: number) => Omit<Leg, 'premium'>[]]> = {
  'long-call': ['Long call', (s) => [{ type: 'call', side: 1, strike: s }]],
  'long-put': ['Long put', (s) => [{ type: 'put', side: 1, strike: s }]],
  'bull-call-spread': ['Bull call spread', (s) => [{ type: 'call', side: 1, strike: s }, { type: 'call', side: -1, strike: Math.round(s * 1.1) }]],
  'bear-put-spread': ['Bear put spread', (s) => [{ type: 'put', side: 1, strike: s }, { type: 'put', side: -1, strike: Math.round(s * 0.9) }]],
  'straddle': ['Long straddle', (s) => [{ type: 'call', side: 1, strike: s }, { type: 'put', side: 1, strike: s }]],
  'iron-condor': ['Iron condor', (s) => [{ type: 'put', side: 1, strike: Math.round(s * 0.85) }, { type: 'put', side: -1, strike: Math.round(s * 0.92) }, { type: 'call', side: -1, strike: Math.round(s * 1.08) }, { type: 'call', side: 1, strike: Math.round(s * 1.15) }]],
  'covered-call': ['Covered call', (s) => [{ type: 'stock', side: 1 }, { type: 'call', side: -1, strike: Math.round(s * 1.08) }]],
  'bear-call-spread': ['Bear call spread', (s) => [{ type: 'call', side: -1, strike: Math.round(s * 1.05) }, { type: 'call', side: 1, strike: Math.round(s * 1.12) }]],
  'bull-put-spread': ['Bull put spread', (s) => [{ type: 'put', side: -1, strike: Math.round(s * 0.95) }, { type: 'put', side: 1, strike: Math.round(s * 0.88) }]],
  'strangle': ['Long strangle', (s) => [{ type: 'put', side: 1, strike: Math.round(s * 0.93) }, { type: 'call', side: 1, strike: Math.round(s * 1.07) }]],
  'iron-butterfly': ['Iron butterfly', (s) => [{ type: 'put', side: 1, strike: Math.round(s * 0.9) }, { type: 'put', side: -1, strike: s }, { type: 'call', side: -1, strike: s }, { type: 'call', side: 1, strike: Math.round(s * 1.1) }]],
  'butterfly': ['Call butterfly (1 × 2 × 1)', (s) => [{ type: 'call', side: 1, strike: Math.round(s * 0.95) }, { type: 'call', side: -1, strike: s, qty: 2 }, { type: 'call', side: 1, strike: Math.round(s * 1.05) }]],
  'protective-put': ['Protective put', (s) => [{ type: 'stock', side: 1 }, { type: 'put', side: 1, strike: Math.round(s * 0.95) }]],
  'collar': ['Collar', (s) => [{ type: 'stock', side: 1 }, { type: 'put', side: 1, strike: Math.round(s * 0.93) }, { type: 'call', side: -1, strike: Math.round(s * 1.07) }]],
}

const GROUPS: [string, string[]][] = [
  ['Bullish', ['long-call', 'bull-call-spread', 'bull-put-spread']],
  ['Bearish', ['long-put', 'bear-put-spread', 'bear-call-spread']],
  ['Neutral, earns time decay', ['iron-condor', 'iron-butterfly', 'butterfly']],
  ['Big move, long volatility', ['straddle', 'strangle']],
  ['With stock', ['covered-call', 'protective-put', 'collar']],
]

const legs = ref<Leg[]>([])
function open() {
  S.value = S0.value; iv.value = iv0.value; day.value = 0
  legs.value = presets[preset.value][1](S0.value).map((l) => ({
    ...l, premium: l.type === 'stock' ? S0.value : round2(bs({ S: S0.value, K: l.strike!, T: dte0.value / 365, sigma: iv0.value / 100, type: l.type }).price),
  }))
}
watch([preset, S0, iv0, dte0], open, { immediate: true })

const T = computed(() => Math.max(dte0.value - day.value, 0) / 365)
const greeks = computed(() => legs.value.reduce((g, l) => {
  const n = l.side * (l.qty ?? 1)
  if (l.type === 'stock') return { ...g, delta: g.delta + n }
  const r = bs({ S: S.value, K: l.strike!, T: T.value, sigma: iv.value / 100, type: l.type })
  return { delta: g.delta + n * r.delta, gamma: g.gamma + n * r.gamma, theta: g.theta + n * r.theta, vega: g.vega + n * r.vega }
}, { delta: 0, gamma: 0, theta: 0, vega: 0 }))
const pnl = computed(() => legs.value.reduce((p, l) => {
  const n = l.side * (l.qty ?? 1)
  if (l.type === 'stock') return p + n * (S.value - l.premium!)
  return p + n * (bs({ S: S.value, K: l.strike!, T: T.value, sigma: iv.value / 100, type: l.type }).price - l.premium!)
}, 0) * 100)
const cost = computed(() => legs.value.reduce((c, l) => c + l.side * (l.qty ?? 1) * (l.premium ?? 0), 0) * 100)

function step(days = 1) {
  const dt = Math.min(days, dte0.value - day.value)
  if (dt <= 0) return
  const z = Math.sqrt(-2 * Math.log(Math.random() || 1e-9)) * Math.cos(2 * Math.PI * Math.random())
  S.value = round2(S.value * Math.exp((-0.5 * (iv.value / 100) ** 2) * dt / 365 + (iv.value / 100) * Math.sqrt(dt / 365) * z))
  iv.value = Math.max(8, Math.round(iv.value + (iv0.value - iv.value) * 0.05 + (Math.random() - 0.5) * 3))
  day.value += dt
}
// What Kon sees when the learner opens the chat.
usePageContext(() => ({
  kind: 'simulator', label: `Simulator · ${presets[preset.value][0]}`,
  text: `Simulator: ${presets[preset.value][0]} opened at spot ${S0.value}, IV ${iv0.value}%, ${dte0.value} DTE. Legs: ${legs.value.map((l) => `${l.side > 0 ? 'long' : 'short'} ${l.qty ?? 1}× ${l.type}${l.strike ? ' ' + l.strike : ''} @ ${l.premium}`).join(', ')}. Now day ${day.value}, spot ${S.value}, IV ${iv.value}%. P&L $${pnl.value.toFixed(0)}. Greeks Δ ${greeks.value.delta.toFixed(2)} Γ ${greeks.value.gamma.toFixed(3)} Θ ${greeks.value.theta.toFixed(3)} ν ${greeks.value.vega.toFixed(3)}.`,
}))
</script>

<template>
  <div class="wrap">
    <header class="phead"><h1>Simulator</h1><FoxSticker pose="think" :size="96" /></header>
    <p class="read muted">Open a structure, then move the market or let time pass. The dashed curve is today’s model value; the solid line is the payoff at expiry.</p>

    <div class="grid">
      <section class="surface">
        <h3>Open a position</h3>
        <label>Structure<select id="sim-preset" v-model="preset"><optgroup v-for="[g, ids] in GROUPS" :key="g" :label="g"><option v-for="k in ids" :key="k" :value="k">{{ presets[k][0] }}</option></optgroup></select></label>
        <label>Entry spot {{ S0 }}<input v-model.number="S0" type="range" min="20" max="500" step="1" /></label>
        <label>Entry IV {{ iv0 }}%<input v-model.number="iv0" type="range" min="10" max="150" step="1" /></label>
        <label>Days to expiry {{ dte0 }}<input v-model.number="dte0" type="range" min="1" max="180" step="1" /></label>
        <p class="muted">Net {{ cost >= 0 ? 'debit' : 'credit' }}: ${{ Math.abs(cost).toFixed(0) }} per 1-lot</p>
      </section>
      <section class="surface">
        <h3>Market now · day {{ day }} of {{ dte0 }}</h3>
        <label>Spot {{ S.toFixed(2) }}<input v-model.number="S" type="range" :min="Math.round(S0 * 0.5)" :max="Math.round(S0 * 1.5)" step="0.5" /></label>
        <label>IV {{ iv }}%<input v-model.number="iv" type="range" min="5" max="200" step="1" /></label>
        <div class="row"><button class="btn" @click="step(1)">+1 day</button><button class="btn" @click="step(7)">+1 week</button><button class="btn" @click="day = dte0">To expiry</button><button class="btn" @click="open">Reset</button></div>
        <p class="pnl" :class="pnl >= 0 ? 'up' : 'down'">{{ pnl >= 0 ? '+' : '−' }}${{ Math.abs(pnl).toFixed(0) }}</p>
        <p class="greeks">Δ {{ greeks.delta.toFixed(2) }} · Γ {{ greeks.gamma.toFixed(3) }} · Θ {{ (greeks.theta * 100).toFixed(1) }}/day · ν {{ (greeks.vega * 100).toFixed(1) }}/pt</p>
      </section>
    </div>
    <PayoffChart :legs="legs" :spot="S" :now="{ T, sigma: iv / 100 }" />
  </div>
</template>

<style scoped>
.grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); margin: 1rem 0; }
label { display: grid; gap: .25rem; margin-bottom: .7rem; font-size: .92rem; }
input[type=range] { padding: 0; accent-color: var(--fox); }
.pnl { font-family: var(--display); font-size: 2.4rem; margin: .6rem 0 0; font-variant-numeric: tabular-nums; }
.pnl.up { color: var(--call); } .pnl.down { color: var(--put); }
.greeks { color: var(--vol); font-variant-numeric: tabular-nums; }
</style>
