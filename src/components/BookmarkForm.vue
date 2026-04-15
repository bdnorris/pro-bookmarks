<script setup>
import { ref, watch, computed } from 'vue'
import { useCategoriesStore } from '../stores/categories'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import InputChips from 'primevue/inputchips'
import Dialog from 'primevue/dialog'

const props = defineProps({
  visible: Boolean,
  bookmark: { type: Object, default: null }, // null = add mode
})

const emit = defineEmits(['update:visible', 'saved'])

const categoriesStore = useCategoriesStore()

// Form fields
const form = ref({
  url: '',
  title: '',
  description: '',
  category_id: null,
  tagNames: [],
})

const saving = ref(false)

// Flat list of categories for the Select component
const categoryOptions = computed(() => {
  const opts = [{ id: null, label: '— None —' }]
  for (const parent of categoriesStore.tree) {
    opts.push({ id: parent.id, label: parent.name })
    for (const child of parent.children) {
      opts.push({ id: child.id, label: `  › ${child.name}` })
    }
  }
  return opts
})

// Reset form when dialog opens/bookmark changes
watch(
  () => [props.visible, props.bookmark],
  ([visible]) => {
    if (!visible) return
    if (props.bookmark) {
      form.value = {
        url: props.bookmark.url,
        title: props.bookmark.title,
        description: props.bookmark.description ?? '',
        category_id: props.bookmark.category_id ?? null,
        tagNames: props.bookmark.tags?.map(t => t.name) ?? [],
      }
    } else {
      form.value = { url: '', title: '', description: '', category_id: null, tagNames: [] }
    }
  }
)

async function tryFetchTitle() {
  if (!form.value.url || form.value.title) return
  try {
    const url = new URL(form.value.url)
    form.value.title = url.hostname.replace(/^www\./, '')
  } catch {
    // ignore invalid url
  }
}

async function save() {
  if (!form.value.url || !form.value.title) return
  saving.value = true
  try {
    emit('saved', { ...form.value })
    emit('update:visible', false)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    :header="bookmark ? 'Edit Bookmark' : 'Add Bookmark'"
    :style="{ width: '520px' }"
    :modal="true"
    :closable="true"
  >
    <div style="display: flex; flex-direction: column; gap: 1rem; padding-top: 0.5rem">
      <!-- URL -->
      <div>
        <label class="text-muted" style="display:block;margin-bottom:0.3rem">URL *</label>
        <InputText
          v-model="form.url"
          placeholder="https://..."
          style="width: 100%"
          @blur="tryFetchTitle"
        />
      </div>

      <!-- Title -->
      <div>
        <label class="text-muted" style="display:block;margin-bottom:0.3rem">Title *</label>
        <InputText
          v-model="form.title"
          placeholder="Bookmark title"
          style="width: 100%"
        />
      </div>

      <!-- Description -->
      <div>
        <label class="text-muted" style="display:block;margin-bottom:0.3rem">Description</label>
        <Textarea
          v-model="form.description"
          placeholder="Optional notes..."
          rows="3"
          style="width: 100%; resize: vertical"
        />
      </div>

      <!-- Category -->
      <div>
        <label class="text-muted" style="display:block;margin-bottom:0.3rem">Category</label>
        <Select
          v-model="form.category_id"
          :options="categoryOptions"
          option-label="label"
          option-value="id"
          placeholder="Select category"
          style="width: 100%"
        />
      </div>

      <!-- Tags -->
      <div>
        <label class="text-muted" style="display:block;margin-bottom:0.3rem">Tags</label>
        <InputChips
          v-model="form.tagNames"
          placeholder="Type a tag, press Enter"
          style="width: 100%"
          :add-on-blur="true"
        />
        <div class="text-muted" style="margin-top: 0.25rem; font-size: 0.75rem">
          Type a tag and press Enter. New tags are created automatically.
        </div>
      </div>
    </div>

    <template #footer>
      <Button
        label="Cancel"
        text
        @click="$emit('update:visible', false)"
      />
      <Button
        :label="bookmark ? 'Save Changes' : 'Add Bookmark'"
        icon="pi pi-check"
        :loading="saving"
        :disabled="!form.url || !form.title"
        @click="save"
      />
    </template>
  </Dialog>
</template>
