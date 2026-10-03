<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Step } from '@shared/types'
import TermText from './TermText.vue'
import MdText from './MdText.vue'
import ClefBar from './ClefBar.vue'
import { api, plain, type ClefOut } from '../lib/api'
import { usePageContext } from '../lib/context'
import { useApp } from '../stores/app'
import type { Pose } from './FoxSticker.vue'

const props = defineProps<{ qid: string; title?: string; kind?: 'question' | 'moment'; scenario: string; steps: Step[]; terms: string[]; rationale?: boolean }>()
const emit = defineEmits<{ done: [correct: number, total: number] }>()
const app = useApp()

const idx = ref(0)
const picks = ref<Record<number, string>>({})
const clefOut = ref<Record<number, ClefOut | null>>({})
const explain = ref<Record<number, string>>({})
const explainCached = ref<Record<number, boolean>>({})
const busy = ref<string | null>(null)
const note = ref('')
const grade = ref<ClefOut | null>(null)

watch(() => props.qid, () => { idx.value = 0; picks.value = {}; clefOut.value = {}; explain.value = {}; note.value = ''; grade.value = null })

const step = computed(() => props.steps[idx.value])
const picked = computed(() => picks.value[idx.value])
const right = computed(() => !!picked.value && picked.value === step.value.answer)
const finished = computed(() => Object.keys(picks.value).length === props.steps.length)
const correctCount = computed(() => props.steps.filter((s, i) => picks.value[i] === s.answer).length)
const label = (id: string) => step.value.choices.find((c) => c.id === id)?.label ?? id

// Moments: the brief is the only background. Clef, the explanation and Kon see exactly what the learner sees.
const brief = computed(() => step.value?.brief)
const situation = computed(() => brief.value
  ? `${plain(props.scenario)}\nCheckpoint ${idx.value + 1} of ${props.steps.length} — ${brief.value.label} (${brief.value.date}): ${brief.value.facts.join('. ')}.`
  : plain(props.scenario))
// Bold the numbers in a fact: prices, percents, levels, ≈ values.
const NUM = /(≈\s?)?[−+-]?[$€£]?\d[\d,]*(\.\d+)?\s?(%|bp|[KMBT]\b|x\b)?/g
function marks(text: string) {
  const out: { t: string; b: boolean }[] = []; let last = 0
  for (const m of text.matchAll(NUM)) { if (m.index! > last) out.push({ t: text.slice(last, m.index), b: false }); out.push({ t: m[0], b: true }); last = m.index! + m[0].length }
  if (last < text.length) out.push({ t: text.slice(last), b: false })
  return out
}

// Kon in the card corner follows what is happening.
const pose = computed<Pose>(() => {
  if (busy.value === 'clef' || busy.value === 'grade') return 'think'
  if (busy.value === 'ai') return 'study'
  if (!picked.value) return 'smile'
  if (!right.value) return 'oops'
  return finished.value && idx.value === props.steps.length - 1 ? 'cheer' : 'laugh'
})

// What Kon sees when the learner opens the chat.
usePageContext(() => {
  const st = step.value
  if (!st) return null
  const lines = [
    `${props.kind === 'moment' ? 'Market moment' : 'Question'}: ${props.title ?? props.qid}`,
    `Scenario: ${situation.value}`,
    `Step ${idx.value + 1} of ${props.steps.length}: ${plain(st.prompt)}`,
    `Choices: ${st.choices.map((c) => c.label).join(' | ')}`,
  ]
  if (picked.value) {
    lines.push(`I picked: ${label(picked.value)}. Correct answer: ${label(st.answer)}.`, `Key: ${plain(st.why)}`)
    const probs = clefOut.value[idx.value]?.fields.pick?.probs
    if (probs) lines.push(`Clef probabilities: ${st.choices.map((c) => `${c.label} ${Math.round((probs[c.id] ?? 0) * 100)}%`).join(', ')}`)
  } else lines.push('I have not answered yet. Do not tell me the answer unless I ask; give hints.')
  return { kind: 'question', label: `${props.title ?? 'Question'} · step ${idx.value + 1}`, text: lines.join('\n'), answered: !!picked.value }
})

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

