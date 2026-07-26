<script setup lang="ts">
import { ref } from 'vue';

withDefaults(defineProps<{
  imageSrc?: string | null;
  label?: string;
  icon?: string;
  subtext?: string;
  accept?: string;
}>(), {
  imageSrc: null,
  label: 'Upload Image',
  icon: '📸',
  subtext: 'Auto cover-cropped, zero distortion',
  accept: 'image/*'
});

const emit = defineEmits<{
  (e: 'upload', file: File): void;
  (e: 'remove'): void;
}>();

const isDropHover = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

const onFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    emit('upload', file);
  }
};

const onDrop = (e: DragEvent) => {
  isDropHover.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) {
    emit('upload', file);
  }
};

const triggerFileInput = () => {
  fileInputRef.value?.click();
};
</script>

<template>
  <div 
    class="drop-zone"
    :class="{ 'drop-active': isDropHover, 'has-file': !!imageSrc }"
    @dragenter.prevent="isDropHover = true"
    @dragover.prevent="isDropHover = true"
    @dragleave.prevent="isDropHover = false"
    @drop.prevent="onDrop"
  >
    <input 
      type="file" 
      ref="fileInputRef" 
      :accept="accept" 
      class="drop-file-input"
      @change="onFileChange"
      :aria-label="label"
    >
    <div v-if="!imageSrc" class="drop-msg">
      <span class="drop-icon">{{ icon }}</span>
      <strong>{{ label }}</strong>
      <span class="sub">{{ subtext }}</span>
    </div>
    <div v-else class="file-loaded-info">
      <span class="loaded-txt">✓ Image Loaded</span>
      <div class="file-action-btns">
        <button type="button" class="btn tiny" @click.prevent.stop="triggerFileInput">Change</button>
        <button type="button" class="btn tiny danger" @click.prevent.stop="emit('remove')">Remove</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.drop-zone {
  position: relative;
  border: 2px dashed var(--studio-border-strong);
  border-radius: var(--radius-card);
  padding: var(--space-4);
  text-align: center;
  background: var(--studio-surface);
  transition: all 0.2s ease;
  min-height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.drop-zone:hover {
  border-color: var(--studio-accent-primary);
  background: rgba(230, 57, 70, 0.05);
}
.drop-zone.drop-active {
  border-color: var(--studio-accent-primary);
  background: rgba(230, 57, 70, 0.12);
}
.drop-zone.has-file {
  border-style: solid;
  border-color: var(--studio-border);
  padding: var(--space-3);
}

.drop-file-input {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 5;
}

.drop-msg {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: var(--studio-text-secondary);
  pointer-events: none;
}
.drop-icon { font-size: 24px; }
.sub { font-size: 11px; color: var(--studio-text-muted); }

.file-loaded-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--studio-text-primary);
  width: 100%;
}
.file-action-btns {
  display: flex;
  gap: 6px;
  position: relative;
  z-index: 10;
}

.btn {
  min-height: 32px;
  background: var(--studio-surface-elevated);
  border: 1px solid var(--studio-border);
  color: var(--studio-text-primary);
  padding: 4px 10px;
  border-radius: var(--radius-sharp);
  font-weight: 700;
  font-size: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.btn:hover { border-color: var(--studio-border-strong); }
.btn.danger { background: rgba(255,77,77,0.15); color: #ff4d4d; border-color: rgba(255,77,77,0.3); }
</style>
