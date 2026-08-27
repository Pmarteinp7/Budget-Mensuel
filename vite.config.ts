import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// GitHub Pages serves this project from /Budget-Mensuel/, not the domain
// root — only prefix asset paths for that build, so local dev/preview keep
// working at "/". Set by the GitHub Actions Pages workflow.
const base = process.env.GH_PAGES ? '/Budget-Mensuel/' : '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
})
