<script setup lang="ts">
import TopNav from './components/TopNav.vue';
</script>

<template>
  <div class="studio-root">
    <TopNav />
    <main class="studio-main" id="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Outfit:wght@400;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Space+Grotesk:wght@600;700&family=Syne:wght@700;800&display=swap');
@import './assets/tokens.css';

:root {
  /* Backward-compatibility mapping for components */
  --bg: var(--studio-bg);
  --panel: var(--studio-surface);
  --panel-2: var(--studio-surface-elevated);
  --line: var(--studio-border);
  --accent: var(--studio-accent-primary);
  --accent-2: var(--studio-accent-secondary);
  --text: var(--studio-text-primary);
  --text-dim: var(--studio-text-secondary);
  --mono: var(--font-mono);
  --disp: var(--font-display);
  --body: var(--font-body);
}

.studio-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--studio-bg);
  color: var(--studio-text-primary);
}

.studio-main {
  flex: 1;
  width: 100%;
  position: relative;
}
</style>