async function askClef() {
  busy.value = 'clef'
  clefOut.value[idx.value] = await api.spar(situation.value, plain(step.value.prompt), step.value.choices).catch(() => null)
  busy.value = null
}
async function askExplain(fresh = false) {
  busy.value = 'ai'
  const c = clefOut.value[idx.value]
  const r = await api.explain({
    scenario: situation.value, prompt: plain(step.value.prompt), choices: step.value.choices.map((c) => c.label),
    correct: label(step.value.answer), picked: label(picked.value!), why: plain(step.value.why),
    clef: c?.ok ? c.fields.pick?.probs : undefined, byok: app.byokPayload,
  }, fresh).catch((e): { ok: boolean; text?: string; error?: string; cached?: unknown } => ({ ok: false, error: String(e) }))
  explain.value[idx.value] = r.ok ? r.text ?? '' : `Explanation unavailable: ${r.error}`
  explainCached.value[idx.value] = !!r.cached
  busy.value = null
}
async function gradeIt() {
  busy.value = 'grade'
  const decisions = props.steps.map((s, i) => `${plain(s.prompt)} → ${s.choices.find((c) => c.id === picks.value[i])?.label}`).join('; ')
  grade.value = await api.grade(plain(props.scenario), decisions, note.value).catch(() => null)
  busy.value = null
}
const yes = (v: unknown) => v === true || v === 'yes' || v === 'true'
</script>

