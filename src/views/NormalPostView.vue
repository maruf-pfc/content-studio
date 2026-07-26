<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue';
import { fitFontSize, drawRichLine } from '../utils/textHelper';

import StudioCard from '../components/StudioCard.vue';
import PhotoDropzone from '../components/PhotoDropzone.vue';
import PlatformRatioSelector, { type Platform } from '../components/PlatformRatioSelector.vue';
import CanvasToolbar from '../components/CanvasToolbar.vue';
import QuickNavPills from '../components/QuickNavPills.vue';
import ToastNotification from '../components/ToastNotification.vue';

/* ---------------- DATA PRESETS ---------------- */
const PLATFORMS: Platform[] = [
  { id: 'instagram', label: 'Instagram', icon: '◪', ratios: ['1:1', '4:5', '9:16'] },
  { id: 'facebook', label: 'Facebook', icon: '▣', ratios: ['1:1', '9:16'] },
  { id: 'linkedin', label: 'LinkedIn', icon: '▤', ratios: ['1:1', '1.91:1'] },
  { id: 'youtube', label: 'YouTube', icon: '▶', ratios: ['16:9'] },
  { id: 'tiktok', label: 'TikTok', icon: '♪', ratios: ['9:16'] },
  { id: 'twitter', label: 'X / Twitter', icon: '𝕏', ratios: ['16:9', '1:1'] }
];

const RATIO_DIMS: Record<string, [number, number]> = {
  '1:1': [1080, 1080],
  '4:5': [1080, 1350],
  '9:16': [1080, 1920],
  '16:9': [1280, 720],
  '1.91:1': [1200, 627]
};

interface Template {
  id: string;
  name: string;
  desc: string;
}

const TEMPLATES: Template[] = [
  { id: 'quote', name: 'Quote Card', desc: 'Centered quote style' },
  { id: 'tip', name: 'Tip / List', desc: 'Headline + body lines' },
  { id: 'stat', name: 'Stat Highlight', desc: 'Giant numeric callout' },
  { id: 'simple', name: 'Minimal', desc: 'Clean statement layout' }
];

interface Theme {
  id: string;
  name: string;
  category: 'dark' | 'light' | 'vibrant';
  bg: string;
  bg2?: string;
  text: string;
  accent: string;
  fontPair: string;
  badge?: string;
}

const THEMES: Theme[] = [
  { id: 'midnight', name: 'Midnight Violet', category: 'dark', bg: '#14121A', bg2: '#221E30', text: '#F5F3FF', accent: '#7C5CFC', fontPair: 'outfit_plus', badge: 'Popular' },
  { id: 'cream', name: 'Cream Editorial', category: 'light', bg: '#F4EFE6', bg2: '#EAE1D0', text: '#241F1A', accent: '#C1552E', fontPair: 'georgia_serif', badge: 'Light Mode' },
  { id: 'neon', name: 'Neon Night', category: 'vibrant', bg: '#0A0A0A', bg2: '#151515', text: '#F2FFEA', accent: '#B6FF3C', fontPair: 'syne_space', badge: 'Vibrant' },
  { id: 'pastel', name: 'Soft Pastel', category: 'light', bg: '#FDEFF4', bg2: '#F6E4EE', text: '#3B2A34', accent: '#FF8FAB', fontPair: 'outfit_plus', badge: 'Pastel' },
  { id: 'mono', name: 'Bold Mono', category: 'dark', bg: '#0E0E0E', bg2: '#1a1a1a', text: '#FFFFFF', accent: '#FFFFFF', fontPair: 'jetbrains_mono', badge: 'Minimal' },
  { id: 'ocean', name: 'Ocean Cyan', category: 'dark', bg: '#062B3F', bg2: '#0A4A66', text: '#EAF7FF', accent: '#4FD1C5', fontPair: 'syne_space', badge: 'Cool' },
  { id: 'crimson_red', name: 'Channel Red', category: 'vibrant', bg: '#180407', bg2: '#2A0B10', text: '#FFFFFF', accent: '#FF2E4C', fontPair: 'outfit_plus', badge: 'Breaking' },
  { id: 'amber_flame', name: 'Amber Flame', category: 'vibrant', bg: '#160B05', bg2: '#2A1409', text: '#FFFFFF', accent: '#FF7D3B', fontPair: 'outfit_plus' },
  { id: 'emerald_deep', name: 'Emerald Forest', category: 'dark', bg: '#051A14', bg2: '#0A2E24', text: '#FFFFFF', accent: '#20E298', fontPair: 'syne_space' },
  { id: 'royal_indigo', name: 'Royal Indigo', category: 'dark', bg: '#0D1126', bg2: '#181E40', text: '#FFFFFF', accent: '#5C7CFF', fontPair: 'outfit_plus' }
];

interface FontPairing {
  id: string;
  name: string;
  titleFont: string;
  bodyFont: string;
}

const FONT_PAIRINGS: FontPairing[] = [
  { id: 'outfit_plus', name: 'Outfit & Plus Jakarta', titleFont: 'Outfit', bodyFont: 'Plus Jakarta Sans' },
  { id: 'syne_space', name: 'Syne & Space Grotesk', titleFont: 'Syne', bodyFont: 'Space Grotesk' },
  { id: 'playfair_inter', name: 'Playfair & Inter', titleFont: 'Playfair Display', bodyFont: 'Inter' },
  { id: 'jetbrains_mono', name: 'JetBrains Mono', titleFont: 'JetBrains Mono', bodyFont: 'JetBrains Mono' },
  { id: 'trebuchet_sans', name: 'Trebuchet & System Sans', titleFont: 'Trebuchet MS', bodyFont: '-apple-system' },
  { id: 'georgia_serif', name: 'Georgia & Serif', titleFont: 'Georgia', bodyFont: 'Georgia' }
];

