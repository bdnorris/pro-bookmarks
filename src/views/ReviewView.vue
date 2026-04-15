<script setup>
import { ref, computed, watch } from 'vue'
import { useBookmarksStore } from '../stores/bookmarks'
import { useCategoriesStore } from '../stores/categories'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import ProgressBar from 'primevue/progressbar'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'

const bookmarksStore = useBookmarksStore()
const categoriesStore = useCategoriesStore()
const toast = useToast()

// Session state
const sessionActive = ref(false)
const queue = ref([])          // snapshot of bookmark ids to review
const currentIndex = ref(0)
const keptCount = ref(0)
const removedCount = ref(0)
const sessionDone = ref(false)
const actioning = ref(false)

const currentBookmark = computed(() => {
  const id = queue.value[currentIndex.value]
  return id ? bookmarksStore.getById(id) : null
})

const progress = computed(() => {
  if (!queue.value.length) return 0
  return Math.round((currentIndex.value / queue.value.length) * 100)
})

const category = computed(() => currentBookmark.value?.category ?? null)
const parentCategory = computed(() => {
  if (!category.value?.parent_id) return null
  return categoriesStore.getById(category.value.parent_id)
})

const reviewedLabel = computed(() => {
  const d = currentBookmark.value?.last_reviewed_at
  if (!d) return 'Never reviewed'
  return `Last reviewed ${new Date(d).toLocaleDateString()}`
})

function startSession() {
  // Take a snapshot of IDs in review order (never-reviewed first, then oldest first)
  queue.value = bookmarksStore.reviewQueue.map(b => b.id)
  currentIndex.value = 0
  keptCount.value = 0
  removedCount.value = 0
  sessionDone.value = false
  sessionActive.value = true
}

function endSession() {
  sessionActive.value = false
  sessionDone.value = currentIndex.value >= queue.value.length
}

async function keep() {
  if (!currentBookmark.value || actioning.value) return
  actioning.value = true
  try {
    await bookmarksStore.markReviewed(currentBookmark.value.id)
    keptCount.value++
    advance()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 4000 })
  } finally {
    actioning.value = false
  }
}

async function remove() {
  if (!currentBookmark.value || actioning.value) return
  actioning.value = true
  try {
    await bookmarksStore.deleteBookmark(currentBookmark.value.id)
    removedCount.value++
    // Don't advance index — the next item shifts into the same slot,
    // but our queue is a snapshot of ids so we just move forward
    advance()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 4000 })
  } finally {
    actioning.value = false
  }
}

function advance() {
  if (currentIndex.value + 1 >= queue.value.length) {
    sessionDone.value = true
    sessionActive.value = false
  } else {
    currentIndex.value++
  }
}

