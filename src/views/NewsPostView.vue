<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue';
import { parseWordTokens, toggleWordHighlight } from '../utils/textHelper';
import { 
  renderNewsCardCanvas, 
  sampleBottomColor, 
  samplePhotoPalette, 
  type NewsCardState, 
  type ExtractedPalette 
} from '../utils/newsCardCanvas';

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
  category: 'dark' | 'light' | 'vibrant';
  bg: string;
  accent: string;
  text: string;
  badge?: string;
}

const THEMES: Theme[] = [
  { id: 'auto', name: 'Auto (Photo Extracted)', category: 'vibrant', bg: '#121019', accent: '#FFE600', text: '#FFFFFF', badge: 'Default ✨' },
  { id: 'midnight', name: 'Midnight Gold', category: 'dark', bg: '#121019', accent: '#FFE600', text: '#FFFFFF', badge: 'Popular' },
  { id: 'channel_red', name: 'Channel 24 Red', category: 'vibrant', bg: '#180407', accent: '#FF2E4C', text: '#FFFFFF', badge: 'Breaking' },
  { id: 'jamuna_blue', name: 'Jamuna Broadcast', category: 'dark', bg: '#0A1128', accent: '#00E5FF', text: '#FFFFFF', badge: 'TV Style' },
  { id: 'emerald_times', name: 'Emerald Times', category: 'dark', bg: '#051A14', accent: '#20E298', text: '#FFFFFF', badge: 'Editorial' },
  { id: 'cyber_dark', name: 'Cyber OLED', category: 'dark', bg: '#080808', accent: '#FFD700', text: '#F0F0F0', badge: 'OLED' },
  { id: 'cream_editorial', name: 'Editorial Cream', category: 'light', bg: '#F5F0E6', accent: '#D94E28', text: '#1F1A17', badge: 'Light Mode' },
  { id: 'sunset_crimson', name: 'Sunset Amber', category: 'vibrant', bg: '#160810', accent: '#FF7D3B', text: '#FFFFFF' },
  { id: 'neon_magenta', name: 'Neon Magenta', category: 'vibrant', bg: '#13091F', accent: '#F72585', text: '#FFFFFF' },
  { id: 'teal_horizon', name: 'Teal Horizon', category: 'dark', bg: '#041B24', accent: '#1BE7D4', text: '#FFFFFF' },
  { id: 'monochrome', name: 'Monochrome Jet', category: 'dark', bg: '#0D0D0D', accent: '#FFFFFF', text: '#F0F0F0', badge: 'Minimal' },
  { id: 'royal_indigo', name: 'Royal Indigo', category: 'dark', bg: '#0D1126', accent: '#5C7CFF', text: '#FFFFFF' },
  { id: 'soft_pastel', name: 'Soft Pastel', category: 'light', bg: '#FBF0F4', accent: '#FF4D8D', text: '#2E1E26', badge: 'Pastel' }
];

const PRESET_ACCENTS = [
  '#FFE600', '#FF2E4C', '#00E5FF', '#20E298', '#FF7D3B', '#F72585', '#1BE7D4', '#5C7CFF', '#FFFFFF'
];

/* ---------------- STATE ---------------- */
const platform = ref('instagram');
const ratio = ref('1:1');
const activeThemeId = ref('auto');
const themeFilter = ref<'all' | 'dark' | 'vibrant' | 'light'>('all');

