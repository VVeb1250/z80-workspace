import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base "./" so the built site works from a GitHub Pages project subpath.
// dosboxDirect runs on the main thread via asyncify, so no SharedArrayBuffer
// / cross-origin isolation headers are needed (GitHub Pages can't set them).
export default defineConfig({
  base: './',
  plugins: [react()],
})
