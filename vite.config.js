import { defineConfig } from 'vite'

export default defineConfig({
  base: '/portfolio/',
  server: {
    host: '0.0.0.0',
    allowedHosts: ['faris-hp-notebook', 'localhost', '127.0.0.1']
  }
})
