<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { load as loadPref, save as savePref } from '../lib/storage'
import { useRoute } from 'vue-router'
import { useApp } from '../stores/app'

// Google Website Translator. The script loads only when a non-English language is active.
// Our own `lang` preference is the source of truth: Google can rewrite its `googtrans` cookie
// while the page unloads, so we set or clear that cookie again on every load.
const langs: [string, string][] = [
  ['en', 'English'], ['zh-CN', '简体中文'], ['zh-TW', '繁體中文'], ['ja', '日本語'], ['ko', '한국어'],
  ['es', 'Español'], ['fr', 'Français'], ['de', 'Deutsch'], ['pt', 'Português'], ['it', 'Italiano'],
  ['ru', 'Русский'], ['vi', 'Tiếng Việt'], ['th', 'ไทย'], ['id', 'Bahasa Indonesia'], ['hi', 'हिन्दी'], ['ar', 'العربية'],
]

const readCookie = () => {
  const m = document.cookie.match(/(?:^|;\s*)googtrans=\/[^/;]+\/([^;]+)/)
  return m ? decodeURIComponent(m[1]) : 'en'
}
const current = ref(loadPref<string>('lang', readCookie()))
const app = useApp()
app.lang = current.value
const route = useRoute()

const setCookie = (code: string) => { document.cookie = `googtrans=/en/${code}; path=/` }

let loader: Promise<void> | null = null
function load() {
  loader ??= new Promise<void>((resolve, reject) => {
    const w = window as any
    w.googleTranslateElementInit = () => {
      new w.google.translate.TranslateElement({ pageLanguage: 'en', autoDisplay: false }, 'gt-el')
      resolve()
    }
    const s = document.createElement('script')
    s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
    s.async = true
    s.onerror = () => { loader = null; reject(new Error('Google Translate failed to load')) }
    document.head.appendChild(s)
  })
  return loader
}

async function combo() {
  for (let i = 0; i < 50; i++) {
    const c = document.querySelector('#gt-el select.goog-te-combo') as HTMLSelectElement | null
    if (c && c.options.length > 1) return c
    await new Promise((r) => setTimeout(r, 100))
  }
  return null
}

