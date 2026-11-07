// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@pinia/nuxt'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'OpsFlow',
      htmlAttrs: { lang: 'en' }
    }
  },

  routeRules: {
    '/': { redirect: '/dashboard' }
  },

  runtimeConfig: {
    // Used for server-side rendering, which calls the API directly (no proxy).
    // Override with NUXT_API_INTERNAL_BASE.
    apiInternalBase: 'http://localhost:4000',
    public: {
      apiBase: ''
    }
  },

  nitro: {
    devProxy: {
      '/api': {
        target: 'http://localhost:4000/api',
        changeOrigin: true
      }
    }
  },

  compatibilityDate: '2026-06-30',

  vite: {
    cssMinify: false
  }
})
