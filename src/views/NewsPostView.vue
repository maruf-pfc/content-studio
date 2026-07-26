<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue';
import { parseWordTokens, toggleWordHighlight } from '../utils/textHelper';
import { 
  renderNewsCardCanvas, 
  samplePhotoPalette, 
  type NewsCardState, 
  type ExtractedPalette 
} from '../utils/newsCardCanvas';

import StudioCard from '../components/StudioCard.vue';
import PhotoDropzone from '../components/PhotoDropzone.vue';
import PlatformRatioSelector, { type Platform } from '../components/PlatformRatioSelector.vue';
import CanvasToolbar from '../components/CanvasToolbar.vue';
import QuickNavPills from '../components/QuickNavPills.vue';
import ToastNotification from '../components/ToastNotification.vue';

/* ---------------- DATA PRESETS ---------------- */
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

const QUICK_NAV_ITEMS = [
  { id: 'section-photo', label: '📸 Photo' },
  { id: 'section-platform', label: '📐 Ratio' },
  { id: 'section-headline', label: '📰 Headline' },
  { id: 'section-theme', label: '🎨 Theme' },
  { id: 'section-logo', label: '🏅 Logo' },
  { id: 'section-footer', label: '✍️ Footer' },
  { id: 'section-drafts', label: '📁 Drafts' }
];

/* ---------------- STATE ---------------- */
const platform = ref('instagram');
const ratio = ref('1:1');
const activeThemeId = ref('auto');
const themeFilter = ref<'all' | 'dark' | 'vibrant' | 'light'>('all');
const canvasFitMode = ref<'fit' | '75' | '100'>('fit');

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

const isDraggingPhoto = ref(false);
const dragStartPointer = { x: 0, y: 0 };
const dragStartOffset = { x: 0, y: 0 };

const autoSampledColor = ref('#14121A');
const extractedPalette = ref<ExtractedPalette | null>(null);

const toastMsg = ref('');
const showToastFlag = ref(false);

interface NewsDraftItem {
  state: NewsCardState;
  photoSrc: string | null;
  logoSrc: string | null;
  activeThemeId: string;
}

const drafts = ref<Record<string, NewsDraftItem>>({});
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

/* ---------------- WATCHERS & LIFECYCLE ---------------- */
watch([newsState, ratio, platform, activeThemeId, photoSrc, logoSrc], () => {
  render();
}, { deep: true });

/* ---------------- METHODS ---------------- */
const showToast = (msg: string) => {
  toastMsg.value = msg;
  showToastFlag.value = true;
  setTimeout(() => { showToastFlag.value = false; }, 2200);
};

const scrollToSection = (id: string) => {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

const handlePhotoUpload = (file: File) => {
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
      showToast('News photo loaded ✓');
    };
    img.src = src;
  };
  reader.readAsDataURL(file);
};

const removePhoto = () => {
  photoSrc.value = null;
  photoEl.value = null;
  autoSampledColor.value = '#14121A';
  extractedPalette.value = null;
  render();
  showToast('Photo removed');
};

const handleLogoUpload = (file: File) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const src = e.target?.result as string;
    logoSrc.value = src;
    const img = new Image();
    img.onload = () => {
      logoEl.value = img;
      render();
      showToast('Logo loaded ✓');
    };
    img.src = src;
  };
  reader.readAsDataURL(file);
};

