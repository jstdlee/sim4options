<script setup lang="ts">
import FoxSticker from '../components/FoxSticker.vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useApp, type ByokCfg, type SearchCfg } from '../stores/app'
import { useRouter } from 'vue-router'

const app = useApp()
const router = useRouter()

// ── Server defaults (shown so learners know what runs when they change nothing)
const cfg = ref<{ cfProvider: string; gateway: string; exaServerKey: boolean; defaultModel: string } | null>(null)
onMounted(async () => { cfg.value = await fetch("/api/search/config").then((r) => r.json() as Promise<any>).catch(() => null) })
const defaultModel = computed(() => cfg.value?.defaultModel ?? '@cf/deepseek-ai/deepseek-v4-pro-0813')

// ── AI model
const f = reactive<ByokCfg>({ thinking: 'off', ...app.byok })
const saved = ref(false)
const err = ref('')
const hints: Record<ByokCfg['provider'], string> = {
  'workers-ai': 'Leave the model empty to use the default. Runs on Cloudflare; no key needed.',
  openai: 'Your key is sent per request through AI Gateway and is never stored on the server.',
  anthropic: 'Your key is sent per request through AI Gateway and is never stored on the server.',
  'google-ai-studio': 'Your key is sent per request through AI Gateway and is never stored on the server.',
  'openai-compatible': 'Any server that speaks the OpenAI chat API (OpenRouter, Groq, Together, DeepSeek, your own vLLM behind HTTPS…).',
}
const models = ref<{ id: string; note?: string }[]>([])
const modelsState = ref<'idle' | 'loading' | 'error'>('idle')
const modelsErr = ref('')
const modelFilter = ref('')
watch(() => [f.provider, f.baseUrl], () => { models.value = []; modelsState.value = 'idle' })
const shownModels = computed(() => models.value.filter((m) => !modelFilter.value || m.id.toLowerCase().includes(modelFilter.value.toLowerCase())).slice(0, 200))

async function loadModels() {
  modelsState.value = 'loading'; modelsErr.value = ''
  const r = await fetch('/api/models', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ provider: f.provider, key: f.key, baseUrl: f.baseUrl }) })
    .then((x) => x.json() as Promise<any>).catch((e) => ({ ok: false, error: String(e) }))
  if (!r.ok) { modelsState.value = 'error'; modelsErr.value = r.error ?? 'Could not load models.'; return }
  models.value = r.models; modelsState.value = 'idle'
  if (!models.value.length) { modelsState.value = 'error'; modelsErr.value = 'The provider returned no chat models.' }
}

function save() {
  err.value = ''
  if (f.provider === 'openai-compatible') {
    try { if (new URL(f.baseUrl ?? '').protocol !== 'https:') throw 0 } catch { err.value = 'Enter a base URL that starts with https:// — the Cloudflare Worker cannot reach http or local addresses.'; return }
    if (!f.model.trim()) { err.value = 'Choose or type the model name the server expects.'; return }
  }
  if (f.provider !== 'workers-ai' && f.provider !== 'openai-compatible' && !f.key.trim()) { err.value = 'Enter the API key for this provider.'; return }
  app.setByok({ ...f }); saved.value = true; setTimeout(() => (saved.value = false), 1800)
}

// ── Web search
const s = reactive<SearchCfg>({ ...app.search })
const sSaved = ref(false)
function saveSearch() { app.setSearch({ ...s }); sSaved.value = true; setTimeout(() => (sSaved.value = false), 1800) }
const testQ = ref('Latest FOMC rate decision')
const test = ref<{ ok: boolean; provider?: string; results?: { title: string; url: string }[]; errors?: string[]; error?: string } | null>(null)
const testing = ref(false)
async function runTest() {
  testing.value = true; test.value = null
  test.value = await fetch('/api/websearch', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ q: testQ.value, search: { ...s, cfProvider: s.cfProvider || undefined, exaKey: s.exaKey || undefined } }) })
    .then((x) => x.json() as Promise<any>).catch((e) => ({ ok: false, error: String(e) }))
  testing.value = false
}
const cfError = computed(() => test.value?.errors?.find((e) => e.startsWith('cloudflare')))
const cfState = computed(() => !test.value ? 'unknown' : test.value.provider?.startsWith('cloudflare') ? 'ok' : cfError.value?.includes('byok_not_configured') ? 'setup' : cfError.value ? 'error' : 'unknown')

