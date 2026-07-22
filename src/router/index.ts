import { createRouter, createWebHistory } from 'vue-router';
import NormalPostView from '../views/NormalPostView.vue';
import NewsPostView from '../views/NewsPostView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'normal-post',
      component: NormalPostView
    },
    {
      path: '/news',
      name: 'news-post',
      component: NewsPostView
    }
  ]
});

export default router;
