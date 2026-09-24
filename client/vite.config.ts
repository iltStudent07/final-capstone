import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const landingPagePlugin = {
  name: 'landing-page-root',
  configureServer(server: { middlewares: { use: (handler: (req: { url?: string }, res: unknown, next: () => void) => void) => void } }) {
    server.middlewares.use((req, _res, next) => {
      if (req.url === '/') {
        req.url = '/landing.html'
      } else if (req.url?.startsWith('/app')) {
        req.url = '/index.html'
      }

      next()
    })
  },
}

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/app/' : '/',
  plugins: [react(), landingPagePlugin],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
}))
