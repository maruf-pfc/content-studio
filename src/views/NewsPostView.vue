<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue';
import { parseWordTokens, toggleWordHighlight } from '../utils/textHelper';
import { renderNewsCardCanvas, sampleBottomColor, type NewsCardState } from '../utils/newsCardCanvas';

/* ---------------- DATA PRESETS ---------------- */
interface Platform {
  id: string;
  label: string;
  icon: string;
  ratios: string[];
}

const PLATFORMS: Platform[] = [
  { id: 'instagram', label: 'Instagram', icon: '◪', ratios: ['1:1', '4:5', '9:16'] },
  { id: 'facebook', label: 'Facebook', icon: '▣', ratios: ['1:1', '9:16', '16:9'] },
  { id: 'linkedin', label: 'LinkedIn', icon: '▤', ratios: ['1:1', '1.91:1'] },
  { id: 'youtube', label: 'YouTube', icon: '▶', ratios: ['16:9'] },
  { id: 'twitter', label: 'X / Twitter', icon: '𝕏', ratios: ['16:9', '1:1'] }
];

const RATIO_DIMS: Record<string, [number, number]> = {
  '1:1': [1080, 1080],
  '4:5': [1080, 1350],
  '9:16': [1080, 1920],
  '16:9': [1280, 720],
  '1.91:1': [1200, 627]
};

interface Theme {
  id: string;
  name: string;
  bg: string;
  accent: string;
  text: string;
}

const THEMES: Theme[] = [
  { id: 'midnight', name: 'Midnight Dark', bg: '#14121A', accent: '#FFE600', text: '#FFFFFF' },
  { id: 'news_red', name: 'Crimson Red', bg: '#17090C', accent: '#FFD700', text: '#FFFFFF' },
  { id: 'deep_blue', name: 'Navy Channel', bg: '#0A1128', accent: '#00E5FF', text: '#FFFFFF' },
  { id: 'monochrome', name: 'Solid Black', bg: '#080808', accent: '#FFE600', text: '#FFFFFF' },
  { id: 'emerald', name: 'Deep Emerald', bg: '#071A14', accent: '#A3FFD6', text: '#FFFFFF' }
];

/* ---------------- STATE ---------------- */
const platform = ref('instagram');
const ratio = ref('1:1');
const activeThemeId = ref('midnight');

const newsState = reactive<NewsCardState>({
  headlineText: 'এখানে আপনার সংবাদ *শিরোনাম* লিখুন',
  copyrightText: '© TelepathicThoughts 2026',
  
  photoZonePercent: 55,
  photoOffsetX: 0,
  photoOffsetY: 0,
  photoScale: 1.0,
  
  sampledColorOverride: '',
  bannerColorOverride: '',
  accentColorOverride: '',
  textColorOverride: '',
  
  logoVisible: true,
  logoAnchor: 'seam-center',
  logoOffsetX: 0,
  logoOffsetY: 0,
  logoSize: 50,
  
  autoFit: true,
  titleFontSize: 70,
  align: 'center',
  fontFamily: 'Outfit'
});

const pageHandle = ref('@TelepathicThoughts');

const photoSrc = ref<string | null>(null);
const logoSrc = ref<string | null>(null);
const photoEl = ref<HTMLImageElement | null>(null);
const logoEl = ref<HTMLImageElement | null>(null);

const mainCanvas = ref<HTMLCanvasElement | null>(null);
const photoFileInput = ref<HTMLInputElement | null>(null);
const logoFileInput = ref<HTMLInputElement | null>(null);

const isDraggingPhoto = ref(false);
const dragStartPointer = { x: 0, y: 0 };
const dragStartOffset = { x: 0, y: 0 };
const isDropHover = ref(false);

const autoSampledColor = ref('#14121A');
const toastMsg = ref('');
const showToastFlag = ref(false);

const drafts = ref<Record<string, any>>({});
const draftName = ref('');

/* ---------------- COMPUTED ---------------- */
const currentTheme = computed(() => {
  return THEMES.find(t => t.id === activeThemeId.value) || THEMES[0];
});

const wordTokens = computed(() => {
  return parseWordTokens(newsState.headlineText);
});

