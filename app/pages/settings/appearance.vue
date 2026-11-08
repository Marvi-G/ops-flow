<script setup lang="ts">
import { useColorMode } from '#imports'

definePageMeta({ layout: 'default' })

const colorMode = useColorMode()
</script>

<template>
  <SettingsLayout>
    <div class="max-w-xl">
      <div class="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-300 dark:bg-neutral-100">
        <h2 class="mb-4 text-[14px] font-semibold text-neutral-900 dark:text-neutral-800">Appearance</h2>
        <div class="space-y-4">
          <div>
            <label class="mb-2 block text-[13px] font-medium text-neutral-700 dark:text-neutral-600">Theme</label>
            <div class="flex gap-3">
              <button
                :class="[
                  'flex flex-1 items-center justify-center gap-2 rounded-md border px-4 py-3 text-[13px] font-medium transition-colors',
                  colorMode.preference === 'light'
                    ? 'border-primary-500 bg-primary-50 text-primary-600 dark:border-primary-400 dark:bg-primary-50 dark:text-primary-400'
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-300 dark:text-neutral-500 dark:hover:bg-neutral-200'
                ]"
                @click="colorMode.preference = 'light'"
              >
                <UIcon name="i-lucide-sun" class="h-4 w-4" />
                Light
              </button>
              <button
                :class="[
                  'flex flex-1 items-center justify-center gap-2 rounded-md border px-4 py-3 text-[13px] font-medium transition-colors',
                  colorMode.preference === 'dark'
                    ? 'border-primary-500 bg-primary-50 text-primary-600 dark:border-primary-400 dark:bg-primary-50 dark:text-primary-400'
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-300 dark:text-neutral-500 dark:hover:bg-neutral-200'
                ]"
                @click="colorMode.preference = 'dark'"
              >
                <UIcon name="i-lucide-moon" class="h-4 w-4" />
                Dark
              </button>
              <button
                :class="[
                  'flex flex-1 items-center justify-center gap-2 rounded-md border px-4 py-3 text-[13px] font-medium transition-colors',
                  colorMode.preference === 'system'
                    ? 'border-primary-500 bg-primary-50 text-primary-600 dark:border-primary-400 dark:bg-primary-50 dark:text-primary-400'
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-300 dark:text-neutral-500 dark:hover:bg-neutral-200'
                ]"
                @click="colorMode.preference = 'system'"
              >
                <UIcon name="i-lucide-monitor" class="h-4 w-4" />
                System
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </SettingsLayout>
</template>
