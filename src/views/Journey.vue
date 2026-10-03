<script setup lang="ts">
import { computed } from 'vue'
import { BANK, LEVELS, TOTAL, MOMENTS, TERMS } from '../lib/content'
import { useApp } from '../stores/app'
import FoxSticker from '../components/FoxSticker.vue'
import { usePageContext } from '../lib/context'

const app = useApp()
const done = (n: number) => app.levelProgress(BANK[n].map((q) => q.id))
const firstOpen = (n: number) => Math.max(0, BANK[n].findIndex((q) => !app.results[q.id]))
const complete = (n: number) => done(n) >= BANK[n].length
const next = computed(() => LEVELS.find((l) => !complete(l.n)) ?? LEVELS[0])
const started = computed(() => LEVELS.some((l) => done(l.n) > 0))

usePageContext(() => ({
  kind: 'page', label: `Journey · next: level ${next.value.n}`,
  text: `Journey page. Progress: ${LEVELS.map((l) => `L${l.n} ${l.name} ${done(l.n)}/${BANK[l.n].length}`).join('; ')}. Next level: ${next.value.n} ${next.value.name}.`,
}))

// Speed lines that burst from behind Kon (fixed lengths, so the banner looks the same on every visit).
const RAYS = Array.from({ length: 36 }, (_, i) => {
  const a = (i / 36) * Math.PI * 2
  const r0 = 120 + ((i * 37) % 5) * 14
  const r1 = 560
  return { x1: 760 + Math.cos(a) * r0, y1: 210 + Math.sin(a) * r0, x2: 760 + Math.cos(a) * r1, y2: 210 + Math.sin(a) * r1, w: 1 + ((i * 13) % 3) }
})
</script>

<template>
  <div class="wrap">
    <section class="hero">
      <svg class="rays" viewBox="0 0 1000 420" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
        <line v-for="(r, k) in RAYS" :key="k" :x1="r.x1" :y1="r.y1" :x2="r.x2" :y2="r.y2" :stroke-width="r.w" />
      </svg>
      <div class="dots" aria-hidden="true" />
      <div class="copy">
        <h1>Learn options <span class="mark">one decision</span> at a time.</h1>
        <p class="read">{{ TOTAL }} questions in seven levels, {{ TERMS.length }} linked terms and {{ MOMENTS.length }} real market moments. Compare every decision with Clef, Cloudflare’s decision model, and ask Kon why.</p>
        <RouterLink class="btn primary cta" :to="`/quest/${next.n}/${firstOpen(next.n)}`">
          {{ started ? 'Continue' : 'Start' }} level {{ next.n }} · {{ next.name }}
        </RouterLink>
      </div>
      <div class="kon">
        <FoxSticker pose="wave" :size="210" bob alt="Kon the fox waving" />
        <span class="bubble say">{{ started ? 'Welcome back!' : 'Hi, I’m Kon!' }}</span>
      </div>
    </section>

    <ol class="ladder">
      <li v-for="l in LEVELS" :key="l.n" class="rung" :class="{ done: complete(l.n), now: l.n === next.n }">
        <span class="n">{{ l.n }}</span>
        <div class="grow">
          <h2>{{ l.name }}</h2>
          <p class="muted">{{ l.blurb }}</p>
          <div class="meter" :aria-label="`${done(l.n)} of ${BANK[l.n].length} done`"><span :style="{ width: (done(l.n) / BANK[l.n].length) * 100 + '%' }" /></div>
        </div>
        <RouterLink class="btn" :class="{ primary: l.n === next.n }" :to="`/quest/${l.n}/${firstOpen(l.n)}`">
          {{ done(l.n) === 0 ? 'Start' : complete(l.n) ? 'Review' : 'Continue' }} · {{ done(l.n) }}/{{ BANK[l.n].length }}
        </RouterLink>
        <FoxSticker v-if="complete(l.n)" class="stamp" pose="thumbs" :size="64" alt="Level complete" />
      </li>
      <li class="rung final">
        <span class="n"><i class="fa-solid fa-star" aria-hidden="true" /></span>
        <div class="grow"><h2>Final test: market moments</h2><p class="muted">Trade through real historical events, checkpoint by checkpoint.</p></div>
        <RouterLink class="btn" to="/moments">Open</RouterLink>
        <FoxSticker class="stamp" pose="surprised" :size="64" />
      </li>
    </ol>
  </div>