const HASHTAG_PRESETS = [
  '#TelepathicThoughts', '#TelepathicBD', '#RelatableMemes', '#BangladeshMemes',
  '#DhakaVibes', '#SameThoughts', '#CreatorEconomy', '#SocialMedia', '#TipsAndTricks'
];

const QUICK_NAV_ITEMS = [
  { id: 'norm-section-ratio', label: '📐 Ratio' },
  { id: 'norm-section-template', label: '🎯 Template' },
  { id: 'norm-section-content', label: '📝 Copy' },
  { id: 'norm-section-theme', label: '🎨 Theme' },
  { id: 'norm-section-bg', label: '🖼️ Bg Photo' },
  { id: 'norm-section-watermark', label: '✍️ Caption' },
  { id: 'norm-section-drafts', label: '📁 Drafts' }
];

/* ---------------- STATE ---------------- */
const state = reactive({
  platform: 'instagram',
  ratio: '1:1',
  template: 'quote',
  theme: 'midnight',
  fontPairing: 'outfit_plus',
  align: 'center' as 'left' | 'center' | 'right',
  autoFit: true,
  watermark: true,
  watermarkText: '@TelepathicThoughts',
  
  customAccent: '',
  customBg: '',
  customText: '',
  
  bgType: 'solid' as 'solid' | 'gradient' | 'radial',
  bgGradientColor2: '',
  bgGradientAngle: 135,
  ambientGlow: true,
  
  patternType: 'circles',
  patternOpacity: 12,
  patternDensity: 30,
  bgPatternColor: '',
  
  bgImageScale: 100,
  bgImageOpacity: 40,
  bgImageBlur: 0,
  bgImageBlend: 'normal',
  
  logoScale: 20,
  logoOpacity: 80,
  logoPosition: 'bottom-right',
  
  titleText: 'যা মনে আছে সেটাই বলি',
  bodyText: '',
  statNumber: '10x',
  captionText: 'We just know 🧠',
  hashtagsText: '#TelepathicThoughts #TelepathicBD #BangladeshMemes #RelatableMemes',
  
  recentColors: ['#7C5CFC', '#FF6B4A', '#B6FF3C', '#FFA3B8', '#C1552E', '#FFFFFF', '#14121A'],
  
  titleFontSize: 65,
  bodyFontSize: 30,
  
  showLiveOverlay: false
});

const themeCategoryFilter = ref<'all' | 'dark' | 'vibrant' | 'light'>('all');
const canvasFitMode = ref<'fit' | '75' | '100'>('fit');

type DraftItem = typeof state & {
  bgImageSrc: string | null;
  logoImageSrc: string | null;
};

const drafts = ref<Record<string, DraftItem>>({});
const draftName = ref('');

const bgImageSrc = ref<string | null>(null);
const logoImageSrc = ref<string | null>(null);
const bgImageEl = ref<HTMLImageElement | null>(null);
const logoImageEl = ref<HTMLImageElement | null>(null);

const mainCanvas = ref<HTMLCanvasElement | null>(null);

const toastMsg = ref('');
const showToastFlag = ref(false);
const showBatchModal = ref(false);

/* ---------------- COMPUTED ---------------- */
const currentTheme = computed(() => {
  return THEMES.find(t => t.id === state.theme) || THEMES[0];
});

const filteredThemes = computed(() => {
  if (themeCategoryFilter.value === 'all') return THEMES;
  return THEMES.filter(t => t.category === themeCategoryFilter.value);
});

const captionWithHashtags = computed(() => {
  let text = state.captionText.trim();
  if (state.hashtagsText.trim()) {
    text += text ? '\n\n' + state.hashtagsText.trim() : state.hashtagsText.trim();
  }
  return text;
});

const effectiveColors = computed(() => {
  const fallback = THEMES[0];
  const t = currentTheme.value ?? fallback;
  return {
    bg: state.customBg || (t ? t.bg : '#14121A'),
    accent: state.customAccent || (t ? t.accent : '#7C5CFC'),
    text: state.customText || (t ? t.text : '#F5F3FF')
  };
});

