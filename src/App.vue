<script setup lang="ts">
import TopNav from './components/TopNav.vue';
</script>

<template>
  <div class="studio-root">
    <TopNav />
    <main class="studio-main">
      <RouterView />
    </main>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@400;600&family=Outfit:wght@400;600;700;800;900&family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;600;700&family=Space+Grotesk:wght@600;700&family=Syne:wght@700;800&display=swap');

:root {
  --bg: #14121A;
  --panel: #1C1926;
  --panel-2: #221E30;
  --line: #332E44;
  --accent: #7C5CFC;
  --accent-2: #FF6B4A;
  --text: #F5F3FF;
  --text-dim: #8B879C;
  --mono: 'JetBrains Mono', monospace;
  --disp: 'Trebuchet MS', sans-serif;
  --body: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--body);
  min-height: 100vh;
  overflow-x: hidden;
}

.studio-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.studio-main {
  flex: 1;
  width: 100%;
}
</style>