const newsState = reactive<NewsCardState>({
  headlineText: 'এখানে আপনার সংবাদ *শিরোনাম* লিখুন',
  copyrightText: '© TelepathicThoughts',
  
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
const extractedPalette = ref<ExtractedPalette | null>(null);

const toastMsg = ref('');
const showToastFlag = ref(false);

const drafts = ref<Record<string, any>>({});
const draftName = ref('');

/* ---------------- COMPUTED ---------------- */
const currentTheme = computed(() => {
  return THEMES.find(t => t.id === activeThemeId.value) || THEMES[0];
});

const filteredThemes = computed(() => {
  if (themeFilter.value === 'all') return THEMES;
  return THEMES.filter(t => t.category === themeFilter.value);
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
      const palette = samplePhotoPalette(img);
      extractedPalette.value = palette;
      autoSampledColor.value = palette.dominant;
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
  extractedPalette.value = null;
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
  if (isDraggingPhoto.value && mainCanvas.value) {
    isDraggingPhoto.value = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  }
};

const resetPhotoTransform = () => {
  newsState.photoOffsetX = 0;
  newsState.photoOffsetY = 0;
  newsState.photoScale = 1.0;
  showToast('Photo position reset');
};

/* Word Highlight Toggle */
const toggleWordToken = (index: number) => {
  newsState.headlineText = toggleWordHighlight(newsState.headlineText, index);
};

/* Color Actions */
const applyAutoSampledColor = () => {
  if (extractedPalette.value) {
    newsState.bannerColorOverride = extractedPalette.value.darkBg;
    newsState.sampledColorOverride = extractedPalette.value.dominant;
    newsState.textColorOverride = extractedPalette.value.textColor;
    newsState.accentColorOverride = extractedPalette.value.accent;
  } else {
    newsState.bannerColorOverride = autoSampledColor.value;
  }
  showToast('Extracted photo colors applied');
};

const resetColorOverrides = () => {
  newsState.bannerColorOverride = '';
  newsState.accentColorOverride = '';
  newsState.textColorOverride = '';
  newsState.sampledColorOverride = '';
  showToast('Color overrides reset');
};

/* Auto Fill Buttons */
const autofillCopyrightHandle = () => {
  const h = pageHandle.value.trim() || '@TelepathicThoughts';
  const clean = h.replace(/^@/, '');
  newsState.copyrightText = `© ${clean}`;
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

/* Draft Actions */
const loadDrafts = () => {
  const cached = localStorage.getItem('news_studio_drafts');
  drafts.value = cached ? JSON.parse(cached) : {};
};

const saveDraft = () => {
  const name = draftName.value.trim();
  if (!name) {
    showToast('Enter a draft name first!');
    return;
  }
  drafts.value[name] = {
    state: { ...newsState },
    photoSrc: photoSrc.value,
    logoSrc: logoSrc.value,
    activeThemeId: activeThemeId.value
  };
  localStorage.setItem('news_studio_drafts', JSON.stringify(drafts.value));
  draftName.value = '';
  showToast(`News Draft "${name}" saved ✓`);
};

const deleteDraft = (name: string) => {
  delete drafts.value[name];
  localStorage.setItem('news_studio_drafts', JSON.stringify(drafts.value));
  showToast(`Draft "${name}" deleted`);
};

const selectDraft = (name: string) => {
  const d = drafts.value[name];
  if (!d) return;

  Object.assign(newsState, d.state);
  if (d.activeThemeId) activeThemeId.value = d.activeThemeId;

  if (d.photoSrc) {
    photoSrc.value = d.photoSrc;
    const img = new Image();
    img.onload = () => {
      photoEl.value = img;
      const palette = samplePhotoPalette(img);
      extractedPalette.value = palette;
      autoSampledColor.value = palette.dominant;
      render();
    };
    img.src = d.photoSrc;
  } else {
    photoSrc.value = null;
    photoEl.value = null;
    extractedPalette.value = null;
  }

  if (d.logoSrc) {
    logoSrc.value = d.logoSrc;
    const img = new Image();
    img.onload = () => {
      logoEl.value = img;
      render();
    };
    img.src = d.logoSrc;
  } else {
    logoSrc.value = null;
    logoEl.value = null;
  }

  showToast(`Loaded draft "${name}"`);
};

/* Exports */
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
      showToast('Copied news graphic to clipboard!');
    }, 'image/png');
  } catch {
    showToast('Clipboard copy unsupported — please download');
  }
};

/* Render Engine */
const render = () => {
  nextTick(() => {
    if (!mainCanvas.value) return;
    const dims = RATIO_DIMS[ratio.value] || [1080, 1080];
    
    let thBg = currentTheme.value?.bg || '#121019';
    let thAccent = currentTheme.value?.accent || '#FFE600';
    let thText = currentTheme.value?.text || '#FFFFFF';

    if (activeThemeId.value === 'auto' && extractedPalette.value) {
      thBg = extractedPalette.value.darkBg;
      thAccent = extractedPalette.value.accent;
      thText = extractedPalette.value.textColor;
    }

    renderNewsCardCanvas(
      mainCanvas.value,
      newsState,
      photoEl.value,
      logoEl.value,
      thBg,
      thAccent,
      thText,
      dims
    );
  });
};

