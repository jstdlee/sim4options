<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import TermSheet from './components/TermSheet.vue'
import ChatFloat from './components/ChatFloat.vue'
import LangPicker from './components/LangPicker.vue'
import SearchPalette from './components/SearchPalette.vue'
import MapModal from './components/MapModal.vue'
import { useApp } from './stores/app'

const app = useApp()
const route = useRoute()
const links: [string, string, string][] = [
  ['/', 'Journey', 'fa-route'],
  ['/cards', 'Skill cards', 'fa-layer-group'],
  ['/map', 'Term map', 'fa-diagram-project'],
  ['/moments', 'Moments', 'fa-bolt'],
  ['/sim', 'Simulator', 'fa-sliders'],
]

// Collapse the nav into a drawer when the links do not fit next to the brand and the icon cluster.
const top = ref<HTMLElement>(), brand = ref<{ $el: HTMLElement }>(), cluster = ref<HTMLElement>(), measure = ref<HTMLElement>()
const collapsed = ref(false)
function fit() {
  const b = brand.value?.$el
  if (!top.value || !b || !cluster.value || !measure.value) return
  const cs = getComputedStyle(top.value)
  const free = top.value.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - b.offsetWidth - cluster.value.offsetWidth - 2 * 16
  collapsed.value = measure.value.scrollWidth > free
}
let ro: ResizeObserver | null = null
onMounted(() => {
  // Measure on the next frame: changing the layout inside the observer callback would loop.
  let raf = 0
  ro = new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(fit) })
  for (const el of [top.value, measure.value, cluster.value]) if (el) ro.observe(el)
  document.fonts?.ready.then(fit)
  fit()
})
onBeforeUnmount(() => ro?.disconnect())
watch(() => app.authed, () => nextTick(fit))

// Drawer
const drawer = ref(false)
const menuBtn = ref<HTMLElement>(), panel = ref<HTMLElement>()
watch(drawer, async (v) => {
  document.body.style.overflow = v ? 'hidden' : ''
  await nextTick()
  if (v) (panel.value?.querySelector('a') as HTMLElement | null)?.focus()
  else menuBtn.value?.focus()
})
watch(() => route.fullPath, () => (drawer.value = false))
watch(collapsed, (c) => { if (!c) drawer.value = false })
const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && drawer.value) drawer.value = false }
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <header ref="top" class="top">
    <RouterLink ref="brand" to="/" class="brand" translate="no"><img src="/fox/favicon.png" alt="" width="32" height="32" /><span>Options Quest</span></RouterLink>

    <nav v-if="app.authed && !collapsed" class="links" aria-label="Main">
      <RouterLink v-for="[to, label] in links" :key="to" :to="to" class="nav">{{ label }}</RouterLink>
    </nav>
    <span v-else class="spacer" />
    <!-- Invisible copy used only to measure the width the links need. -->
    <div ref="measure" class="links measure" aria-hidden="true"><span v-for="[to, label] in links" :key="to" class="nav">{{ label }}</span></div>

    <div ref="cluster" class="cluster" role="toolbar" aria-label="App">
      <SearchPalette v-if="app.authed" />
      <LangPicker />
      <RouterLink v-if="app.authed" to="/settings" class="icon-btn" aria-label="Settings" title="Settings"><i class="fa-solid fa-gear" /></RouterLink>
      <button v-if="app.authed && collapsed" ref="menuBtn" class="icon-btn" aria-label="Open menu" title="Menu"
        aria-controls="nav-drawer" :aria-expanded="drawer" @click="drawer = true"><i class="fa-solid fa-bars" /></button>
    </div>
  </header>

  <Transition name="drawer">
    <div v-if="drawer" class="scrim" @click.self="drawer = false">
      <aside id="nav-drawer" ref="panel" class="drawer" role="dialog" aria-modal="true" aria-label="Menu">
        <div class="dhead">
          <img src="/fox/wave.webp" alt="" />
          <button class="icon-btn" aria-label="Close menu" title="Close (Esc)" @click="drawer = false"><i class="fa-solid fa-xmark" /></button>
        </div>
        <nav aria-label="Main">
          <RouterLink v-for="[to, label, icon] in links" :key="to" :to="to" class="dlink"><i :class="['fa-solid', 'fa-fw', icon]" aria-hidden="true" />{{ label }}</RouterLink>
          <RouterLink to="/settings" class="dlink"><i class="fa-solid fa-fw fa-gear" aria-hidden="true" />Settings</RouterLink>
        </nav>
      </aside>
    </div>
  </Transition>

  <!-- Each page mounts fresh (keyed by URL). Google Translate replaces text nodes, so patching old
       nodes would leave the next question untranslated or stale. -->
  <main><RouterView v-slot="{ Component, route: r }"><component :is="Component" :key="r.fullPath" /></RouterView></main>
  <MapModal />
  <TermSheet />
  <ChatFloat v-if="app.authed" />
