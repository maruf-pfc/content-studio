<script setup lang="ts">
interface NavItem {
  id: string;
  label: string;
}

defineProps<{
  items: NavItem[];
}>();

const emit = defineEmits<{
  (e: 'jump', id: string): void;
}>();
</script>

<template>
  <div class="quick-nav-bar" aria-label="Jump to Control Section">
    <button 
      v-for="item in items" 
      :key="item.id"
      class="qjump-chip"
      @click="emit('jump', item.id)"
    >
      {{ item.label }}
    </button>
  </div>
</template>

<style scoped>
.quick-nav-bar {
  display: none;
}

@media (max-width: 1023px) {
  .quick-nav-bar {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    padding-bottom: 8px;
    margin-bottom: var(--space-4);
    position: sticky;
    top: 56px;
    background: var(--studio-surface);
    z-index: 20;
    padding-top: 8px;
    margin-top: -8px;
    border-bottom: 1px solid var(--studio-border);
  }

  .qjump-chip {
    background: var(--studio-surface-elevated);
    border: 1px solid var(--studio-border);
    color: var(--studio-text-secondary);
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    padding: 6px 12px;
    border-radius: var(--radius-pill);
    cursor: pointer;
    white-space: nowrap;
    min-height: 34px;
    display: flex;
    align-items: center;
    transition: all 0.15s ease;
  }

  .qjump-chip:hover {
    color: var(--studio-text-primary);
    border-color: var(--studio-border-strong);
  }

  .qjump-chip:active {
    transform: scale(0.96);
  }
}
</style>
