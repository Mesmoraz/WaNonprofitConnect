import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import brand from './brand.json' with { type: 'json' }

// The name lives only in brand.json. index.html's %BRAND_NAME% and the web manifest both read it.
const api = 'http://localhost:5253'

export default defineConfig({
  plugins: [
    react(),
    { name: 'brand-html', transformIndexHtml: html => html.replaceAll('%BRAND_NAME%', brand.name).replaceAll('%THEME_COLOR%', brand.themeColor) },
    VitePWA({
      // No offline cache in the alpha: a service worker kept serving old, broken builds (Sep 23). This one
      // removes itself and its caches on every device that has the old one. The manifest still makes it installable.
      selfDestroying: true,
      registerType: 'autoUpdate',
      manifest: {
        name: brand.name, short_name: brand.shortName, description: brand.tagline,
        theme_color: brand.themeColor, background_color: brand.backgroundColor,
        display: 'standalone', start_url: '/', icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
      },
      workbox: { navigateFallbackDenylist: [/^\/api\//, /^\/hubs\//, /^\/health/], maximumFileSizeToCacheInBytes: 6 * 1024 * 1024 },
    }),
  ],
  server: {
    port: 5173,
    proxy: { '/api': api, '/hubs': { target: api, ws: true }, '/health': api },
  },
  build: { outDir: '../src/WaNonprofitConnect.Api/wwwroot', emptyOutDir: true, rolldownOptions: { input: { main: 'index.html', mapDev: 'map-dev.html' } } },
})
