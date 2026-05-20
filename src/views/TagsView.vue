<script setup>
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useTagsStore } from '../stores/tags'
import { useBookmarksStore } from '../stores/bookmarks'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dialog from 'primevue/dialog'

const tagsStore = useTagsStore()
const bookmarksStore = useBookmarksStore()
const toast = useToast()
const confirm = useConfirm()

const formVisible = ref(false)
const editingTag = ref(null)
const formName = ref('')
const saving = ref(false)

const sortedTags = computed(() => {
  return tagsStore.tags
    .map(tag => ({
      ...tag,
      count: bookmarksStore.bookmarks.filter(b => b.tags?.some(t => t.id === tag.id)).length,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
})

function openEdit(tag) {
  editingTag.value = tag
  formName.value = tag.name
  formVisible.value = true
}

async function save() {
  if (!formName.value.trim()) return
  saving.value = true
  try {
    const id = editingTag.value.id
    await tagsStore.renameTag(id, formName.value)
    const normalized = formName.value.trim().toLowerCase()
    bookmarksStore.bookmarks.forEach(b => {
      const t = b.tags?.find(t => t.id === id)
      if (t) t.name = normalized
    })
    toast.add({ severity: 'success', summary: 'Tag renamed', life: 2500 })
    formVisible.value = false
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 })
  } finally {
    saving.value = false
  }
}

function confirmDelete(tag) {
  const countMsg = tag.count === 1
    ? 'It is used by 1 bookmark.'
    : tag.count > 1
      ? `It is used by ${tag.count} bookmarks.`
      : ''

  confirm.require({
    message: `Delete "${tag.name}"? ${countMsg}`.trim(),
    header: 'Delete Tag',
    icon: 'pi pi-trash',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await tagsStore.deleteTag(tag.id)
        bookmarksStore.bookmarks.forEach(b => {
          if (b.tags) b.tags = b.tags.filter(t => t.id !== tag.id)
        })
        toast.add({ severity: 'success', summary: 'Tag deleted', life: 2500 })
      } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 })
      }
    },
  })
}
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Tags</h1>
    </div>

    <div v-if="tagsStore.loading" class="empty-state">
      <i class="pi pi-spin pi-spinner" />
    </div>

    <div v-else-if="sortedTags.length === 0" class="empty-state">
      <i class="pi pi-tag" />
      <span>No tags yet. Add tags to your bookmarks to see them here.</span>
    </div>

    <div v-else class="category-tree">
      <div
        v-for="tag in sortedTags"
        :key="tag.id"
        class="category-parent-row"
      >
        <div class="category-parent-header">
          <RouterLink
            :to="{ path: '/bookmarks', query: { tag: tag.id } }"
            class="category-parent-name"
            style="text-decoration: none; color: inherit;"
          >
            <i class="pi pi-tag" style="color: var(--p-primary-color); font-size: 0.85rem" />
            {{ tag.name }}
            <span class="text-muted">({{ tag.count }})</span>
          </RouterLink>
          <div class="category-actions flex-center">
            <Button
              icon="pi pi-pencil"
              text rounded size="small" severity="secondary"
              v-tooltip.top="'Rename'"
              @click="openEdit(tag)"
            />
            <Button
              icon="pi pi-trash"
              text rounded size="small" severity="danger"
              v-tooltip.top="'Delete'"
              @click="confirmDelete(tag)"
            />
          </div>
        </div>
      </div>
    </div>

    <Dialog
      v-model:visible="formVisible"
      header="Rename Tag"
      :style="{ width: '360px' }"
      modal
    >
      <div style="padding-top: 0.5rem">
        <label class="text-muted" style="display: block; margin-bottom: 0.3rem">Name *</label>
        <InputText
          v-model="formName"
          placeholder="Tag name"
          style="width: 100%"
          @keyup.enter="save"
        />
      </div>

      <template #footer>
        <Button label="Cancel" text @click="formVisible = false" />
        <Button
          label="Save Changes"
          icon="pi pi-check"
          :loading="saving"
          :disabled="!formName.trim()"
          @click="save"
        />
      </template>
    </Dialog>
  </div>
</template>
