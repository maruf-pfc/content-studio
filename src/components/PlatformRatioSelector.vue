<script setup lang="ts">
import { computed } from 'vue';

export interface Platform {
  id: string;
  label: string;
  icon: string;
  ratios: string[];
}

const props = defineProps<{
  platforms: Platform[];
  platform: string;
  ratio: string;
}>();

const emit = defineEmits<{
  (e: 'update:platform', val: string): void;
  (e: 'update:ratio', val: string): void;
}>();

const activePlatformObj = computed(() => {
  return props.platforms.find(p => p.id === props.platform) || props.platforms[0];
});

const onSelectPlatform = (p: Platform) => {
  emit('update:platform', p.id);
  const firstRatio = p.ratios[0] || '1:1';
  emit('update:ratio', firstRatio);
};
</script>

<template>
  <div class="platform-ratio-selector">
    <div class="platform-grid">
      <button 
        v-for="p in platforms" 
        :key="p.id" 
        class="platform-btn"
        :class="{ active: p.id === platform }"
        @click="onSelectPlatform(p)"
        :aria-label="`Select platform ${p.label}`"
      >
        <span class="pico" aria-hidden="true">{{ p.icon }}</span>
        <span>{{ p.label }}</span>
      </button>
    </div>

    <div class="ratio-row">
      <button 
        v-for="r in (activePlatformObj?.ratios || [])" 
        :key="r"
        class="ratio-chip"
        :class="{ active: r === ratio }"
        @click="emit('update:ratio', r)"
        :aria-label="`Select ratio ${r}`"
      >
        {{ r }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.platform-ratio-selector {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.platform-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-2);
}

.platform-btn {
  min-height: var(--min-touch-target);
  background: var(--studio-surface);
  border: 1px solid var(--studio-border);
  border-radius: var(--radius-sharp);
  padding: 8px 4px;
  cursor: pointer;
  color: var(--studio-text-secondary);
  font-size: 11px;
  font-family: var(--font-mono);
  text-align: center;
  transition: all 0.15s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.platform-btn:hover {
  border-color: var(--studio-border-strong);
  color: var(--studio-text-primary);
}

.platform-btn:active {
  transform: scale(0.97);
}

.platform-btn.active {
  border-color: var(--studio-accent-primary);
  color: var(--studio-text-primary);
  background: rgba(230, 57, 70, 0.15);
  font-weight: 700;
}

.ratio-row {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.ratio-chip {
  min-height: 38px;
  background: var(--studio-surface);
  border: 1px solid var(--studio-border);
  border-radius: var(--radius-pill);
  padding: 6px 14px;
  font-size: 11.5px;
  font-family: var(--font-mono);
  cursor: pointer;
  color: var(--studio-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.ratio-chip:hover {
  border-color: var(--studio-border-strong);
  color: var(--studio-text-primary);
}

.ratio-chip:active {
  transform: scale(0.96);
}

.ratio-chip.active {
  background: var(--studio-accent-primary);
  border-color: var(--studio-accent-primary);
  color: #ffffff;
  font-weight: 700;
}

@media (max-width: 479px) {
  .platform-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
  }
  .platform-btn {
    padding: 6px 2px;
    font-size: 9.5px;
  }
}
</style>
