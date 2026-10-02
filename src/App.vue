<script setup lang="ts">
import TermSheet from './components/TermSheet.vue'
import ChatFloat from './components/ChatFloat.vue'
import LangPicker from './components/LangPicker.vue'
const links = [['/', 'Journey'], ['/cards', 'Cards'], ['/map', 'Term map'], ['/moments', 'Moments'], ['/sim', 'Simulator'], ['/settings', 'Settings']]
</script>

<template>
  <header class="top">
    <RouterLink to="/" class="brand" translate="no">Options Quest</RouterLink>
    <nav aria-label="Main"><RouterLink v-for="[to, label] in links" :key="to" :to="to" class="nav">{{ label }}</RouterLink></nav>
    <LangPicker />
  </header>
  <main><RouterView /></main>
  <TermSheet />
  <ChatFloat />
</template>

<style scoped>
.top { position: sticky; top: env(safe-area-inset-top, 0px); z-index: 20; display: flex; gap: 1rem; align-items: center; padding: .7rem 1.1rem; background: var(--ink); border-bottom: 1px solid var(--line); }
.brand { font-weight: 800; text-decoration: none; font-size: 1.1rem; white-space: nowrap; }
nav { display: flex; gap: .2rem; overflow-x: auto; min-width: 0; }
.nav { text-decoration: none; padding: .3rem .6rem; border-radius: 8px; color: var(--muted); white-space: nowrap; }
.nav.router-link-exact-active { color: var(--paper); background: var(--panel); }
</style>
