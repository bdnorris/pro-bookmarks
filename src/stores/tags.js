import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'

export const useTagsStore = defineStore('tags', () => {
  const tags = ref([])
  const loading = ref(false)

  async function fetchTags() {
    loading.value = true
    const { data, error } = await supabase
      .from('bookmark_tags')
      .select('*')
      .order('name')
    if (!error) tags.value = data
    loading.value = false
  }

  // Return existing tag or create and return new one
  async function getOrCreate(name) {
    const normalized = name.trim().toLowerCase()
    const existing = tags.value.find(t => t.name === normalized)
    if (existing) return existing

    const { data, error } = await supabase
      .from('bookmark_tags')
      .upsert({ name: normalized }, { onConflict: 'name' })
      .select()
      .single()
    if (error) throw new Error(error.message)
    if (!tags.value.find(t => t.id === data.id)) {
      tags.value.push(data)
      tags.value.sort((a, b) => a.name.localeCompare(b.name))
    }
    return data
  }

  async function deleteTag(id) {
    const { error } = await supabase.from('bookmark_tags').delete().eq('id', id)
    if (error) throw new Error(error.message)
    tags.value = tags.value.filter(t => t.id !== id)
  }

  // Remove any tags that are no longer referenced by any bookmark
  async function pruneOrphanTags() {
    const { data, error } = await supabase
      .from('bookmark_tags')
      .select('id, bookmark_tag_links(bookmark_id)')
    if (error || !data) return
    const orphanIds = data
      .filter(t => !t.bookmark_tag_links || t.bookmark_tag_links.length === 0)
      .map(t => t.id)
    if (orphanIds.length === 0) return
    await supabase.from('bookmark_tags').delete().in('id', orphanIds)
    tags.value = tags.value.filter(t => !orphanIds.includes(t.id))
  }

  return { tags, loading, fetchTags, getOrCreate, deleteTag, pruneOrphanTags }
})
