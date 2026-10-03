<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useApp, type ByokCfg } from '../stores/app'
import { useRouter } from 'vue-router'

const app = useApp()
const router = useRouter()
const f = reactive<ByokCfg>({ ...app.byok })
const saved = ref(false)
const hints: Record<ByokCfg['provider'], string> = {
  'workers-ai': 'Leave model blank to use the default (@cf/moonshotai/kimi-k2.6), or enter another @cf/… model.',
  openai: 'e.g. gpt-5.1 — your key is sent per request through AI Gateway, never stored on the server.',
  anthropic: 'e.g. claude-sonnet-4-6',
  'google-ai-studio': 'e.g. gemini-2.5-flash',
}
async function signOut() {
  await fetch('/api/logout', { method: 'POST' }).catch(() => {})
  app.authed = false
  router.replace('/login')
}
function save() { app.setByok({ ...f }); saved.value = true; setTimeout(() => (saved.value = false), 1800) }
</script>

<template>
  <div class="wrap">
    <h1>Settings</h1>
    <section class="surface box">
      <h2>AI model</h2>
      <p class="muted">Explanations and the tutor use Workers AI by default. Clef decisions always run on Workers AI. Bring your own key to use another provider.</p>
      <label>Provider<select v-model="f.provider">
        <option value="workers-ai">Cloudflare Workers AI</option><option value="openai">OpenAI</option>
        <option value="anthropic">Anthropic</option><option value="google-ai-studio">Google AI Studio</option></select></label>
      <label>Model<input v-model="f.model" :placeholder="f.provider === 'workers-ai' ? '@cf/moonshotai/kimi-k2.6' : 'model name'" /></label>
      <p class="muted small">{{ hints[f.provider] }}</p>
      <label v-if="f.provider !== 'workers-ai'">API key<input v-model="f.key" type="password" autocomplete="off" placeholder="Stored only in this browser" /></label>
      <div class="row"><button class="btn primary" @click="save">Save model settings</button><span v-if="saved" class="muted">Saved</span></div>
    </section>
    <section class="surface box">
      <h2>Progress</h2>
      <p class="muted">Learner ID {{ app.uid.slice(0, 8) }}. Progress is stored in this browser and synced to the app database.</p>
      <button class="btn" @click="app.reset()">Reset progress</button>
    </section>
    <section class="surface box">
      <h2>Account</h2>
      <p class="muted">You are signed in with an access token on this browser.</p>
      <button class="btn" @click="signOut">Sign out</button>
    </section>
    <p class="muted small">Options Quest is for education only and is not financial advice.</p>
  </div>
</template>

<style scoped>
.box { margin: 1rem 0; max-width: 560px; }
label { display: grid; gap: .25rem; margin-bottom: .8rem; }
.small { font-size: .85rem; }
</style>
