<script setup lang="ts">
import { usePageContext } from '../lib/context'
import FoxSticker from '../components/FoxSticker.vue'
import { computed, ref } from 'vue'
import { MOMENTS } from '../lib/content'
import { useApp } from '../stores/app'
const app = useApp()
// Themes, most common first; search matches ticker, title, date, summary and tags.
const TAGS = Object.entries(MOMENTS.flatMap((m) => m.tags).reduce<Record<string, number>>((a, t) => ((a[t] = (a[t] ?? 0) + 1), a), {}))
  .sort((a, b) => b[1] - a[1]).slice(0, 16).map(([t]) => t)
const tag = ref<string | null>(null)
const q = ref('')
const list = computed(() => {
  const words = q.value.toLowerCase().split(/\s+/).filter(Boolean)
  return MOMENTS.filter((m) => (!tag.value || m.tags.includes(tag.value)) &&
    words.every((w) => `${m.ticker} ${m.title} ${m.date} ${m.summary} ${m.tags.join(' ')}`.toLowerCase().includes(w)))
})
const score = (id: string) => app.results[`moment:${id}`]
const passed = computed(() => MOMENTS.filter((m) => { const r = score(m.id); return r && r.correct / r.total >= 2 / 3 }).length)

usePageContext(() => ({
  kind: 'page', label: `Market moments · ${passed.value}/${MOMENTS.length} passed`,
  text: `Market moments list. Passed ${passed.value} of ${MOMENTS.length}. Moments: ${list.value.map((m) => { const r = score(m.id); return `${m.ticker} ${m.title} (${m.date})${r ? ` ${r.correct}/${r.total}` : ''}` }).join('; ')}.`,
}))
</script>

<template>
  <div class="wrap">
    <header class="phead"><h1>Market moments</h1><FoxSticker pose="surprised" :size="96" /></header>
    <p class="read muted">Trade through real events checkpoint by checkpoint. Prices are approximate reconstructions for teaching. Pass a moment with 2 of 3 decisions right; pass {{ Math.ceil(MOMENTS.length * 0.7) }} to complete the final test.</p>
    <p><strong>{{ passed }} / {{ MOMENTS.length }}</strong> passed</p>
    <input id="moment-search" v-model="q" type="search" class="search" placeholder="Search a ticker, event or year (NVDA, crash, 2020…)" aria-label="Search moments" />
    <div class="row filters"><button class="chip" :class="{ on: !tag }" @click="tag = null">All {{ MOMENTS.length }}</button>
      <button v-for="t in TAGS" :key="t" class="chip" :class="{ on: tag === t }" @click="tag = tag === t ? null : t">{{ t }}</button></div>
    <p class="muted count">{{ list.length }} shown</p>
    <div class="list">
      <RouterLink v-for="m in list" :key="m.id" :to="`/moments/${m.id}/0`" class="moment">
        <span class="tk">{{ m.ticker }}</span>
        <div class="grow"><h2>{{ m.title }}</h2><p class="muted">{{ m.date }}. {{ m.summary }}</p></div>
        <span v-if="score(m.id)" class="chip" :class="{ on: score(m.id).correct / score(m.id).total >= 2 / 3 }">{{ score(m.id).correct }}/{{ score(m.id).total }}</span>
      </RouterLink>
    </div>
    <FoxSticker v-if="!list.length" pose="sleep" :size="120" say="No moment matches. Try another word or theme." />
  </div>
</template>

<style scoped>
.search { margin: .4rem 0 .6rem; max-width: 520px; }
.filters { margin: 0 0 .4rem; }
.count { font-size: .85rem; margin: 0 0 .6rem; }
.list { display: grid; gap: .6rem; }
.moment { display: flex; gap: 1rem; align-items: center; text-decoration: none; color: var(--paper); padding: 1rem; background: var(--panel); border: 2px solid var(--edge); border-radius: 14px; box-shadow: var(--shadow); transition: transform .08s ease, box-shadow .08s ease; }
.moment:hover { transform: translate(-1px, -1px); box-shadow: 4px 4px 0 var(--edge); background: #fff6dc; }
.moment h2 { font-size: 1.1rem; margin: 0; }
.moment p { margin: .2rem 0 0; }
.tk { font-family: var(--display); font-size: .95rem; min-width: 4.2rem; text-align: center; padding: .25rem .4rem; border: 2px solid var(--edge); border-radius: 8px; background: var(--pop); }
</style>
