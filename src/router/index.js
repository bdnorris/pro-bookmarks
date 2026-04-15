import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../lib/supabase'
import HomeView from '../views/HomeView.vue'
import BookmarksView from '../views/BookmarksView.vue'
import CategoriesView from '../views/CategoriesView.vue'
import ReviewView from '../views/ReviewView.vue'
import LoginView from '../views/LoginView.vue'

const routes = [
  { path: '/login',     name: 'login',      component: LoginView, meta: { public: true } },
  { path: '/',          name: 'home',        component: HomeView },
  { path: '/bookmarks', name: 'bookmarks',  component: BookmarksView },
  { path: '/categories',name: 'categories', component: CategoriesView },
  { path: '/review',    name: 'review',     component: ReviewView },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Guard: redirect to /login when not authenticated
router.beforeEach(async (to) => {
  if (to.meta.public) return true

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { name: 'login' }

  // Prevent authenticated users from landing on /login
  return true
})
