<script setup lang="ts">
import { computed } from 'vue'
import { useApp } from '../stores/app'
import { TERM_MAP } from '../lib/content'

const props = defineProps<{ text: string }>()
const app = useApp()
const parts = computed(() => {
  const out: { t: 'txt' | 'term'; v: string; id?: string }[] = []
  const re = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g
  let last = 0, m: RegExpExecArray | null
  while ((m = re.exec(props.text))) {
    if (m.index > last) out.push({ t: 'txt', v: props.text.slice(last, m.index) })
    const id = m[1].trim()
    out.push({ t: 'term', id, v: m[2] ?? TERM_MAP[id]?.name ?? id })
    last = m.index + m[0].length
  }
  if (last < props.text.length) out.push({ t: 'txt', v: props.text.slice(last) })
  return out
})
</script>

<template>
  <span><template v-for="(p, i) in parts" :key="i"><button v-if="p.t === 'term'" class="term-link" @click="app.openTerm = p.id!">{{ p.v }}</button><template v-else>{{ p.v }}</template></template></span>
</template>
