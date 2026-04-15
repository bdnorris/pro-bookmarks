<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Message from 'primevue/message'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)

async function submit() {
  errorMsg.value = ''
  if (!email.value || !password.value) {
    errorMsg.value = 'Email and password are required.'
    return
  }
  loading.value = true
  try {
    await authStore.signIn(email.value, password.value)
    router.push('/')
  } catch (e) {
    errorMsg.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div style="min-height:100vh; display:flex; align-items:center; justify-content:center; background:var(--p-surface-ground)">
    <div style="width:100%; max-width:380px; padding:1rem">
      <!-- Logo -->
      <div style="text-align:center; margin-bottom:2rem">
        <i class="pi pi-bookmark-fill" style="font-size:2.5rem; color:var(--p-primary-color)" />
        <h1 style="margin:0.5rem 0 0.25rem; font-size:1.4rem; font-weight:700">Pro Bookmarks</h1>
        <p style="margin:0; color:var(--p-text-muted-color); font-size:0.875rem">Sign in to continue</p>
      </div>

      <!-- Card -->
      <div style="border:1px solid var(--p-content-border-color); border-radius:10px; background:var(--p-surface-card); padding:1.75rem">
        <div style="display:flex; flex-direction:column; gap:1.1rem">
          <div>
            <label style="display:block; font-size:0.83rem; color:var(--p-text-muted-color); margin-bottom:0.35rem">
              Email
            </label>
            <InputText
              v-model="email"
              type="email"
              placeholder="you@example.com"
              style="width:100%"
              autocomplete="email"
              @keyup.enter="submit"
            />
          </div>

          <div>
            <label style="display:block; font-size:0.83rem; color:var(--p-text-muted-color); margin-bottom:0.35rem">
              Password
            </label>
            <Password
              v-model="password"
              placeholder="••••••••"
              :feedback="false"
              toggle-mask
              style="width:100%"
              input-style="width:100%"
              autocomplete="current-password"
              @keyup.enter="submit"
            />
          </div>

          <Message v-if="errorMsg" severity="error" :closable="false" style="margin:0">
            {{ errorMsg }}
          </Message>

          <Button
            label="Sign In"
            icon="pi pi-sign-in"
            :loading="loading"
            style="width:100%; margin-top:0.25rem"
            @click="submit"
          />
        </div>
      </div>
    </div>
  </div>
</template>
