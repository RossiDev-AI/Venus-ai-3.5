
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Content-Type": "application/wasm"
    },
  },
  preview: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Venus Neural Cinema Studio',
        short_name: 'Lumina',
        description: 'Next-gen Multi-Agent Image/Video Orchestrator',
        theme_color: '#050505',
        background_color: '#050505',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        file_handlers: [
          {
            action: '/',
            accept: {
              'image/*': ['.png', '.jpg', '.jpeg', '.webp']
            }
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:js|css|wasm)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-assets-cache'
            }
          }
        ]
      }
    })
  ],
  build: {
    target: 'esnext',
    minify: 'terser',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'tldraw-vendor': ['tldraw'],
          'pixi-vendor': ['pixi.js'],
          'wasm-core': ['canvaskit-wasm', '@ffmpeg/ffmpeg'],
          'ai-runtime': ['@huggingface/transformers'],
          'utils-vendor': ['chroma-js', 'pica', 'yjs']
        }
      }
    }
  }
});