/* ---------------- WATCHERS & LIFECYCLE ---------------- */
watch([state, bgImageSrc, logoImageSrc], () => {
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

const copyCaption = async () => {
  try {
    await navigator.clipboard.writeText(captionWithHashtags.value);
    showToast('Copied caption + hashtags!');
  } catch {
    showToast('Failed to copy to clipboard');
  }
};

const addHashtag = (tag: string) => {
  if (state.hashtagsText.includes(tag)) return;
  state.hashtagsText = (state.hashtagsText + ' ' + tag).trim();
};

const pushRecentColor = (hex: string) => {
  if (!hex || state.recentColors.includes(hex)) return;
  state.recentColors.unshift(hex);
  if (state.recentColors.length > 8) state.recentColors.pop();
};

const handleBgUpload = (file: File) => {
  const reader = new FileReader();
  reader.onload = (ev) => {
    const src = ev.target?.result as string;
    bgImageSrc.value = src;
    const img = new Image();
    img.onload = () => {
      bgImageEl.value = img;
      render();
      showToast('Background photo loaded ✓');
    };
    img.src = src;
  };
  reader.readAsDataURL(file);
};

const removeBgImage = () => {
  bgImageSrc.value = null;
  bgImageEl.value = null;
  render();
  showToast('Background photo removed');
};

const handleLogoUpload = (file: File) => {
  const reader = new FileReader();
  reader.onload = (ev) => {
    const src = ev.target?.result as string;
    logoImageSrc.value = src;
    const img = new Image();
    img.onload = () => {
      logoImageEl.value = img;
      render();
      showToast('Logo loaded ✓');
    };
    img.src = src;
  };
  reader.readAsDataURL(file);
};

const removeLogoImage = () => {
  logoImageSrc.value = null;
  logoImageEl.value = null;
  render();
  showToast('Logo removed');
};

const selectTheme = (th: Theme) => {
  state.theme = th.id;
  state.fontPairing = th.fontPair;
  state.customAccent = '';
  state.customBg = '';
  state.customText = '';
};

const loadDrafts = () => {
  const cached = localStorage.getItem('cs_drafts_v2');
  drafts.value = cached ? JSON.parse(cached) : {};
};

const saveDraft = () => {
  const name = draftName.value.trim();
  if (!name) {
    showToast('Enter a draft name first!');
    return;
  }
  const item: DraftItem = {
    ...state,
    bgImageSrc: bgImageSrc.value,
    logoImageSrc: logoImageSrc.value
  };
  drafts.value[name] = item;
  localStorage.setItem('cs_drafts_v2', JSON.stringify(drafts.value));
  draftName.value = '';
  showToast(`Draft "${name}" saved ✓`);
};

const deleteDraft = (name: string) => {
  delete drafts.value[name];
  localStorage.setItem('cs_drafts_v2', JSON.stringify(drafts.value));
  showToast(`Draft "${name}" deleted`);
};

const selectDraft = (name: string) => {
  const d = drafts.value[name];
  if (!d) return;

  Object.assign(state, d);

  if (d.bgImageSrc) {
    bgImageSrc.value = d.bgImageSrc;
    const img = new Image();
    img.onload = () => { bgImageEl.value = img; render(); };
    img.src = d.bgImageSrc;
  } else {
    bgImageSrc.value = null;
    bgImageEl.value = null;
  }

  if (d.logoImageSrc) {
    logoImageSrc.value = d.logoImageSrc;
    const img = new Image();
    img.onload = () => { logoImageEl.value = img; render(); };
    img.src = d.logoImageSrc;
  } else {
    logoImageSrc.value = null;
    logoImageEl.value = null;
  }

  showToast(`Loaded draft "${name}"`);
};

/* Canvas Rendering Core Engine */
function renderGraphic(
  canvas: HTMLCanvasElement, 
  ratioKey: string
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dims = RATIO_DIMS[ratioKey] || [1080, 1080];
  const w = dims[0];
  const h = dims[1];

  canvas.width = w;
  canvas.height = h;

  const colors = effectiveColors.value;
  const font = getActiveFontPair();

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = w;
  tempCanvas.height = h;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;

  const pad = w * 0.08;

  // 1. Base Fill & Gradients
  if (state.bgType === 'gradient') {
    const angleRad = (state.bgGradientAngle * Math.PI) / 180;
    const x2 = w / 2 + Math.cos(angleRad) * (w / 2);
    const y2 = h / 2 + Math.sin(angleRad) * (h / 2);
    const grad = tempCtx.createLinearGradient(w / 2 - Math.cos(angleRad) * (w / 2), h / 2 - Math.sin(angleRad) * (h / 2), x2, y2);
    grad.addColorStop(0, colors.bg);
    grad.addColorStop(1, state.bgGradientColor2 || currentTheme.value?.bg2 || colors.bg);
    tempCtx.fillStyle = grad;
  } else if (state.bgType === 'radial') {
    const radGrad = tempCtx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, Math.max(w, h) / 1.2);
    radGrad.addColorStop(0, state.bgGradientColor2 || currentTheme.value?.bg2 || colors.accent);
    radGrad.addColorStop(1, colors.bg);
    tempCtx.fillStyle = radGrad;
  } else {
    tempCtx.fillStyle = colors.bg;
  }
  tempCtx.fillRect(0, 0, w, h);

  // 2. Ambient Glow
  if (state.ambientGlow && state.bgType === 'solid') {
    tempCtx.save();
    const glowGrad = tempCtx.createRadialGradient(w * 0.8, h * 0.2, 0, w * 0.8, h * 0.2, w * 0.6);
    glowGrad.addColorStop(0, colors.accent + '33');
    glowGrad.addColorStop(1, 'transparent');
    tempCtx.fillStyle = glowGrad;
    tempCtx.fillRect(0, 0, w, h);
    tempCtx.restore();
  }

  // 3. Background Patterns
  if (state.patternType !== 'none') {
    tempCtx.save();
    tempCtx.fillStyle = state.bgPatternColor || colors.accent;
    tempCtx.globalAlpha = state.patternOpacity / 100;
    const step = Math.max(20, 100 - state.patternDensity);

    if (state.patternType === 'dots') {
      for (let x = step / 2; x < w; x += step) {
        for (let y = step / 2; y < h; y += step) {
          tempCtx.beginPath();
          tempCtx.arc(x, y, 2.5, 0, Math.PI * 2);
          tempCtx.fill();
        }
      }
    } else if (state.patternType === 'grid') {
      tempCtx.strokeStyle = state.bgPatternColor || colors.accent;
      tempCtx.lineWidth = 1;
      for (let x = 0; x < w; x += step) {
        tempCtx.beginPath(); tempCtx.moveTo(x, 0); tempCtx.lineTo(x, h); tempCtx.stroke();
      }
      for (let y = 0; y < h; y += step) {
        tempCtx.beginPath(); tempCtx.moveTo(0, y); tempCtx.lineTo(w, y); tempCtx.stroke();
      }
    } else if (state.patternType === 'circles') {
      tempCtx.strokeStyle = state.bgPatternColor || colors.accent;
      tempCtx.lineWidth = 2;
      tempCtx.beginPath(); tempCtx.arc(0, 0, w * 0.35, 0, Math.PI * 2); tempCtx.stroke();
      tempCtx.beginPath(); tempCtx.arc(w, h, w * 0.45, 0, Math.PI * 2); tempCtx.stroke();
    }
    tempCtx.restore();
  }

  // 4. Custom Background Image
  if (bgImageEl.value) {
    tempCtx.save();
    tempCtx.globalCompositeOperation = (state.bgImageBlend || 'source-over') as GlobalCompositeOperation;
    if (state.bgImageBlur > 0) {
      tempCtx.filter = `blur(${state.bgImageBlur}px)`;
    }
    tempCtx.globalAlpha = state.bgImageOpacity / 100;
    
    const imgW = bgImageEl.value.width;
    const imgH = bgImageEl.value.height;
    const scale = state.bgImageScale / 100;
    const canvasRatio = w / h;
    const imgRatio = imgW / imgH;
    
    let renderW, renderH;
    if (imgRatio > canvasRatio) {
      renderH = h * scale;
      renderW = renderH * imgRatio;
    } else {
      renderW = w * scale;
      renderH = renderW / imgRatio;
    }
    
    const rx = (w - renderW) / 2;
    const ry = (h - renderH) / 2;
    tempCtx.drawImage(bgImageEl.value, rx, ry, renderW, renderH);
    tempCtx.restore();
  }

  // Text Alignment
  const align = state.align;
  tempCtx.textAlign = align;
  tempCtx.textBaseline = 'middle';
  
  let alignX = w / 2;
  if (align === 'left') alignX = pad;
  else if (align === 'right') alignX = w - pad;
  const maxTextWidth = w - pad * 2;

  // 5. Template Layout Engine
  if (state.template === 'stat') {
    const heroText = state.statNumber?.trim() || '10x';
    tempCtx.fillStyle = colors.accent;
    const heroSize = w * 0.28;
    tempCtx.font = `900 ${heroSize}px "${font.titleFont}", sans-serif`;
    tempCtx.fillText(heroText, alignX, h * 0.42);

    const titleText = state.titleText?.trim() || '';
    if (titleText) {
      const calcSize = state.autoFit ? fitFontSize(tempCtx, titleText, maxTextWidth, h * 0.35, 75, font.bodyFont, '700', 1.3, state.autoFit).size : state.titleFontSize;
      tempCtx.font = `700 ${calcSize}px "${font.bodyFont}", sans-serif`;
      drawLines(tempCtx, titleText.split('\n'), alignX, h * 0.68, calcSize, calcSize * 1.3, colors.text, colors.accent, font.bodyFont, '700');
    }
  } else if (state.template === 'tip') {
    let currentY = pad * 1.5;

    const titleText = state.titleText?.trim() || '';
    if (titleText) {
      const calcTitleSize = state.autoFit ? fitFontSize(tempCtx, titleText, maxTextWidth, h * 0.25, 70, font.titleFont, '800', 1.3, state.autoFit).size : state.titleFontSize;
      tempCtx.font = `800 ${calcTitleSize}px "${font.titleFont}", sans-serif`;
      const titleLines = titleText.split('\n');
      drawLines(tempCtx, titleLines, alignX, currentY, calcTitleSize, calcTitleSize * 1.3, colors.text, colors.accent, font.titleFont, '800');
      currentY += titleLines.length * (calcTitleSize * 1.3) + pad * 0.5;
    }

    const bodyText = state.bodyText?.trim() || '';
    if (bodyText) {
      const calcBodySize = state.autoFit ? fitFontSize(tempCtx, bodyText, maxTextWidth, h - currentY - pad * 1.5, 42, font.bodyFont, '500', 1.4, state.autoFit).size : state.bodyFontSize;
      tempCtx.font = `500 ${calcBodySize}px "${font.bodyFont}", sans-serif`;
      drawLines(tempCtx, bodyText.split('\n'), alignX, currentY, calcBodySize, calcBodySize * 1.4, colors.text, colors.accent, font.bodyFont, '500');
    }
  } else {
    // Quote and Minimal templates
    let textToDraw = state.titleText?.trim() || '';
    if (state.template === 'quote' && textToDraw && !textToDraw.startsWith('“')) {
      textToDraw = `“${textToDraw}”`;
    }

    const calcSize = state.autoFit 
      ? fitFontSize(tempCtx, textToDraw, maxTextWidth, h * 0.6, 90, font.titleFont, '800', 1.35, state.autoFit).size
      : state.titleFontSize;

    tempCtx.font = `800 ${calcSize}px "${font.titleFont}", sans-serif`;
    const lines = textToDraw.split('\n');
    const startY = h / 2 - ((lines.length - 1) * (calcSize * 1.35)) / 2;
    drawLines(tempCtx, lines, alignX, startY, calcSize, calcSize * 1.35, colors.text, colors.accent, font.titleFont, '800');
  }

  // 6. Brand Logo Overlay
  if (logoImageEl.value) {
    tempCtx.save();
    tempCtx.globalAlpha = state.logoOpacity / 100;
    const lSize = w * (state.logoScale / 100);
    const lRatio = logoImageEl.value.width / logoImageEl.value.height;
    const lw = lSize;
    const lh = lSize / lRatio;
    
    let lx = pad;
    let ly = pad;
    if (state.logoPosition.includes('right')) lx = w - pad - lw;
    if (state.logoPosition.includes('bottom')) ly = h - pad - lh;
    if (state.logoPosition === 'top-center') lx = (w - lw) / 2;
    
    tempCtx.drawImage(logoImageEl.value, lx, ly, lw, lh);
    tempCtx.restore();
  }

  // 7. Watermark Handle
  if (state.watermark) {
    tempCtx.save();
    tempCtx.textAlign = 'center';
    tempCtx.textBaseline = 'middle';
    tempCtx.fillStyle = colors.text;
    tempCtx.globalAlpha = 0.55;
    tempCtx.font = `600 ${w * 0.026}px "${font.bodyFont}", sans-serif`;
    tempCtx.fillText(state.watermarkText.trim() || '@TelepathicThoughts', w / 2, h - pad * 0.55);
    tempCtx.restore();
  }

  // Blit final output to visible canvas
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(tempCanvas, 0, 0);
}

function getActiveFontPair(): FontPairing {
  return (FONT_PAIRINGS.find(f => f.id === state.fontPairing) || FONT_PAIRINGS[0]) as FontPairing;
}

function drawLines(
  context: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  startY: number,
  fontSize: number,
  lineHeight: number,
  defaultColor: string,
  accentColor: string,
  fontFamily: string,
  weight: string = '700'
) {
  lines.forEach((line, index) => {
    const y = startY + index * lineHeight;
    drawRichLine(
      context,
      line,
      x,
      y,
      fontSize,
      fontFamily,
      weight,
      accentColor,
      defaultColor,
      state.align
    );
  });
}

const render = () => {
  nextTick(() => {
    if (!mainCanvas.value) return;
    renderGraphic(mainCanvas.value, state.ratio);
  });
};

const openBatchModal = () => {
  showBatchModal.value = true;
  nextTick(() => {
    const ratios = Object.keys(RATIO_DIMS);
    ratios.forEach(ratio => {
      const el = document.getElementById(`batch-canvas-${ratio.replace(':', '-')}`) as HTMLCanvasElement;
      if (el) {
        renderGraphic(el, ratio);
      }
    });
  });
};

const downloadBatchItem = (ratio: string) => {
  const tempCanvas = document.createElement('canvas');
  renderGraphic(tempCanvas, ratio);
  const link = document.createElement('a');
  link.download = `content-studio-${state.platform}-${ratio}-${Date.now()}.png`;
  link.href = tempCanvas.toDataURL('image/png');
  link.click();
  showToast(`Downloaded ${ratio} Format!`);
};

const downloadAllBatch = () => {
  const ratios = Object.keys(RATIO_DIMS);
  let delay = 0;
  ratios.forEach(ratio => {
    setTimeout(() => {
      downloadBatchItem(ratio);
    }, delay);
    delay += 350;
  });
  showToast('Downloading all formats...');
};

const downloadPNG = () => {
  if (!mainCanvas.value) return;
  const link = document.createElement('a');
  link.download = `graphic-${state.platform}-${state.ratio}-${Date.now()}.png`;
  link.href = mainCanvas.value.toDataURL('image/png');
  link.click();
  showToast('Graphic Downloaded!');
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
    showToast('Clipboard copy unsupported — please download');
  }
};