<template>
  <section class="card" :aria-label="title ?? 'Question'">
    <img class="kon" :src="`/fox/${pose}.webp`" alt="" aria-hidden="true" />

    <div class="context"><slot /></div>

    <ol v-if="steps.length > 1" class="steps" aria-label="Decision steps">
      <li v-for="(s, i) in steps" :key="i">
        <button :class="['dot', { now: i === idx, ok: picks[i] === s.answer, bad: picks[i] && picks[i] !== s.answer }]"
          :disabled="i > 0 && !picks[i - 1]" :aria-current="i === idx ? 'step' : undefined" @click="idx = i">Step {{ i + 1 }}</button>
      </li>
    </ol>

    <section v-if="brief" class="brief" :aria-label="`Situation at checkpoint ${idx + 1}`">
      <header><span class="cp">Checkpoint {{ idx + 1 }}/{{ steps.length }}</span><b>{{ brief.label }}</b><time>{{ brief.date }}</time></header>
      <ul><li v-for="(f, k) in brief.facts" :key="k"><template v-for="(seg, j) in marks(f)" :key="j"><b v-if="seg.b">{{ seg.t }}</b><template v-else>{{ seg.t }}</template></template></li></ul>
      <p v-if="brief.note" class="note"><i class="fa-solid fa-circle-info" aria-hidden="true" /> {{ brief.note }}</p>
    </section>

    <h3 class="prompt"><i v-if="brief" class="fa-solid fa-circle-question" aria-hidden="true" /> <TermText :text="step.prompt" /></h3>
    <div class="choices" :class="{ three: step.choices.length === 3 }" role="group" aria-label="Choices">
      <button v-for="c in step.choices" :key="c.id" class="choice"
        :class="{ right: picked && c.id === step.answer, wrong: picked === c.id && c.id !== step.answer }"
        :disabled="!!picked" @click="choose(c.id)">
        <span class="lbl">{{ c.label }}</span>
        <i v-if="picked && c.id === step.answer" class="fa-solid fa-circle-check" aria-label="correct answer" />
        <i v-else-if="picked === c.id" class="fa-solid fa-circle-xmark" aria-label="your pick" />
      </button>
    </div>

    <div v-if="picked" class="reveal" aria-live="polite">
      <p class="verdict" :class="right ? 'ok' : 'bad'">
        <i :class="['fa-solid', right ? 'fa-circle-check' : 'fa-circle-xmark']" aria-hidden="true" />
        {{ right ? (finished && idx === steps.length - 1 ? 'Correct! All steps done.' : 'Correct!') : `Not quite. The answer is “${label(step.answer)}”.` }}
      </p>
      <p class="read why"><TermText :text="step.why" /></p>
      <div class="actions">
        <button class="btn" :disabled="busy === 'clef'" @click="askClef">
          <i class="fa-solid fa-scale-balanced" aria-hidden="true" />{{ busy === 'clef' ? 'Asking Clef…' : 'Compare with Clef' }}</button>
        <button class="btn" :disabled="busy === 'ai'" @click="askExplain()">
          <i class="fa-solid fa-book-open" aria-hidden="true" />{{ busy === 'ai' ? 'Explaining…' : 'Explain in depth' }}</button>
        <button v-if="idx < steps.length - 1" class="btn primary" @click="idx++">
          Next step<i class="fa-solid fa-arrow-right" aria-hidden="true" /></button>
      </div>
      <ClefBar v-if="clefOut[idx]?.ok" :probs="clefOut[idx]!.fields.pick?.probs" :choices="step.choices" :answer="step.answer" :ms="clefOut[idx]!.ms" :model="clefOut[idx]!.model" />
      <p v-else-if="clefOut[idx]" class="muted">Clef is unavailable: {{ clefOut[idx]!.error }}</p>
      <div v-if="explain[idx]" class="explain read"><MdText :text="explain[idx]" />
        <p v-if="explainCached[idx]" class="memo"><i class="fa-solid fa-bookmark" aria-hidden="true" /> From Kon’s notes ·
          <button class="linkish" :disabled="busy === 'ai'" @click="askExplain(true)">Explain again fresh</button></p></div>
    </div>

    <section v-if="finished && rationale" class="rationale">
      <h3>Explain your reasoning</h3>
      <p class="muted">Clef grades whether you covered direction, volatility and risk.</p>
      <textarea id="rationale" v-model="note" rows="3" placeholder="e.g. IV was elevated before the print so I used a spread to limit vega…" />
      <div class="actions"><button class="btn primary" :disabled="note.length < 15 || busy === 'grade'" @click="gradeIt">
        <i class="fa-solid fa-pen-nib" aria-hidden="true" />{{ busy === 'grade' ? 'Grading…' : 'Grade my reasoning' }}</button></div>
      <div v-if="grade?.ok" class="row grades">
        <span class="chip" :class="{ on: yes(grade.fields.direction?.value) }"><i :class="['fa-solid', yes(grade.fields.direction?.value) ? 'fa-check' : 'fa-minus']" aria-hidden="true" />Direction</span>
        <span class="chip" :class="{ on: yes(grade.fields.volatility?.value) }"><i :class="['fa-solid', yes(grade.fields.volatility?.value) ? 'fa-check' : 'fa-minus']" aria-hidden="true" />Volatility</span>
        <span class="chip" :class="{ on: yes(grade.fields.risk?.value) }"><i :class="['fa-solid', yes(grade.fields.risk?.value) ? 'fa-check' : 'fa-minus']" aria-hidden="true" />Risk</span>
        <span class="chip">Quality: {{ grade.fields.quality?.value }}</span>
      </div>
      <p v-else-if="grade" class="muted">Grading is unavailable: {{ grade.error }}</p>
    </section>
  </section>
</template>

