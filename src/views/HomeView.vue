<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBookmarksStore } from '../stores/bookmarks'
import { useCategoriesStore } from '../stores/categories'
import { useTagsStore } from '../stores/tags'
import Button from 'primevue/button'
import BookmarkCard from '../components/BookmarkCard.vue'

const props = defineProps({
  onAddBookmark: Function,
})

const router = useRouter()
const bookmarksStore = useBookmarksStore()
const categoriesStore = useCategoriesStore()
const tagsStore = useTagsStore()

const recentBookmarks = computed(() => bookmarksStore.bookmarks.slice(0, 6))
const stats = computed(() => bookmarksStore.stats)
const categoryCount = computed(() => categoriesStore.categories.length)

function editBookmark(bm) {
  props.onAddBookmark?.(bm)
}

async function deleteBookmark(bm) {
  if (confirm(`Delete "${bm.title}"?`)) {
    await bookmarksStore.deleteBookmark(bm.id)
  }
}
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Dashboard</h1>
      <Button label="Add Bookmark" icon="pi pi-plus" @click="$props.onAddBookmark?.()" />
    </div>

    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card" style="border: 1px solid var(--p-content-border-color); border-radius: 8px; background: var(--p-surface-card)">
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-label">Bookmarks</div>
      </div>
      <div class="stat-card" style="border: 1px solid var(--p-content-border-color); border-radius: 8px; background: var(--p-surface-card)">
        <div class="stat-value">{{ categoryCount }}</div>
        <div class="stat-label">Categories</div>
      </div>
      <div class="stat-card" style="border: 1px solid var(--p-content-border-color); border-radius: 8px; background: var(--p-surface-card)">
        <div class="stat-value">{{ stats.tagCount }}</div>
        <div class="stat-label">Tags</div>
      </div>
      <div
        class="stat-card"
        style="border: 1px solid var(--p-content-border-color); border-radius: 8px; background: var(--p-surface-card); cursor: pointer"
        @click="router.push('/review')"
      >
        <div class="stat-value" :style="{ color: stats.unreviewed > 0 ? 'var(--p-orange-500)' : 'var(--p-primary-color)' }">
          {{ stats.unreviewed }}
        </div>
        <div class="stat-label">Never Reviewed</div>
      </div>
    </div>

    <!-- Review CTA -->
    <div
      v-if="stats.unreviewed > 0"
      style="display:flex; align-items:center; justify-content:space-between; padding:1rem 1.25rem; border-radius:8px; background:var(--p-orange-50); border:1px solid var(--p-orange-200); margin-bottom:1.5rem"
    >
      <div>
        <div style="font-weight:600; color:var(--p-orange-700)">
          <i class="pi pi-replay" style="margin-right:0.4rem" />
          {{ stats.unreviewed }} bookmark{{ stats.unreviewed === 1 ? '' : 's' }} waiting for review
        </div>
        <div class="text-muted" style="margin-top:0.2rem">
          Start a review session to decide what stays and what goes.
        </div>
      </div>
      <Button
        label="Start Review"
        icon="pi pi-play"
        severity="warning"
        @click="router.push('/review')"
      />
    </div>

    <!-- Recent bookmarks -->
    <div class="page-header" style="margin-bottom: 1rem">
      <h2 style="font-size:1.05rem; font-weight:600; margin:0">Recently Added</h2>
      <Button label="View All" text size="small" @click="router.push('/bookmarks')" />
    </div>

    <div v-if="bookmarksStore.loading" class="empty-state">
      <i class="pi pi-spin pi-spinner" />
      <span>Loading bookmarks…</span>
    </div>

    <div v-else-if="recentBookmarks.length === 0" class="empty-state">
      <i class="pi pi-bookmark" />
      <span>No bookmarks yet. Add your first one!</span>
      <Button label="Add Bookmark" icon="pi pi-plus" @click="$props.onAddBookmark?.()" />
    </div>

    <div v-else class="bookmark-grid">
      <BookmarkCard
        v-for="bm in recentBookmarks"
        :key="bm.id"
        :bookmark="bm"
        @edit="editBookmark"
        @delete="deleteBookmark"
      />
    </div>
  </div>
</template>
