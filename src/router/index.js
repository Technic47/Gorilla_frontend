import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/login',        component: () => import('../views/LoginView.vue'),       meta: { public: true } },
  { path: '/register',     component: () => import('../views/RegisterView.vue'),    meta: { public: true } },
  { path: '/',             component: () => import('../views/AccountsView.vue'),    meta: { requiresAuth: true } },
  { path: '/account/:id',  component: () => import('../views/AccountDetailView.vue'), meta: { requiresAuth: true } },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach(to => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) return '/login'
  if (to.meta.public       && auth.isAuthenticated)  return '/'
})

export default router