const removeLogo = () => {
  logoSrc.value = null;
  logoEl.value = null;
  render();
  showToast('Logo removed');
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
    <aside class="sidebar" aria-label="News Post Controls">
      <div class="mode-title">
        <span>📰 NEWS POST STUDIO</span>
        <span class="mode-badge">Broadcast Newsroom Layout</span>
      </div>

      <!-- Quick Section Jump Chips for Mobile -->
      <QuickNavPills :items="QUICK_NAV_ITEMS" @jump="scrollToSection" />

      <!-- 1. Photo Zone Upload & Scale -->
      <StudioCard id="section-photo" title="1. Photo Zone & Layout" icon="📸">
        <label class="field-label">Upload News Photo</label>
        <PhotoDropzone 
          :image-src="photoSrc"
          label="Tap or Drag Photo Here"
          subtext="Auto cover-cropped, zero distortion"
          @upload="handlePhotoUpload"
          @remove="removePhoto"
        />

        <div v-if="photoSrc" class="photo-controls">
          <div class="slider-field">
            <div class="lbl-row">
              <label for="photo-height-range">Photo Zone Height</label>
              <span>{{ newsState.photoZonePercent }}%</span>
            </div>
            <input id="photo-height-range" type="range" min="35" max="75" v-model.number="newsState.photoZonePercent">
          </div>

          <div class="slider-field">
            <div class="lbl-row">
              <label for="photo-scale-range">Photo Zoom Scale</label>
              <span>{{ newsState.photoScale.toFixed(2) }}x</span>
            </div>
            <input id="photo-scale-range" type="range" min="0.5" max="3.0" step="0.05" v-model.number="newsState.photoScale">
          </div>

          <button class="btn tiny" style="width:100%; justify-content:center; margin-top:4px;" @click="resetPhotoTransform">
            ↺ Reset Photo Pan/Zoom Position
          </button>
        </div>
      </StudioCard>

      <!-- 2. Platform & Aspect Ratio -->
      <StudioCard id="section-platform" title="2. Platform & Ratio" icon="📐">
        <PlatformRatioSelector 
          :platforms="PLATFORMS"
          v-model:platform="platform"
          v-model:ratio="ratio"
        />
      </StudioCard>

      <!-- 3. Headline Text & Word Highlight Editor -->
      <StudioCard id="section-headline" title="3. News Headline" icon="📰">
        <label class="field-label" for="headline-input">Headline Text (*word* for accent highlight)</label>
        <textarea id="headline-input" v-model="newsState.headlineText" placeholder="এখানে আপনার সংবাদ শিরোনাম লিখুন..." rows="3"></textarea>

        <label class="field-label">Interactive Word Highlight Chips</label>
        <div class="word-chip-grid">
          <button 
            v-for="(t, idx) in wordTokens" 
            :key="idx"
            class="wtoken-chip"
            :class="{ highlighted: t.highlighted }"
            @click="toggleWordToken(idx)"
            :aria-label="`Toggle highlight for word ${t.cleanWord}`"
          >
            {{ t.cleanWord }}
          </button>
        </div>

        <div class="toggle-row" style="margin-top:12px;">
          <label class="field-label" style="margin:0;">Auto-fit Headline Font Size</label>
          <div class="switch" :class="{ on: newsState.autoFit }" @click="newsState.autoFit = !newsState.autoFit" role="switch" :aria-checked="newsState.autoFit"></div>
        </div>

        <div v-if="!newsState.autoFit" class="slider-field" style="margin-top:10px;">
          <div class="lbl-row">
            <label for="headline-size-range">Headline Font Size</label>
            <span>{{ newsState.titleFontSize }}px</span>
          </div>
          <input id="headline-size-range" type="range" min="30" max="120" v-model.number="newsState.titleFontSize">
        </div>
      </StudioCard>

      <!-- 4. Theme & Colors System -->
      <StudioCard id="section-theme" title="4. Theme & Color System" icon="🎨">
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
            role="button"
            tabindex="0"
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
                <input type="color" :value="newsState.bannerColorOverride || extractedPalette.darkBg" @input="e => newsState.bannerColorOverride = (e.target as HTMLInputElement).value" aria-label="Banner Background Color">
                <span class="swatch-hex">{{ newsState.bannerColorOverride || extractedPalette.darkBg }}</span>
              </div>
            </div>

            <div class="auto-swatch-item">
              <label>Fade Start Color</label>
              <div class="swatch-picker-row">
                <input type="color" :value="newsState.sampledColorOverride || extractedPalette.dominant" @input="e => newsState.sampledColorOverride = (e.target as HTMLInputElement).value" aria-label="Fade Start Color">
                <span class="swatch-hex">{{ newsState.sampledColorOverride || extractedPalette.dominant }}</span>
              </div>
            </div>

            <div class="auto-swatch-item">
              <label>Headline Highlight</label>
              <div class="swatch-picker-row">
                <input type="color" :value="newsState.accentColorOverride || extractedPalette.accent" @input="e => newsState.accentColorOverride = (e.target as HTMLInputElement).value" aria-label="Headline Highlight Color">
                <span class="swatch-hex">{{ newsState.accentColorOverride || extractedPalette.accent }}</span>
              </div>
            </div>

            <div class="auto-swatch-item">
              <label>Base Headline Text</label>
              <div class="swatch-picker-row">
                <input type="color" :value="newsState.textColorOverride || extractedPalette.textColor" @input="e => newsState.textColorOverride = (e.target as HTMLInputElement).value" aria-label="Headline Text Color">
                <span class="swatch-hex">{{ newsState.textColorOverride || extractedPalette.textColor }}</span>
              </div>
            </div>
          </div>
          <div v-else style="font-size:11px; color:var(--studio-text-muted); text-align:center; padding:8px;">
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
                <input type="color" v-model="newsState.bannerColorOverride" aria-label="Banner Background Override">
                <span class="hex-val">{{ newsState.bannerColorOverride || currentTheme?.bg }}</span>
              </div>
            </div>

            <div class="picker-item">
              <label>Accent</label>
              <div class="picker-row">
                <input type="color" v-model="newsState.accentColorOverride" aria-label="Accent Highlight Override">
                <span class="hex-val">{{ newsState.accentColorOverride || currentTheme?.accent }}</span>
              </div>
            </div>

            <div class="picker-item">
              <label>Base Text</label>
              <div class="picker-row">
                <input type="color" v-model="newsState.textColorOverride" aria-label="Base Text Color Override">
                <span class="hex-val">{{ newsState.textColorOverride || currentTheme?.text }}</span>
              </div>
            </div>
          </div>

          <!-- Quick Swatch Palette Dots -->
          <div class="quick-swatches">
            <span style="font-size:10.5px; color:var(--studio-text-muted);">Quick Accent:</span>
            <div class="swatch-dots">
              <span 
                v-for="col in PRESET_ACCENTS" 
                :key="col"
                class="dot-btn"
                :style="{ backgroundColor: col }"
                @click="newsState.accentColorOverride = col"
                role="button"
                :aria-label="`Select accent swatch ${col}`"
              ></span>
            </div>
          </div>
        </div>
      </StudioCard>

      <!-- 5. Brand Logo Badge Controls -->
      <StudioCard id="section-logo" title="5. Brand Logo Badge" icon="🏅">
        <div class="toggle-row">
          <label class="field-label" style="margin:0;">Show Logo Badge</label>
          <div class="switch" :class="{ on: newsState.logoVisible }" @click="newsState.logoVisible = !newsState.logoVisible" role="switch" :aria-checked="newsState.logoVisible"></div>
        </div>

        <div v-if="newsState.logoVisible" style="margin-top:12px;">
          <label class="field-label">Upload Brand Logo</label>
          <PhotoDropzone 
            :image-src="logoSrc"
            label="Tap to Upload Logo"
            subtext="PNG with transparent background recommended"
            icon="🏅"
            @upload="handleLogoUpload"
            @remove="removeLogo"
          />

          <label class="field-label" for="logo-anchor-select" style="margin-top:12px;">Logo Position Preset</label>
          <select id="logo-anchor-select" v-model="newsState.logoAnchor">
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
              <label for="logo-size-range">Logo Size Radius</label>
              <span>{{ newsState.logoSize }}px</span>
            </div>
            <input id="logo-size-range" type="range" min="20" max="100" v-model.number="newsState.logoSize">
          </div>

          <div class="slider-field">
            <div class="lbl-row">
              <label for="logo-offset-x">Fine Offset X</label>
              <span>{{ newsState.logoOffsetX }}px</span>
            </div>
            <input id="logo-offset-x" type="range" min="-200" max="200" v-model.number="newsState.logoOffsetX">
          </div>

          <div class="slider-field">
            <div class="lbl-row">
              <label for="logo-offset-y">Fine Offset Y</label>
              <span>{{ newsState.logoOffsetY }}px</span>
            </div>
            <input id="logo-offset-y" type="range" min="-200" max="200" v-model.number="newsState.logoOffsetY">
          </div>
        </div>
      </StudioCard>

      <!-- 6. Footer / Copyright Controls -->
      <StudioCard id="section-footer" title="6. Footer / Copyright" icon="✍️">
        <input type="text" v-model="newsState.copyrightText" placeholder="e.g. © TelepathicThoughts" aria-label="Copyright Text">
        <div style="display:flex; gap:8px; margin-top:8px;">
          <button class="btn tiny" @click="autofillCopyrightHandle">Use Handle</button>
          <button class="btn tiny" @click="autofillDate">Append Date</button>
        </div>
      </StudioCard>

      <!-- 7. Saved Drafts -->
      <StudioCard id="section-drafts" title="7. Saved News Drafts" icon="📁">
        <div style="display:flex; gap:8px; margin-bottom:8px;">
          <input type="text" v-model="draftName" placeholder="News draft name..." style="flex:1;" aria-label="Draft Name">
          <button class="btn" @click="saveDraft">Save Draft</button>
        </div>
        <div class="draft-list-container">
          <div v-if="Object.keys(drafts).length === 0" style="font-size:11px; color:var(--studio-text-muted); text-align:center;">
            No drafts yet — create your first graphic
          </div>
          <div v-for="(d, name) in drafts" :key="name" class="draft-item">
            <span class="draft-name" @click="selectDraft(name.toString())">{{ name }}</span>
            <button class="draft-del-btn" @click="deleteDraft(name.toString())" aria-label="Delete draft">✕</button>
          </div>
        </div>
      </StudioCard>
    </aside>

    <!-- CANVAS PREVIEW & WORKSTATION -->
    <div class="canvas-area">
      <!-- Canvas Zoom Toolbar Component -->
      <CanvasToolbar 
        v-model:fitMode="canvasFitMode"
        hintText="💡 Click & Drag canvas to pan photo"
      />

      <div 
        class="frame-wrap" 
        id="newsFrameWrap"
        :class="['zoom-' + canvasFitMode, { 'is-dragging': isDraggingPhoto }]"
        @pointerdown="onCanvasPointerDown"
        @pointermove="onCanvasPointerMove"
        @pointerup="onCanvasPointerUp"
      >
        <canvas ref="mainCanvas"></canvas>
      </div>

      <div class="actions">
        <button class="btn primary" @click="downloadPNG">⬇ Download PNG Graphic</button>
        <button class="btn secondary" @click="copyImage">⧉ Copy Image</button>
      </div>
    </div>

    <!-- Toast Notification Component -->
    <ToastNotification :show="showToastFlag" :message="toastMsg" />
  </div>
</template>

<style scoped>
.news-app {
  display: grid;
  grid-template-columns: 440px 1fr;
  min-height: calc(100vh - 60px);
  background: var(--studio-bg);
}

.sidebar {
  background: var(--studio-surface);
  border-right: 1px solid var(--studio-border);
  padding: var(--space-4);
  overflow-y: auto;
  height: calc(100vh - 60px);
  box-shadow: var(--elevation-1);
}

.mode-title {
  display: flex; flex-direction: column; gap: 4px; margin-bottom: var(--space-4);
}
.mode-title span { font-family: var(--font-display); font-size: var(--text-lg); font-weight: 900; color: var(--studio-text-primary); }
.mode-badge { font-family: var(--font-mono); font-size: 10px; color: var(--studio-accent-primary); letter-spacing: 0.08em; text-transform: uppercase; }

label.field-label { display: block; font-size: var(--text-xs); color: var(--studio-text-secondary); margin: var(--space-2) 0 var(--space-1); font-weight: 600; }

input[type=text], textarea, select {
  width: 100%; background: var(--studio-surface); border: 1px solid var(--studio-border);
  color: var(--studio-text-primary); padding: 10px 12px; border-radius: var(--radius-sharp); font-size: var(--text-sm);
  font-family: var(--font-body); resize: vertical; box-sizing: border-box; min-height: var(--min-touch-target);
  transition: border-color 0.15s, box-shadow 0.15s;
}
input[type=text]:focus, textarea:focus, select:focus {
  border-color: var(--studio-accent-primary);
  box-shadow: 0 0 0 2px rgba(230, 57, 70, 0.2);
}

.photo-controls { margin-top: var(--space-3); display: flex; flex-direction: column; gap: var(--space-3); }
.slider-field { display: flex; flex-direction: column; gap: 4px; }
.lbl-row { display: flex; justify-content: space-between; font-size: var(--text-xs); color: var(--studio-text-secondary); font-family: var(--font-mono); }
.slider-field input[type=range] { width: 100%; cursor: pointer; min-height: 32px; accent-color: var(--studio-accent-primary); }

.word-chip-grid { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-top: 6px; }
.wtoken-chip {
  min-height: 36px;
  font-family: var(--font-body); font-size: var(--text-xs); background: var(--studio-surface);
  border: 1px solid var(--studio-border); padding: 6px 12px; border-radius: var(--radius-sharp);
  cursor: pointer; color: var(--studio-text-secondary); transition: all 0.15s;
  display: flex; align-items: center; justify-content: center;
}
.wtoken-chip:hover { border-color: var(--studio-border-strong); color: var(--studio-text-primary); }
.wtoken-chip:active { transform: scale(0.96); }
.wtoken-chip.highlighted { background: var(--studio-accent-primary); border-color: var(--studio-accent-primary); color: #fff; font-weight: 700; }

/* Theme UI */
.theme-cat-tabs {
  display: flex; gap: 4px; background: var(--studio-bg); padding: 3px;
  border-radius: var(--radius-sharp); border: 1px solid var(--studio-border); margin-bottom: var(--space-3);
}
.cat-tab {
  flex: 1; min-height: 34px; background: transparent; border: none; color: var(--studio-text-secondary);
  font-family: var(--font-mono); font-size: 10px; font-weight: 700; padding: 4px 0;
  border-radius: var(--radius-sharp); cursor: pointer; text-align: center; transition: all 0.15s;
}
.cat-tab.active { background: var(--studio-accent-primary); color: #fff; }

.theme-card-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2); margin-bottom: var(--space-3);
}

.palette-card {
  min-height: 54px;
  background: var(--studio-surface); border: 1px solid var(--studio-border); border-radius: var(--radius-card);
  padding: 8px; cursor: pointer; position: relative; transition: all 0.18s ease;
  display: flex; flex-direction: column; gap: 6px; text-align: left;
}
.palette-card:hover { border-color: var(--studio-accent-primary); transform: translateY(-1px); }
.palette-card:active { transform: scale(0.98); }
.palette-card.active { border-color: var(--studio-accent-primary); background: rgba(230, 57, 70, 0.12); box-shadow: 0 0 12px rgba(230, 57, 70, 0.25); }

.palette-bar {
  height: 18px; border-radius: 4px; display: flex; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);
}
.bar-bg { flex: 2; height: 100%; }
.bar-accent { flex: 1; height: 100%; }

