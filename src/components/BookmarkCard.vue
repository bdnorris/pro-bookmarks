<script setup>
import { computed } from 'vue'
import { useCategoriesStore } from '../stores/categories'
import Button from 'primevue/button'
import Tag from 'primevue/tag'

const props = defineProps({
  bookmark: { type: Object, required: true },
})

const emit = defineEmits(['edit', 'delete'])

const categoriesStore = useCategoriesStore()

const category = computed(() => props.bookmark.category ?? null)

const parentCategory = computed(() => {
  if (!category.value?.parent_id) return null
  return categoriesStore.getById(category.value.parent_id)
})

const reviewedLabel = computed(() => {
  const d = props.bookmark.last_reviewed_at
  if (!d) return 'Never reviewed'
  const diff = Date.now() - new Date(d).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'Reviewed today'
  if (days === 1) return 'Reviewed yesterday'
  if (days < 30) return `Reviewed ${days}d ago`
  const months = Math.floor(days / 30)
  return `Reviewed ${months}mo ago`
})

function openUrl() {
  window.open(props.bookmark.url, '_blank', 'noopener,noreferrer')
}

function displayHost(url) {
  try { return new URL(url).hostname.replace(/^www\./, '') }
  catch { return url }
}
</script>

<template>
  <div class="bookmark-card p-card p-component" style="padding: 1rem; border-radius: 8px; border: 1px solid var(--p-content-border-color); background: var(--p-surface-card);">
    <!-- OG image banner -->
    <div
      v-if="bookmark.og_image"
      style="margin: -1rem -1rem 0.75rem; border-radius: 7px 7px 0 0; overflow: hidden;"
    >
      <img
        :src="bookmark.og_image"
        :alt="bookmark.title"
        style="width: 100%; height: 140px; object-fit: cover; display: block;"
        @error="$event.target.style.display = 'none'"
      />
    </div>

    <!-- Title row -->
    <div class="flex-center" style="margin-bottom: 0.25rem">
      <button
        class="bookmark-card-title"
        style="background:none;border:none;padding:0;cursor:pointer;text-align:left;color:var(--p-text-color)"
        @click="openUrl"
      >
        {{ bookmark.title }}
      </button>
    </div>

    <!-- URL -->
    <div class="bookmark-card-url">
      <i class="pi pi-link" style="font-size:0.7rem;margin-right:0.2rem" />
      {{ displayHost(bookmark.url) }}
    </div>

    <!-- Description -->
    <div v-if="bookmark.description" class="bookmark-card-desc" style="margin-top: 0.35rem">
      {{ bookmark.description }}
    </div>

    <!-- Category breadcrumb -->
    <div v-if="category" class="category-crumb" style="margin-top: 0.5rem">
      <i class="pi pi-folder" style="font-size:0.7rem" />
      <span v-if="parentCategory">{{ parentCategory.name }} › </span>
      {{ category.name }}
    </div>

    <!-- Tags -->
    <div v-if="bookmark.tags?.length" class="tag-list" style="margin-top: 0.4rem">
      <Tag
        v-for="tag in bookmark.tags"
        :key="tag.id"
        :value="tag.name"
        severity="secondary"
        style="font-size: 0.7rem; padding: 0.15rem 0.5rem"
      />
    </div>

    <!-- Meta + Actions -->
    <div class="bookmark-card-meta" style="margin-top: 0.6rem; padding-top: 0.5rem; border-top: 1px solid var(--p-content-border-color)">
      <span>{{ reviewedLabel }}</span>
      <div class="flex-center">
        <Button
          icon="pi pi-pencil"
          text
          rounded
          size="small"
          severity="secondary"
          @click="$emit('edit', bookmark)"
          v-tooltip.top="'Edit'"
        />
        <Button
          icon="pi pi-trash"
          text
          rounded
          size="small"
          severity="danger"
          @click="$emit('delete', bookmark)"
          v-tooltip.top="'Delete'"
        />
      </div>
    </div>
  </div>
</template>
