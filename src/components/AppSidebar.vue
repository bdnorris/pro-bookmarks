<script setup>
import { RouterLink, useRouter } from 'vue-router'
import Button from 'primevue/button'

const emit = defineEmits(['add-bookmark'])
const router = useRouter()

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

    <div style="padding: 0.75rem 0.75rem 1rem">
      <Button
        label="Add Bookmark"
        icon="pi pi-plus"
        class="p-button-sm"
        style="width: 100%"
        @click="$emit('add-bookmark')"
      />
    </div>
  </aside>
</template>
