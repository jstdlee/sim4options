<script setup lang="ts">
import { usePageContext } from '../lib/context'
import FoxSticker from '../components/FoxSticker.vue'
import { computed, ref } from 'vue'
import { MOMENTS } from '../lib/content'
import { useApp } from '../stores/app'
const app = useApp()
const tickers = Array.from(new Set(MOMENTS.map((m) => m.ticker)))
const tk = ref<string | null>(null)
const list = computed(() => MOMENTS.filter((m) => !tk.value || m.ticker === tk.value))
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
    <div class="row filters"><button class="chip" :class="{ on: !tk }" @click="tk = null">All</button>
      <button v-for="t in tickers" :key="t" class="chip" :class="{ on: tk === t }" @click="tk = t">{{ t }}</button></div>
    <div class="list">
      <RouterLink v-for="m in list" :key="m.id" :to="`/moments/${m.id}/0`" class="moment">
        <span class="tk">{{ m.ticker }}</span>
        <div class="grow"><h2>{{ m.title }}</h2><p class="muted">{{ m.date }}. {{ m.summary }}</p></div>
        <span v-if="score(m.id)" class="chip" :class="{ on: score(m.id).correct / score(m.id).total >= 2 / 3 }">{{ score(m.id).correct }}/{{ score(m.id).total }}</span>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.filters { margin: .5rem 0 1rem; }
.list { display: grid; gap: .6rem; }
.moment { display: flex; gap: 1rem; align-items: center; text-decoration: none; color: var(--paper); padding: 1rem; background: var(--panel); border: 2px solid var(--edge); border-radius: 14px; box-shadow: var(--shadow); transition: transform .08s ease, box-shadow .08s ease; }
.moment:hover { transform: translate(-1px, -1px); box-shadow: 4px 4px 0 var(--edge); background: #fff6dc; }
.moment h2 { font-size: 1.1rem; margin: 0; }
.moment p { margin: .2rem 0 0; }
.tk { font-family: var(--display); font-size: .95rem; min-width: 4.2rem; text-align: center; padding: .25rem .4rem; border: 2px solid var(--edge); border-radius: 8px; background: var(--pop); }
</style>