onMounted(() => {
  loadDrafts();
  render();
});
</script>

<template>
  <div class="news-app">
    <!-- SIDEBAR CONTROLS -->
    <div class="sidebar">
      <div class="mode-title">
        <span>📰 News Post Card Mode</span>
        <span class="mode-badge">Bangladeshi News Card Style</span>
      </div>

      <!-- 1. Photo Zone Upload & Scale -->
      <div class="section">
        <div class="section-label">1. Photo Zone & Layout</div>
        
        <label class="field-label">Upload News Photo</label>
        <div 
          class="drop-zone"
          :class="{ 'drop-active': isDropHover, 'has-file': !!photoSrc }"
          @dragover.prevent="isDropHover = true"
          @dragleave.prevent="isDropHover = false"
          @drop.prevent="onPhotoDrop"
        >
          <input type="file" ref="photoFileInput" accept="image/*" style="display:none;" @change="onPhotoFileChange">
          <div v-if="!photoSrc" class="drop-msg" @click="photoFileInput?.click()">
            <span class="drop-icon">📸</span>
            <strong>Click or Drag Photo Here</strong>
            <span class="sub">Auto cover-cropped, zero distortion</span>
          </div>
          <div v-else class="file-loaded-info">
            <span>✓ Photo Loaded</span>
            <div style="display:flex; gap:6px;">
              <button class="btn tiny" @click="photoFileInput?.click()">Change</button>
              <button class="btn tiny danger" @click="removePhoto">Remove</button>
            </div>
          </div>
        </div>

        <div v-if="photoSrc" class="photo-controls">
          <div class="slider-field">
            <div class="lbl-row">
              <label>Photo Zone Height</label>
              <span>{{ newsState.photoZonePercent }}%</span>
            </div>
            <input type="range" min="35" max="75" v-model.number="newsState.photoZonePercent">
          </div>

          <div class="slider-field">
            <div class="lbl-row">
              <label>Photo Zoom Scale</label>
              <span>{{ newsState.photoScale.toFixed(2) }}x</span>
            </div>
            <input type="range" min="0.5" max="3.0" step="0.05" v-model.number="newsState.photoScale">
          </div>

          <button class="btn tiny" style="width:100%; justify-content:center; margin-top:4px;" @click="resetPhotoTransform">
            ↺ Reset Photo Pan/Zoom Position
          </button>
        </div>
      </div>

      <!-- 2. Platform & Aspect Ratio -->
      <div class="section">
        <div class="section-label">2. Platform & Ratio</div>
        <div class="platform-grid">
          <div 
            v-for="p in PLATFORMS" 
            :key="p.id" 
            class="platform-btn"
            :class="{ active: p.id === platform }"
            @click="platform = p.id; ratio = PLATFORMS.find(x => x.id === p.id)?.ratios[0] || '1:1';"
          >
            <span class="pico">{{ p.icon }}</span>{{ p.label }}
          </div>
        </div>

        <div class="ratio-row" style="margin-top:10px;">
          <div 
            v-for="r in PLATFORMS.find(x => x.id === platform)?.ratios" 
            :key="r"
            class="ratio-chip"
            :class="{ active: r === ratio }"
            @click="ratio = r"
          >
            {{ r }}
          </div>
        </div>
      </div>

      <!-- 3. Headline Text & Word Highlight Editor -->
      <div class="section">
        <div class="section-label">3. News Headline</div>
        <label class="field-label">Headline Text (*word* for accent highlight)</label>
        <textarea v-model="newsState.headlineText" placeholder="এখানে আপনার সংবাদ শিরোনাম লিখুন..." rows="3"></textarea>

        <label class="field-label">Interactive Word Highlight Chips</label>
        <div class="word-chip-grid">
          <span 
            v-for="(t, idx) in wordTokens" 
            :key="idx"
            class="wtoken-chip"
            :class="{ highlighted: t.highlighted }"
            @click="toggleWordToken(idx)"
          >
            {{ t.cleanWord }}
          </span>
        </div>

        <div class="toggle-row" style="margin-top:12px;">
          <label class="field-label" style="margin:0;">Auto-fit Headline Font Size</label>
          <div class="switch" :class="{ on: newsState.autoFit }" @click="newsState.autoFit = !newsState.autoFit"></div>
        </div>

        <div v-if="!newsState.autoFit" class="slider-field" style="margin-top:10px;">
          <div class="lbl-row">
            <label>Headline Font Size</label>
            <span>{{ newsState.titleFontSize }}px</span>
          </div>
          <input type="range" min="30" max="120" v-model.number="newsState.titleFontSize">
        </div>
      </div>

      <!-- 4. Theme & Colors System -->
      <div class="section">
        <div class="section-label">4. Theme & Color System</div>

        <!-- Filter Category Tabs -->
        <div class="theme-cat-tabs">
          <button 
            v-for="cat in ['all', 'dark', 'vibrant', 'light'] as const" 
            :key="cat"
            class="cat-tab"
            :class="{ active: themeFilter === cat }"
            @click="themeFilter = cat"
          >
            {{ cat.toUpperCase() }}
          </button>
        </div>

        <!-- Palette Card Grid -->
        <div class="theme-card-grid">
          <div 
            v-for="th in filteredThemes" 
            :key="th.id"
            class="palette-card"
            :class="{ active: th.id === activeThemeId }"
            @click="activeThemeId = th.id"
          >
            <div class="palette-bar">
              <div class="bar-bg" :style="{ backgroundColor: th.id === 'auto' && extractedPalette ? extractedPalette.darkBg : th.bg }"></div>
              <div class="bar-accent" :style="{ backgroundColor: th.id === 'auto' && extractedPalette ? extractedPalette.accent : th.accent }"></div>
            </div>
            <div class="palette-meta">
              <span class="palette-title">{{ th.name }}</span>
              <span v-if="th.badge" class="palette-badge">{{ th.badge }}</span>
            </div>
            <div v-if="th.id === activeThemeId" class="active-badge">✓</div>
          </div>
        </div>

        <!-- Live Auto-Extracted Palette Card -->
        <div v-if="activeThemeId === 'auto'" class="auto-palette-card">
          <div class="auto-card-title">
            <span>✨ Live Extracted Photo Palette</span>
            <button class="btn tiny" @click="applyAutoSampledColor">Apply Extracted</button>
          </div>

          <div v-if="extractedPalette" class="auto-swatches-grid">
            <div class="auto-swatch-item">
              <label>Banner Background</label>
              <div class="swatch-picker-row">
                <input type="color" :value="newsState.bannerColorOverride || extractedPalette.darkBg" @input="e => newsState.bannerColorOverride = (e.target as HTMLInputElement).value">
                <span class="swatch-hex">{{ newsState.bannerColorOverride || extractedPalette.darkBg }}</span>
              </div>
            </div>

            <div class="auto-swatch-item">
              <label>Fade Start Color</label>
              <div class="swatch-picker-row">
                <input type="color" :value="newsState.sampledColorOverride || extractedPalette.dominant" @input="e => newsState.sampledColorOverride = (e.target as HTMLInputElement).value">
                <span class="swatch-hex">{{ newsState.sampledColorOverride || extractedPalette.dominant }}</span>
              </div>
            </div>

            <div class="auto-swatch-item">
              <label>Headline Highlight</label>
              <div class="swatch-picker-row">
                <input type="color" :value="newsState.accentColorOverride || extractedPalette.accent" @input="e => newsState.accentColorOverride = (e.target as HTMLInputElement).value">
                <span class="swatch-hex">{{ newsState.accentColorOverride || extractedPalette.accent }}</span>
              </div>
            </div>

            <div class="auto-swatch-item">
              <label>Base Headline Text</label>
              <div class="swatch-picker-row">
                <input type="color" :value="newsState.textColorOverride || extractedPalette.textColor" @input="e => newsState.textColorOverride = (e.target as HTMLInputElement).value">
                <span class="swatch-hex">{{ newsState.textColorOverride || extractedPalette.textColor }}</span>
              </div>
            </div>
          </div>
          <div v-else style="font-size:11px; color:var(--text-dim); text-align:center; padding:8px;">
            Upload a photo to see auto-extracted live colors!
          </div>
        </div>

        <!-- Manual Color Sampling & Custom Overrides -->
        <div class="color-overrides-box">
          <div class="override-header">
            <span>Color Overrides & Pickers</span>
            <button class="btn tiny" @click="resetColorOverrides">Reset Overrides</button>
          </div>

          <!-- Color Pickers -->
          <div class="color-picker-grid">
            <div class="picker-item">
              <label>Banner Bg</label>
              <div class="picker-row">
                <input type="color" v-model="newsState.bannerColorOverride">
                <span class="hex-val">{{ newsState.bannerColorOverride || currentTheme?.bg }}</span>
              </div>
            </div>

            <div class="picker-item">
              <label>Accent Highlight</label>
              <div class="picker-row">
                <input type="color" v-model="newsState.accentColorOverride">
                <span class="hex-val">{{ newsState.accentColorOverride || currentTheme?.accent }}</span>
              </div>
            </div>

            <div class="picker-item">
              <label>Base Text</label>
              <div class="picker-row">
                <input type="color" v-model="newsState.textColorOverride">
                <span class="hex-val">{{ newsState.textColorOverride || currentTheme?.text }}</span>
              </div>
            </div>
          </div>

          <!-- Quick Swatch Palette Dots -->
          <div class="quick-swatches">
            <span style="font-size:10.5px; color:var(--text-dim);">Quick Accent:</span>
            <div class="swatch-dots">
              <span 
                v-for="col in PRESET_ACCENTS" 
                :key="col"
                class="dot-btn"
                :style="{ backgroundColor: col }"
                @click="newsState.accentColorOverride = col"
              ></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 5. Brand Logo Badge Controls -->
      <div class="section">
        <div class="section-label">5. Brand Logo Badge</div>
        <div class="toggle-row">
          <label class="field-label" style="margin:0;">Show Logo Badge</label>
          <div class="switch" :class="{ on: newsState.logoVisible }" @click="newsState.logoVisible = !newsState.logoVisible"></div>
        </div>

        <div v-if="newsState.logoVisible" style="margin-top:12px;">
          <label class="field-label">Upload Brand Logo</label>
          <div style="display:flex; gap:8px;">
            <input type="file" ref="logoFileInput" accept="image/*" style="display:none;" @change="onLogoFileChange">
            <button class="btn" @click="logoFileInput?.click()" style="padding:6px 12px; font-size:12px; flex:1;">
              {{ logoSrc ? '✓ Change Logo' : 'Upload Logo Image' }}
            </button>
            <button v-if="logoSrc" class="btn tiny danger" @click="removeLogo">Remove</button>
          </div>

          <label class="field-label">Logo Position Preset</label>
          <select v-model="newsState.logoAnchor">
            <option value="seam-center">Center Seam (Reference Style)</option>
            <option value="seam-left">Left Seam</option>
            <option value="seam-right">Right Seam</option>
            <option value="top-left">Top Left</option>
            <option value="top-center">Top Center</option>
            <option value="top-right">Top Right</option>
            <option value="bottom-left">Bottom Left</option>
            <option value="bottom-right">Bottom Right</option>
          </select>

          <div class="slider-field">
            <div class="lbl-row">
              <label>Logo Size Radius</label>
              <span>{{ newsState.logoSize }}px</span>
            </div>
            <input type="range" min="20" max="100" v-model.number="newsState.logoSize">
          </div>

          <div class="slider-field">
            <div class="lbl-row">
              <label>Fine Offset X</label>
              <span>{{ newsState.logoOffsetX }}px</span>
            </div>
            <input type="range" min="-200" max="200" v-model.number="newsState.logoOffsetX">
          </div>

          <div class="slider-field">
            <div class="lbl-row">
              <label>Fine Offset Y</label>
              <span>{{ newsState.logoOffsetY }}px</span>
            </div>
            <input type="range" min="-200" max="200" v-model.number="newsState.logoOffsetY">
          </div>
        </div>
      </div>

      <!-- 6. Footer / Copyright Controls -->
      <div class="section">
        <div class="section-label">6. Footer / Copyright</div>
        <input type="text" v-model="newsState.copyrightText" placeholder="e.g. © TelepathicThoughts">
        <div style="display:flex; gap:8px; margin-top:8px;">
          <button class="btn tiny" @click="autofillCopyrightHandle">Use Handle</button>
          <button class="btn tiny" @click="autofillDate">Append Date</button>
        </div>
      </div>

      <!-- 7. Saved Drafts -->
      <div class="section">
        <div class="section-label">7. Saved News Drafts</div>
        <div style="display:flex; gap:8px; margin-bottom:8px;">
          <input type="text" v-model="draftName" placeholder="News draft name..." style="flex:1;">
          <button class="btn" @click="saveDraft">Save</button>
        </div>
        <div class="draft-list-container">
          <div v-if="Object.keys(drafts).length === 0" style="font-size:11px; color:var(--text-dim); text-align:center;">No saved drafts</div>
          <div v-for="(d, name) in drafts" :key="name" class="draft-item">
            <span class="draft-name" @click="selectDraft(name.toString())">{{ name }}</span>
            <button class="draft-del-btn" @click="deleteDraft(name.toString())">✕</button>
          </div>
        </div>
      </div>
    </div>

    <!-- CANVAS PREVIEW & INTERACTION AREA -->
    <div class="canvas-area">
      <div class="canvas-header-hint">
        <span>💡 Click & Drag canvas to pan photo | Scroll scale slider in sidebar to zoom</span>
      </div>

      <div 
        class="frame-wrap" 
        id="newsFrameWrap"
        :class="{ 'is-dragging': isDraggingPhoto }"
        @pointerdown="onCanvasPointerDown"
        @pointermove="onCanvasPointerMove"
        @pointerup="onCanvasPointerUp"
      >
        <canvas ref="mainCanvas"></canvas>
      </div>

      <div class="actions">
        <button class="btn primary" @click="downloadPNG">⬇ Download PNG Graphic</button>
        <button class="btn" @click="copyImage">⧉ Copy Image</button>
      </div>
    </div>

    <!-- Toast system -->
    <div class="toast" :class="{ show: showToastFlag }">
      <span>{{ toastMsg }}</span>
    </div>
  </div>
