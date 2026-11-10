/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Django dev server that /api calls are forwarded to during `npm run dev`; used by the proxy below.
const DJANGO_DEV_SERVER_URL = 'http://localhost:8000'

// Largest JS file size in kB before the build warns. The map file (MapLibre, about 1.1 MB) already loads on its own
// and can't be split further; the main file (about 670 kB, under 220 kB zipped) stays under it too.
const CHUNK_SIZE_WARNING_LIMIT_KB = 1200

// Timezone tests run in, so local-time results are the same on every machine; used by the test settings below.
const TEST_TIMEZONE = 'America/Chicago'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // "@/..." imports point at src/; must match "paths" in tsconfig.json and tsconfig.app.json.
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    chunkSizeWarningLimit: CHUNK_SIZE_WARNING_LIMIT_KB,
  },
  server: {
    proxy: {
      '/api': DJANGO_DEV_SERVER_URL,
    },
  },
  // Vitest settings (`npm test`).
  test: {
    env: { TZ: TEST_TIMEZONE },
  },
})