/* ---------------- WATCHERS ---------------- */
watch([newsState, ratio, platform, activeThemeId, photoSrc, logoSrc], () => {
  render();
}, { deep: true });

/* ---------------- METHODS ---------------- */
const showToast = (msg: string) => {
  toastMsg.value = msg;
  showToastFlag.value = true;
  setTimeout(() => { showToastFlag.value = false; }, 2200);
};

const handlePhotoUpload = (file: File) => {
  if (!file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const src = e.target?.result as string;
    photoSrc.value = src;
    const img = new Image();
    img.onload = () => {
      photoEl.value = img;
      autoSampledColor.value = sampleBottomColor(img);
      newsState.photoOffsetX = 0;
      newsState.photoOffsetY = 0;
      newsState.photoScale = 1.0;
      render();
    };
    img.src = src;
  };
  reader.readAsDataURL(file);
};

const onPhotoFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) handlePhotoUpload(file);
};

const onPhotoDrop = (e: DragEvent) => {
  isDropHover.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) handlePhotoUpload(file);
};

const removePhoto = () => {
  photoSrc.value = null;
  photoEl.value = null;
  autoSampledColor.value = '#14121A';
  if (photoFileInput.value) photoFileInput.value.value = '';
  render();
};

const onLogoFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const src = e.target?.result as string;
    logoSrc.value = src;
    const img = new Image();
    img.onload = () => {
      logoEl.value = img;
      render();
    };
    img.src = src;
  };
  reader.readAsDataURL(file);
};

const removeLogo = () => {
  logoSrc.value = null;
  logoEl.value = null;
  if (logoFileInput.value) logoFileInput.value.value = '';
  render();
};

/* Interactive Canvas Pan Control */
const onCanvasPointerDown = (e: PointerEvent) => {
  if (!photoEl.value || !mainCanvas.value) return;
  isDraggingPhoto.value = true;
  dragStartPointer.x = e.clientX;
  dragStartPointer.y = e.clientY;
  dragStartOffset.x = newsState.photoOffsetX;
  dragStartOffset.y = newsState.photoOffsetY;
  (e.target as HTMLElement).setPointerCapture(e.pointerId);
};

const onCanvasPointerMove = (e: PointerEvent) => {
  if (!isDraggingPhoto.value || !mainCanvas.value) return;
  const rect = mainCanvas.value.getBoundingClientRect();
  const scaleRatio = 1080 / rect.width;

  const dx = (e.clientX - dragStartPointer.x) * scaleRatio;
  const dy = (e.clientY - dragStartPointer.y) * scaleRatio;

  newsState.photoOffsetX = Math.round(dragStartOffset.x + dx);
  newsState.photoOffsetY = Math.round(dragStartOffset.y + dy);
};

const onCanvasPointerUp = (e: PointerEvent) => {
  isDraggingPhoto.value = false;
  try {
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  } catch {}
};

const resetPhotoPan = () => {
  newsState.photoOffsetX = 0;
  newsState.photoOffsetY = 0;
  newsState.photoScale = 1.0;
  showToast('Photo position reset');
};

/* Word Highlight Controls */
const toggleHighlightToken = (index: number) => {
  newsState.headlineText = toggleWordHighlight(newsState.headlineText, index);
};

/* Auto Fill Buttons */
const autofillCopyrightHandle = () => {
  const h = pageHandle.value.trim() || '@TelepathicThoughts';
  const clean = h.replace(/^@/, '');
  newsState.copyrightText = `© ${clean} 2026`;
  showToast('Copyright updated from handle');
};

const autofillDate = () => {
  const d = new Date();
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
  let dateStr = '';
  try {
    dateStr = d.toLocaleDateString('bn-BD', options);
  } catch {
    dateStr = d.toLocaleDateString('en-US', options);
  }
  const current = newsState.copyrightText ? `${newsState.copyrightText} · ${dateStr}` : `© ${dateStr}`;
  newsState.copyrightText = current;
  showToast('Date appended to copyright');
};

