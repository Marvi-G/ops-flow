<template>
  <SettingsSettingsLayout>
    <div class="max-w-xl">
      <div class="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-300 dark:bg-neutral-100">
        <h2 class="mb-4 text-[14px] font-semibold text-neutral-900 dark:text-neutral-800">Notification preferences</h2>
        <div class="space-y-4">
          <div v-for="pref in [
            { label: 'Incident created', desc: 'Get notified when a new incident is created' },
            { label: 'Incident assigned', desc: 'Get notified when you are assigned to an incident' },
            { label: 'Status changes', desc: 'Get notified when incident status changes' },
            { label: 'Mentions', desc: 'Get notified when someone mentions you' },
            { label: 'Service alerts', desc: 'Get notified when a service status changes' }
          ]" :key="pref.label" class="flex items-center justify-between">
            <div>
              <p class="text-[13px] font-medium text-neutral-900 dark:text-neutral-800">{{ pref.label }}</p>
              <p class="text-[12px] text-neutral-500">{{ pref.desc }}</p>
            </div>
            <label class="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" checked class="peer sr-only" />
              <div class="h-5 w-9 rounded-full bg-neutral-300 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-500 peer-checked:after:translate-x-full dark:bg-neutral-400" />
            </label>
          </div>
        </div>
        <div class="mt-6 flex justify-end">
          <UButton color="primary" size="sm" label="Save preferences" />
        </div>
      </div>
    </div>
  </SettingsSettingsLayout>
</template>
