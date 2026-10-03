<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Step } from '@shared/types'
import TermText from './TermText.vue'
import MdText from './MdText.vue'
import FoxSticker from './FoxSticker.vue'
import ClefBar from './ClefBar.vue'
import { api, plain, type ClefOut } from '../lib/api'
import { useApp } from '../stores/app'

const props = defineProps<{ qid: string; scenario: string; steps: Step[]; terms: string[]; rationale?: boolean }>()
const emit = defineEmits<{ done: [correct: number, total: number] }>()
const app = useApp()

const idx = ref(0)
const picks = ref<Record<number, string>>({})
const clefOut = ref<Record<number, ClefOut | null>>({})
const explain = ref<Record<number, string>>({})
const busy = ref<string | null>(null)
const note = ref('')
const grade = ref<ClefOut | null>(null)

watch(() => props.qid, () => { idx.value = 0; picks.value = {}; clefOut.value = {}; explain.value = {}; note.value = ''; grade.value = null })

const step = computed(() => props.steps[idx.value])
const picked = computed(() => picks.value[idx.value])
const finished = computed(() => Object.keys(picks.value).length === props.steps.length)
const correctCount = computed(() => props.steps.filter((s, i) => picks.value[i] === s.answer).length)

function choose(id: string) {
  if (picked.value) return
  picks.value[idx.value] = id
  const ok = id === step.value.answer
  api.attempt({ userId: app.uid, questionId: props.qid, step: idx.value, choice: id, correct: ok, terms: props.terms })
  if (Object.keys(picks.value).length === props.steps.length) {
    app.record(props.qid, correctCount.value, props.steps.length, props.terms)
    emit('done', correctCount.value, props.steps.length)
  }
}
const label = (id: string) => step.value.choices.find((c) => c.id === id)?.label ?? id

async function askClef() {
  busy.value = 'clef'
  clefOut.value[idx.value] = await api.spar(plain(props.scenario), plain(step.value.prompt), step.value.choices).catch(() => null)
  busy.value = null
}
async function askExplain() {
  busy.value = 'ai'
  const c = clefOut.value[idx.value]
  const r = await api.explain({
    scenario: plain(props.scenario), prompt: plain(step.value.prompt), choices: step.value.choices.map((c) => c.label),
    correct: label(step.value.answer), picked: label(picked.value!), why: plain(step.value.why),
    clef: c?.ok ? c.fields.pick?.probs : undefined, byok: app.byokPayload,
  }).catch((e): { ok: boolean; text?: string; error?: string } => ({ ok: false, error: String(e) }))
  explain.value[idx.value] = r.ok ? r.text ?? '' : `Explanation unavailable: ${r.error}`
  busy.value = null
}
async function gradeIt() {
  busy.value = 'grade'
  const decisions = props.steps.map((s, i) => `${plain(s.prompt)} → ${s.choices.find((c) => c.id === picks.value[i])?.label}`).join('; ')
  grade.value = await api.grade(plain(props.scenario), decisions, note.value).catch(() => null)
  busy.value = null
}
function askTutor() {
  app.chatContext = `Scenario: ${plain(props.scenario)}\nStep: ${plain(step.value.prompt)}\nChoices: ${step.value.choices.map((c) => c.label).join(' | ')}${picked.value ? `\nI picked: ${label(picked.value)}; correct: ${label(step.value.answer)}` : ''}`
  app.chatOpen = true
}
const yes = (v: unknown) => v === true || v === 'yes' || v === 'true'
</script>