/* Render Engine Trigger */
const render = () => {
  nextTick(() => {
    if (!mainCanvas.value) return;
    const dims = RATIO_DIMS[ratio.value] || [1080, 1080];
    const bg = currentTheme.value?.bg || '#14121A';
    const accent = currentTheme.value?.accent || '#FFE600';
    const text = currentTheme.value?.text || '#FFFFFF';
    renderNewsCardCanvas(
      mainCanvas.value,
      newsState,
      photoEl.value,
      logoEl.value,
      bg,
      accent,
      text,
      dims
    );
  });
};

/* Exports & Drafts */
const downloadPNG = () => {
  if (!mainCanvas.value) return;
  const link = document.createElement('a');
  link.download = `news-card-${platform.value}-${ratio.value}-${Date.now()}.png`;
  link.href = mainCanvas.value.toDataURL('image/png');
  link.click();
  showToast('News Graphic Downloaded!');
};

const copyImage = async () => {
  if (!mainCanvas.value) return;
  try {
    mainCanvas.value.toBlob(async (blob) => {
      if (!blob) return;
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      showToast('Copied graphic to clipboard!');
    }, 'image/png');
  } catch {
    showToast('Download PNG instead');
  }
};

const saveDraft = () => {
  const name = draftName.value.trim();
  if (!name) {
    showToast('Enter draft name first');
    return;
  }
  drafts.value[name] = {
    state: { ...newsState },
    platform: platform.value,
    ratio: ratio.value,
    themeId: activeThemeId.value,
    photoSrc: photoSrc.value,
    logoSrc: logoSrc.value
  };
  localStorage.setItem('studio_news_drafts', JSON.stringify(drafts.value));
  draftName.value = '';
  showToast(`News draft "${name}" saved ✓`);
};

const loadDrafts = () => {
  const cached = localStorage.getItem('studio_news_drafts');
  drafts.value = cached ? JSON.parse(cached) : {};
};

const selectDraft = (name: string) => {
  const d = drafts.value[name];
  if (!d) return;
  Object.assign(newsState, d.state);
  platform.value = d.platform || 'instagram';
  ratio.value = d.ratio || '1:1';
  activeThemeId.value = d.themeId || 'midnight';

  if (d.photoSrc) {
    photoSrc.value = d.photoSrc;
    const img = new Image();
    img.onload = () => { photoEl.value = img; render(); };
    img.src = d.photoSrc;
  } else {
    photoSrc.value = null; photoEl.value = null;
  }

  if (d.logoSrc) {
    logoSrc.value = d.logoSrc;
    const img = new Image();
    img.onload = () => { logoEl.value = img; render(); };
    img.src = d.logoSrc;
  } else {
    logoSrc.value = null; logoEl.value = null;
  }

  showToast(`Loaded draft "${name}"`);
};

onMounted(() => {
  loadDrafts();
  render();
});
</script>

