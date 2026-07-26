<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const navigateTo = (path: string) => {
  router.push(path);
};
</script>

<template>
  <header class="top-nav" role="banner">
    <div class="nav-brand" @click="navigateTo('/')" role="link" tabindex="0" aria-label="Content Studio Home">
      <div class="nav-mark" aria-hidden="true">T</div>
      <div class="nav-titles">
        <div class="nav-name">
          <span class="brand-txt">CONTENT STUDIO</span>
          <span class="live-dot" title="Broadcast Mode Active"></span>
        </div>
        <div class="nav-sub">BROADCAST MEDIA WORKSTATION</div>
      </div>
    </div>

    <nav class="nav-tabs" aria-label="Mode Navigation">
      <button 
        class="nav-tab" 
        :class="{ active: route.path === '/' || route.path === '' }"
        @click="navigateTo('/')"
        aria-label="Normal Post Generator"
      >
        <span class="tab-icon" aria-hidden="true">📝</span>
        <span class="tab-txt">Normal Post</span>
      </button>

      <button 
        class="nav-tab" 
        :class="{ active: route.path.startsWith('/news') }"
        @click="navigateTo('/news')"
        aria-label="News Post Card Generator"
      >
        <span class="tab-icon" aria-hidden="true">📰</span>
        <span class="tab-txt">News Post</span>
      </button>
    </nav>
  </header>
</template>

<style scoped>
.top-nav {
  height: 60px;
  background: var(--studio-surface);
  border-bottom: 1px solid var(--studio-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-6);
  z-index: 100;
  position: sticky;
  top: 0;
  box-shadow: var(--elevation-1);
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  cursor: pointer;
  border-radius: var(--radius-sharp);
  padding: var(--space-1) var(--space-2);
  transition: opacity 0.15s;
}
.nav-brand:hover {
  opacity: 0.9;
}

.nav-mark {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sharp);
  background: linear-gradient(135deg, var(--studio-accent-primary), #FF5252);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-weight: 900;
  font-size: var(--text-lg);
  color: #FFFFFF;
  box-shadow: 0 0 12px rgba(230, 57, 70, 0.4);
}

.nav-name {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: var(--text-base);
  color: var(--studio-text-primary);
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  gap: 6px;
}

.live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--studio-status-success);
  box-shadow: 0 0 8px var(--studio-status-success);
  animation: pulse-live 2s infinite;
}

@keyframes pulse-live {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.85); }
  100% { opacity: 1; transform: scale(1); }
}

.nav-sub {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--studio-text-muted);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.nav-tabs {
  display: flex;
  gap: var(--space-1);
  background: var(--studio-bg);
  padding: var(--space-1);
  border-radius: var(--radius-card);
  border: 1px solid var(--studio-border);
}

.nav-tab {
  min-height: var(--min-touch-target);
  min-width: 120px;
  background: transparent;
  border: none;
  color: var(--studio-text-secondary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 700;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-sharp);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  transition: all 0.15s ease;
}

.nav-tab:hover {
  color: var(--studio-text-primary);
}

.nav-tab:active {
  transform: scale(0.96);
}

.nav-tab.active {
  background: var(--studio-accent-primary);
  color: #FFFFFF;
  box-shadow: 0 2px 10px rgba(230, 57, 70, 0.4);
}

.tab-icon {
  font-size: 15px;
}

@media (max-width: 640px) {
  .top-nav {
    padding: 0 var(--space-3);
    padding-top: var(--safe-top);
    height: calc(56px + var(--safe-top));
  }
  .nav-sub { display: none; }
  .nav-tab {
    min-width: auto;
    padding: var(--space-2) var(--space-3);
    font-size: var(--text-xs);
  }
}

@media (max-width: 400px) {
  .brand-txt {
    font-size: 13px;
  }
  .nav-mark {
    width: 30px;
    height: 30px;
    font-size: 14px;
  }
  .nav-tab {
    padding: 4px 8px;
    font-size: 11px;
  }
}
</style>
