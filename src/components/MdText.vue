<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useApp } from '../stores/app'
import { TERM_MAP } from '../lib/content'

// Renders model output as Markdown. [[id]] / [[id|label]] become term buttons; the HTML is sanitized.
const props = defineProps<{ text: string }>()
const app = useApp()

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

const html = computed(() => {
  const withTerms = props.text.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, rawId: string, label?: string) => {
    const id = rawId.trim()
    return `<button type="button" class="term-link" data-term="${esc(id)}">${esc(label ?? TERM_MAP[id]?.name ?? id)}</button>`
  })
  const raw = marked.parse(withTerms, { async: false, gfm: true, breaks: true }) as string
  return DOMPurify.sanitize(raw, { ADD_ATTR: ['data-term'], FORBID_TAGS: ['style', 'form', 'input', 'img'] })
})

function onClick(e: MouseEvent) {
  const el = (e.target as HTMLElement).closest('[data-term]') as HTMLElement | null
  if (el) app.openTerm = el.dataset.term!
}
</script>

<template>
  <div class="md" @click="onClick" v-html="html" />
</template>

<style scoped>
.md { white-space: normal; }
.md :deep(> :first-child) { margin-top: 0; }
.md :deep(> :last-child) { margin-bottom: 0; }
.md :deep(p) { margin: 0 0 .6em; }
.md :deep(h1), .md :deep(h2), .md :deep(h3), .md :deep(h4) { font-size: 1em; font-weight: 800; margin: .9em 0 .35em; }
.md :deep(ul), .md :deep(ol) { margin: 0 0 .6em; padding-left: 1.3em; }
.md :deep(li) { margin: .15em 0; }
.md :deep(strong) { font-weight: 700; }
.md :deep(code) { font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-size: .88em; padding: .05em .35em; border-radius: 5px; background: color-mix(in srgb, currentColor 10%, transparent); }
.md :deep(pre) { overflow-x: auto; padding: .6em .8em; border-radius: 8px; background: color-mix(in srgb, currentColor 8%, transparent); }
.md :deep(pre code) { padding: 0; background: none; }
.md :deep(blockquote) { margin: 0 0 .6em; padding-left: .8em; border-left: 3px solid currentColor; opacity: .85; }
.md :deep(table) { border-collapse: collapse; margin: 0 0 .6em; display: block; overflow-x: auto; font-variant-numeric: tabular-nums; }
.md :deep(th), .md :deep(td) { border: 1px solid color-mix(in srgb, currentColor 25%, transparent); padding: .25em .55em; text-align: left; }
.md :deep(a) { text-decoration: underline; }
</style>