.palette-meta { display: flex; align-items: center; justify-content: space-between; gap: 4px; }
.palette-title { font-size: 11px; font-weight: 700; color: var(--studio-text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.palette-badge { font-family: var(--font-mono); font-size: 8px; background: rgba(255,255,255,0.12); padding: 1px 4px; border-radius: 3px; color: var(--studio-text-secondary); }

.active-badge {
  position: absolute; top: 4px; right: 4px; width: 16px; height: 16px; border-radius: 50%;
  background: var(--studio-accent-primary); color: #fff; font-size: 9px; font-weight: 900;
  display: flex; align-items: center; justify-content: center;
}

/* Auto Extracted Palette Card */
.auto-palette-card {
  background: var(--studio-surface); border: 1px solid var(--studio-accent-primary); border-radius: var(--radius-card);
  padding: var(--space-3); margin-bottom: var(--space-3); display: flex; flex-direction: column; gap: var(--space-2);
  box-shadow: 0 4px 14px rgba(230, 57, 70, 0.15);
}
.auto-card-title { display: flex; justify-content: space-between; align-items: center; font-size: 11px; font-weight: 700; color: var(--studio-text-primary); }
.auto-swatches-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2); }
.auto-swatch-item label { display: block; font-size: 9.5px; color: var(--studio-text-secondary); margin-bottom: 3px; font-family: var(--font-mono); }
.swatch-picker-row { display: flex; align-items: center; gap: 6px; background: var(--studio-surface-elevated); border: 1px solid var(--studio-border); padding: 4px 6px; border-radius: var(--radius-sharp); min-height: 36px; }
.swatch-picker-row input[type=color] { width: 24px; height: 24px; border-radius: 4px; border: none; background: none; cursor: pointer; padding: 0; }
.swatch-hex { font-family: var(--font-mono); font-size: 9.5px; color: var(--studio-text-secondary); text-transform: uppercase; }

