// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
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

  compatibilityDate: '2026-06-30',

  vite: {
    cssMinify: false
  }
})
