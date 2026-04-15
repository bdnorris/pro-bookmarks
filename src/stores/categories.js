import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'

export const useCategoriesStore = defineStore('categories', () => {
  const categories = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Computed: flat list of top-level categories
  const parentCategories = computed(() =>
    categories.value.filter(c => !c.parent_id)
  )

  // Computed: 2-level tree [{...parent, children: [...]}]
  const tree = computed(() =>
    parentCategories.value.map(parent => ({
      ...parent,
      children: categories.value
        .filter(c => c.parent_id === parent.id)
        .sort((a, b) => a.name.localeCompare(b.name)),
    })).sort((a, b) => a.name.localeCompare(b.name))
  )

  // Get category by id
  function getById(id) {
    return categories.value.find(c => c.id === id) ?? null
  }

  async function fetchCategories() {
    loading.value = true
    error.value = null
    const { data, error: err } = await supabase
      .from('bookmark_categories')
      .select('*')
      .order('name')
    if (err) {
      error.value = err.message
    } else {
      categories.value = data
    }
    loading.value = false
  }

  async function addCategory(name, parentId = null) {
    const { data, error: err } = await supabase
      .from('bookmark_categories')
      .insert({ name: name.trim(), parent_id: parentId })
      .select()
      .single()
    if (err) throw new Error(err.message)
    categories.value.push(data)
    return data
  }

  async function updateCategory(id, name) {
    const { data, error: err } = await supabase
      .from('bookmark_categories')
      .update({ name: name.trim() })
      .eq('id', id)
      .select()
      .single()
    if (err) throw new Error(err.message)
    const idx = categories.value.findIndex(c => c.id === id)
    if (idx !== -1) categories.value[idx] = data
    return data
  }

  async function deleteCategory(id) {
    const { error: err } = await supabase
      .from('bookmark_categories')
      .delete()
      .eq('id', id)
    if (err) throw new Error(err.message)
    // CASCADE deletes children; remove all affected from local state
    categories.value = categories.value.filter(
      c => c.id !== id && c.parent_id !== id
    )
  }

  return {
    categories,
    parentCategories,
    tree,
    loading,
    error,
    getById,
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
  }
})