onMounted(() => {
  loadDrafts();
  render();
});
</script>

<template>
  <div class="app">
    <!-- SIDEBAR CONTROLS -->
    <aside class="sidebar" aria-label="Editor Controls">
      <!-- Quick Section Jump Chips for Mobile -->
      <QuickNavPills :items="QUICK_NAV_ITEMS" @jump="scrollToSection" />

      <!-- 1. Platform & Format -->
      <StudioCard id="norm-section-ratio" title="1. Target Platform & Aspect Ratio" icon="📐">
        <PlatformRatioSelector 
          :platforms="PLATFORMS"
          v-model:platform="state.platform"
          v-model:ratio="state.ratio"
        />
      </StudioCard>

      <!-- 2. Layout Template Selection -->
      <StudioCard id="norm-section-template" title="2. Layout Template" icon="🎯">
        <div class="template-grid">
          <div 
            v-for="t in TEMPLATES" 
            :key="t.id"
            class="tpl-btn"
            :class="{ active: t.id === state.template }"
            @click="state.template = t.id"
            role="button"
            tabindex="0"
          >
            <strong>{{ t.name }}</strong>
            <span>{{ t.desc }}</span>
          </div>
        </div>
      </StudioCard>

      <!-- 3. Content Inputs -->
      <StudioCard id="norm-section-content" title="3. Content & Copywriting" icon="📝">
        <div v-if="state.template === 'stat'">
          <label class="field-label" for="stat-input">Stat / Number Callout</label>
          <input id="stat-input" type="text" v-model="state.statNumber" placeholder="e.g. 10x or 99%">
        </div>

        <label class="field-label" for="title-input">Headline / Main Text (*word* for accent)</label>
        <textarea id="title-input" v-model="state.titleText" placeholder="Write main graphic text..." rows="3"></textarea>

        <div v-if="state.template === 'tip'" style="margin-top:10px;">
          <label class="field-label" for="body-input">Body Bullet Lines</label>
          <textarea id="body-input" v-model="state.bodyText" placeholder="Bullet line 1&#10;Bullet line 2..." rows="4"></textarea>
        </div>

        <div class="toggle-row" style="margin-top:10px;">
          <label class="field-label" style="margin:0;">Auto-fit Canvas Font Sizes</label>
          <div class="switch" :class="{ on: state.autoFit }" @click="state.autoFit = !state.autoFit" role="switch" :aria-checked="state.autoFit"></div>
        </div>

        <div v-if="!state.autoFit" style="margin-top:10px;">
          <div class="slider-field">
            <div class="lbl-row">
              <label for="title-size-range">Title Font Size</label>
              <span>{{ state.titleFontSize }}px</span>
            </div>
            <input id="title-size-range" type="range" min="30" max="140" v-model.number="state.titleFontSize">
          </div>

          <div v-if="state.template === 'tip'" class="slider-field" style="margin-top:8px;">
            <div class="lbl-row">
              <label for="body-size-range">Body Font Size</label>
              <span>{{ state.bodyFontSize }}px</span>
            </div>
            <input id="body-size-range" type="range" min="16" max="60" v-model.number="state.bodyFontSize">
          </div>
        </div>
      </StudioCard>

      <!-- 4. Theme & Typography -->
      <StudioCard id="norm-section-theme" title="4. Theme & Color System" icon="🎨">
        <div class="theme-cat-tabs">
          <button 
            v-for="cat in ['all', 'dark', 'vibrant', 'light'] as const" 
            :key="cat"
            class="cat-tab"
            :class="{ active: themeCategoryFilter === cat }"
            @click="themeCategoryFilter = cat"
          >
            {{ cat.toUpperCase() }}
          </button>
        </div>

        <div class="theme-card-grid">
          <div 
            v-for="th in filteredThemes" 
            :key="th.id"
            class="palette-card"
            :class="{ active: th.id === state.theme }"
            @click="selectTheme(th)"
            role="button"
            tabindex="0"
          >
            <div class="palette-bar">
              <div class="bar-bg" :style="{ backgroundColor: th.bg }"></div>
              <div class="bar-accent" :style="{ backgroundColor: th.accent }"></div>
            </div>
            <div class="palette-meta">
              <span class="palette-title">{{ th.name }}</span>
              <span v-if="th.badge" class="palette-badge">{{ th.badge }}</span>
            </div>
            <div v-if="th.id === state.theme" class="active-badge">✓</div>
          </div>
        </div>

        <div class="color-overrides-box">
          <div class="override-header">
            <span>Fine Color Overrides</span>
            <button class="btn tiny" @click="state.customBg = ''; state.customAccent = ''; state.customText = '';">Reset</button>
          </div>

          <div class="color-picker-grid">
            <div class="picker-item">
              <label>Bg</label>
              <div class="picker-row">
                <input type="color" v-model="state.customBg" @change="pushRecentColor(state.customBg)" aria-label="Background Color">
                <span class="hex-val">{{ effectiveColors.bg }}</span>
              </div>
            </div>
            <div class="picker-item">
              <label>Accent</label>
              <div class="picker-row">
                <input type="color" v-model="state.customAccent" @change="pushRecentColor(state.customAccent)" aria-label="Accent Color">
                <span class="hex-val">{{ effectiveColors.accent }}</span>
              </div>
            </div>
            <div class="picker-item">
              <label>Text</label>
              <div class="picker-row">
                <input type="color" v-model="state.customText" @change="pushRecentColor(state.customText)" aria-label="Text Color">
                <span class="hex-val">{{ effectiveColors.text }}</span>
              </div>
            </div>
          </div>

          <div class="quick-swatches">
            <span style="font-size:10.5px; color:var(--studio-text-muted);">Recent:</span>
            <div class="swatch-dots">
              <span 
                v-for="col in state.recentColors" 
                :key="col"
                class="dot-btn"
                :style="{ backgroundColor: col }"
                @click="state.customAccent = col"
                role="button"
                :aria-label="`Select color ${col}`"
              ></span>
            </div>
          </div>
        </div>

        <label class="field-label" for="font-pair-select" style="margin-top:12px;">Font Pairing</label>
        <select id="font-pair-select" v-model="state.fontPairing">
          <option v-for="fp in FONT_PAIRINGS" :key="fp.id" :value="fp.id">{{ fp.name }}</option>
        </select>

        <label class="field-label">Text Alignment</label>
        <div class="align-row">
          <button class="align-btn" :class="{ active: state.align === 'left' }" @click="state.align = 'left'">Left</button>
          <button class="align-btn" :class="{ active: state.align === 'center' }" @click="state.align = 'center'">Center</button>
          <button class="align-btn" :class="{ active: state.align === 'right' }" @click="state.align = 'right'">Right</button>
        </div>
      </StudioCard>

      <!-- 5. Advanced Backgrounds & Media Overlays -->
      <StudioCard id="norm-section-bg" title="5. Backgrounds & Overlay Media" icon="🖼️">
        <label class="field-label" for="bg-type-select">Background Style</label>
        <select id="bg-type-select" v-model="state.bgType">
          <option value="solid">Solid Color</option>
          <option value="gradient">Linear Gradient</option>
          <option value="radial">Radial Glow Gradient</option>
        </select>

        <div v-if="state.bgType !== 'solid'" style="margin-top:10px;">
          <label class="field-label">Gradient Second Color</label>
          <input type="color" v-model="state.bgGradientColor2" style="width:100%; height:36px; border-radius:4px; border:none; cursor:pointer;" aria-label="Gradient Second Color">
          <div v-if="state.bgType === 'gradient'" class="slider-field" style="margin-top:8px;">
            <div class="lbl-row">
              <label for="grad-angle-range">Gradient Angle</label>
              <span>{{ state.bgGradientAngle }}°</span>
            </div>
            <input id="grad-angle-range" type="range" min="0" max="360" v-model.number="state.bgGradientAngle">
          </div>
        </div>

        <div class="toggle-row">
          <label class="field-label" style="margin:0;">Ambient Corner Glow</label>
          <div class="switch" :class="{ on: state.ambientGlow }" @click="state.ambientGlow = !state.ambientGlow" role="switch" :aria-checked="state.ambientGlow"></div>
        </div>

        <label class="field-label" for="pattern-select" style="margin-top:12px;">Geometric Background Pattern</label>
        <select id="pattern-select" v-model="state.patternType">
          <option value="none">None</option>
          <option value="circles">Organic Circles</option>
          <option value="dots">Dot Matrix Grid</option>
          <option value="grid">Linear Square Grid</option>
        </select>

        <div v-if="state.patternType !== 'none'" style="margin-top:10px;">
          <div class="slider-field">
            <div class="lbl-row">
              <label for="pattern-opacity-range">Pattern Opacity</label>
              <span>{{ state.patternOpacity }}%</span>
            </div>
            <input id="pattern-opacity-range" type="range" min="5" max="50" v-model.number="state.patternOpacity">
          </div>
        </div>

        <!-- Custom Background Image -->
        <label class="field-label" style="margin-top:12px;">Custom Background Photo</label>
        <PhotoDropzone 
          :image-src="bgImageSrc"
          label="Tap to Upload Background Image"
          subtext="JPEG/PNG format supported"
          icon="🖼️"
          @upload="handleBgUpload"
          @remove="removeBgImage"
        />

        <div v-if="bgImageSrc" style="margin-top:10px;">
          <div class="slider-field">
            <div class="lbl-row">
              <label for="bg-opacity-range">Image Opacity</label>
              <span>{{ state.bgImageOpacity }}%</span>
            </div>
            <input id="bg-opacity-range" type="range" min="5" max="100" v-model.number="state.bgImageOpacity">
          </div>
          <div class="slider-field">
            <div class="lbl-row">
              <label for="bg-blur-range">Image Blur</label>
              <span>{{ state.bgImageBlur }}px</span>
            </div>
            <input id="bg-blur-range" type="range" min="0" max="20" v-model.number="state.bgImageBlur">
          </div>
        </div>

        <!-- Brand Logo Overlay -->
        <label class="field-label" style="margin-top:12px;">Brand Watermark Logo</label>
        <PhotoDropzone 
          :image-src="logoImageSrc"
          label="Tap to Upload Logo Image"
          subtext="PNG with transparent background"
          icon="🏅"
          @upload="handleLogoUpload"
          @remove="removeLogoImage"
        />
      </StudioCard>

      <!-- 6. Watermark & Social Captions -->
      <StudioCard id="norm-section-watermark" title="6. Watermark & Caption Tool" icon="✍️">
        <div class="toggle-row">
          <label class="field-label" style="margin:0;">Show Canvas Watermark</label>
          <div class="switch" :class="{ on: state.watermark }" @click="state.watermark = !state.watermark" role="switch" :aria-checked="state.watermark"></div>
        </div>

        <input v-if="state.watermark" type="text" v-model="state.watermarkText" placeholder="@YourHandle" style="margin-top:8px;" aria-label="Watermark Text">

        <label class="field-label" for="caption-input" style="margin-top:12px;">Social Post Caption</label>
        <textarea id="caption-input" v-model="state.captionText" placeholder="Write post caption..." rows="3"></textarea>

        <label class="field-label">Hashtag Presets</label>
        <div class="hashtag-chips">
          <span 
            v-for="ht in HASHTAG_PRESETS" 
            :key="ht" 
            class="hchip"
            @click="addHashtag(ht)"
            role="button"
            :aria-label="`Add hashtag ${ht}`"
          >
            {{ ht }}
          </span>
        </div>
      </StudioCard>

      <!-- 7. Saved Drafts -->
      <StudioCard id="norm-section-drafts" title="7. Saved Drafts" icon="📁">
        <div style="display:flex; gap:8px; margin-bottom:8px;">
          <input type="text" v-model="draftName" placeholder="Draft name..." style="flex:1;" aria-label="Draft Name">
          <button class="btn" @click="saveDraft">Save Draft</button>
        </div>

        <div class="draft-list-container">
          <div v-if="Object.keys(drafts).length === 0" style="font-size:11px; color:var(--studio-text-muted); text-align:center;">
            No saved drafts yet
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
        hintText="💡 Real-time Canvas Workstation"
      />

      <div 
        class="frame-wrap" 
        id="normalFrameWrap"
        :class="['zoom-' + canvasFitMode]"
      >
        <canvas ref="mainCanvas"></canvas>
      </div>

      <div class="actions">
        <button class="btn primary" @click="downloadPNG">⬇ Download PNG Graphic</button>
        <button class="btn secondary" @click="copyImage">⧉ Copy Image</button>
        <button class="btn secondary" @click="openBatchModal">⚡ Batch All Formats</button>
      </div>

      <div class="caption-preview">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span class="lbl">Social Post Caption & Hashtags</span>
          <button class="btn tiny" @click="copyCaption">📋 Copy Copywriting</button>
        </div>
        <div class="txt">{{ captionWithHashtags }}</div>
      </div>
    </div>

    <!-- Batch Export Modal -->
    <div class="modal-overlay" :class="{ show: showBatchModal }" @click.self="showBatchModal = false" role="dialog" aria-modal="true">
      <div class="modal-container">
        <div class="modal-header">
          <span class="modal-title">⚡ Multi-Format Batch Export</span>
          <button class="modal-close" @click="showBatchModal = false" aria-label="Close modal">✕</button>
        </div>
        <div class="modal-body">
          <div class="batch-grid">
            <div v-for="(dims, ratioKey) in RATIO_DIMS" :key="ratioKey" class="batch-card">
              <span class="batch-card-title">{{ ratioKey }} ({{ dims[0] }}×{{ dims[1] }}px)</span>
              <div class="batch-canvas-wrap">
                <canvas :id="`batch-canvas-${ratioKey.toString().replace(':', '-')}`"></canvas>
              </div>
              <button class="btn secondary" style="width:100%; font-size:11px;" @click="downloadBatchItem(ratioKey.toString())">Download Format</button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn secondary" @click="showBatchModal = false">Close</button>
          <button class="btn primary" @click="downloadAllBatch">⬇ Download All Formats</button>
        </div>
      </div>
    </div>

    <!-- Toast Notification Component -->
    <ToastNotification :show="showToastFlag" :message="toastMsg" />
  </div>
