import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/portfolio/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        blog: resolve(__dirname, 'blog.html'),
        blogPost: resolve(__dirname, 'blog-posts/index.html'),
      }
    }
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: ['faris-hp-notebook', 'localhost', '127.0.0.1']
  }
})
