<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from './components/AppSidebar.vue'
import BookmarkForm from './components/BookmarkForm.vue'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import { useBookmarksStore } from './stores/bookmarks'
import { useCategoriesStore } from './stores/categories'
import { useTagsStore } from './stores/tags'
import { useAuthStore } from './stores/auth'
import { useToast } from 'primevue/usetoast'

const route = useRoute()
const bookmarksStore = useBookmarksStore()
const categoriesStore = useCategoriesStore()
const tagsStore = useTagsStore()
const authStore = useAuthStore()
const toast = useToast()

// Don't show the app shell on the login page
const isPublicRoute = computed(() => route.meta?.public === true)

// Global bookmark form (triggered from sidebar or HomeView)
const formVisible = ref(false)
const editingBookmark = ref(null)

function openAdd(bookmark = null) {
  editingBookmark.value = bookmark
  formVisible.value = true
}

async function onSaved(formData) {
  try {
    if (editingBookmark.value) {
      await bookmarksStore.updateBookmark(editingBookmark.value.id, formData)
      toast.add({ severity: 'success', summary: 'Bookmark updated', life: 3000 })
    } else {
      await bookmarksStore.addBookmark(formData)
      toast.add({ severity: 'success', summary: 'Bookmark added', life: 3000 })
    }
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 })
  }
}

onMounted(async () => {
  await authStore.initialize()

  // Only load data if authenticated
  if (authStore.user) {
    try {
      await Promise.all([
        categoriesStore.fetchCategories(),
        tagsStore.fetchTags(),
        bookmarksStore.fetchBookmarks(),
      ])
    } catch (e) {
      toast.add({ severity: 'error', summary: 'Failed to load data', detail: e.message, life: 6000 })
    }
  }
})
</script>

<template>
  <!-- Public pages (login) render without the app shell -->
  <RouterView v-if="isPublicRoute" />

  <!-- Authenticated app shell -->
  <div v-else class="app-layout">
    <AppSidebar @add-bookmark="openAdd(null)" />
    <main class="app-main">
      <RouterView :on-add-bookmark="openAdd" />
    </main>
  </div>

  <BookmarkForm
    v-if="!isPublicRoute"
    v-model:visible="formVisible"
    :bookmark="editingBookmark"
    @saved="onSaved"
  />

  <Toast position="bottom-right" />
  <ConfirmDialog />
</template>
