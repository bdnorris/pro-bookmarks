<script setup>
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useCategoriesStore } from '../stores/categories'
import { useBookmarksStore } from '../stores/bookmarks'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'

const categoriesStore = useCategoriesStore()
const bookmarksStore = useBookmarksStore()
const toast = useToast()
const confirm = useConfirm()

const formVisible = ref(false)
const editingCategory = ref(null) // null = add mode
const formName = ref('')
const formParentId = ref(null)
const saving = ref(false)

const dialogTitle = computed(() =>
  editingCategory.value ? 'Edit Category' : 'Add Category'
)

// For parent select in the dialog (only top-level cats, exclude self)
const parentOptions = computed(() => {
  const opts = [{ id: null, label: '— Top Level —' }]
  for (const cat of categoriesStore.parentCategories) {
    if (editingCategory.value && cat.id === editingCategory.value.id) continue
    opts.push({ id: cat.id, label: cat.name })
  }
  return opts
})

function bookmarkCountFor(id) {
  return bookmarksStore.bookmarks.filter(b => b.category_id === id).length
}

function openAdd(parentId = null) {
  editingCategory.value = null
  formName.value = ''
  formParentId.value = parentId
  formVisible.value = true
}

function openEdit(cat) {
  editingCategory.value = cat
  formName.value = cat.name
  formParentId.value = cat.parent_id ?? null
  formVisible.value = true
}

async function save() {
  if (!formName.value.trim()) return
  saving.value = true
  try {
    if (editingCategory.value) {
      await categoriesStore.updateCategory(editingCategory.value.id, formName.value)
      toast.add({ severity: 'success', summary: 'Category updated', life: 2500 })
    } else {
      await categoriesStore.addCategory(formName.value, formParentId.value)
      toast.add({ severity: 'success', summary: 'Category added', life: 2500 })
    }
    formVisible.value = false
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 })
  } finally {
    saving.value = false
  }
}

function confirmDelete(cat) {
  const isParent = !cat.parent_id
  const childCount = isParent
    ? categoriesStore.categories.filter(c => c.parent_id === cat.id).length
    : 0
  const bmCount = bookmarkCountFor(cat.id)

  let message = `Delete "${cat.name}"?`
  if (isParent && childCount > 0) {
    message += ` This will also delete ${childCount} subcategor${childCount === 1 ? 'y' : 'ies'}.`
  }
  if (bmCount > 0) {
    message += ` ${bmCount} bookmark${bmCount === 1 ? '' : 's'} will become uncategorized.`
  }

  confirm.require({
    message,
    header: 'Delete Category',
    icon: 'pi pi-trash',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await categoriesStore.deleteCategory(cat.id)
        toast.add({ severity: 'success', summary: 'Category deleted', life: 2500 })
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
      <h1 class="page-title">Categories</h1>
      <Button label="Add Category" icon="pi pi-plus" @click="openAdd(null)" />
    </div>

    <div v-if="categoriesStore.loading" class="empty-state">
      <i class="pi pi-spin pi-spinner" />
    </div>

    <div v-else-if="categoriesStore.tree.length === 0" class="empty-state">
      <i class="pi pi-folder" />
      <span>No categories yet.</span>
      <Button label="Create First Category" icon="pi pi-plus" @click="openAdd(null)" />
    </div>

    <div v-else class="category-tree">
      <div
        v-for="parent in categoriesStore.tree"
        :key="parent.id"
        class="category-parent-row"
      >
        <!-- Parent header -->
        <div class="category-parent-header">
          <RouterLink
            :to="{ path: '/bookmarks', query: { category: parent.id } }"
            class="category-parent-name"
            style="text-decoration: none; color: inherit;"
          >
            <i class="pi pi-folder" style="color:var(--p-primary-color); font-size:0.85rem" />
            {{ parent.name }}
            <span class="text-muted">({{ bookmarkCountFor(parent.id) + parent.children.reduce((s, c) => s + bookmarkCountFor(c.id), 0) }})</span>
          </RouterLink>
          <div class="category-actions flex-center">
            <Button
              icon="pi pi-plus"
              text rounded size="small" severity="secondary"
              v-tooltip.top="'Add subcategory'"
              @click="openAdd(parent.id)"
            />
            <Button
              icon="pi pi-pencil"
              text rounded size="small" severity="secondary"
              v-tooltip.top="'Edit'"
              @click="openEdit(parent)"
            />
            <Button
              icon="pi pi-trash"
              text rounded size="small" severity="danger"
              v-tooltip.top="'Delete'"
              @click="confirmDelete(parent)"
            />
          </div>
        </div>

        <!-- Children -->
        <div v-if="parent.children.length" class="category-children">
          <div
            v-for="child in parent.children"
            :key="child.id"
            class="category-child-row"
          >
            <RouterLink
              :to="{ path: '/bookmarks', query: { category: child.id } }"
              class="category-child-name flex-center"
              style="text-decoration: none; color: inherit;"
            >
              <i class="pi pi-folder-open" style="font-size:0.75rem; color:var(--p-text-muted-color)" />
              {{ child.name }}
              <span class="text-muted">({{ bookmarkCountFor(child.id) }})</span>
            </RouterLink>
            <div class="category-actions flex-center">
              <Button
                icon="pi pi-pencil"
                text rounded size="small" severity="secondary"
                v-tooltip.top="'Edit'"
                @click="openEdit(child)"
              />
              <Button
                icon="pi pi-trash"
                text rounded size="small" severity="danger"
                v-tooltip.top="'Delete'"
                @click="confirmDelete(child)"
              />
            </div>
          </div>
        </div>

        <!-- Add subcategory inline hint -->
        <div style="padding: 0.35rem 0.75rem 0.5rem 1.75rem">
          <Button
            :label="parent.children.length ? 'Add subcategory' : 'Add first subcategory'"
            text
            size="small"
            icon="pi pi-plus"
            severity="secondary"
            @click="openAdd(parent.id)"
          />
        </div>
      </div>
    </div>

    <!-- Add / Edit dialog -->
    <Dialog
      v-model:visible="formVisible"
      :header="dialogTitle"
      :style="{ width: '400px' }"
      modal
    >
      <div style="display:flex; flex-direction:column; gap:1rem; padding-top:0.5rem">
        <div>
          <label class="text-muted" style="display:block;margin-bottom:0.3rem">Name *</label>
          <InputText
            v-model="formName"
            placeholder="Category name"
            style="width:100%"
            @keyup.enter="save"
          />
        </div>

        <div>
          <label class="text-muted" style="display:block;margin-bottom:0.3rem">Parent (optional)</label>
          <Select
            v-model="formParentId"
            :options="parentOptions"
            option-label="label"
            option-value="id"
            placeholder="— Top Level —"
            style="width:100%"
          />
          <div class="text-muted" style="margin-top:0.25rem; font-size:0.75rem">
            Only 2 levels allowed. Leave empty for a top-level category.
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" text @click="formVisible = false" />
        <Button
          :label="editingCategory ? 'Save Changes' : 'Add Category'"
          icon="pi pi-check"
          :loading="saving"
          :disabled="!formName.trim()"
          @click="save"
        />
      </template>
    </Dialog>
  </div>
</template>
