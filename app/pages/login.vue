<script setup lang="ts">
definePageMeta({ layout: false })

const email = ref('mark@northstarlabs.io')
const password = ref('password')
const loading = ref(false)
const error = ref('')

const router = useRouter()

async function handleLogin() {
  if (!email.value || !password.value) {
    error.value = 'Please fill in all fields'
    return
  }
  loading.value = true
  error.value = ''
  await new Promise(r => setTimeout(r, 800))
  loading.value = false
  router.push('/dashboard')
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-50">
    <div class="w-full max-w-sm">
      <!-- Logo -->
      <div class="mb-8 text-center">
        <div class="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500">
          <UIcon name="i-lucide-zap" class="h-5 w-5 text-white" />
        </div>
        <h1 class="text-lg font-semibold text-neutral-900 dark:text-neutral-800">OpsFlow</h1>
        <p class="mt-1 text-[13px] text-neutral-500">Sign in to your account</p>
      </div>

      <!-- Form -->
      <form class="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-300 dark:bg-neutral-100" @submit.prevent="handleLogin">
        <div v-if="error" class="mb-4 rounded-md bg-danger-50 p-3 text-[13px] text-danger-500 dark:bg-danger-50/20">
          {{ error }}
        </div>

        <div class="space-y-4">
          <div>
            <label for="email" class="mb-1.5 block text-[13px] font-medium text-neutral-700 dark:text-neutral-600">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="you@company.com"
              class="h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-neutral-300 dark:text-neutral-800"
            />
          </div>
          <div>
            <label for="password" class="mb-1.5 block text-[13px] font-medium text-neutral-700 dark:text-neutral-600">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="Enter your password"
              class="h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-neutral-300 dark:text-neutral-800"
            />
          </div>
        </div>

        <div class="mt-6">
          <UButton
            type="submit"
            color="primary"
            block
            size="md"
            label="Sign in"
            :loading="loading"
          />
        </div>
      </form>

      <p class="mt-4 text-center text-[12px] text-neutral-400">
        Demo: use any email and password to sign in
      </p>
    </div>
  </div>
</template>