async function signOut() {
  await fetch('/api/logout', { method: 'POST' }).catch(() => {})
  app.authed = false
  router.replace('/login')
}
</script>

<template>
  <div class="wrap narrow">
    <header class="phead"><h1>Settings</h1><FoxSticker pose="smile" :size="96" /></header>

    <!-- AI model -->
    <section class="surface box">
      <h2><i class="fa-solid fa-microchip" aria-hidden="true" /> AI model</h2>
      <p class="muted">Explanations and Kon use this model. Clef decisions always run on Workers AI.</p>
      <p class="default"><span class="tag">Default</span> <code>{{ defaultModel }}</code> on Cloudflare Workers AI, thinking off.</p>

      <label for="byok-provider">Provider</label>
      <select id="byok-provider" v-model="f.provider">
        <option value="workers-ai">Cloudflare Workers AI</option><option value="openai">OpenAI</option>
        <option value="anthropic">Anthropic</option><option value="google-ai-studio">Google AI Studio</option>
        <option value="openai-compatible">OpenAI-compatible API (custom URL)</option>
      </select>
      <p class="muted small">{{ hints[f.provider] }}</p>

      <template v-if="f.provider === 'openai-compatible'">
        <label for="byok-base">Base URL</label>
        <input id="byok-base" v-model="f.baseUrl" type="url" inputmode="url" spellcheck="false" placeholder="https://api.example.com/v1" />
      </template>
      <template v-if="f.provider !== 'workers-ai'">
        <label for="byok-key">API key{{ f.provider === 'openai-compatible' ? ' (if the server needs one)' : '' }}</label>
        <input id="byok-key" v-model="f.key" type="password" autocomplete="off" placeholder="Stored only in this browser" />
      </template>

      <label for="byok-model">Model</label>
      <div class="field-row">
        <input id="byok-model" v-model="f.model" list="model-list" spellcheck="false" :placeholder="f.provider === 'workers-ai' ? defaultModel : 'model name'" />
        <button class="btn" :disabled="modelsState === 'loading'" @click="loadModels">
          <i :class="['fa-solid', modelsState === 'loading' ? 'fa-spinner fa-spin' : 'fa-list']" aria-hidden="true" />{{ modelsState === 'loading' ? 'Loading…' : 'Load models' }}</button>
      </div>
      <datalist id="model-list"><option v-for="m in models" :key="m.id" :value="m.id">{{ m.note }}</option></datalist>
      <p v-if="modelsState === 'error'" class="err" role="alert">{{ modelsErr }}</p>
      <div v-if="models.length" class="models">
        <input id="model-filter" v-model="modelFilter" class="filter" placeholder="Filter models…" aria-label="Filter models" />
        <div class="mlist" role="listbox" aria-label="Models from the provider">
          <button v-for="m in shownModels" :key="m.id" role="option" :aria-selected="f.model === m.id" class="mitem" @click="f.model = m.id">
            <span class="mid">{{ m.id }}</span><small v-if="m.note">{{ m.note }}</small></button>
        </div>
        <p class="muted small">{{ models.length }} models from the provider.</p>
      </div>

      <span id="think-label" class="lbl">Thinking</span>
      <div class="seg" role="radiogroup" aria-labelledby="think-label">
        <button v-for="t in (['off', 'low', 'high'] as const)" :key="t" role="radio" :aria-checked="f.thinking === t" @click="f.thinking = t">{{ t === 'off' ? 'Off (fast)' : t === 'low' ? 'Low' : 'High' }}</button>
      </div>
      <p class="muted small">Thinking lets reasoning models work through the problem first. Slower: a short DeepSeek answer took about 3 s with thinking off and 7 s with low.</p>

      <div class="row actions"><button class="btn primary" @click="save"><i class="fa-solid fa-floppy-disk" aria-hidden="true" />Save model settings</button>
        <FoxSticker v-if="saved" pose="thumbs" :size="48" say="Saved!" /><span v-if="err" class="err" role="alert">{{ err }}</span></div>
    </section>

    <!-- Web search -->
    <section class="surface box">
      <h2><i class="fa-solid fa-globe" aria-hidden="true" /> Web search</h2>
      <p class="muted">Kon searches the web when a question needs fresh facts (news, dates, prices). Answers then list their sources.</p>

      <div class="providers">
        <div class="prov">
          <span class="tag">Default</span>
          <div><b>Cloudflare Web Search API</b> <small class="muted">built in, through AI Gateway “{{ cfg?.gateway ?? 'sim4options' }}”, provider {{ s.cfProvider || cfg?.cfProvider || 'ceramic' }}</small></div>
          <span :class="['state', cfState]">
            <template v-if="cfState === 'ok'"><i class="fa-solid fa-circle-check" /> Working</template>
            <template v-else-if="cfState === 'setup'"><i class="fa-solid fa-triangle-exclamation" /> Needs AI Gateway credits or a provider key</template>
            <template v-else-if="cfState === 'error'"><i class="fa-solid fa-circle-xmark" /> Error</template>
            <template v-else><i class="fa-solid fa-circle-question" /> Run a test</template>
          </span>
        </div>
        <div class="prov">
          <span class="tag alt">Backup</span>
          <div><b>Exa</b> <small class="muted">used when Cloudflare search fails or finds nothing</small></div>
          <span :class="['state', s.exaKey || cfg?.exaServerKey ? 'ok' : 'error']">
            <i :class="['fa-solid', s.exaKey || cfg?.exaServerKey ? 'fa-key' : 'fa-circle-xmark']" />
            {{ s.exaKey ? 'Your key' : cfg?.exaServerKey ? 'Server key set' : 'No key' }}</span>
        </div>
      </div>

      <span id="mode-label" class="lbl">When to search</span>
      <div class="seg" role="radiogroup" aria-labelledby="mode-label">
        <button v-for="[m, t] in ([['auto', 'Auto (Kon decides)'], ['always', 'Always'], ['off', 'Off']] as const)" :key="m" role="radio" :aria-checked="s.mode === m" @click="s.mode = m">{{ t }}</button>
      </div>

      <label for="cf-provider">Cloudflare search provider</label>
      <select id="cf-provider" v-model="s.cfProvider">
        <option value="">Server default ({{ cfg?.cfProvider ?? 'ceramic' }})</option>
        <option value="ceramic">Ceramic.ai</option><option value="exa">Exa</option><option value="linkup">Linkup</option>
      </select>

      <fieldset class="exa">
        <legend>Exa</legend>
        <label for="exa-key">Your Exa API key (optional)</label>
        <input id="exa-key" v-model="s.exaKey" type="password" autocomplete="off" placeholder="Stored only in this browser; empty = server key" />
        <div class="two">
          <div><label for="exa-n">Results</label>
            <select id="exa-n" v-model.number="s.numResults"><option v-for="n in [3, 5, 8, 10]" :key="n" :value="n">{{ n }}</option></select></div>
          <div><label for="exa-type">Search type</label>
            <select id="exa-type" v-model="s.exaType"><option value="auto">Auto</option><option value="fast">Fast</option><option value="neural">Neural</option><option value="keyword">Keyword</option></select></div>
        </div>
      </fieldset>

      <div class="row actions"><button class="btn primary" @click="saveSearch"><i class="fa-solid fa-floppy-disk" aria-hidden="true" />Save search settings</button>
        <FoxSticker v-if="sSaved" pose="thumbs" :size="48" say="Saved!" /></div>

      <div class="test">
        <label for="test-q">Test search</label>
        <div class="field-row">
          <input id="test-q" v-model="testQ" @keydown.enter="runTest" />
          <button class="btn" :disabled="testing || !testQ.trim()" @click="runTest"><i :class="['fa-solid', testing ? 'fa-spinner fa-spin' : 'fa-magnifying-glass']" aria-hidden="true" />{{ testing ? 'Searching…' : 'Test' }}</button>
        </div>
        <div v-if="test" class="result" aria-live="polite">
          <p :class="test.ok ? 'okline' : 'err'"><i :class="['fa-solid', test.ok ? 'fa-circle-check' : 'fa-circle-xmark']" aria-hidden="true" />
            {{ test.ok ? `${test.results?.length} results from ${test.provider}` : (test.error ?? 'No results.') }}</p>
          <ol v-if="test.results?.length"><li v-for="r in test.results" :key="r.url"><a :href="r.url" target="_blank" rel="noopener noreferrer">{{ r.title }}</a></li></ol>
          <ul v-if="test.errors?.length" class="errs"><li v-for="e in test.errors" :key="e">{{ e }}</li></ul>
        </div>
      </div>
    </section>

    <section class="surface box">
      <h2><i class="fa-solid fa-chart-line" aria-hidden="true" /> Progress</h2>
      <p class="muted">Learner ID {{ app.uid.slice(0, 8) }}. Progress is stored in this browser and synced to the app database.</p>
      <button class="btn" @click="app.reset()">Reset progress</button>
    </section>
    <section class="surface box">
      <h2><i class="fa-solid fa-user-lock" aria-hidden="true" /> Account</h2>
      <p class="muted">You are signed in with an access token on this browser.</p>
      <button class="btn" @click="signOut"><i class="fa-solid fa-right-from-bracket" aria-hidden="true" />Sign out</button>
    </section>
    <p class="muted small">Options Quest is for education only and is not financial advice.</p>
  </div>