<style scoped>
/* One question = one manga panel, Kon sits on its top-right corner. */
.card { position: relative; display: grid; gap: 1rem; margin-top: 2.6rem; padding: 1.4rem clamp(1rem, 3vw, 1.6rem) 1.4rem; background: var(--panel); border: 2px solid var(--edge); border-radius: 18px; box-shadow: 4px 4px 0 var(--edge); }
.kon { position: absolute; top: -62px; right: 14px; height: 96px; width: auto; pointer-events: none; filter: drop-shadow(2px 0 0 #fff) drop-shadow(-2px 0 0 #fff) drop-shadow(0 2px 0 #fff) drop-shadow(0 -2px 0 #fff) drop-shadow(2px 3px 0 rgb(26 23 18 / .18)); }
.context { padding-right: 4.5rem; }
.context:empty { display: none; }
.context :deep(> :last-child) { margin-bottom: 0; }

.steps { display: flex; gap: .4rem; list-style: none; padding: 0; margin: 0; flex-wrap: wrap; }
.dot { border: 2px solid var(--edge); background: var(--panel); border-radius: 999px; padding: .1rem .75rem; font-size: .82rem; font-weight: 700; }
.dot.now { background: var(--pop); box-shadow: var(--shadow-sm); }
.dot.ok { background: var(--call); color: #fff; }
.dot.bad { background: var(--put); color: #fff; }
.dot:disabled { opacity: .45; }
.prompt { font-size: 1.15rem; margin: 0; white-space: pre-line; }

/* Moment brief: the facts known at this checkpoint, numbers in bold. */
.brief { border: 2px solid var(--edge); border-radius: 14px; background: var(--ink); padding: .7rem .95rem .8rem; }
.brief header { display: flex; flex-wrap: wrap; align-items: center; gap: .4rem .6rem; margin-bottom: .35rem; }
.brief .cp { font-size: .72rem; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; padding: .05rem .45rem; border: 1.5px solid var(--edge); border-radius: 6px; background: var(--pop); }
.brief time { margin-left: auto; font-size: .82rem; color: var(--muted); font-variant-numeric: tabular-nums; }
.brief ul { margin: 0; padding-left: 1.15rem; display: grid; gap: .2rem; font-family: var(--read); line-height: 1.5; }
.brief li b { font-weight: 700; color: var(--paper); background: color-mix(in srgb, var(--pop) 45%, transparent); border-radius: 3px; padding: 0 .1em; }
.brief .note { margin: .4rem 0 0; font-size: .78rem; color: var(--muted); }
.prompt i { color: var(--fox); }

/* Choices: equal cells. 2 or 4 options → 2 columns, 3 options → 3 columns, one column on phones. */
.choices { display: grid; gap: .7rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
.choices.three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.choice { display: flex; align-items: center; justify-content: space-between; gap: .6rem; text-align: left; background: var(--panel); border: 2px solid var(--edge); border-radius: 14px; padding: .8rem .95rem; min-height: 3.4rem; font-weight: 700; box-shadow: var(--shadow); transition: transform .08s ease, box-shadow .08s ease, background .15s; }
.choice:not(:disabled):hover { background: #fff6dc; transform: translate(-1px, -1px); box-shadow: 4px 4px 0 var(--edge); }
.choice:not(:disabled):active { transform: translate(3px, 3px); box-shadow: 0 0 0 var(--edge); }
.choice:disabled { cursor: default; opacity: .55; }
.choice.right { opacity: 1; background: color-mix(in srgb, var(--call) 22%, var(--panel)); }
.choice.right i { color: var(--call); }
.choice.wrong { opacity: 1; background: color-mix(in srgb, var(--put) 18%, var(--panel)); }
.choice.wrong i { color: var(--put); }

.reveal { display: grid; gap: .8rem; }
.verdict { display: flex; align-items: center; gap: .5rem; margin: 0; font-weight: 800; font-size: 1.05rem; }
.verdict.ok { color: var(--call); } .verdict.bad { color: var(--put); }
.why { margin: 0; }
/* Actions: equal-width buttons that wrap as a grid. */
.actions { display: grid; gap: .6rem; grid-template-columns: repeat(auto-fit, minmax(11.5rem, 1fr)); }
.actions .btn { justify-content: center; }
.explain { padding: .9rem 1.1rem; border: 2px solid var(--edge); border-radius: 14px; background: var(--ink); }
.memo { display: flex; flex-wrap: wrap; align-items: center; gap: .35rem; margin: .6rem 0 0; font-family: var(--ui); font-size: .78rem; color: var(--muted); }
.memo i { color: var(--teal); }
.linkish { border: 0; background: none; padding: 0; color: var(--teal); font-weight: 800; text-decoration: underline; }
.rationale { display: grid; gap: .6rem; padding-top: 1rem; border-top: 2px dashed var(--line); }
.rationale h3, .rationale p { margin: 0; }

@media (max-width: 600px) {
  .choices, .choices.three { grid-template-columns: 1fr; }
  .kon { height: 76px; top: -50px; right: 8px; }
  .context { padding-right: 3.2rem; }
}
</style>
