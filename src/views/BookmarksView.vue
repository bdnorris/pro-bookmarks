<script setup>
import { ref, computed } from 'vue'
import { useBookmarksStore } from '../stores/bookmarks'
import { useCategoriesStore } from '../stores/categories'
import { useTagsStore } from '../stores/tags'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import BookmarkCard from '../components/BookmarkCard.vue'
import BookmarkForm from '../components/BookmarkForm.vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import MultiSelect from 'primevue/multiselect'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'

const props = defineProps({
  openFormWith: { type: Object, default: null }, // pre-populated bookmark (edit mode trigger from parent)
})

const bookmarksStore = useBookmarksStore()
const categoriesStore = useCategoriesStore()
const tagsStore = useTagsStore()
const toast = useToast()
const confirm = useConfirm()

// Form state
const formVisible = ref(false)
const editingBookmark = ref(null)

// Filters
const searchQuery = ref('')
const selectedCategoryId = ref(null)
const selectedTagIds = ref([])

// Category options for Select
const categoryOptions = computed(() => {
  const opts = [{ id: null, label: 'All Categories' }]
  for (const parent of categoriesStore.tree) {
    opts.push({ id: parent.id, label: parent.name })
    for (const child of parent.children) {
      opts.push({ id: child.id, label: `  › ${child.name}` })
    }
  }
  return opts
})

// Filtered bookmarks
const filtered = computed(() => {
  let list = bookmarksStore.bookmarks
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter(b =>
      b.title.toLowerCase().includes(q) ||
      b.url.toLowerCase().includes(q) ||
      b.description?.toLowerCase().includes(q)
    )
  }
  if (selectedCategoryId.value !== null) {
    // Include category and its children
    const children = categoriesStore.categories
      .filter(c => c.parent_id === selectedCategoryId.value)
      .map(c => c.id)
    const ids = [selectedCategoryId.value, ...children]
    list = list.filter(b => ids.includes(b.category_id))
  }
  if (selectedTagIds.value.length > 0) {
    list = list.filter(b =>
      selectedTagIds.value.every(tid => b.tags?.some(t => t.id === tid))
    )
  }
  return list
})

function openAdd() {
  editingBookmark.value = null
  formVisible.value = true
}

function openEdit(bookmark) {
  editingBookmark.value = bookmark
  formVisible.value = true
}

function clearFilters() {
  searchQuery.value = ''
  selectedCategoryId.value = null
  selectedTagIds.value = []
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

async function confirmDelete(bookmark) {
  confirm.require({
    message: `Delete "${bookmark.title}"? This cannot be undone.`,
    header: 'Delete Bookmark',
    icon: 'pi pi-trash',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await bookmarksStore.deleteBookmark(bookmark.id)
        toast.add({ severity: 'success', summary: 'Bookmark deleted', life: 2500 })
      } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 })
      }
    },
  })
}

// Expose openEdit so App.vue can trigger it from sidebar
defineExpose({ openEdit, openAdd })
</script>

<template>
  <div>
    <!-- Header -->
    <div class="page-header">
      <h1 class="page-title">Bookmarks</h1>
      <Button label="Add Bookmark" icon="pi pi-plus" @click="openAdd" />
    </div>

    <!-- Filters -->
    <div style="display:flex; gap:0.75rem; flex-wrap:wrap; margin-bottom:1.25rem">
      <IconField style="flex:1; min-width:200px">
        <InputIcon class="pi pi-search" />
        <InputText
          v-model="searchQuery"
          placeholder="Search bookmarks…"
          style="width: 100%"
        />
      </IconField>

      <Select
        v-model="selectedCategoryId"
        :options="categoryOptions"
        option-label="label"
        option-value="id"
        placeholder="All Categories"
        style="min-width: 180px"
      />

      <MultiSelect
        v-model="selectedTagIds"
        :options="tagsStore.tags"
        option-label="name"
        option-value="id"
        placeholder="Filter by tags"
        style="min-width: 180px"
        display="chip"
      />

      <Button
        v-if="searchQuery || selectedCategoryId !== null || selectedTagIds.length"
        icon="pi pi-times"
        text
        severity="secondary"
        label="Clear"
        @click="clearFilters"
      />
    </div>

    <!-- Count -->
    <div class="text-muted" style="margin-bottom: 0.75rem">
      {{ filtered.length }} bookmark{{ filtered.length === 1 ? '' : 's' }}
    </div>

    <!-- Loading -->
    <div v-if="bookmarksStore.loading" class="empty-state">
      <i class="pi pi-spin pi-spinner" />
      <span>Loading…</span>
    </div>

    <!-- Empty -->
    <div v-else-if="filtered.length === 0" class="empty-state">
      <i class="pi pi-bookmark" />
      <span v-if="bookmarksStore.bookmarks.length === 0">No bookmarks yet. Add your first one!</span>
      <span v-else>No bookmarks match the current filters.</span>
    </div>

    <!-- Grid -->
    <div v-else class="bookmark-grid">
      <BookmarkCard
        v-for="bm in filtered"
        :key="bm.id"
        :bookmark="bm"
        @edit="openEdit"
        @delete="confirmDelete"
      />
    </div>

    <!-- Add / Edit dialog -->
    <BookmarkForm
      v-model:visible="formVisible"
      :bookmark="editingBookmark"
      @saved="onSaved"
    />
  </div>
</template>