function openUrl() {
  if (currentBookmark.value?.url) {
    window.open(currentBookmark.value.url, '_blank', 'noopener,noreferrer')
  }
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="review-container">
    <!-- ── Not started ───────────────────────────────── -->
    <div v-if="!sessionActive && !sessionDone">
      <div class="page-header">
        <h1 class="page-title">Review Queue</h1>
      </div>

      <div
        style="border:1px solid var(--p-content-border-color); border-radius:10px; background:var(--p-surface-card); padding:2rem; text-align:center"
      >
        <i class="pi pi-replay" style="font-size:2.5rem; color:var(--p-primary-color); opacity:0.7" />
        <h2 style="margin:1rem 0 0.5rem; font-size:1.2rem">
          {{ bookmarksStore.bookmarks.length }} bookmark{{ bookmarksStore.bookmarks.length === 1 ? '' : 's' }} in your collection
        </h2>
        <p class="text-muted" style="margin:0 0 1.5rem">
          The review queue walks you through your bookmarks one at a time —
          keep what's useful, remove what's not.
          Never-reviewed items come first.
        </p>

        <div style="display:flex; gap:1rem; justify-content:center; flex-wrap:wrap; margin-bottom:1.5rem">
          <div style="text-align:center">
            <div style="font-size:1.5rem; font-weight:700; color:var(--p-orange-500)">
              {{ bookmarksStore.stats.unreviewed }}
            </div>
            <div class="text-muted" style="font-size:0.8rem">Never reviewed</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:1.5rem; font-weight:700; color:var(--p-primary-color)">
              {{ bookmarksStore.bookmarks.length - bookmarksStore.stats.unreviewed }}
            </div>
            <div class="text-muted" style="font-size:0.8rem">Previously reviewed</div>
          </div>
        </div>

        <Button
          label="Start Review Session"
          icon="pi pi-play"
          size="large"
          :disabled="bookmarksStore.bookmarks.length === 0"
          @click="startSession"
        />
      </div>
    </div>

    <!-- ── Session done / summary ───────────────────── -->
    <div v-else-if="sessionDone && !sessionActive">
      <div class="page-header">
        <h1 class="page-title">Session Complete</h1>
      </div>

      <div
        style="border:1px solid var(--p-content-border-color); border-radius:10px; background:var(--p-surface-card); padding:2rem; text-align:center"
      >
        <i class="pi pi-check-circle" style="font-size:3rem; color:var(--p-green-500)" />
        <h2 style="margin:1rem 0 0.5rem">Great work!</h2>
        <p class="text-muted" style="margin:0 0 1.5rem">Here's a summary of your session:</p>

        <div style="display:flex; gap:2rem; justify-content:center; margin-bottom:2rem">
          <div>
            <div style="font-size:2rem; font-weight:700; color:var(--p-green-500)">{{ keptCount }}</div>
            <div class="text-muted">Kept</div>
          </div>
          <div>
            <div style="font-size:2rem; font-weight:700; color:var(--p-red-500)">{{ removedCount }}</div>
            <div class="text-muted">Removed</div>
          </div>
          <div>
            <div style="font-size:2rem; font-weight:700; color:var(--p-primary-color)">
              {{ bookmarksStore.bookmarks.length }}
            </div>
            <div class="text-muted">Remaining</div>
          </div>
        </div>

        <div style="display:flex; gap:1rem; justify-content:center">
          <Button
            label="Review Again"
            icon="pi pi-replay"
            severity="secondary"
            @click="() => { sessionDone = false; startSession() }"
          />
          <Button
            label="Done"
            icon="pi pi-check"
            @click="sessionDone = false"
          />
        </div>
      </div>
    </div>

    <!-- ── Active session ────────────────────────────── -->
    <div v-else-if="sessionActive && currentBookmark">
      <!-- Header -->
      <div class="page-header">
        <h1 class="page-title">Review Queue</h1>
        <Button label="End Session" icon="pi pi-times" text severity="secondary" @click="endSession" />
      </div>

      <!-- Progress -->
      <div style="margin-bottom: 0.5rem">
        <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem">
          <span class="text-muted">Progress</span>
          <span class="text-muted">{{ currentIndex }} of {{ queue.length }}</span>
        </div>
        <ProgressBar :value="progress" style="height: 8px" />
      </div>

      <!-- Bookmark card -->
      <div
        class="review-card"
        style="border:1px solid var(--p-content-border-color); border-radius:10px; background:var(--p-surface-card); padding:1.5rem"
      >
        <!-- Title / link -->
        <button
          style="background:none;border:none;padding:0;cursor:pointer;text-align:left;width:100%"
          @click="openUrl"
        >
          <h2
            style="margin:0 0 0.4rem; font-size:1.2rem; font-weight:700; color:var(--p-primary-color); line-height:1.3"
          >
            {{ currentBookmark.title }}
            <i class="pi pi-external-link" style="font-size:0.8rem; margin-left:0.4rem; opacity:0.6" />
          </h2>
        </button>

        <div style="font-size:0.82rem; color:var(--p-text-muted-color); margin-bottom:0.75rem; word-break:break-all">
          {{ currentBookmark.url }}
        </div>

        <Divider style="margin: 0.5rem 0" />

        <!-- Description -->
        <p
          v-if="currentBookmark.description"
          style="margin:0.75rem 0; font-size:0.9rem; line-height:1.55; color:var(--p-text-color)"
        >
          {{ currentBookmark.description }}
        </p>
        <p v-else style="margin:0.75rem 0; font-size:0.85rem; color:var(--p-text-muted-color); font-style:italic">
          No description.
        </p>

        <!-- Category -->
        <div v-if="category" style="margin-bottom:0.5rem; font-size:0.83rem; display:flex; align-items:center; gap:0.3rem">
          <i class="pi pi-folder" style="color:var(--p-text-muted-color)" />
          <span v-if="parentCategory" class="text-muted">{{ parentCategory.name }} › </span>
          <span style="color:var(--p-primary-color); font-weight:600">{{ category.name }}</span>
        </div>

        <!-- Tags -->
        <div v-if="currentBookmark.tags?.length" class="tag-list" style="margin-bottom:0.75rem">
          <Tag
            v-for="tag in currentBookmark.tags"
            :key="tag.id"
            :value="tag.name"
            severity="secondary"
            style="font-size:0.75rem"
          />
        </div>

        <Divider style="margin: 0.5rem 0" />

        <!-- Meta -->
        <div style="display:flex; gap:1.5rem; font-size:0.78rem; color:var(--p-text-muted-color)">
          <span>
            <i class="pi pi-calendar" style="margin-right:0.3rem" />
            Added {{ formatDate(currentBookmark.created_at) }}
          </span>
          <span>
            <i class="pi pi-replay" style="margin-right:0.3rem" />
            {{ reviewedLabel }}
          </span>
          <span v-if="currentBookmark.review_count">
            Reviewed {{ currentBookmark.review_count }}x
          </span>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="review-actions">
        <Button
          label="Remove"
          icon="pi pi-trash"
          severity="danger"
          outlined
          size="large"
          :loading="actioning"
          @click="remove"
        />
        <Button
          label="Keep"
          icon="pi pi-check"
          severity="success"
          size="large"
          :loading="actioning"
          @click="keep"
        />
      </div>
    </div>

    <!-- Edge case: session started but bookmark was just deleted from under us -->
    <div v-else-if="sessionActive && !currentBookmark">
      <p class="text-muted" style="text-align:center; margin-top:2rem">
        All done — no more bookmarks to review.
      </p>
      <div style="text-align:center; margin-top:1rem">
        <Button label="See Summary" @click="() => { sessionDone = true; sessionActive = false }" />
      </div>
    </div>
  </div>
</template>
