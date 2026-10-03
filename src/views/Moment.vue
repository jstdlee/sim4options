<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MOMENTS } from '../lib/content'
import StepPlayer from '../components/StepPlayer.vue'
import TermText from '../components/TermText.vue'
import type { Step } from '@shared/types'

const route = useRoute(), router = useRouter()
const idx = computed(() => MOMENTS.findIndex((m) => m.id === route.params.id))
const m = computed(() => MOMENTS[idx.value])
const finished = ref<null | { c: number; t: number }>(null)
const steps = computed<Step[]>(() => m.value?.checkpoints.map((cp) => ({ ...cp.step, prompt: `${cp.label}, ${cp.date}. ${cp.context}\n\n${cp.step.prompt}` })) ?? [])
const go = (d: number) => { const n = idx.value + d; if (MOMENTS[n]) { finished.value = null; router.push(`/moments/${MOMENTS[n].id}/0`) } }
</script>

<template>
  <div class="wrap narrow">
    <nav class="muted crumbs" aria-label="Breadcrumb"><RouterLink to="/moments">Moments</RouterLink> / {{ m?.ticker }}</nav>
    <template v-if="m">
      <h1><span class="tk">{{ m.ticker }}</span> {{ m.title }}</h1>
      <p class="read muted">{{ m.date }}. {{ m.summary }}</p>
      <StepPlayer :key="m.id" :qid="`moment:${m.id}`" kind="moment" :title="`${m.ticker}: ${m.title}`" :scenario="`${m.ticker} ${m.date}: ${m.summary}`" :steps="steps" :terms="m.terms" rationale @done="(c, t) => (finished = { c, t })">
        <ol class="timeline" aria-label="Checkpoints">
          <li v-for="cp in m.checkpoints" :key="cp.label"><i class="fa-solid fa-location-dot" aria-hidden="true" /><strong>{{ cp.label }}</strong> <span class="muted">{{ cp.date }}</span></li>
        </ol>
      </StepPlayer>
      <section v-if="finished" class="surface outcome">
        <h2><i :class="['fa-solid', finished.c / finished.t >= 2 / 3 ? 'fa-trophy' : 'fa-rotate-right']" aria-hidden="true" />
          {{ finished.c / finished.t >= 2 / 3 ? 'Passed' : 'Not passed yet' }} · {{ finished.c }}/{{ finished.t }}</h2>
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
.timeline { display: flex; gap: .4rem 1.2rem; flex-wrap: wrap; list-style: none; padding: 0; margin: 0; }
.timeline i { color: var(--fox); margin-right: .3rem; }
.outcome { margin-top: 1.5rem; }
.outcome h2 { display: flex; gap: .5rem; align-items: center; }
.pager { margin-top: 1.6rem; display: grid; grid-template-columns: 9.5rem 1fr 9.5rem; gap: .8rem; }
.pager .btn { justify-content: center; }
@media (max-width: 600px) { .pager { grid-template-columns: 1fr 1fr; } .pager span { display: none; } }
</style>