function clearCookie() {
  const host = location.hostname
  for (const d of ['', `; domain=${host}`, `; domain=.${host}`]) document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${d}`
}

// Google can mark the page as translated and still fetch nothing. Its translated text is wrapped in
// <font style="vertical-align: inherit">, so check for that and ask again (up to 4 times).
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const isTranslated = () => !!document.querySelector('main font[style*="vertical-align"]')
let ensuring = 0
async function ensure(code: string) {
  const run = ++ensuring
  for (let attempt = 0; attempt < 4; attempt++) {
    await sleep(attempt === 0 ? 1200 : 1600)
    if (run !== ensuring || current.value !== code) return
    if (isTranslated()) return
    const c = await combo()
    if (!c) continue
    c.value = code
    c.dispatchEvent(new Event('change'))
  }
}

async function pick(code: string) {
  current.value = code
  app.lang = code
  savePref('lang', code)
  if (code === 'en') { clearCookie(); location.reload(); return }
  if (!loader) {
    // First switch away from English: the widget applies the cookie when it starts. Changing its
    // selector right after start-up can be lost, because the translator is not ready yet.
    setCookie(code)
    load().then(() => ensure(code), () => location.reload())
    return
  }
  try {
    await load()
    const c = await combo()
    if (!c) throw new Error('no combo')
    c.value = code
    c.dispatchEvent(new Event('change'))
    ensure(code)
  } catch {
    // Fallback: set the cookie; the widget applies it on the next load.
    setCookie(code)
    location.reload()
  }
}

// Globe menu
const open = ref(false)
const root = ref<HTMLElement>()
const short = computed(() => ({ 'zh-CN': '简', 'zh-TW': '繁', ja: '日', ko: '한' } as Record<string, string>)[current.value] ?? current.value.slice(0, 2).toUpperCase())
const currentName = computed(() => langs.find(([c]) => c === current.value)?.[1] ?? 'English')
async function toggle() {
  open.value = !open.value
  if (open.value) { await nextTick(); (root.value?.querySelector('[aria-checked="true"]') as HTMLElement | null)?.focus() }
}
function choose(code: string) { open.value = false; if (code !== current.value) pick(code) }
function onKey(e: KeyboardEvent) {
  if (!open.value) return
  const items = [...(root.value?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? [])]
  const i = items.indexOf(document.activeElement as HTMLElement)
  if (e.key === 'Escape') { open.value = false; (root.value?.querySelector('.icon-btn') as HTMLElement | null)?.focus() }
  else if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length]?.focus() }
  else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length]?.focus() }
}
const onDoc = (e: MouseEvent) => { if (open.value && !root.value?.contains(e.target as Node)) open.value = false }
onMounted(() => document.addEventListener('pointerdown', onDoc))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onDoc))

onMounted(() => {
  if (current.value === 'en') { clearCookie(); return }
  setCookie(current.value)
  load().then(() => ensure(current.value), () => {})
})
// New page content: make sure Google translated it too.
watch(() => route.fullPath, () => { if (current.value !== 'en' && loader) ensure(current.value) })
</script>

<template>
  <div ref="root" class="lang" translate="no" @keydown="onKey">
    <button class="icon-btn globe" :class="{ on: open }" :aria-label="`Language: ${currentName}`" :title="`Language: ${currentName} (Google Translate)`"
      aria-haspopup="menu" :aria-expanded="open" @click="toggle">
      <i class="fa-solid fa-globe" /><span v-if="current !== 'en'" class="code">{{ short }}</span>
    </button>
    <Transition name="pop">
      <div v-if="open" class="menu" role="menu" aria-label="Language">
        <button v-for="[code, name] in langs" :key="code" role="menuitemradio" :aria-checked="code === current" class="item" @click="choose(code)">
          <span>{{ name }}</span><i v-if="code === current" class="fa-solid fa-check" aria-hidden="true" />
        </button>
        <p class="note">Machine translation by Google. Trading terms may read oddly.</p>
      </div>
    </Transition>
    <div id="gt-el" hidden aria-hidden="true"></div>
  </div>
</template>

<style scoped>
.lang { position: relative; flex: none; }
.globe { position: relative; }
.code { position: absolute; right: -4px; bottom: -4px; min-width: 18px; height: 18px; padding: 0 3px; display: grid; place-items: center; font-size: 10px; font-weight: 800; line-height: 1; border: 1.5px solid var(--edge); border-radius: 6px; background: var(--pop); }
.menu { position: absolute; right: 0; top: calc(100% + 8px); z-index: 50; width: 220px; max-height: min(420px, 70vh); overflow: auto; display: grid; padding: .35rem; background: var(--panel); border: 2px solid var(--edge); border-radius: 14px; box-shadow: 4px 4px 0 var(--edge); transform-origin: top right; }
.item { display: flex; justify-content: space-between; align-items: center; gap: .5rem; padding: .45rem .6rem; border: 0; border-radius: 8px; background: none; text-align: left; font-weight: 700; }
.item:hover, .item:focus-visible { background: #fff6dc; outline: none; }
.item[aria-checked='true'] { background: var(--pop); }
.note { margin: .3rem .4rem .2rem; font-size: .75rem; color: var(--muted); }
.pop-enter-active { transition: opacity .18s cubic-bezier(.23, 1, .32, 1), transform .18s cubic-bezier(.23, 1, .32, 1); }
.pop-leave-active { transition: opacity .12s ease, transform .12s ease; }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: scale(.97); }
@media (prefers-reduced-motion: reduce) { .pop-enter-from, .pop-leave-to { transform: none; } }
</style>
