<script setup>
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Button from 'primevue/button'

const emit = defineEmits(['add-bookmark'])

const router = useRouter()
const authStore = useAuthStore()

const userEmail = computed(() => authStore.user?.email ?? '')

async function signOut() {
  await authStore.signOut()
  router.push('/login')
}

const navItems = [
  { to: '/',            icon: 'pi pi-home',        label: 'Dashboard' },
  { to: '/bookmarks',  icon: 'pi pi-bookmark',    label: 'Bookmarks' },
  { to: '/categories', icon: 'pi pi-folder',      label: 'Categories' },
  { to: '/review',     icon: 'pi pi-replay',      label: 'Review Queue' },
]
</script>

<template>
  <aside class="app-sidebar">
    <div class="sidebar-header">
      <RouterLink to="/" class="sidebar-logo">
        <i class="pi pi-bookmark-fill" />
        Pro Bookmarks
      </RouterLink>
    </div>

    <nav class="sidebar-nav">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="nav-item"
      >
        <i :class="item.icon" style="font-size: 0.95rem" />
        {{ item.label }}
      </RouterLink>
    </nav>

    <div style="padding: 0.75rem">
      <Button
        label="Add Bookmark"
        icon="pi pi-plus"
        class="p-button-sm"
        style="width: 100%; margin-bottom: 0.75rem"
        @click="$emit('add-bookmark')"
      />

      <!-- Signed-in user + logout -->
      <div style="border-top: 1px solid var(--p-content-border-color); padding-top: 0.75rem">
        <div
          style="font-size: 0.75rem; color: var(--p-text-muted-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 0.5rem"
          :title="userEmail"
        >
          <i class="pi pi-user" style="margin-right: 0.3rem" />
          {{ userEmail }}
        </div>
        <Button
          label="Sign Out"
          icon="pi pi-sign-out"
          text
          severity="secondary"
          size="small"
          style="width: 100%"
          @click="signOut"
        />
      </div>
    </div>
  </aside>
</template>
