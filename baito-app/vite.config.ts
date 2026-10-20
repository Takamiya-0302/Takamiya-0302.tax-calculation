import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { viteSingleFile } from 'vite-plugin-singlefile'

// 通常: `npm run build` → dist/ を GitHub Pages などに置くとPWAとして動く
// プレビュー: `npm run build:single` → 1ファイルのHTML（すぐ試す用。オフライン機能なし）
export default defineConfig(({ mode }) => {
  if (mode === 'single') {
    return { base: './', plugins: [react(), viteSingleFile()], build: { outDir: 'dist-single' } }
  }
  return {
    base: './',
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['apple-touch-icon.png'],
        manifest: {
          name: 'バイト給与・年収の壁',
          short_name: 'バイト給与',
          description: 'シフトを入れるだけで、バイト代の手取りと年収の壁がわかる',
          lang: 'ja',
          start_url: './',
          scope: './',
          display: 'standalone',
          background_color: '#f3f5f1',
          theme_color: '#f3f5f1',
          icons: [
            { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,png,svg}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
              handler: 'CacheFirst',
              options: { cacheName: 'google-fonts', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 } },
            },
          ],
        },
      }),
    ],
  }
})