</template>

<style scoped>
.news-app {
  display: grid;
  grid-template-columns: 440px 1fr;
  min-height: calc(100vh - 56px);
}

@media (max-width: 1024px) {
  .news-app { grid-template-columns: 1fr; }
  .canvas-area { order: -1; padding: 24px 16px 40px; }
}

.sidebar {
  background: var(--panel);
  border-right: 1px solid var(--line);
  padding: 24px;
  overflow-y: auto;
  height: calc(100vh - 56px);
}

.mode-title {
  display: flex; flex-direction: column; gap: 4px; margin-bottom: 20px;
}
.mode-title span { font-size: 15px; font-weight: 800; color: var(--text); }
.mode-badge { font-family: var(--mono); font-size: 10.5px; color: var(--accent); }

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

label.field-label { display: block; font-size: 12px; color: var(--text-dim); margin: 12px 0 6px; }

input[type=text], textarea, select {
  width: 100%; background: var(--panel-2); border: 1px solid var(--line);
  color: var(--text); padding: 10px 12px; border-radius: 8px; font-size: 13.5px;
  font-family: var(--body); resize: vertical; box-sizing: border-box;
}

.drop-zone {
  border: 2px dashed var(--line); border-radius: 12px; padding: 16px;
  text-align: center; background: var(--panel-2); transition: all 0.2s ease; cursor: pointer;
}
.drop-zone.drop-active { border-color: var(--accent); background: rgba(124, 92, 252, 0.12); }
.drop-zone.has-file { border-style: solid; border-color: var(--line); padding: 12px; }
.drop-msg { display: flex; flex-direction: column; align-items: center; gap: 4px; color: var(--text-dim); }
.drop-icon { font-size: 24px; margin-bottom: 2px; }
.sub { font-size: 11px; }