</template>

<style scoped>
.hero {
  position: relative; overflow: hidden; margin: 1rem 0 1.6rem; padding: 2rem clamp(1rem, 4vw, 2.5rem);
  display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, .9fr); align-items: center; gap: 1rem;
  background: var(--panel); border: 2px solid var(--edge); border-radius: 20px; box-shadow: 4px 4px 0 var(--edge);
}
.rays { position: absolute; inset: 0; width: 100%; height: 100%; }
.rays line { stroke: var(--edge); opacity: .09; stroke-linecap: round; }
.dots { position: absolute; left: -40px; bottom: -40px; width: 260px; height: 200px; background: radial-gradient(var(--pop) 2.2px, transparent 2.6px) 0 0 / 12px 12px; -webkit-mask: radial-gradient(circle at 0 100%, #000 30%, transparent 72%); mask: radial-gradient(circle at 0 100%, #000 30%, transparent 72%); }
.copy { position: relative; display: grid; gap: .4rem; justify-items: start; }
.copy h1 { margin: 0; }
.copy .read { margin: .3rem 0 .8rem; color: var(--muted); }
.cta { font-size: 1.05rem; padding: .65rem 1.2rem; }
.kon { position: relative; display: flex; justify-content: center; align-items: flex-end; min-height: 230px; }
.say { position: absolute; top: 0; right: 0; transform: rotate(3deg); }
.say::before { left: 22px; top: auto; bottom: -13px; transform: none; border-width: 12px 8px 0 8px; border-color: var(--edge) transparent transparent; }
.say::after { left: 24px; top: auto; bottom: -8px; transform: none; border-width: 9px 6px 0 6px; border-color: var(--panel) transparent transparent; }

.ladder { list-style: none; padding: 0; margin: 0; display: grid; gap: .8rem; }
.rung { position: relative; display: grid; grid-template-columns: auto minmax(0, 1fr) 10.5rem; gap: 1rem; align-items: center; padding: 1rem 1.1rem; border: 2px solid var(--edge); border-radius: 16px; background: var(--panel); box-shadow: var(--shadow); }
.rung > .btn { justify-content: center; }
.rung.now { background: #fff6dc; }
.rung h2 { font-size: 1.15rem; margin: 0; }
.rung p { margin: .1rem 0 .5rem; }
.n { display: grid; place-items: center; flex: none; width: 2.6rem; height: 2.6rem; border-radius: 50%; border: 2px solid var(--edge); background: var(--pop); font-family: var(--display); font-size: 1.3rem; }
.done .n { background: var(--call); color: #fff; }
.meter { height: 10px; border: 1.5px solid var(--edge); background: var(--ink); border-radius: 99px; overflow: hidden; max-width: 22rem; }
.meter span { display: block; height: 100%; background: var(--call); background-image: repeating-linear-gradient(-45deg, transparent 0 5px, rgb(255 255 255 / .3) 5px 9px); }
.final { border-style: dashed; }
.stamp { position: absolute; right: -10px; top: -26px; transform: rotate(8deg); pointer-events: none; }

@media (max-width: 720px) {
  .hero { grid-template-columns: 1fr; padding-bottom: 0; }
  .kon { min-height: 0; justify-content: flex-end; margin-top: -.5rem; }
  .kon :deep(img) { height: 150px !important; }
  .say { top: 10%; right: auto; left: 0; }
  .rung { grid-template-columns: auto minmax(0, 1fr); }
  .rung > .btn { grid-column: 1 / -1; }
}
</style>
