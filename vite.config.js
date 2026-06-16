import { defineConfig, loadEnv } from 'vite'
import { resolve } from 'path'

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return defineConfig({
    base: env.VITE_BASE_PATH,
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
      allowedHosts: ['farisbaros.is-a.dev', 'faris-hp-notebook', 'localhost', '127.0.0.1']
    }
  });
};