</template>

<style scoped>
.app {
  display: grid;
  grid-template-columns: 420px 1fr;
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

.template-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2); }
.tpl-btn {
  min-height: 54px;
  background: var(--studio-surface); border: 1px solid var(--studio-border); border-radius: var(--radius-card);
  padding: 10px; cursor: pointer; font-size: 12px; color: var(--studio-text-secondary); text-align: left; transition: all 0.15s;
}
.tpl-btn:hover { border-color: var(--studio-border-strong); }
.tpl-btn:active { transform: scale(0.98); }
.tpl-btn strong { display: block; font-size: 12.5px; color: var(--studio-text-primary); margin-bottom: 2px; }
.tpl-btn.active { border-color: var(--studio-accent-primary); background: rgba(230, 57, 70, 0.12); }

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

.align-row { display: flex; gap: 6px; }
.align-btn { flex: 1; min-height: var(--min-touch-target); background: var(--studio-surface); border: 1px solid var(--studio-border); border-radius: var(--radius-sharp); padding: 8px 0; cursor: pointer; color: var(--studio-text-secondary); font-size: 14px; text-align: center; }
.align-btn.active { border-color: var(--studio-accent-primary); color: var(--studio-text-primary); }

.toggle-row { display: flex; align-items: center; justify-content: space-between; min-height: var(--min-touch-target); margin-top: 10px; }
.switch { width: 44px; height: 24px; background: var(--studio-surface); border: 1px solid var(--studio-border); border-radius: var(--radius-pill); position: relative; cursor: pointer; transition: all 0.2s; }
.switch.on { background: var(--studio-accent-primary); border-color: var(--studio-accent-primary); }
.switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; background: #fff; border-radius: 50%; transition: left 0.15s; }
.switch.on::after { left: 22px; }

