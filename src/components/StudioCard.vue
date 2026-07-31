<script setup lang="ts">
defineProps<{
  id?: string;
  title: string;
  icon?: string;
}>();
</script>

<template>
  <section :id="id" class="studio-card">
    <div class="studio-card-header">
      <span v-if="icon" class="card-icon" aria-hidden="true">{{ icon }}</span>
      <span class="card-title">{{ title }}</span>
    </div>
    <div class="studio-card-body">
      <slot></slot>
    </div>
  </section>
</template>

<style scoped>
.studio-card {
  background: var(--studio-surface-elevated);
  border: 1px solid var(--studio-border);
  border-radius: var(--radius-card);
  padding: var(--space-4);
  margin-bottom: var(--space-4);
  scroll-margin-top: 75px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  width: 100%;
  box-sizing: border-box;
}

@media (max-width: 479px) {
  .studio-card {
    padding: var(--space-3);
  }
}

.studio-card:focus-within {
  border-color: var(--studio-border-strong);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

.studio-card-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--studio-text-secondary);
  padding-bottom: var(--space-3);
  margin-bottom: var(--space-3);
  border-bottom: 1px solid var(--studio-border);
}

.card-title {
  flex: 1;
}

.card-icon {
  font-size: 14px;
}

.studio-card-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
</style>
