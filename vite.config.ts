import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages: repo `citador` → https://<user>.github.io/citador/
  base: '/citador/',
})
