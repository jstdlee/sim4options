<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MOMENTS } from '../lib/content'
import StepPlayer from '../components/StepPlayer.vue'
import TermText from '../components/TermText.vue'
import type { Step, Checkpoint } from '@shared/types'

const route = useRoute(), router = useRouter()
const idx = computed(() => MOMENTS.findIndex((m) => m.id === route.params.id))
const m = computed(() => MOMENTS[idx.value])
const finished = ref<null | { c: number; t: number }>(null)
// Each checkpoint becomes one step with a brief: short facts known at that time, the price-basis note apart.
// Only pure price-basis lines ("Prices as traded before the 20:1 split") become a footnote; everything else is a fact.
const NOTE = /^prices (are )?as traded\b/i
function brief(cp: Checkpoint) {
  const parts = cp.context.split(/(?<=[.!?])\s+(?=[A-Z0-9≈$€£(+−-])/).map((x) => x.trim().replace(/\.$/, '')).filter(Boolean)
  return { label: cp.label, date: cp.date, facts: parts.filter((x) => !NOTE.test(x)), note: parts.filter((x) => NOTE.test(x)).join('. ') || undefined }
}
const steps = computed<Step[]>(() => m.value?.checkpoints.map((cp) => ({ ...cp.step, brief: brief(cp) })) ?? [])
// The title and summary often give the outcome away: show them only after the last decision.
const setup = computed(() => (m.value ? `${m.value.ticker}, ${m.value.date}. Themes: ${m.value.tags.join(', ')}.` : ''))
const go = (d: number) => { const n = idx.value + d; if (MOMENTS[n]) { finished.value = null; router.push(`/moments/${MOMENTS[n].id}/0`) } }
</script>

<template>
  <div class="wrap narrow">
    <nav class="muted crumbs" aria-label="Breadcrumb"><RouterLink to="/moments">Moments</RouterLink> / {{ m?.ticker }}</nav>
    <template v-if="m">
      <h1><span class="tk">{{ m.ticker }}</span> {{ finished ? m.title : m.date }}</h1>
      <div class="row themes"><span v-for="t in m.tags" :key="t" class="chip">{{ t }}</span>
        <span class="muted small">Three checkpoints. Decide with what you know at each one.</span></div>
      <StepPlayer :key="m.id" :qid="`moment:${m.id}`" kind="moment" :title="`${m.ticker}, ${m.date}`" :scenario="setup" :steps="steps" :terms="m.terms" rationale @done="(c, t) => (finished = { c, t })" />
      <section v-if="finished" class="surface outcome" aria-live="polite">
        <h2><i :class="['fa-solid', finished.c / finished.t >= 2 / 3 ? 'fa-trophy' : 'fa-rotate-right']" aria-hidden="true" />
          {{ finished.c / finished.t >= 2 / 3 ? 'Passed' : 'Not passed yet' }} · {{ finished.c }}/{{ finished.t }}</h2>
        <p class="what"><b>What happened:</b> {{ m.title }}. {{ m.summary }}</p>
        <p class="read"><TermText :text="m.outcome" /></p>
      </section>
      <div class="pager">
        <button class="btn" :disabled="idx === 0" @click="go(-1)"><i class="fa-solid fa-arrow-left" aria-hidden="true" />Previous</button>
        <span />
        <button class="btn primary" :disabled="idx === MOMENTS.length - 1" @click="go(1)">Next moment<i class="fa-solid fa-arrow-right" aria-hidden="true" /></button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.crumbs { font-size: .88rem; margin: .4rem 0 .8rem; }
.crumbs a { color: var(--muted); }
h1 { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem; }
.tk { font-size: .55em; padding: .2rem .5rem; border: 2px solid var(--edge); border-radius: 8px; background: var(--pop); }
.themes { margin: .3rem 0 0; }
.small { font-size: .85rem; }
.what { margin: 0 0 .5rem; }
.outcome { margin-top: 1.5rem; }
.outcome h2 { display: flex; gap: .5rem; align-items: center; }
.pager { margin-top: 1.6rem; display: grid; grid-template-columns: 11rem 1fr 11rem; gap: .8rem; }
.pager .btn { justify-content: center; }
@media (max-width: 600px) { .pager { grid-template-columns: 1fr 1fr; } .pager span { display: none; } }
</style>