.hashtag-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.hchip { min-height: 34px; font-family: var(--font-mono); font-size: 10.5px; background: var(--studio-surface); border: 1px solid var(--studio-border); padding: 4px 10px; border-radius: var(--radius-pill); cursor: pointer; color: var(--studio-text-secondary); display: flex; align-items: center; }
.hchip:hover { border-color: var(--studio-border-strong); color: var(--studio-text-primary); }
.hchip:active { transform: scale(0.96); }

.canvas-area {
  display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
  padding: var(--space-6) var(--space-6) var(--space-12); background: var(--studio-bg); overflow-y: auto; height: calc(100vh - 60px); box-sizing: border-box;
}

.frame-wrap { max-width: 520px; width: 100%; position: relative; display: flex; justify-content: center; align-items: center; margin-bottom: 20px; transition: max-width 0.25s ease, max-height 0.25s ease; }
.frame-wrap canvas { width: 100% !important; height: auto !important; border-radius: var(--radius-card); box-shadow: var(--elevation-3); border: 1px solid var(--studio-border); display: block; }

/* Canvas Viewport Zoom Modes */
.frame-wrap.zoom-fit { max-height: min(68vh, 620px); }
.frame-wrap.zoom-fit canvas { max-height: min(68vh, 620px); width: auto !important; max-width: 100%; object-fit: contain; }
.frame-wrap.zoom-75 { max-width: 390px; }
.frame-wrap.zoom-100 { max-width: 520px; }

