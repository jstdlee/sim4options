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
  <div class="wrap">
    <nav class="muted crumbs"><RouterLink to="/moments">Moments</RouterLink> / {{ m?.ticker }}</nav>
    <template v-if="m">
      <h1>{{ m.ticker }}: {{ m.title }}</h1>
      <p class="read muted">{{ m.date }}. {{ m.summary }}</p>
      <ol class="timeline">
        <li v-for="cp in m.checkpoints" :key="cp.label"><strong>{{ cp.label }}</strong> <span class="muted">{{ cp.date }}</span></li>
      </ol>
      <StepPlayer :key="m.id" :qid="`moment:${m.id}`" :scenario="`${m.ticker} ${m.date}: ${m.summary}`" :steps="steps" :terms="m.terms" rationale @done="(c, t) => (finished = { c, t })" />
      <section v-if="finished" class="surface outcome">
        <h2>{{ finished.c / finished.t >= 2 / 3 ? 'Passed' : 'Not passed yet' }} · {{ finished.c }}/{{ finished.t }}</h2>
        <p class="read"><TermText :text="m.outcome" /></p>
      </section>
      <div class="row pager">
        <button class="btn" :disabled="idx === 0" @click="go(-1)">Previous moment</button>
        <span class="grow" />
        <button class="btn primary" :disabled="idx === MOMENTS.length - 1" @click="go(1)">Next moment</button>
      </div>
    </template>
    <p v-else>Moment not found. <RouterLink to="/moments">See all moments</RouterLink></p>
  </div>
</template>

<style scoped>
.crumbs { font-size: .88rem; margin: .4rem 0 1rem; }
.timeline { display: flex; gap: 1.2rem; flex-wrap: wrap; padding-left: 1.1rem; margin: 0 0 1.4rem; }
.outcome { margin-top: 1.5rem; }
.pager { margin-top: 2rem; padding-right: 7.5rem; }
:deep(.prompt) { white-space: pre-line; }
</style>
