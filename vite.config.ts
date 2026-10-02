// Works with both `vite` and Vite+ (`vp dev` / `vp build`), which reads the same config.
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { cloudflare } from '@cloudflare/vite-plugin'

export default defineConfig({
  plugins: [vue(), cloudflare()],
  resolve: { alias: { '@': '/src', '@shared': '/shared', '@content': '/content' } },
})
