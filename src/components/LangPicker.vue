<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { load as loadPref, save as savePref } from '../lib/storage'

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

async function pick(code: string) {
  current.value = code
  savePref('lang', code)
  if (code === 'en') { clearCookie(); location.reload(); return }
  if (!loader) {
    // First switch away from English: the widget applies the cookie when it starts. Changing its
    // selector right after start-up can be lost, because the translator is not ready yet.
    setCookie(code)
    load().catch(() => location.reload())
    return
  }
  try {
    await load()
    const c = await combo()
    if (!c) throw new Error('no combo')
    c.value = code
    c.dispatchEvent(new Event('change'))
  } catch {
    // Fallback: set the cookie; the widget applies it on the next load.
    setCookie(code)
    location.reload()
  }
}

onMounted(() => {
  if (current.value === 'en') { clearCookie(); return }
  setCookie(current.value)
  load().catch(() => {})
})
</script>

<template>
  <label class="lang" translate="no" title="Translate this page (Google Translate)">
    <span aria-hidden="true">🌐</span>
    <select :value="current" aria-label="Language" @change="pick(($event.target as HTMLSelectElement).value)">
      <option v-for="[code, name] in langs" :key="code" :value="code">{{ name }}</option>
    </select>
    <div id="gt-el" hidden aria-hidden="true"></div>
  </label>
</template>

<style scoped>
.lang { display: inline-flex; align-items: center; gap: .3rem; margin-left: auto; flex: none; }
.lang select { width: auto; max-width: 9.5rem; padding: .25rem .45rem; font-size: .88rem; color: var(--muted); background: var(--ink); }
.lang select:hover { color: var(--paper); border-color: var(--muted); }
</style>
