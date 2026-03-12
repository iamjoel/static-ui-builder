import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { handleGenerateMarkdownDevRequest } from './server/generate-markdown'

function registerGenerateMarkdownMiddleware(middlewares: { use: (path: string, handler: (req: any, res: any, next: () => void) => void) => void }) {
  middlewares.use('/api/generate-markdown', (req, res, next) => {
    if (!req.url?.startsWith('/api/generate-markdown') && req.url !== '/' && req.url !== '') {
      next()
      return
    }

    void handleGenerateMarkdownDevRequest(req, res)
  })
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  for (const [key, value] of Object.entries(env)) {
    if (!(key in process.env))
      process.env[key] = value
  }

  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'generate-markdown-dev-api',
        configureServer(server) {
          registerGenerateMarkdownMiddleware(server.middlewares)
        },
        configurePreviewServer(server) {
          registerGenerateMarkdownMiddleware(server.middlewares)
        },
      },
    ],
  }
})