<template>
  <div class="player">
    <ol class="steps" aria-label="Decision steps">
      <li v-for="(s, i) in steps" :key="i">
        <button :class="['dot', { now: i === idx, ok: picks[i] === s.answer, bad: picks[i] && picks[i] !== s.answer }]"
          :disabled="i > 0 && !picks[i - 1]" @click="idx = i">Step {{ i + 1 }}</button>
      </li>
    </ol>

    <h3 class="prompt"><TermText :text="step.prompt" /></h3>
    <div class="choices">
      <button v-for="c in step.choices" :key="c.id" class="choice"
        :class="{ right: picked && c.id === step.answer, wrong: picked === c.id && c.id !== step.answer }"
        :disabled="!!picked" @click="choose(c.id)">{{ c.label }}</button>
    </div>

    <div v-if="picked" class="reveal" aria-live="polite">
      <FoxSticker v-if="picked === step.answer" class="react" :pose="idx === steps.length - 1 ? 'cheer' : 'laugh'" :size="92">
        <span class="verdict ok">{{ idx === steps.length - 1 ? 'Correct! All steps done.' : 'Correct!' }}</span>
      </FoxSticker>
      <FoxSticker v-else class="react" pose="oops" :size="92">
        <span class="verdict bad">Not quite. The answer is “{{ label(step.answer) }}”.</span>
      </FoxSticker>
      <p class="read"><TermText :text="step.why" /></p>
      <div class="row">
        <button class="btn" :disabled="busy === 'clef'" @click="askClef">{{ busy === 'clef' ? 'Asking Clef…' : 'Compare with Clef' }}</button>
        <button class="btn" :disabled="busy === 'ai'" @click="askExplain">{{ busy === 'ai' ? 'Explaining…' : 'Explain in depth' }}</button>
        <button class="btn" @click="askTutor"><img class="ico" src="/fox/head.webp" alt="" />Ask the tutor</button>
        <span class="grow" />
        <button v-if="idx < steps.length - 1" class="btn primary" @click="idx++">Next step</button>
      </div>
      <FoxSticker v-if="busy === 'clef'" class="wait" pose="think" :size="64" say="Clef is weighing the choices…" />
      <FoxSticker v-if="busy === 'ai'" class="wait" pose="study" :size="64" say="Reading up on this…" />
      <ClefBar v-if="clefOut[idx]?.ok" :probs="clefOut[idx]!.fields.pick?.probs" :choices="step.choices" :answer="step.answer" :ms="clefOut[idx]!.ms" :model="clefOut[idx]!.model" />
      <p v-else-if="clefOut[idx]" class="muted">Clef is unavailable: {{ clefOut[idx]!.error }}</p>
      <div v-if="explain[idx]" class="explain read"><MdText :text="explain[idx]" /></div>
    </div>
    <div v-else class="row"><button class="btn" @click="askTutor"><img class="ico" src="/fox/head.webp" alt="" />Ask the tutor before answering</button></div>

    <section v-if="finished && rationale" class="surface rationale">
      <h3>Explain your reasoning</h3>
      <p class="muted">Clef grades whether you covered direction, volatility and risk.</p>
      <textarea v-model="note" rows="3" placeholder="e.g. IV was elevated before the print so I used a spread to limit vega…" />
      <div class="row" style="margin-top:.6rem"><button class="btn primary" :disabled="note.length < 15 || busy === 'grade'" @click="gradeIt">{{ busy === 'grade' ? 'Grading…' : 'Grade my reasoning' }}</button></div>
      <FoxSticker v-if="busy === 'grade'" class="wait" pose="think" :size="64" say="Grading your reasoning…" />
      <div v-if="grade?.ok" class="row grades">
        <span class="chip" :class="{ on: yes(grade.fields.direction?.value) }">Direction</span>
        <span class="chip" :class="{ on: yes(grade.fields.volatility?.value) }">Volatility</span>
        <span class="chip" :class="{ on: yes(grade.fields.risk?.value) }">Risk</span>
        <span class="chip">Quality: {{ grade.fields.quality?.value }}</span>
      </div>
      <p v-else-if="grade" class="muted">Grading is unavailable: {{ grade.error }}</p>
    </section>
  </div>
</template>

<style scoped>
.steps { display: flex; gap: .4rem; list-style: none; padding: 0; margin: 0 0 1rem; flex-wrap: wrap; }
.dot { border: 2px solid var(--edge); background: var(--panel); border-radius: 999px; padding: .1rem .75rem; font-size: .82rem; font-weight: 700; }
.dot.now { background: var(--pop); box-shadow: var(--shadow-sm); }
.dot.ok { background: var(--call); color: #fff; }
.dot.bad { background: var(--put); color: #fff; }
.dot:disabled { opacity: .45; }
.prompt { font-size: 1.2rem; }
.choices { display: grid; gap: .6rem; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); margin: .8rem 0 1rem; }
.choice { text-align: left; background: var(--panel); border: 2px solid var(--edge); border-radius: 14px; padding: .8rem .95rem; min-height: 3rem; font-weight: 700; box-shadow: var(--shadow); transition: transform .08s ease, box-shadow .08s ease, background .15s; }
.choice:not(:disabled):hover { background: #fff6dc; transform: translate(-1px, -1px); box-shadow: 4px 4px 0 var(--edge); }
.choice:not(:disabled):active { transform: translate(3px, 3px); box-shadow: 0 0 0 var(--edge); }
.choice:disabled { cursor: default; opacity: .6; }
.choice.right { opacity: 1; background: color-mix(in srgb, var(--call) 22%, var(--panel)); }
.choice.wrong { opacity: 1; background: color-mix(in srgb, var(--put) 18%, var(--panel)); }
.react { margin: .2rem 0 .6rem; }
.verdict { font-weight: 800; font-size: 1.05rem; }
.verdict.ok { color: var(--call); } .verdict.bad { color: var(--put); }
.wait { margin-top: .8rem; }
.wait :deep(.bubble) { font-weight: 700; font-size: .9rem; }
.explain { margin-top: 1rem; padding: .9rem 1.1rem; border: 2px solid var(--edge); border-radius: 14px; background: var(--panel); box-shadow: var(--shadow); }
.rationale { margin-top: 1.5rem; }
.grades { margin-top: .7rem; }
</style>
