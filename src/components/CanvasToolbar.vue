<script setup lang="ts">
defineProps<{
  fitMode: 'fit' | '75' | '100';
  hintText?: string;
}>();

const emit = defineEmits<{
  (e: 'update:fitMode', val: 'fit' | '75' | '100'): void;
}>();
</script>

<template>
  <div class="canvas-toolbar">
    <div class="canvas-header-hint">
      <span>{{ hintText || '💡 Real-time Canvas Workstation' }}</span>
    </div>
    <div class="zoom-presets">
      <span class="zoom-label">Preview Zoom:</span>
      <button 
        class="zoom-chip" 
        :class="{ active: fitMode === 'fit' }" 
        @click="emit('update:fitMode', 'fit')" 
        aria-label="Fit graphic to screen"
      >
        🔍 Fit
      </button>
      <button 
        class="zoom-chip" 
        :class="{ active: fitMode === '75' }" 
        @click="emit('update:fitMode', '75')" 
        aria-label="Zoom 75%"
      >
        75%
      </button>
      <button 
        class="zoom-chip" 
        :class="{ active: fitMode === '100' }" 
        @click="emit('update:fitMode', '100')" 
        aria-label="Zoom 100%"
      >
        100%
      </button>
    </div>
  </div>
</template>

<style scoped>
.canvas-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 540px;
  margin-bottom: var(--space-3);
  gap: 8px;
  flex-wrap: wrap;
}

.canvas-header-hint {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--studio-text-muted);
}

.zoom-presets {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--studio-surface);
  border: 1px solid var(--studio-border);
  padding: 3px 6px;
  border-radius: var(--radius-pill);
}

.zoom-label {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--studio-text-muted);
  margin-right: 2px;
}

.zoom-chip {
  background: transparent;
  border: none;
  color: var(--studio-text-secondary);
  font-family: var(--font-mono);
  font-size: 10.5px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: all 0.15s;
  min-height: 28px;
}

.zoom-chip:hover {
  color: var(--studio-text-primary);
}

.zoom-chip.active {
  background: var(--studio-accent-primary);
  color: #ffffff;
}

@media (max-width: 1023px) {
  .canvas-toolbar {
    max-width: 100%;
  }
}
</style>
