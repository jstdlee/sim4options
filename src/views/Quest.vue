<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BANK, LEVELS, TERM_MAP } from '../lib/content'
import TermText from '../components/TermText.vue'
import StepPlayer from '../components/StepPlayer.vue'
import PayoffChart from '../components/PayoffChart.vue'
import { useApp } from '../stores/app'
import FoxSticker from '../components/FoxSticker.vue'

const route = useRoute(), router = useRouter(), app = useApp()
const level = computed(() => Number(route.params.level))
const i = computed(() => Number(route.params.i))
const list = computed(() => BANK[level.value] ?? [])
const q = computed(() => list.value[i.value])
const meta = computed(() => LEVELS.find((l) => l.n === level.value))
const showChart = ref(false)

const go = (d: number) => {
  const n = i.value + d
  if (n >= 0 && n < list.value.length) router.push(`/quest/${level.value}/${n}`)
  else if (n >= list.value.length && BANK[level.value + 1]) router.push(`/quest/${level.value + 1}/0`)
}
const onKey = (e: KeyboardEvent) => {
  if ((e.target as HTMLElement)?.closest('input,textarea') || app.openTerm || app.chatOpen) return
  if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1)
}
let x0 = 0, y0 = 0
const ts = (e: TouchEvent) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY }
const te = (e: TouchEvent) => {
  const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0
  if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1)
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="wrap narrow" @touchstart.passive="ts" @touchend.passive="te">
    <nav class="crumbs muted" aria-label="Breadcrumb">
      <RouterLink to="/">Journey</RouterLink> / Level {{ level }} · {{ meta?.name }} / {{ i + 1 }} of {{ list.length }}
    </nav>
    <template v-if="q">
      <div class="head">
        <h1>{{ q.title }}</h1>
        <span v-if="app.results[q.id]" class="chip score" :class="{ on: app.results[q.id].correct === app.results[q.id].total }">
          <i class="fa-solid fa-star" aria-hidden="true" />{{ app.results[q.id].correct }}/{{ app.results[q.id].total }}</span>
      </div>
      <div class="row tags"><span v-for="t in q.tags" :key="t" class="chip">{{ t }}</span><span v-if="q.generated" class="chip">practice variant</span></div>

      <StepPlayer :key="q.id" :qid="q.id" :title="q.title" :scenario="q.scenario" :steps="q.steps" :terms="q.terms" :rationale="level >= 5">
        <p class="read scenario"><TermText :text="q.scenario" /></p>
        <div v-if="q.legs" class="chart">
          <button class="btn" :aria-expanded="showChart" @click="showChart = !showChart">
            <i class="fa-solid fa-chart-line" aria-hidden="true" />{{ showChart ? 'Hide payoff' : 'Show payoff of the textbook answer' }}</button>
          <PayoffChart v-if="showChart" :legs="q.legs" :spot="q.spot" />
        </div>
      </StepPlayer>

      <section class="review">
        <h3>Terms in this question</h3>
        <div class="row"><button v-for="t in q.terms" :key="t" class="chip" @click="app.openTerm = t">{{ TERM_MAP[t]?.name ?? t }}</button></div>
      </section>

      <div class="pager">
        <button class="btn" :disabled="i === 0" @click="go(-1)"><i class="fa-solid fa-arrow-left" aria-hidden="true" />Previous</button>
        <span class="muted hint">Swipe or use ← →</span>
        <button class="btn primary" @click="go(1)">{{ i === list.length - 1 ? 'Next level' : 'Next' }}<i class="fa-solid fa-arrow-right" aria-hidden="true" /></button>
      </div>
    </template>
    <FoxSticker v-else pose="oops" :size="140" say="That question does not exist." />
  </div>
</template>

<style scoped>
.crumbs { font-size: .88rem; margin: .4rem 0 .8rem; }
.crumbs a { color: var(--muted); }
.head { display: flex; align-items: flex-start; gap: .8rem; }
.head h1 { flex: 1; margin: 0; }
.score { margin-top: .5rem; }
.tags { margin: .6rem 0 0; }
.scenario { font-size: 1.12rem; margin: 0; }
.chart { margin-top: .8rem; display: grid; gap: .6rem; justify-items: start; }
.chart :deep(figure) { width: 100%; }
.review { margin-top: 1.6rem; }
/* Pager: equal buttons at both ends of the column. */
.pager { margin-top: 1.6rem; display: grid; grid-template-columns: 9.5rem 1fr 9.5rem; align-items: center; gap: .8rem; position: sticky; bottom: calc(.5rem + env(safe-area-inset-bottom, 0px)); background: var(--ink); padding: .5rem 0; }
.pager .btn { justify-content: center; }
.hint { text-align: center; font-size: .85rem; }
@media (max-width: 600px) {
  .pager { grid-template-columns: 1fr 1fr; padding-right: 0; }
  .hint { display: none; }
}
</style>
