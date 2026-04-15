import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import BookmarksView from '../views/BookmarksView.vue'
import CategoriesView from '../views/CategoriesView.vue'
import ReviewView from '../views/ReviewView.vue'

const routes = [
  { path: '/',            name: 'home',       component: HomeView },
  { path: '/bookmarks',  name: 'bookmarks',  component: BookmarksView },
  { path: '/categories', name: 'categories', component: CategoriesView },
  { path: '/review',     name: 'review',     component: ReviewView },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