.color-overrides-box {
  background: var(--studio-surface); border: 1px solid var(--studio-border); border-radius: var(--radius-card);
  padding: var(--space-3); display: flex; flex-direction: column; gap: var(--space-2);
}
.override-header { display: flex; justify-content: space-between; align-items: center; font-size: 11px; font-weight: 700; }

.color-picker-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.picker-item label { display: block; font-size: 9.5px; color: var(--studio-text-secondary); margin-bottom: 3px; font-family: var(--font-mono); }
.picker-row { display: flex; align-items: center; gap: 4px; background: var(--studio-surface-elevated); border: 1px solid var(--studio-border); padding: 3px 5px; border-radius: var(--radius-sharp); min-height: 36px; }
.picker-row input[type=color] { width: 22px; height: 22px; border-radius: 4px; border: none; background: none; cursor: pointer; padding: 0; }
.hex-val { font-family: var(--font-mono); font-size: 9px; color: var(--studio-text-secondary); text-transform: uppercase; overflow: hidden; text-overflow: ellipsis; }

.quick-swatches { display: flex; align-items: center; justify-content: space-between; margin-top: 2px; }
.swatch-dots { display: flex; gap: 6px; }
.dot-btn { width: 20px; height: 20px; border-radius: 50%; cursor: pointer; border: 1px solid rgba(255,255,255,0.2); transition: transform 0.15s; }
.dot-btn:hover { transform: scale(1.25); }