.actions { display: flex; gap: 10px; width: 100%; max-width: 520px; flex-wrap: wrap; }
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

.caption-preview { max-width: 520px; width: 100%; margin-top: 20px; background: var(--studio-surface); border: 1px solid var(--studio-border); border-radius: var(--radius-card); padding: var(--space-4); box-sizing: border-box; }
.caption-preview .lbl { font-family: var(--font-mono); font-size: 10px; color: var(--studio-text-muted); text-transform: uppercase; margin-bottom: 8px; }
.caption-preview .txt { font-size: 13px; line-height: 1.5; color: var(--studio-text-primary); word-break: break-word; }

/* Modal & Toast */
.modal-overlay { position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.75); display: flex; align-items: center; justify-content: center; z-index: 1000; opacity: 0; pointer-events: none; transition: opacity 0.2s; backdrop-filter: blur(4px); }
.modal-overlay.show { opacity: 1; pointer-events: auto; }
.modal-container { background: var(--studio-surface); border: 1px solid var(--studio-border); border-radius: var(--radius-modal); width: 90%; max-width: 900px; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: var(--elevation-3); }
.modal-header { padding: 16px 24px; border-bottom: 1px solid var(--studio-border); display: flex; justify-content: space-between; align-items: center; }
.modal-title { font-weight: 800; font-size: 16px; font-family: var(--font-display); }
.modal-close { background: none; border: none; color: var(--studio-text-muted); font-size: 24px; cursor: pointer; padding: 4px; }
.modal-body { padding: 24px; overflow-y: auto; flex: 1; }
.batch-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
.batch-card { background: var(--studio-surface-elevated); border: 1px solid var(--studio-border); border-radius: var(--radius-card); padding: 12px; display: flex; flex-direction: column; gap: 10px; }
.batch-card-title { font-family: var(--font-mono); font-size: 11px; color: var(--studio-text-muted); }
.batch-canvas-wrap canvas { width: 100% !important; height: auto !important; border-radius: 6px; display: block; }
.modal-footer { padding: 16px 24px; border-top: 1px solid var(--studio-border); display: flex; justify-content: flex-end; gap: 12px; }

