<script setup lang="ts">
import FoxSticker from '../components/FoxSticker.vue'
import { computed, ref } from 'vue'
import { TERMS, ALL_TAGS, TERM_MAP } from '../lib/content'
import { useApp } from '../stores/app'

const app = useApp()
const q = ref(''), tags = ref<string[]>([]), weakOnly = ref(false)
const toggle = (t: string) => (tags.value = tags.value.includes(t) ? tags.value.filter((x) => x !== t) : [...tags.value, t])
const list = computed(() => TERMS.filter((t) =>
  (!q.value || (t.name + t.short).toLowerCase().includes(q.value.toLowerCase())) &&
  (!tags.value.length || tags.value.every((x) => t.tags.includes(x))) &&
  (!weakOnly.value || (app.mastery(t.id) ?? 0) < 0.7)))
</script>

<template>
  <div class="wrap">
    <header class="phead"><h1>Skill cards</h1><FoxSticker pose="study" :size="96" /></header>
    <div class="row filters">
      <input v-model="q" class="grow" placeholder="Search terms" aria-label="Search terms" />
      <label class="row"><input v-model="weakOnly" type="checkbox" style="width:auto" /> Needs review</label>
    </div>
    <div class="row tagbar"><button v-for="t in ALL_TAGS" :key="t" class="chip" :class="{ on: tags.includes(t) }" @click="toggle(t)">{{ t }}</button></div>
    <p class="muted">{{ list.length }} cards</p>
    <div class="grid">
      <article v-for="t in list" :key="t.id" class="card">
        <button class="title" @click="app.openTerm = t.id">{{ t.name }}</button>
        <p class="read">{{ t.short }}</p>
        <p v-if="t.formula" class="formula">{{ t.formula }}</p>
        <div class="row"><button v-for="r in t.related.slice(0, 4)" :key="r" class="chip" @click="app.openTerm = r">{{ TERM_MAP[r]?.name ?? r }}</button></div>
      </article>
    </div>
    <FoxSticker v-if="!list.length" class="none" pose="sleep" :size="120" say="No cards match. Try another word or clear the tags." />
  </div>
</template>

<style scoped>
.filters { margin: 1rem 0 .7rem; }
.tagbar { margin-bottom: .6rem; }
.grid { display: grid; gap: .8rem; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
.card { background: var(--panel); padding: .9rem 1rem 1rem; border: 2px solid var(--edge); border-radius: 14px; box-shadow: var(--shadow); }
.none { margin: 2rem 0; }
.title { background: none; border: 0; padding: 0; font-family: var(--display); font-size: 1.12rem; text-align: left; }
.title:hover { color: var(--fox); }
.card .read { font-size: .98rem; margin: .4rem 0; }
.formula { font-family: ui-monospace, 'SF Mono', Menlo, monospace; color: var(--teal); font-size: .86rem; background: color-mix(in srgb, var(--teal) 8%, transparent); border-radius: 8px; padding: .25rem .5rem; }
</style>
