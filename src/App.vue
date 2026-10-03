<script setup lang="ts">
import TermSheet from './components/TermSheet.vue'
import ChatFloat from './components/ChatFloat.vue'
import LangPicker from './components/LangPicker.vue'
import { useApp } from './stores/app'
const app = useApp()
const links = [['/', 'Journey'], ['/cards', 'Cards'], ['/map', 'Term map'], ['/moments', 'Moments'], ['/sim', 'Simulator'], ['/settings', 'Settings']]
</script>

<template>
  <header class="top">
    <RouterLink to="/" class="brand" translate="no"><img src="/fox/favicon.png" alt="" width="32" height="32" /><span>Options Quest</span></RouterLink>
    <nav v-if="app.authed" aria-label="Main"><RouterLink v-for="[to, label] in links" :key="to" :to="to" class="nav">{{ label }}</RouterLink></nav>
    <LangPicker />
  </header>
  <main><RouterView /></main>
  <TermSheet />
  <ChatFloat v-if="app.authed" />
</template>

<style scoped>
.top { position: sticky; top: env(safe-area-inset-top, 0px); z-index: 20; display: flex; gap: 1rem; align-items: center; padding: .55rem 1.1rem; background: var(--panel); border-bottom: 2px solid var(--edge); }
.brand { display: inline-flex; align-items: center; gap: .45rem; font-family: var(--display); color: var(--paper); text-decoration: none; font-size: 1.05rem; white-space: nowrap; }
.brand img { width: 32px; height: 32px; transition: transform .2s; }
.brand:hover img { transform: rotate(-10deg) scale(1.08); }
nav { display: flex; gap: .3rem; overflow-x: auto; min-width: 0; padding: 3px 3px 5px; }
.nav { text-decoration: none; padding: .25rem .75rem; border-radius: 999px; color: var(--paper); font-weight: 700; white-space: nowrap; border: 2px solid transparent; }
.nav:hover { border-color: var(--edge); }
.nav.router-link-exact-active { background: var(--pop); border-color: var(--edge); box-shadow: var(--shadow-sm); }
@media (max-width: 560px) {
  .top { flex-wrap: wrap; row-gap: .3rem; padding-bottom: .3rem; }
  .brand span { display: none; }
  nav { order: 3; width: 100%; }
}
</style>
