import { createRouter, createWebHistory } from 'vue-router'
import { useApp } from './stores/app'

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', component: () => import('./views/Journey.vue') },
    { path: '/quest/:level/:i', component: () => import('./views/Quest.vue') },
    { path: '/cards', component: () => import('./views/Cards.vue') },
    { path: '/map', component: () => import('./views/TermMap.vue') },
    { path: '/moments', component: () => import('./views/Moments.vue') },
    { path: '/moments/:id/:cp', component: () => import('./views/Moment.vue') },
    { path: '/sim', component: () => import('./views/Simulator.vue') },
    { path: '/settings', component: () => import('./views/Settings.vue') },
    { path: '/login', component: () => import('./views/Login.vue') },
    { path: '/:rest(.*)*', component: () => import('./views/NotFound.vue') },
  ],
})

// Every page needs a session; /login is the only open route.
router.beforeEach(async (to) => {
  const app = useApp()
  if (app.authed === null) {
    app.authed = await fetch('/api/session').then((r) => r.json()).then((j: any) => !!j.ok).catch(() => false)
  }
  if (!app.authed && to.path !== '/login') return { path: '/login', query: to.fullPath === '/' ? {} : { next: to.fullPath } }
  if (app.authed && to.path === '/login') return '/'
})