<template>
  <div class="news-app">
    <!-- SIDEBAR -->
    <div class="news-sidebar">
      <!-- 1. Platform & Ratio -->
      <div class="section">
        <div class="section-label">Platform & Ratio</div>
        <div class="ratio-row">
          <button 
            v-for="r in RATIO_DIMS ? Object.keys(RATIO_DIMS) : []" 
            :key="r"
            class="ratio-chip"
            :class="{ active: r === ratio }"
            @click="ratio = r"
          >
            {{ r }}
          </button>
        </div>
      </div>

      <!-- 2. Photo Zone Controls (Pan / Zoom / Height) -->
      <div class="section">
        <div class="section-label">1. Photo Zone & Controls</div>
        
        <div 
          class="drag-drop-zone"
          @dragover.prevent="isDropHover = true"
          @dragleave.prevent="isDropHover = false"
          @drop.prevent="onPhotoDrop"
          @click="photoFileInput?.click()"
          :class="{ dragging: isDropHover }"
        >
          <input type="file" ref="photoFileInput" accept="image/*" style="display:none;" @change="onPhotoFileChange">
          <div v-if="!photoSrc" style="display:flex; flex-direction:column; align-items:center; gap:6px;">
            <span style="font-size:24px;">📸</span>
            <span style="font-size:11px; font-weight:600; color:var(--text-dim);">Drag & Drop News Photo or Click to Browse</span>
          </div>
          <div v-else style="display:flex; align-items:center; gap:10px;">
            <img :src="photoSrc" style="width:50px; height:50px; object-fit:cover; border-radius:6px;">
            <div style="flex:1; text-align:left;">
              <div style="font-size:11px; font-weight:700;">Photo Uploaded</div>
              <div style="font-size:10px; color:var(--text-dim);">Drag canvas to pan · Use slider to zoom</div>
            </div>
            <button class="btn tiny" @click.stop="removePhoto">Remove</button>
          </div>
        </div>

        <div style="margin-top:12px; display:flex; flex-direction:column; gap:8px;">
          <div class="ctrl-row">
            <span class="ctrl-label">Photo Zone Height ({{ newsState.photoZonePercent }}%)</span>
            <input type="range" v-model.number="newsState.photoZonePercent" min="35" max="75" style="width:130px;">
          </div>

          <div class="ctrl-row">
            <span class="ctrl-label">Zoom Scale ({{ newsState.photoScale.toFixed(2) }}x)</span>
            <input type="range" v-model.number="newsState.photoScale" min="0.5" max="3.0" step="0.05" style="width:130px;">
          </div>

          <div class="ctrl-row">
            <button class="btn tiny" @click="resetPhotoPan" style="width:100%; justify-content:center;">Reset Pan & Zoom</button>
          </div>
        </div>
      </div>

      <!-- 3. Headline Editor & Word Highlight Selector -->
      <div class="section">
        <div class="section-label">2. Headline & Word Highlight</div>

        <label class="field-label">Headline Text (*word* for accent highlight)</label>
        <textarea v-model="newsState.headlineText" placeholder="Enter news headline..."></textarea>

        <label class="field-label" style="margin-top:8px;">Click word to toggle accent highlight:</label>
        <div class="word-chip-grid">
          <button 
            v-for="t in wordTokens" 
            :key="t.index"
            class="word-chip"
            :class="{ highlighted: t.highlighted }"
            @click="toggleHighlightToken(t.index)"
          >
            {{ t.cleanWord }}
          </button>
        </div>
      </div>

      <!-- 4. Logo / Badge Placement & Anchor Points -->
      <div class="section">
        <div class="section-label">3. Brand Logo Badge</div>

        <div style="display:flex; gap:8px; margin-bottom:10px;">
          <input type="file" ref="logoFileInput" accept="image/*" style="display:none;" @change="onLogoFileChange">
          <button class="btn" @click="logoFileInput?.click()" style="flex:1; justify-content:center;">Upload Brand Logo</button>
          <button v-if="logoSrc" class="btn" @click="removeLogo">Remove</button>
        </div>

        <div v-if="logoSrc" class="control-box">
          <div class="toggle-row">
            <span class="ctrl-label">Show Badge</span>
            <div class="switch" :class="{ on: newsState.logoVisible }" @click="newsState.logoVisible = !newsState.logoVisible"></div>
          </div>

          <label class="field-label" style="margin-top:8px;">Badge Anchor Position</label>
          <select v-model="newsState.logoAnchor">
            <option value="top-left">Top Left</option>
            <option value="top-center">Top Center</option>
            <option value="top-right">Top Right</option>
            <option value="seam-left">Seam Left</option>
            <option value="seam-center">Seam Center (Default)</option>
            <option value="seam-right">Seam Right</option>
            <option value="bottom-left">Bottom Left</option>
            <option value="bottom-right">Bottom Right</option>
          </select>

          <div class="ctrl-row" style="margin-top:8px;">
            <span class="ctrl-label">Badge Size</span>
            <input type="range" v-model.number="newsState.logoSize" min="20" max="120" style="width:120px;">
          </div>

          <div class="ctrl-row">
            <span class="ctrl-label">Offset X</span>
            <input type="range" v-model.number="newsState.logoOffsetX" min="-150" max="150" style="width:120px;">
          </div>

          <div class="ctrl-row">
            <span class="ctrl-label">Offset Y</span>
            <input type="range" v-model.number="newsState.logoOffsetY" min="-150" max="150" style="width:120px;">
          </div>
        </div>
      </div>

      <!-- 5. Theme & Color Sampling Overrides -->
      <div class="section">
        <div class="section-label">4. Theme & Colors</div>
        <div class="theme-grid">
          <div 
            v-for="th in THEMES" 
            :key="th.id"
            class="theme-swatch"
            :class="{ active: th.id === activeThemeId }"
            :style="{ background: `linear-gradient(135deg, ${th.bg}, ${th.accent})` }"
            @click="activeThemeId = th.id"
          >
            <span>{{ th.name }}</span>
          </div>
        </div>

        <div style="margin-top:10px; display:flex; flex-direction:column; gap:6px;">
          <div class="ctrl-row">
            <span class="ctrl-label">Auto Edge Color:</span>
            <span class="swatch-dot" :style="{ backgroundColor: autoSampledColor }"></span>
          </div>
          <div class="ctrl-row">
            <span class="ctrl-label">Banner Background Color</span>
            <input type="color" v-model="newsState.bannerColorOverride">
          </div>
          <div class="ctrl-row">
            <span class="ctrl-label">Accent Highlight Color</span>
            <input type="color" v-model="newsState.accentColorOverride">
          </div>
        </div>
      </div>

      <!-- 6. Footer / Copyright Controls -->
      <div class="section">
        <div class="section-label">5. Footer / Copyright</div>
        <input type="text" v-model="newsState.copyrightText" placeholder="e.g. © TelepathicThoughts 2026">
        <div style="display:flex; gap:8px; margin-top:8px;">
          <button class="btn tiny" @click="autofillCopyrightHandle">Use Handle</button>
          <button class="btn tiny" @click="autofillDate">Append Date</button>
        </div>
      </div>

      <!-- 7. Saved Drafts -->
      <div class="section">
        <div class="section-label">Saved Drafts</div>
        <div style="display:flex; gap:8px; margin-bottom:8px;">
          <input type="text" v-model="draftName" placeholder="News draft name..." style="flex:1;">
          <button class="btn" @click="saveDraft">Save</button>
        </div>
        <div class="draft-list-container">
          <div v-if="Object.keys(drafts).length === 0" style="font-size:11px; color:var(--text-dim); text-align:center;">No saved news drafts</div>
          <div v-for="(_d, name) in drafts" :key="name" class="draft-item">
            <span @click="selectDraft(name.toString())">{{ name }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- CANVAS PREVIEW AREA -->
    <div class="news-canvas-area">
      <div class="canvas-hint">
        💡 <strong>Interactive Canvas:</strong> Drag directly on the preview image to pan photo. Use controls in sidebar to zoom or position logo.
      </div>

      <div class="frame-wrap">
        <canvas 
          ref="mainCanvas"
          @pointerdown="onCanvasPointerDown"
          @pointermove="onCanvasPointerMove"
          @pointerup="onCanvasPointerUp"
          @pointercancel="onCanvasPointerUp"
          class="interactive-canvas"
        ></canvas>
      </div>

      <div class="actions">
        <button class="btn primary" @click="downloadPNG">⬇ Download PNG Graphic</button>
        <button class="btn secondary" @click="copyImage">⧉ Copy Image to Clipboard</button>
      </div>
    </div>

    <!-- Toast notification -->
    <div class="toast" :class="{ show: showToastFlag }">
      <span>{{ toastMsg }}</span>
    </div>
  </div>
</template>

<style scoped>
.news-app {
  display: grid;
  grid-template-columns: 400px 1fr;
  min-height: calc(100vh - 56px);
}

@media (max-width: 1024px) {
  .news-app { grid-template-columns: 1fr; }
  .news-canvas-area { order: -1; padding: 20px; }
}

.news-sidebar {
  background: var(--panel);
  border-right: 1px solid var(--line);
  padding: 24px;
  overflow-y: auto;
  height: calc(100vh - 56px);
  box-sizing: border-box;
}

.section { margin-bottom: 24px; }

.section-label {
  font-family: var(--mono);
  font-size: 10.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-dim);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-label::after { content: ''; flex: 1; height: 1px; background: var(--line); }

label.field-label { display: block; font-size: 11.5px; color: var(--text-dim); margin: 8px 0 4px; }

input[type=text], textarea, select {
  width: 100%; background: var(--panel-2); border: 1px solid var(--line);
  color: var(--text); padding: 10px 12px; border-radius: 8px; font-size: 13px;
  font-family: var(--body); resize: vertical; box-sizing: border-box;
}

textarea { min-height: 70px; line-height: 1.4; }

.ratio-row { display: flex; gap: 6px; flex-wrap: wrap; }
.ratio-chip {
  background: var(--panel-2); border: 1px solid var(--line); border-radius: 20px;
  padding: 5px 12px; font-size: 11px; font-family: var(--mono); cursor: pointer; color: var(--text-dim);
}
.ratio-chip.active { background: var(--accent); border-color: var(--accent); color: #fff; }

.drag-drop-zone {
  border: 2px dashed var(--line); border-radius: 10px; padding: 16px;
  text-align: center; cursor: pointer; background: var(--panel-2); transition: all 0.2s;
}
.drag-drop-zone.dragging { border-color: var(--accent); background: rgba(124,92,252,0.15); }

.ctrl-row { display: flex; justify-content: space-between; align-items: center; }
.ctrl-label { font-size: 11px; color: var(--text-dim); }

.word-chip-grid { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.word-chip {
  background: var(--panel-2); border: 1px solid var(--line); color: var(--text-dim);
  padding: 4px 10px; border-radius: 14px; font-size: 11.5px; cursor: pointer; transition: all 0.15s;
}
.word-chip.highlighted {
  background: #FFE600; border-color: #FFE600; color: #000; font-weight: 700;
}

.control-box {
  background: var(--panel-2); border: 1px solid var(--line); border-radius: 8px;
  padding: 12px; display: flex; flex-direction: column; gap: 8px;
}

.toggle-row { display: flex; justify-content: space-between; align-items: center; }
.switch {
  width: 36px; height: 20px; background: var(--panel-2); border: 1px solid var(--line);
  border-radius: 20px; position: relative; cursor: pointer;
}
.switch.on { background: var(--accent); border-color: var(--accent); }
.switch::after {
  content: ''; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px;
  background: #fff; border-radius: 50%; transition: left 0.15s;
}
.switch.on::after { left: 18px; }

.theme-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.theme-swatch { height: 42px; border-radius: 6px; cursor: pointer; position: relative; border: 2px solid transparent; }
.theme-swatch.active { border-color: #fff; }
.theme-swatch span { position: absolute; bottom: 2px; left: 4px; font-size: 8.5px; font-family: var(--mono); color: #fff; background: rgba(0,0,0,0.5); padding: 1px 4px; border-radius: 3px; }

.swatch-dot { width: 18px; height: 18px; border-radius: 50%; border: 1px solid var(--line); display: inline-block; }

.news-canvas-area {
  display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
  padding: 24px; background: var(--bg); overflow-y: auto; height: calc(100vh - 56px); box-sizing: border-box;
}

.canvas-hint {
  max-width: 520px; width: 100%; margin-bottom: 14px; background: var(--panel-2);
  border: 1px solid var(--line); border-radius: 8px; padding: 10px 14px; font-size: 11.5px; color: var(--text); text-align: left;
}

.frame-wrap { max-width: 520px; width: 100%; display: flex; justify-content: center; margin-bottom: 20px; }
.interactive-canvas {
  width: 100% !important; height: auto !important; border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.6); border: 1px solid var(--line); cursor: grab; touch-action: none;
}
.interactive-canvas:active { cursor: grabbing; }

.actions { display: flex; gap: 10px; max-width: 520px; width: 100%; }
.btn { background: var(--panel-2); border: 1px solid var(--line); color: var(--text); padding: 8px 14px; border-radius: 8px; font-weight: 600; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 6px; }
.btn.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
.btn.secondary { background: var(--panel); }
.btn.tiny { padding: 4px 8px; font-size: 11px; }

.toast { position: fixed; bottom: 24px; right: 24px; background: var(--panel-2); border: 1px solid var(--accent); color: var(--text); padding: 10px 18px; border-radius: 8px; font-weight: 600; font-size: 12.5px; opacity: 0; transform: translateY(20px); transition: all 0.2s; pointer-events: none; z-index: 2000; }
.toast.show { opacity: 1; transform: translateY(0); }

.draft-item { background: var(--panel-2); border: 1px solid var(--line); padding: 6px 10px; border-radius: 6px; font-size: 11.5px; cursor: pointer; margin-bottom: 4px; }
</style>
