<template>
  <SettingsLayout>
    <div class="max-w-xl">
      <div class="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-300 dark:bg-neutral-100">
        <h2 class="mb-4 text-[14px] font-semibold text-neutral-900 dark:text-neutral-800">Roles & Permissions</h2>
        <div class="space-y-4">
          <div v-for="role in ['Owner', 'Admin', 'Member', 'Viewer']" :key="role" class="rounded-md border border-neutral-200 p-4 dark:border-neutral-300">
            <div class="flex items-center justify-between">
              <h3 class="text-[13px] font-medium text-neutral-900 dark:text-neutral-800">{{ role }}</h3>
              <UButton color="neutral" variant="ghost" size="xs" label="Edit" icon="i-lucide-pencil" />
            </div>
            <p class="mt-1 text-[12px] text-neutral-500">
              {{ role === 'Owner' ? 'Full access to all organization settings and billing.' :
                 role === 'Admin' ? 'Can manage teams, projects, and incidents.' :
                 role === 'Member' ? 'Can create and manage incidents and services.' :
                 'Read-only access to organization data.' }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </SettingsLayout>
</template>
