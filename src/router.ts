import { createRouter, createWebHistory } from 'vue-router'

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
  ],
})
