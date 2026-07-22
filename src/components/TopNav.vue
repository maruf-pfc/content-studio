<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const navigateTo = (path: string) => {
  router.push(path);
};
</script>

<template>
  <header class="top-nav">
    <div class="nav-brand" @click="navigateTo('/')">
      <div class="nav-mark">T</div>
      <div class="nav-titles">
        <div class="nav-name">Content Studio</div>
        <div class="nav-sub">Telepathic Thoughts</div>
      </div>
    </div>

    <div class="nav-tabs">
      <button 
        class="nav-tab" 
        :class="{ active: route.path === '/' || route.path === '' }"
        @click="navigateTo('/')"
      >
        <span class="tab-icon">📝</span> Normal Post
      </button>

      <button 
        class="nav-tab" 
        :class="{ active: route.path.startsWith('/news') }"
        @click="navigateTo('/news')"
      >
        <span class="tab-icon">📰</span> News Post
      </button>
    </div>
  </header>
</template>

<style scoped>
.top-nav {
  height: 56px;
  background: #171422;
  border-bottom: 1px solid #2e2940;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 100;
  position: sticky;
  top: 0;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.nav-mark {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #7C5CFC, #FF6B4A);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Trebuchet MS', sans-serif;
  font-weight: 900;
  font-size: 15px;
  color: #fff;
}

.nav-name {
  font-weight: 800;
  font-size: 15px;
  color: #F5F3FF;
  letter-spacing: -0.01em;
}

.nav-sub {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  color: #8B879C;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.nav-tabs {
  display: flex;
  gap: 8px;
  background: #0f0d17;
  padding: 4px;
  border-radius: 10px;
  border: 1px solid #282338;
}

.nav-tab {
  background: transparent;
  border: none;
  color: #8B879C;
  font-family: var(--body);
  font-size: 13px;
  font-weight: 600;
  padding: 6px 16px;
  border-radius: 7px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s ease;
}

.nav-tab:hover {
  color: #F5F3FF;
}

.nav-tab.active {
  background: #7C5CFC;
  color: #FFFFFF;
  box-shadow: 0 2px 8px rgba(124, 92, 252, 0.35);
}

.tab-icon {
  font-size: 14px;
}
</style>