.file-loaded-info { display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: 700; color: var(--text); }

.photo-controls { margin-top: 12px; display: flex; flex-direction: column; gap: 10px; }
.slider-field { display: flex; flex-direction: column; gap: 4px; }
.lbl-row { display: flex; justify-content: space-between; font-size: 11.5px; color: var(--text-dim); }
.slider-field input[type=range] { width: 100%; cursor: pointer; }

.platform-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.platform-btn {
  background: var(--panel-2); border: 1px solid var(--line); border-radius: 8px;
  padding: 10px 4px; cursor: pointer; color: var(--text-dim); font-size: 10.5px;
  font-family: var(--mono); text-align: center;
}
.platform-btn.active { border-color: var(--accent); color: var(--text); background: rgba(124, 92, 252, 0.14); }

.ratio-row { display: flex; gap: 8px; flex-wrap: wrap; }
.ratio-chip {
  background: var(--panel-2); border: 1px solid var(--line); border-radius: 20px;
  padding: 6px 12px; font-size: 11.5px; font-family: var(--mono); cursor: pointer; color: var(--text-dim);
}
.ratio-chip.active { background: var(--accent); border-color: var(--accent); color: #fff; }

.word-chip-grid { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.wtoken-chip {
  font-family: var(--body); font-size: 12px; background: var(--panel-2);
  border: 1px solid var(--line); padding: 5px 10px; border-radius: 6px;
  cursor: pointer; color: var(--text-dim); transition: all 0.15s;
}
.wtoken-chip.highlighted { background: var(--accent); border-color: var(--accent); color: #fff; font-weight: 700; }

/* Theme UI */
.theme-cat-tabs {
  display: flex; gap: 4px; background: var(--panel-2); padding: 3px;
  border-radius: 8px; border: 1px solid var(--line); margin-bottom: 12px;
}
.cat-tab {
  flex: 1; background: transparent; border: none; color: var(--text-dim);
  font-family: var(--mono); font-size: 9.5px; font-weight: 700; padding: 5px 0;
  border-radius: 6px; cursor: pointer; text-align: center; transition: all 0.15s;
}
.cat-tab.active { background: var(--accent); color: #fff; }

.theme-card-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px;
}

.palette-card {
  background: var(--panel-2); border: 1px solid var(--line); border-radius: 10px;
  padding: 8px; cursor: pointer; position: relative; transition: all 0.18s ease;
  display: flex; flex-direction: column; gap: 6px; text-align: left;
}
.palette-card:hover { border-color: var(--accent); transform: translateY(-1px); }
.palette-card.active { border-color: var(--accent); background: rgba(124, 92, 252, 0.12); box-shadow: 0 0 12px rgba(124, 92, 252, 0.25); }

.palette-bar {
  height: 20px; border-radius: 6px; display: flex; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);
}
.bar-bg { flex: 2; height: 100%; }
.bar-accent { flex: 1; height: 100%; }

.palette-meta { display: flex; align-items: center; justify-content: space-between; gap: 4px; }
.palette-title { font-size: 11px; font-weight: 700; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.palette-badge { font-family: var(--mono); font-size: 8px; background: rgba(255,255,255,0.12); padding: 1px 4px; border-radius: 3px; color: var(--text-dim); }

.active-badge {
  position: absolute; top: 4px; right: 4px; width: 16px; height: 16px; border-radius: 50%;
  background: var(--accent); color: #fff; font-size: 9px; font-weight: 900;
  display: flex; align-items: center; justify-content: center;
}

/* Auto Extracted Palette Card */
.auto-palette-card {
  background: var(--panel-2); border: 1px solid var(--accent); border-radius: 10px;
  padding: 12px; margin-bottom: 14px; display: flex; flex-direction: column; gap: 10px;
  box-shadow: 0 4px 14px rgba(124, 92, 252, 0.15);
}
.auto-card-title { display: flex; justify-content: space-between; align-items: center; font-size: 11px; font-weight: 700; color: var(--text); }
.auto-swatches-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.auto-swatch-item label { display: block; font-size: 9.5px; color: var(--text-dim); margin-bottom: 3px; font-family: var(--mono); }
.swatch-picker-row { display: flex; align-items: center; gap: 6px; background: var(--panel); border: 1px solid var(--line); padding: 4px 6px; border-radius: 6px; }
.swatch-picker-row input[type=color] { width: 22px; height: 22px; border-radius: 4px; border: none; background: none; cursor: pointer; padding: 0; }
.swatch-hex { font-family: var(--mono); font-size: 9.5px; color: var(--text-dim); text-transform: uppercase; }

.color-overrides-box {
  background: var(--panel-2); border: 1px solid var(--line); border-radius: 10px;
  padding: 12px; display: flex; flex-direction: column; gap: 10px;
}
.override-header { display: flex; justify-content: space-between; align-items: center; font-size: 11px; font-weight: 700; }

.color-picker-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.picker-item label { display: block; font-size: 9.5px; color: var(--text-dim); margin-bottom: 3px; font-family: var(--mono); }
.picker-row { display: flex; align-items: center; gap: 4px; background: var(--panel); border: 1px solid var(--line); padding: 3px 5px; border-radius: 6px; }
.picker-row input[type=color] { width: 20px; height: 20px; border-radius: 4px; border: none; background: none; cursor: pointer; padding: 0; }
.hex-val { font-family: var(--mono); font-size: 9px; color: var(--text-dim); text-transform: uppercase; overflow: hidden; text-overflow: ellipsis; }

.quick-swatches { display: flex; align-items: center; justify-content: space-between; margin-top: 2px; }
.swatch-dots { display: flex; gap: 4px; }
.dot-btn { width: 14px; height: 14px; border-radius: 50%; cursor: pointer; border: 1px solid rgba(255,255,255,0.2); transition: transform 0.15s; }
.dot-btn:hover { transform: scale(1.25); }

.toggle-row { display: flex; align-items: center; justify-content: space-between; }
.switch { width: 38px; height: 22px; background: var(--panel-2); border: 1px solid var(--line); border-radius: 20px; position: relative; cursor: pointer; }
.switch.on { background: var(--accent); border-color: var(--accent); }
.switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; background: #fff; border-radius: 50%; transition: left .15s; }
.switch.on::after { left: 18px; }

.canvas-area {
  display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
  padding: 24px 24px 60px; background: var(--bg); overflow-y: auto; height: calc(100vh - 56px); box-sizing: border-box;
}

.canvas-header-hint { font-family: var(--mono); font-size: 11px; color: var(--text-dim); margin-bottom: 12px; }

.frame-wrap {
  max-width: 540px; width: 100%; position: relative; display: flex; justify-content: center;
  align-items: center; margin-bottom: 20px; cursor: grab; user-select: none; touch-action: none;
}
.frame-wrap.is-dragging { cursor: grabbing; }
.frame-wrap canvas {
  width: 100% !important; height: auto !important; border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5); border: 1px solid var(--line); display: block;
}

.actions { display: flex; gap: 10px; width: 100%; max-width: 540px; }
.btn { background: var(--panel-2); border: 1px solid var(--line); color: var(--text); padding: 10px 16px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; }
.btn.primary { background: var(--accent); border-color: var(--accent); color: #fff; flex: 1; justify-content: center; }
.btn.tiny { padding: 4px 8px; font-size: 11px; }
.btn.danger { background: rgba(255,77,77,0.15); color: #ff4d4d; border-color: rgba(255,77,77,0.3); }

.toast { position: fixed; bottom: 24px; right: 24px; background: var(--panel-2); border: 1px solid var(--accent); color: var(--text); padding: 12px 20px; border-radius: 10px; font-weight: 600; font-size: 13px; opacity: 0; transform: translateY(20px); transition: all 0.25s; pointer-events: none; z-index: 2000; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
.toast.show { opacity: 1; transform: translateY(0); }
.draft-item { display: flex; justify-content: space-between; align-items: center; background: var(--panel-2); border: 1px solid var(--line); border-radius: 6px; padding: 6px 10px; margin-bottom: 6px; font-size: 12px; cursor: pointer; }
.draft-del-btn { background: none; border: none; color: var(--text-dim); cursor: pointer; }
</style>
