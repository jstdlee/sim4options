<script setup lang="ts">
import { BANK, LEVELS, TOTAL, MOMENTS, TERMS } from '../lib/content'
import { useApp } from '../stores/app'
const app = useApp()
const done = (n: number) => app.levelProgress(BANK[n].map((q) => q.id))
const firstOpen = (n: number) => Math.max(0, BANK[n].findIndex((q) => !app.results[q.id]))
</script>

<template>
  <div class="wrap">
    <section class="hero">
      <h1>Learn options one decision at a time.</h1>
      <p class="read muted">{{ TOTAL }} practice questions across seven levels, {{ TERMS.length }} linked terms, and {{ MOMENTS.length }} real market moments to test yourself against. Every decision can be compared with Clef, Cloudflare’s decision model, and explained by the tutor.</p>
    </section>

    <ol class="ladder">
      <li v-for="l in LEVELS" :key="l.n" class="rung">
        <span class="n">{{ l.n }}</span>
        <div class="grow">
          <h2>{{ l.name }}</h2>
          <p class="muted">{{ l.blurb }}</p>
          <div class="meter" :aria-label="`${done(l.n)} of ${BANK[l.n].length} done`"><span :style="{ width: (done(l.n) / BANK[l.n].length) * 100 + '%' }" /></div>
        </div>
        <RouterLink class="btn" :class="{ primary: done(l.n) < BANK[l.n].length }" :to="`/quest/${l.n}/${firstOpen(l.n)}`">
          {{ done(l.n) === 0 ? 'Start' : done(l.n) >= BANK[l.n].length ? 'Review' : 'Continue' }} · {{ done(l.n) }}/{{ BANK[l.n].length }}
        </RouterLink>
      </li>
      <li class="rung final">
        <span class="n">★</span>
        <div class="grow"><h2>Final test: market moments</h2><p class="muted">Trade through real historical events, checkpoint by checkpoint.</p></div>
        <RouterLink class="btn" to="/moments">Open</RouterLink>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.hero { padding: 2.5rem 0 1.5rem; max-width: 46rem; }
.ladder { list-style: none; padding: 0; margin: 0; display: grid; gap: .6rem; }
.rung { display: flex; gap: 1rem; align-items: center; padding: 1rem; border: 1px solid var(--line); border-radius: 14px; background: var(--panel); flex-wrap: wrap; }
.rung h2 { font-size: 1.15rem; margin: 0; }
.rung p { margin: .1rem 0 .5rem; }
.n { font-size: 2rem; font-weight: 800; width: 2.2rem; text-align: center; color: var(--vol); }
.meter { height: 6px; background: var(--ink); border-radius: 4px; overflow: hidden; max-width: 22rem; }
.meter span { display: block; height: 100%; background: var(--call); }
.final { border-style: dashed; }
</style>
