<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppSidebar from './components/AppSidebar.vue'
import BookmarkForm from './components/BookmarkForm.vue'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import { useBookmarksStore } from './stores/bookmarks'
import { useCategoriesStore } from './stores/categories'
import { useTagsStore } from './stores/tags'
import { useToast } from 'primevue/usetoast'

const bookmarksStore = useBookmarksStore()
const categoriesStore = useCategoriesStore()
const tagsStore = useTagsStore()
const toast = useToast()

// Global bookmark form (triggered from sidebar "Add Bookmark" or HomeView)
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

// Load all data on mount
onMounted(async () => {
  try {
    await Promise.all([
      categoriesStore.fetchCategories(),
      tagsStore.fetchTags(),
      bookmarksStore.fetchBookmarks(),
    ])
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Failed to load data', detail: e.message, life: 6000 })
  }
})
</script>

<template>
  <div class="app-layout">
    <AppSidebar @add-bookmark="openAdd(null)" />

    <main class="app-main">
      <RouterView :on-add-bookmark="openAdd" />
    </main>
  </div>

  <!-- Global add/edit dialog (used by sidebar button and HomeView) -->
  <BookmarkForm
    v-model:visible="formVisible"
    :bookmark="editingBookmark"
    @saved="onSaved"
  />

  <Toast position="bottom-right" />
  <ConfirmDialog />
</template>
