<template>
  <SettingsLayout>
    <div class="max-w-xl">
      <div class="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-300 dark:bg-neutral-100">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-[14px] font-semibold text-neutral-900 dark:text-neutral-800">API Keys</h2>
          <UButton color="primary" size="sm" icon="i-lucide-plus" label="Create key" />
        </div>
        <p class="mb-4 text-[13px] text-neutral-500">API keys allow external services to interact with the OpsFlow API.</p>
        <div class="rounded-md border border-neutral-200 dark:border-neutral-300">
          <div class="divide-y divide-neutral-200 dark:divide-neutral-300">
            <div v-for="key in [
              { name: 'Production', prefix: 'ofk_prod_...a8f2', lastUsed: '2 hours ago' },
              { name: 'Staging', prefix: 'ofk_stg_...b3c1', lastUsed: '1 day ago' },
              { name: 'CI/CD Pipeline', prefix: 'ofk_prod_...d7e4', lastUsed: '3 hours ago' }
            ]" :key="key.name" class="flex items-center justify-between px-4 py-3">
              <div>
                <p class="text-[13px] font-medium text-neutral-900 dark:text-neutral-800">{{ key.name }}</p>
                <p class="text-[12px] font-mono text-neutral-500">{{ key.prefix }}</p>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-[12px] text-neutral-400">Last used {{ key.lastUsed }}</span>
                <button class="text-[12px] text-danger-500 hover:text-danger-600">Revoke</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </SettingsLayout>
</template>