</template>

<style scoped>
.top { position: sticky; top: env(safe-area-inset-top, 0px); z-index: 20; display: flex; gap: 16px; align-items: center; padding: .5rem 1.1rem; background: var(--panel); border-bottom: 2px solid var(--edge); }
.brand { display: inline-flex; align-items: center; gap: .45rem; flex: none; font-family: var(--display); color: var(--paper); text-decoration: none; font-size: 1.05rem; white-space: nowrap; }
.brand img { width: 32px; height: 32px; transition: transform .2s; }
.brand:hover img { transform: rotate(-10deg) scale(1.08); }
.links { display: flex; gap: .3rem; flex: 1; min-width: 0; padding: 3px 3px 5px; }
.spacer { flex: 1; }
/* Fixed + off-screen: a fixed box never widens the page, so phones get no sideways scroll. */
.measure { position: fixed; top: 0; left: 0; transform: translateY(-200%); visibility: hidden; pointer-events: none; flex: none; white-space: nowrap; }
.nav { text-decoration: none; padding: .25rem .75rem; border-radius: 999px; color: var(--paper); font-weight: 700; white-space: nowrap; border: 2px solid transparent; }
.nav:hover { border-color: var(--edge); }
.nav.router-link-exact-active { background: var(--pop); border-color: var(--edge); box-shadow: var(--shadow-sm); }
.cluster { display: flex; align-items: center; gap: 4px; flex: none; }
@media (max-width: 420px) { .brand span { display: none; } }

.scrim { position: fixed; inset: 0; z-index: 60; background: rgb(26 23 18 / .3); }
.drawer { position: absolute; top: 0; right: 0; bottom: 0; width: min(300px, 86vw); display: flex; flex-direction: column; gap: .5rem; padding: calc(.8rem + env(safe-area-inset-top, 0px)) .9rem calc(1rem + env(safe-area-inset-bottom, 0px)); background: var(--panel); border-left: 2px solid var(--edge); box-shadow: -4px 0 0 var(--edge); overflow-y: auto; }
.dhead { display: flex; align-items: flex-end; justify-content: space-between; }
.dhead img { height: 88px; filter: drop-shadow(2px 0 0 #fff) drop-shadow(-2px 0 0 #fff) drop-shadow(0 2px 0 #fff) drop-shadow(0 -2px 0 #fff); }
.drawer nav { display: grid; gap: .45rem; }
.dlink { display: flex; align-items: center; gap: .75rem; min-height: 48px; padding: .55rem .9rem; border: 2px solid var(--edge); border-radius: 14px; background: var(--panel); color: var(--paper); font-weight: 800; text-decoration: none; box-shadow: var(--shadow-sm); }
.dlink i { color: var(--fox); }
.dlink:hover { background: #fff6dc; }
.dlink.router-link-exact-active { background: var(--pop); }
.drawer-enter-active, .drawer-leave-active { transition: opacity .24s cubic-bezier(.32, .72, 0, 1); }
.drawer-enter-active .drawer, .drawer-leave-active .drawer { transition: transform .24s cubic-bezier(.32, .72, 0, 1); }
.drawer-enter-from, .drawer-leave-to { opacity: 0; }
.drawer-enter-from .drawer, .drawer-leave-to .drawer { transform: translateX(100%); }
@media (prefers-reduced-motion: reduce) { .drawer-enter-from .drawer, .drawer-leave-to .drawer { transform: none; } }
</style>
