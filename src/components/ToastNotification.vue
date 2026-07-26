<script setup lang="ts">
defineProps<{
  show: boolean;
  message: string;
}>();
</script>

<template>
  <div class="toast" :class="{ show }" role="status" aria-live="polite">
    <span>{{ message }}</span>
  </div>
</template>

<style scoped>
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: var(--studio-surface-elevated);
  border: 1px solid var(--studio-accent-primary);
  color: var(--studio-text-primary);
  padding: 12px 20px;
  border-radius: var(--radius-card);
  font-weight: 700;
  font-size: var(--text-sm);
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.25s ease;
  pointer-events: none;
  z-index: 2000;
  box-shadow: var(--elevation-3);
}

.toast.show {
  opacity: 1;
  transform: translateY(0);
}
</style>