</template>

<style scoped>
.box { margin: 1rem 0; display: grid; gap: .45rem; }
.box h2 { display: flex; align-items: center; gap: .5rem; margin: 0; }
.box h2 i { color: var(--fox); font-size: .85em; }
.box > p { margin: 0; }
label, .lbl { font-weight: 800; margin-top: .4rem; }
.small { font-size: .85rem; }
.err { color: var(--put); font-weight: 700; margin: 0; }
.default { font-size: .9rem; }
.default code, .mid { font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-size: .85em; }
.tag { display: inline-block; font-size: .7rem; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; padding: .05rem .45rem; border: 1.5px solid var(--edge); border-radius: 6px; background: var(--pop); }
.tag.alt { background: var(--panel); }
.field-row { display: flex; gap: .5rem; }
.field-row input { flex: 1; min-width: 0; }
.models { display: grid; gap: .4rem; }
.mlist { max-height: 220px; overflow-y: auto; border: 2px solid var(--edge); border-radius: 10px; padding: .25rem; display: grid; }
.mitem { display: flex; justify-content: space-between; gap: .6rem; text-align: left; border: 0; background: none; padding: .35rem .5rem; border-radius: 7px; }
.mitem:hover { background: #fff6dc; }
.mitem[aria-selected='true'] { background: var(--pop); font-weight: 800; }
.mitem small { color: var(--muted); white-space: nowrap; }
.seg { display: inline-flex; flex-wrap: wrap; gap: 0; border: 2px solid var(--edge); border-radius: 12px; overflow: hidden; justify-self: start; }
.seg button { border: 0; border-right: 2px solid var(--edge); background: var(--panel); padding: .4rem .85rem; font-weight: 700; }
.seg button:last-child { border-right: 0; }
.seg button[aria-checked='true'] { background: var(--pop); }
.providers { display: grid; gap: .5rem; margin: .3rem 0; }
.prov { display: grid; grid-template-columns: auto 1fr auto; gap: .6rem; align-items: center; padding: .6rem .75rem; border: 2px solid var(--edge); border-radius: 12px; }
.prov small { display: block; }
.state { font-size: .82rem; font-weight: 800; text-align: right; }
.state.ok { color: var(--call); } .state.setup { color: #b7791f; } .state.error { color: var(--put); } .state.unknown { color: var(--muted); }
.exa { border: 2px dashed var(--line); border-radius: 12px; padding: .4rem .8rem .8rem; display: grid; gap: .35rem; margin: .4rem 0 0; }
.exa legend { font-weight: 800; padding: 0 .3rem; }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; }
.two > div { display: grid; gap: .25rem; }
.actions { margin-top: .5rem; }
.test { display: grid; gap: .4rem; margin-top: .6rem; padding-top: .8rem; border-top: 2px dashed var(--line); }
.result ol { margin: .2rem 0 0; padding-left: 1.2rem; font-size: .88rem; }
.result a { color: var(--teal); word-break: break-word; }
.okline { color: var(--call); font-weight: 800; margin: 0; }
.errs { margin: .3rem 0 0; padding-left: 1.2rem; font-size: .78rem; color: var(--muted); word-break: break-word; }
@media (max-width: 560px) { .prov { grid-template-columns: auto 1fr; } .state { grid-column: 1 / -1; text-align: left; } .two { grid-template-columns: 1fr; } }
</style>