.toggle-row { display: flex; align-items: center; justify-content: space-between; min-height: var(--min-touch-target); }
.switch { width: 44px; height: 24px; background: var(--studio-surface); border: 1px solid var(--studio-border); border-radius: var(--radius-pill); position: relative; cursor: pointer; transition: all 0.2s; }
.switch.on { background: var(--studio-accent-primary); border-color: var(--studio-accent-primary); }
.switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; background: #fff; border-radius: 50%; transition: left 0.15s; }
.switch.on::after { left: 22px; }

.canvas-area {
  display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
  padding: var(--space-6) var(--space-6) var(--space-12); background: var(--studio-bg); overflow-y: auto; height: calc(100vh - 60px); box-sizing: border-box;
}

.frame-wrap {
  max-width: 540px; width: 100%; position: relative; display: flex; justify-content: center;
  align-items: center; margin-bottom: var(--space-6); cursor: grab; user-select: none; touch-action: pan-y; transition: max-width 0.25s ease, max-height 0.25s ease;
}
.frame-wrap.is-dragging { cursor: grabbing; touch-action: none; }
.frame-wrap canvas {
  width: 100% !important; height: auto !important; border-radius: var(--radius-card);
  box-shadow: var(--elevation-3); border: 1px solid var(--studio-border); display: block;
}

