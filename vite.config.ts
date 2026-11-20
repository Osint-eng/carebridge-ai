import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import ttsHandler from './api/tts'

function apiDevMiddleware(): Plugin {
  return {
    name: 'api-tts-dev-middleware',
    configureServer(server) {
      server.middlewares.use('/api/tts', (req, res, next) => {
        if (!req.url || req.url === '/') {
          const chunks: Buffer[] = []
          req.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
          req.on('end', async () => {
            const rawBody = Buffer.concat(chunks).toString('utf8')
            const adaptedReq = Object.assign(req, { body: rawBody })
            const adaptedRes = {
              statusCode: 200,
              setHeader: (name: string, value: string) => res.setHeader(name, value),
              status: (code: number) => {
                res.statusCode = code
                return adaptedRes
              },
              json: (payload: unknown) => {
                if (!res.headersSent) {
                  res.setHeader('Content-Type', 'application/json')
                }
                res.end(JSON.stringify(payload))
              },
              send: (payload: Buffer | string) => {
                res.end(payload)
              },
            }
            try {
              await ttsHandler(adaptedReq, adaptedRes)
            } catch (err: any) {
              if (!res.headersSent) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
              }
              res.end(JSON.stringify({ error: err?.message || 'Local TTS handler error' }))
            }
          })
          return
        }
        next()
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), apiDevMiddleware()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    open: false,
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['framer-motion', 'lucide-react'],
        },
      },
    },
  },
})
