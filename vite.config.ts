import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// VITE_BASE lets the same code deploy at the root (Netlify, Render) or under a repo path (GitHub Pages: /<repo>/).
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), tailwindcss()],
  server: { proxy: { '/api': `http://localhost:${process.env.PORT ?? 8787}` } },
})