/* Canvas Viewport Zoom Modes */
.frame-wrap.zoom-fit { max-height: min(68vh, 620px); }
.frame-wrap.zoom-fit canvas { max-height: min(68vh, 620px); width: auto !important; max-width: 100%; object-fit: contain; }
.frame-wrap.zoom-75 { max-width: 405px; }
.frame-wrap.zoom-100 { max-width: 540px; }

.actions { display: flex; gap: var(--space-3); width: 100%; max-width: 540px; }
.btn {
  min-height: var(--min-touch-target);
  background: var(--studio-surface-elevated); border: 1px solid var(--studio-border); color: var(--studio-text-primary);
  padding: 10px 18px; border-radius: var(--radius-sharp); font-weight: 700; font-size: var(--text-sm);
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.15s;
}
.btn:hover { border-color: var(--studio-border-strong); }
.btn:active { transform: scale(0.97); }
.btn.primary { background: var(--studio-accent-primary); border-color: var(--studio-accent-primary); color: #fff; flex: 1; box-shadow: 0 4px 14px rgba(230, 57, 70, 0.35); }
.btn.secondary { background: var(--studio-surface); border-color: var(--studio-border); }
.btn.tiny { min-height: 32px; padding: 4px 10px; font-size: 11px; }
.btn.danger { background: rgba(255,77,77,0.15); color: #ff4d4d; border-color: rgba(255,77,77,0.3); }

.draft-item { display: flex; justify-content: space-between; align-items: center; background: var(--studio-surface); border: 1px solid var(--studio-border); border-radius: var(--radius-sharp); padding: 8px 12px; margin-bottom: 6px; font-size: 12px; cursor: pointer; min-height: 40px; }
.draft-del-btn { background: none; border: none; color: var(--studio-text-muted); cursor: pointer; min-width: 32px; min-height: 32px; display: flex; align-items: center; justify-content: center; }

/* Responsive Mobile Layout Flow (<1024px) */
@media (max-width: 1023px) {
  .news-app {
    grid-template-columns: 1fr;
    height: auto;
    min-height: 100vh;
  }

  .canvas-area {
    order: -1;
    padding: var(--space-4) var(--space-3);
    height: auto;
    overflow-y: visible;
    border-bottom: 1px solid var(--studio-border);
    touch-action: pan-y;
  }

  .actions {
    max-width: 100%;
  }

  .sidebar {
    height: auto;
    overflow-y: visible;
    border-right: none;
    padding: var(--space-4) var(--space-3) var(--space-12);
  }
}

@media (max-width: 767px) {
  input[type=text], textarea, select {
    font-size: 16px !important; /* Prevents iOS Safari auto-zoom */
  }
}

@media (max-width: 479px) {
  .color-picker-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
  }
  .picker-item label { font-size: 8.5px; }
  .hex-val { font-size: 8px; }

  .theme-card-grid, .auto-swatches-grid {
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }

  .actions { flex-direction: column; }
  .btn { width: 100%; }
}
</style>