.draft-item { display: flex; justify-content: space-between; align-items: center; background: var(--studio-surface); border: 1px solid var(--studio-border); border-radius: var(--radius-sharp); padding: 8px 12px; margin-bottom: 6px; font-size: 12px; cursor: pointer; min-height: 40px; }
.draft-del-btn { background: none; border: none; color: var(--studio-text-muted); cursor: pointer; min-width: 32px; min-height: 32px; display: flex; align-items: center; justify-content: center; }

/* Responsive Mobile Layout Flow (<1024px) */
@media (max-width: 1023px) {
  .app {
    grid-template-columns: 1fr;
  }

  .canvas-area {
    order: -1;
    padding: var(--space-4) var(--space-3);
    height: auto;
    border-bottom: 1px solid var(--studio-border);
  }

  .actions {
    max-width: 100%;
  }

  .caption-preview {
    max-width: 100%;
  }

  .sidebar {
    height: auto;
    border-right: none;
    padding: var(--space-4) var(--space-3) var(--space-12);
  }
}

@media (max-width: 767px) {
  input[type=text], textarea, select {
    font-size: 16px !important; /* Prevents iOS Safari auto-zoom */
  }

  .modal-container {
    width: 95%;
    max-height: 90vh;
  }
  .modal-header {
    padding: 12px 16px;
  }
  .modal-body {
    padding: 16px;
  }
  .modal-footer {
    padding: 12px 16px;
    flex-direction: column;
  }
  .modal-footer .btn {
    width: 100%;
  }
}

@media (max-width: 479px) {
  .color-picker-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
  }
  .picker-item label { font-size: 8.5px; }
  .hex-val { font-size: 8px; }

  .template-grid, .theme-card-grid {
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }

  .actions { flex-direction: column; }
  .btn { width: 100%; }
}
</style>
