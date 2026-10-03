<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Step } from '@shared/types'
import TermText from './TermText.vue'
import MdText from './MdText.vue'
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
      <p class="verdict" :class="picked === step.answer ? 'ok' : 'bad'">{{ picked === step.answer ? 'Correct.' : `Not quite — the answer is “${label(step.answer)}”.` }}</p>
      <p class="read"><TermText :text="step.why" /></p>
      <div class="row">
        <button class="btn" :disabled="busy === 'clef'" @click="askClef">{{ busy === 'clef' ? 'Asking Clef…' : 'Compare with Clef' }}</button>
        <button class="btn" :disabled="busy === 'ai'" @click="askExplain">{{ busy === 'ai' ? 'Explaining…' : 'Explain in depth' }}</button>
        <button class="btn" @click="askTutor">Ask the tutor</button>
        <span class="grow" />
        <button v-if="idx < steps.length - 1" class="btn primary" @click="idx++">Next step</button>
      </div>
      <ClefBar v-if="clefOut[idx]?.ok" :probs="clefOut[idx]!.fields.pick?.probs" :choices="step.choices" :answer="step.answer" :ms="clefOut[idx]!.ms" :model="clefOut[idx]!.model" />
      <p v-else-if="clefOut[idx]" class="muted">Clef is unavailable: {{ clefOut[idx]!.error }}</p>
      <div v-if="explain[idx]" class="explain read"><MdText :text="explain[idx]" /></div>
    </div>
    <div v-else class="row"><button class="btn" @click="askTutor">Ask the tutor before answering</button></div>

    <section v-if="finished && rationale" class="surface rationale">
      <h3>Explain your reasoning</h3>
      <p class="muted">Clef grades whether you covered direction, volatility and risk.</p>
      <textarea v-model="note" rows="3" placeholder="e.g. IV was elevated before the print so I used a spread to limit vega…" />
      <div class="row" style="margin-top:.6rem"><button class="btn primary" :disabled="note.length < 15 || busy === 'grade'" @click="gradeIt">{{ busy === 'grade' ? 'Grading…' : 'Grade my reasoning' }}</button></div>
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
.dot { border: 1px solid var(--line); background: transparent; border-radius: 999px; padding: .15rem .7rem; font-size: .82rem; }
.dot.now { border-color: var(--paper); }
.dot.ok { background: color-mix(in srgb, var(--call) 30%, transparent); }
.dot.bad { background: color-mix(in srgb, var(--put) 30%, transparent); }
.prompt { font-size: 1.2rem; }
.choices { display: grid; gap: .5rem; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); margin: .8rem 0 1rem; }
.choice { text-align: left; background: var(--ink); border: 1px solid var(--line); border-radius: 12px; padding: .8rem .9rem; min-height: 3rem; }
.choice:not(:disabled):hover { border-color: var(--paper); }
.choice.right { border-color: var(--call); background: color-mix(in srgb, var(--call) 18%, var(--ink)); }
.choice.wrong { border-color: var(--put); background: color-mix(in srgb, var(--put) 18%, var(--ink)); }
.verdict { font-weight: 700; }
.verdict.ok { color: var(--call); } .verdict.bad { color: var(--put); }
.explain { margin-top: 1rem; padding-left: 1rem; border-left: 3px solid var(--vol); }
.rationale { margin-top: 1.5rem; }
.grades { margin-top: .7rem; }
</style>
