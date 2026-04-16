import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useTagsStore } from './tags'

export const useBookmarksStore = defineStore('bookmarks', () => {
  const bookmarks = ref([])
  const loading = ref(false)
  const error = ref(null)

  const tagsStore = useTagsStore()

  // Computed: bookmarks ordered for the review queue
  // Never-reviewed first, then oldest reviewed first
  const reviewQueue = computed(() =>
    [...bookmarks.value].sort((a, b) => {
      if (!a.last_reviewed_at && !b.last_reviewed_at) return 0
      if (!a.last_reviewed_at) return -1
      if (!b.last_reviewed_at) return 1
      return new Date(a.last_reviewed_at) - new Date(b.last_reviewed_at)
    })
  )

  const stats = computed(() => ({
    total: bookmarks.value.length,
    unreviewed: bookmarks.value.filter(b => !b.last_reviewed_at).length,
    tagCount: tagsStore.tags.length,
  }))

  async function fetchBookmarks() {
    loading.value = true
    error.value = null

    const [{ data: bms, error: bErr }, { data: tagLinks, error: tErr }] =
      await Promise.all([
        supabase
          .from('bookmark_bookmarks')
          .select('*, category:bookmark_categories(id, name, parent_id)')
          .order('created_at', { ascending: false }),
        supabase
          .from('bookmark_tag_links')
          .select('bookmark_id, tag:bookmark_tags(id, name)'),
      ])

    if (bErr || tErr) {
      error.value = (bErr || tErr).message
      loading.value = false
      return
    }

    // Build tag map: bookmark_id → Tag[]
    const tagMap = {}
    for (const link of tagLinks) {
      if (!tagMap[link.bookmark_id]) tagMap[link.bookmark_id] = []
      if (link.tag) tagMap[link.bookmark_id].push(link.tag)
    }

    bookmarks.value = bms.map(b => ({ ...b, tags: tagMap[b.id] ?? [] }))
    loading.value = false
  }

  async function addBookmark({ url, title, description, category_id, tagNames, og_image }) {
    const { data: bm, error: bErr } = await supabase
      .from('bookmark_bookmarks')
      .insert({ url, title, description: description || null, category_id: category_id || null, og_image: og_image || null })
      .select('*, category:bookmark_categories(id, name, parent_id)')
      .single()
    if (bErr) throw new Error(bErr.message)

    const resolvedTags = await resolveTags(tagNames)

    if (resolvedTags.length > 0) {
      const { error: tErr } = await supabase.from('bookmark_tag_links').insert(
        resolvedTags.map(t => ({ bookmark_id: bm.id, tag_id: t.id }))
      )
      if (tErr) throw new Error(tErr.message)
    }

    const full = { ...bm, tags: resolvedTags }
    bookmarks.value.unshift(full)
    return full
  }

  async function updateBookmark(id, { url, title, description, category_id, tagNames, og_image }) {
    const { data: bm, error: bErr } = await supabase
      .from('bookmark_bookmarks')
      .update({ url, title, description: description || null, category_id: category_id || null, og_image: og_image || null })
      .eq('id', id)
      .select('*, category:bookmark_categories(id, name, parent_id)')
      .single()
    if (bErr) throw new Error(bErr.message)

    // Replace all tag links
    await supabase.from('bookmark_tag_links').delete().eq('bookmark_id', id)
    const resolvedTags = await resolveTags(tagNames)
    if (resolvedTags.length > 0) {
      await supabase.from('bookmark_tag_links').insert(
        resolvedTags.map(t => ({ bookmark_id: id, tag_id: t.id }))
      )
    }

    await tagsStore.pruneOrphanTags()

    const full = { ...bm, tags: resolvedTags }
    const idx = bookmarks.value.findIndex(b => b.id === id)
    if (idx !== -1) bookmarks.value[idx] = full
    return full
  }

  async function deleteBookmark(id) {
    const { error: err } = await supabase.from('bookmark_bookmarks').delete().eq('id', id)
    if (err) throw new Error(err.message)
    bookmarks.value = bookmarks.value.filter(b => b.id !== id)
    await tagsStore.pruneOrphanTags()
  }

  // Mark bookmark as reviewed (Keep action in review queue)
  async function markReviewed(id) {
    const now = new Date().toISOString()
    const { data, error: err } = await supabase
      .from('bookmark_bookmarks')
      .update({ last_reviewed_at: now, review_count: (getById(id)?.review_count ?? 0) + 1 })
      .eq('id', id)
      .select()
      .single()
    if (err) throw new Error(err.message)
    const idx = bookmarks.value.findIndex(b => b.id === id)
    if (idx !== -1) {
      bookmarks.value[idx] = { ...bookmarks.value[idx], ...data }
    }
  }

  function getById(id) {
    return bookmarks.value.find(b => b.id === id) ?? null
  }

  async function resolveTags(tagNames = []) {
    if (!tagNames || tagNames.length === 0) return []
    return Promise.all(tagNames.map(name => tagsStore.getOrCreate(name)))
  }

  return {
    bookmarks,
    loading,
    error,
    reviewQueue,
    stats,
    fetchBookmarks,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    markReviewed,
    getById,
  }
})
