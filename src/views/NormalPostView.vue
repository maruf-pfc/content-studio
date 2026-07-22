<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue';
import { wrapText, fitFontSize, drawRichLine } from '../utils/textHelper';

/* ---------------- DATA PRESETS ---------------- */
interface Platform {
  id: string;
  label: string;
  icon: string;
  ratios: string[];
  maxChars: number;
}

const PLATFORMS: Platform[] = [
  { id: 'instagram', label: 'Instagram', icon: '◪', ratios: ['1:1', '4:5', '9:16'], maxChars: 2200 },
  { id: 'facebook', label: 'Facebook', icon: '▣', ratios: ['1:1', '9:16'], maxChars: 63206 },
  { id: 'linkedin', label: 'LinkedIn', icon: '▤', ratios: ['1:1', '1.91:1'], maxChars: 3000 },
  { id: 'youtube', label: 'YouTube', icon: '▶', ratios: ['16:9'], maxChars: 5000 },
  { id: 'tiktok', label: 'TikTok', icon: '♪', ratios: ['9:16'], maxChars: 2200 },
  { id: 'twitter', label: 'X / Twitter', icon: '𝕏', ratios: ['16:9', '1:1'], maxChars: 280 }
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
  bg: string;
  bg2?: string;
  text: string;
  accent: string;
  fontPair: string;
  mode: 'dark' | 'light';
}

const THEMES: Theme[] = [
  { id: 'midnight', name: 'Midnight Violet', bg: '#14121A', bg2: '#221E30', text: '#F5F3FF', accent: '#7C5CFC', fontPair: 'outfit_plus', mode: 'dark' },
  { id: 'cream', name: 'Cream Editorial', bg: '#F4EFE6', bg2: '#EAE1D0', text: '#241F1A', accent: '#C1552E', fontPair: 'georgia_serif', mode: 'light' },
  { id: 'neon', name: 'Neon Night', bg: '#0A0A0A', bg2: '#151515', text: '#F2FFEA', accent: '#B6FF3C', fontPair: 'syne_space', mode: 'dark' },
  { id: 'pastel', name: 'Soft Pastel', bg: '#FDEFF4', bg2: '#F6E4EE', text: '#3B2A34', accent: '#FF8FAB', fontPair: 'outfit_plus', mode: 'light' },
  { id: 'mono', name: 'Bold Mono', bg: '#0E0E0E', bg2: '#1a1a1a', text: '#FFFFFF', accent: '#FFFFFF', fontPair: 'jetbrains_mono', mode: 'dark' },
  { id: 'ocean', name: 'Ocean Gradient', bg: '#062B3F', bg2: '#0A4A66', text: '#EAF7FF', accent: '#4FD1C5', fontPair: 'syne_space', mode: 'dark' }
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
const bgFileInput = ref<HTMLInputElement | null>(null);
const logoFileInput = ref<HTMLInputElement | null>(null);

const toastMsg = ref('');
const showToastFlag = ref(false);

const showBatchModal = ref(false);
const batchGrid = ref<HTMLDivElement | null>(null);

/* ---------------- COMPUTED PROPERTIES ---------------- */
const currentPlatformObject = computed((): Platform => {
  return (PLATFORMS.find(p => p.id === state.platform) || PLATFORMS[0]) as Platform;
});

const currentPlatformRatioDims = computed(() => {
  return RATIO_DIMS[state.ratio] || [1080, 1080];
});

const currentCaptionLength = computed(() => {
  return state.captionText.length;
});

const isCaptionLengthWarning = computed(() => {
  return currentCaptionLength.value > currentPlatformObject.value.maxChars;
});

const parsedCaption = computed(() => {
  const cap = state.captionText.trim();
  const tags = state.hashtagsText.trim();
  
  let html = cap
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
    
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');
  html = html.replace(/\n/g, '<br>');
  
  if (tags) {
    const escapedTags = tags.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    html += `<br><br><span class="hash">${escapedTags}</span>`;
  }
  
  return html;
});

/* ---------------- WATCHERS FOR AUTO-RENDERING ---------------- */
watch(() => state, () => {
  render();
}, { deep: true });

/* ---------------- METHODS & ACTIONS ---------------- */
const showToast = (msg: string) => {
  toastMsg.value = msg;
  showToastFlag.value = true;
  setTimeout(() => {
    showToastFlag.value = false;
  }, 2200);
};

const selectPlatform = (platformId: string) => {
  state.platform = platformId;
  const plat = PLATFORMS.find(p => p.id === platformId);
  if (plat && plat.ratios.length > 0) {
    state.ratio = plat.ratios[0] || '1:1';
  }
};

const selectRatio = (ratio: string) => {
  state.ratio = ratio;
};

const selectTemplate = (templateId: string) => {
  state.template = templateId;
};

const selectTheme = (th: Theme) => {
  state.theme = th.id;
  state.customAccent = '';
  state.customBg = '';
  state.customText = '';
  state.fontPairing = th.fontPair;
  
  state.customBg = th.bg;
  state.customAccent = th.accent;
  state.customText = th.text;
};

const setCustomColor = (type: 'accent' | 'bg' | 'text', value: string) => {
  if (type === 'accent') {
    state.customAccent = value;
  } else if (type === 'bg') {
    state.customBg = value;
  } else {
    state.customText = value;
  }
  trackColorHistory(value);
};

const trackColorHistory = (color: string) => {
  if (!state.recentColors.includes(color)) {
    state.recentColors.unshift(color);
    if (state.recentColors.length > 8) state.recentColors.pop();
    localStorage.setItem('studio_recent_colors', JSON.stringify(state.recentColors));
  }
};

const loadStoredColors = () => {
  const cached = localStorage.getItem('studio_recent_colors');
  if (cached) {
    state.recentColors = JSON.parse(cached);
  }
};

const resetCustomColors = () => {
  state.customBg = '';
  state.customAccent = '';
  state.customText = '';
  showToast('Colors reset to theme defaults ✓');
};

const applyRecentColor = (color: string) => {
  state.customAccent = color;
};

const selectAlignment = (align: 'left' | 'center' | 'right') => {
  state.align = align;
};

const addHashtag = (tag: string) => {
  const cur = state.hashtagsText.trim();
  if (!cur.includes(tag)) {
    state.hashtagsText = (cur ? cur + ' ' : '') + tag;
  }
};

// Background Image Upload
const onBgFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (evt) => {
    const src = evt.target?.result as string;
    bgImageSrc.value = src;
    const img = new Image();
    img.onload = () => {
      bgImageEl.value = img;
      render();
    };
    img.src = src;
  };
  reader.readAsDataURL(file);
};

const removeBgImage = () => {
  bgImageSrc.value = null;
  bgImageEl.value = null;
  if (bgFileInput.value) bgFileInput.value.value = '';
  render();
};

// Brand Logo Upload
const onLogoFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (evt) => {
    const src = evt.target?.result as string;
    logoImageSrc.value = src;
    const img = new Image();
    img.onload = () => {
      logoImageEl.value = img;
      render();
    };
    img.src = src;
  };
  reader.readAsDataURL(file);
};

const removeLogo = () => {
  logoImageSrc.value = null;
  logoImageEl.value = null;
  if (logoFileInput.value) logoFileInput.value.value = '';
  render();
};

// Draft Handlers
const loadDrafts = () => {
  const cached = localStorage.getItem('studio_drafts');
  drafts.value = cached ? JSON.parse(cached) : {};
};

const saveDraft = () => {
  const name = draftName.value.trim();
  if (!name) {
    showToast('Enter a draft name first!');
    return;
  }
  
  drafts.value[name] = {
    ...state,
    bgImageSrc: bgImageSrc.value,
    logoImageSrc: logoImageSrc.value
  };
  localStorage.setItem('studio_drafts', JSON.stringify(drafts.value));
  draftName.value = '';
  showToast(`Draft "${name}" saved ✓`);
};

const deleteDraft = (name: string) => {
  delete drafts.value[name];
  localStorage.setItem('studio_drafts', JSON.stringify(drafts.value));
  showToast(`Draft "${name}" deleted`);
};

const selectDraft = (name: string) => {
  const d = drafts.value[name];
  if (!d) return;
  
  Object.assign(state, d);
  
  if (d.bgImageSrc) {
    bgImageSrc.value = d.bgImageSrc;
    const img = new Image();
    img.onload = () => {
      bgImageEl.value = img;
      render();
    };
    img.src = d.bgImageSrc;
  } else {
    bgImageSrc.value = null;
    bgImageEl.value = null;
  }
  
  if (d.logoImageSrc) {
    logoImageSrc.value = d.logoImageSrc;
    const img = new Image();
    img.onload = () => {
      logoImageEl.value = img;
      render();
    };
    img.src = d.logoImageSrc;
  } else {
    logoImageSrc.value = null;
    logoImageEl.value = null;
  }
  
  showToast(`Loaded draft "${name}"`);
};

// Image Exports
const downloadPNG = () => {
  if (!mainCanvas.value) return;
  const link = document.createElement('a');
  link.download = `content-studio-${state.platform}-${state.ratio}-${Date.now()}.png`;
  link.href = mainCanvas.value.toDataURL('image/png');
  link.click();
  showToast('PNG Graphic Downloaded!');
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

const copyCaption = async () => {
  const cap = state.captionText.trim();
  const tags = state.hashtagsText.trim();
  const full = tags ? `${cap}\n\n${tags}` : cap;
  
  try {
    await navigator.clipboard.writeText(full);
    showToast('Caption text copied!');
  } catch {
    showToast('Copy failed — please copy manually');
  }
};

/* ---------------- CANVAS DRAWING PIPELINE ---------------- */
function getThemeDetails() {
  const th = { ...THEMES.find(t => t.id === state.theme) } as Theme;
  if (state.customAccent) th.accent = state.customAccent;
  if (state.customBg) th.bg = state.customBg;
  if (state.customText) th.text = state.customText;
  return th;
}

function getActiveFontPair(): FontPairing {
  return (FONT_PAIRINGS.find(f => f.id === state.fontPairing) || FONT_PAIRINGS[0]) as FontPairing;
}

function hexToRgba(hex: string, alpha: number) {
  if (!hex) return `rgba(0,0,0,${alpha})`;
  if (hex.startsWith('rgb')) {
    return hex.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
  }
  hex = hex.replace('#', '');
  let r, g, b;
  if (hex.length === 3) {
    r = parseInt(hex.substring(0, 1) + hex.substring(0, 1), 16);
    g = parseInt(hex.substring(1, 2) + hex.substring(1, 2), 16);
    b = parseInt(hex.substring(2, 3) + hex.substring(2, 3), 16);
  } else {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function drawLines(
  context: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  centerY: number,
  lineHeight: number,
  align: 'left' | 'center' | 'right',
  size: number,
  fontFamily: string,
  weight: string,
  accentColor: string,
  textColor: string
) {
  const totalHeight = lines.length * lineHeight;
  let y = centerY - (totalHeight / 2) + (lineHeight / 2);
  
  for (const line of lines) {
    drawRichLine(context, line, x, y, size, fontFamily, weight, accentColor, textColor, align);
    y += lineHeight;
  }
}

function renderGraphic(tempCanvas: HTMLCanvasElement, ratio: string, _platformId: string, isThumbnail = false) {
  const dims = RATIO_DIMS[ratio] || [1080, 1080];
  const w = dims[0];
  const h = dims[1];
  tempCanvas.width = w;
  tempCanvas.height = h;
  
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;
  const colors = getThemeDetails();
  const font = getActiveFontPair();
  const titleText = state.titleText.trim() || 'Your title/hook goes here';
  const bodyText = state.bodyText.trim();
  const pad = w * 0.09;
  
  // 1. Draw Background
  if (state.bgType === 'solid') {
    tempCtx.fillStyle = colors.bg;
    tempCtx.fillRect(0, 0, w, h);
  } else if (state.bgType === 'gradient') {
    const angleRad = ((state.bgGradientAngle || 135) * Math.PI) / 180;
    const cx = w / 2;
    const cy = h / 2;
    const x1 = cx - Math.cos(angleRad) * w * 0.5;
    const y1 = cy - Math.sin(angleRad) * h * 0.5;
    const x2 = cx + Math.cos(angleRad) * w * 0.5;
    const y2 = cy + Math.sin(angleRad) * h * 0.5;
    
    const grad = tempCtx.createLinearGradient(x1, y1, x2, y2);
    grad.addColorStop(0, colors.bg);
    grad.addColorStop(1, state.bgGradientColor2 || colors.bg2 || '#1a162b');
    tempCtx.fillStyle = grad;
    tempCtx.fillRect(0, 0, w, h);
  } else if (state.bgType === 'radial') {
    const grad = tempCtx.createRadialGradient(w/2, h/2, w * 0.05, w/2, h/2, Math.max(w,h) * 0.6);
    grad.addColorStop(0, state.bgGradientColor2 || colors.bg2 || '#1a162b');
    grad.addColorStop(1, colors.bg);
    tempCtx.fillStyle = grad;
    tempCtx.fillRect(0, 0, w, h);
  }

  // Ambient Glows
  if (state.ambientGlow) {
    tempCtx.save();
    const rad1 = tempCtx.createRadialGradient(w * 0.85, h * 0.15, 20, w * 0.85, h * 0.15, w * 0.45);
    rad1.addColorStop(0, hexToRgba(colors.accent, 0.22));
    rad1.addColorStop(1, 'rgba(0,0,0,0)');
    tempCtx.fillStyle = rad1;
    tempCtx.fillRect(0, 0, w, h);

    const rad2 = tempCtx.createRadialGradient(w * 0.15, h * 0.88, 20, w * 0.15, h * 0.88, w * 0.4);
    rad2.addColorStop(0, hexToRgba(colors.accent, 0.16));
    rad2.addColorStop(1, 'rgba(0,0,0,0)');
    tempCtx.fillStyle = rad2;
    tempCtx.fillRect(0, 0, w, h);
    tempCtx.restore();
  }

  // Background Image Layer
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

  // Alignment coordinates
  const align = state.align;
  tempCtx.textAlign = align;
  tempCtx.textBaseline = 'middle';
  
  let alignX = w / 2;
  if (align === 'left') alignX = pad;
  else if (align === 'right') alignX = w - pad;
  const maxTextWidth = w - pad * 2;
  
  // Template layout rendering
  if (state.template === 'stat') {
    const heroText = state.statNumber?.trim() || '10x';
    tempCtx.fillStyle = colors.accent;
    const heroSize = w * 0.28;
    tempCtx.font = `900 ${heroSize}px "${font.titleFont}", sans-serif`;
    tempCtx.fillText(heroText, alignX, h * 0.42);
    
    tempCtx.fillStyle = colors.text;
    const labelMaxHeight = h * 0.22;
    const startSize = state.autoFit ? w * 0.07 : (state.titleFontSize / 1000) * w;
    const fit = fitFontSize(tempCtx, titleText, maxTextWidth, labelMaxHeight, startSize, font.bodyFont, '600', 1.25, state.autoFit);
    drawLines(tempCtx, fit.lines, alignX, h * 0.62, fit.size * 1.25, align, fit.size, font.bodyFont, '600', colors.accent, colors.text);
    
  } else if (state.template === 'tip') {
    tempCtx.save();
    tempCtx.fillStyle = colors.accent;
    tempCtx.font = `700 ${w * 0.032}px "${font.bodyFont}", sans-serif`;
    tempCtx.fillText('PRO TIP', alignX, h * 0.14);
    tempCtx.restore();

    tempCtx.fillStyle = colors.text;
    const titleMaxHeight = h * 0.4;
    const startSize = state.autoFit ? w * 0.075 : (state.titleFontSize / 1000) * w;
    const fitTitle = fitFontSize(tempCtx, titleText, maxTextWidth, titleMaxHeight, startSize, font.titleFont, '800', 1.15, state.autoFit);
    drawLines(tempCtx, fitTitle.lines, alignX, h * 0.42, fitTitle.size * 1.15, align, fitTitle.size, font.titleFont, '800', colors.accent, colors.text);

    if (bodyText) {
      tempCtx.fillStyle = colors.text;
      tempCtx.save();
      tempCtx.globalAlpha = 0.75;
      const bodyMaxHeight = h * 0.22;
      const bStartSize = state.autoFit ? w * 0.036 : (state.bodyFontSize / 1000) * w;
      const fitBody = fitFontSize(tempCtx, bodyText, maxTextWidth, bodyMaxHeight, bStartSize, font.bodyFont, '400', 1.35, state.autoFit);
      drawLines(tempCtx, fitBody.lines, alignX, h * 0.72, fitBody.size * 1.35, align, fitBody.size, font.bodyFont, '400', colors.accent, colors.text);
      tempCtx.restore();
    }

  } else if (state.template === 'simple') {
    tempCtx.fillStyle = colors.text;
    const startSize = state.autoFit ? w * 0.09 : (state.titleFontSize / 1000) * w;
    const fit = fitFontSize(tempCtx, titleText, maxTextWidth, h * 0.5, startSize, font.titleFont, '800', 1.15, state.autoFit);
    drawLines(tempCtx, fit.lines, alignX, h * 0.5, fit.size * 1.15, align, fit.size, font.titleFont, '800', colors.accent, colors.text);

  } else {
    // Quote layout (Default)
    const quoteAlignX = w / 2;
    tempCtx.save();
    tempCtx.fillStyle = colors.accent;
    tempCtx.textAlign = 'center';
    tempCtx.textBaseline = 'middle';
    tempCtx.font = `800 ${w * 0.12}px Georgia, serif`;
    tempCtx.fillText('"', quoteAlignX, h * 0.22);
    tempCtx.restore();

    tempCtx.fillStyle = colors.text;
    const startSize = state.autoFit ? w * 0.08 : (state.titleFontSize / 1000) * w;
    const fit = fitFontSize(tempCtx, titleText, maxTextWidth, h * 0.45, startSize, font.titleFont, '700', 1.2, state.autoFit);
    drawLines(tempCtx, fit.lines, quoteAlignX, h * 0.5, fit.size * 1.2, 'center', fit.size, font.titleFont, '700', colors.accent, colors.text);

    if (bodyText) {
      tempCtx.fillStyle = colors.accent;
      const bodyMaxHeight = h * 0.15;
      const bStartSize = state.autoFit ? w * 0.03 : (state.bodyFontSize / 1000) * w;
      const fitBody = fitFontSize(tempCtx, bodyText, maxTextWidth, bodyMaxHeight, bStartSize, font.bodyFont, '600', 1.3, state.autoFit);
      const authorTextLines = fitBody.lines.map((line, idx) => idx === 0 ? `— ${line}` : `  ${line}`);
      drawLines(tempCtx, authorTextLines, quoteAlignX, h * 0.78, fitBody.size * 1.3, 'center', fitBody.size, font.bodyFont, '600', colors.accent, colors.text);
    }
  }

  // Draw Logo Overlay
  if (logoImageEl.value && !isThumbnail) {
    tempCtx.save();
    tempCtx.globalAlpha = state.logoOpacity / 100;
    const logoW = logoImageEl.value.width;
    const logoH = logoImageEl.value.height;
    const scale = state.logoScale / 100;
    const targetW = w * 0.18 * scale;
    const targetH = targetW * (logoH / logoW);
    
    let lx = w - targetW - pad;
    let ly = h - targetH - pad;
    
    if (state.logoPosition === 'top-left') { lx = pad; ly = pad; }
    else if (state.logoPosition === 'top-right') { lx = w - targetW - pad; ly = pad; }
    else if (state.logoPosition === 'bottom-left') { lx = pad; ly = h - targetH - pad; }
    else if (state.logoPosition === 'center') { lx = w/2 - targetW/2; ly = h/2 - targetH/2; }
    
    tempCtx.drawImage(logoImageEl.value, lx, ly, targetW, targetH);
    tempCtx.restore();
  }

  // Draw Watermark handle
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
}

const render = () => {
  nextTick(() => {
    if (!mainCanvas.value) return;
    renderGraphic(mainCanvas.value, state.ratio, state.platform, false);
  });
};

const openBatchModal = () => {
  showBatchModal.value = true;
  nextTick(() => {
    const ratios = Object.keys(RATIO_DIMS);
    ratios.forEach(ratio => {
      const el = document.getElementById(`batch-canvas-${ratio.replace(':', '-')}`) as HTMLCanvasElement;
      if (el) {
        renderGraphic(el, ratio, state.platform, true);
      }
    });
  });
};

const downloadBatchItem = (ratio: string) => {
  const tempCanvas = document.createElement('canvas');
  renderGraphic(tempCanvas, ratio, state.platform, false);
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

onMounted(() => {
  loadStoredColors();
  loadDrafts();
  render();
});
</script>

<template>
  <div class="app">
    <!-- SIDEBAR -->
    <div class="sidebar">
      <!-- Platform & Ratio -->
      <div class="section">
        <div class="section-label">Platform</div>
        <div class="platform-grid">
          <div 
            v-for="p in PLATFORMS" 
            :key="p.id" 
            class="platform-btn"
            :class="{ active: p.id === state.platform }"
            @click="selectPlatform(p.id)"
          >
            <span class="pico">{{ p.icon }}</span>{{ p.label }}
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-label">Image Ratio</div>
        <div class="ratio-row">
          <div 
            v-for="r in PLATFORMS.find(x => x.id === state.platform)?.ratios" 
            :key="r"
            class="ratio-chip"
            :class="{ active: r === state.ratio }"
            @click="selectRatio(r)"
          >
            {{ r }}
          </div>
        </div>
      </div>

      <!-- Template & Fonts -->
      <div class="section">
        <div class="section-label">Layout Template</div>
        <div class="template-grid">
          <div 
            v-for="t in TEMPLATES" 
            :key="t.id"
            class="tpl-btn"
            :class="{ active: t.id === state.template }"
            @click="selectTemplate(t.id)"
          >
            <strong>{{ t.name }}</strong>{{ t.desc }}
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-label">Typography</div>
        <label class="field-label">Font Pairing</label>
        <select v-model="state.fontPairing">
          <option v-for="f in FONT_PAIRINGS" :key="f.id" :value="f.id">
            {{ f.name }}
          </option>
        </select>
        
        <label class="field-label">Alignment</label>
        <div class="align-row">
          <div class="align-btn" :class="{ active: state.align === 'left' }" @click="selectAlignment('left')">⯇</div>
          <div class="align-btn" :class="{ active: state.align === 'center' }" @click="selectAlignment('center')">☰</div>
          <div class="align-btn" :class="{ active: state.align === 'right' }" @click="selectAlignment('right')">⯈</div>
        </div>
        
        <div class="toggle-row">
          <label class="field-label">Auto-fit text size</label>
          <div class="switch" :class="{ on: state.autoFit }" @click="state.autoFit = !state.autoFit"></div>
        </div>
      </div>

      <!-- Theme & Colors -->
      <div class="section">
        <div class="section-label">Theme</div>
        <div class="theme-grid">
          <div 
            v-for="th in THEMES" 
            :key="th.id"
            class="theme-swatch"
            :class="{ active: th.id === state.theme }"
            :style="{ background: `linear-gradient(135deg, ${th.bg}, ${th.accent})` }"
            @click="selectTheme(th)"
          >
            <span>{{ th.name }}</span>
          </div>
        </div>
        
        <div class="color-row" style="display:flex; gap:8px; margin-top:8px;">
          <input type="color" :value="state.customAccent || '#7C5CFC'" @input="e => setCustomColor('accent', (e.target as HTMLInputElement).value)" title="Custom accent color">
          <input type="color" :value="state.customBg || '#14121A'" @input="e => setCustomColor('bg', (e.target as HTMLInputElement).value)" title="Custom background color">
          <input type="color" :value="state.customText || '#FFFFFF'" @input="e => setCustomColor('text', (e.target as HTMLInputElement).value)" title="Custom text color">
          <button class="btn" style="padding:6px 12px; font-size:11px;" @click="resetCustomColors">Reset</button>
        </div>
      </div>

      <!-- Media Overlays -->
      <div class="section">
        <div class="section-label">Media Overlays</div>
        <label class="field-label">Background Photo</label>
        <div style="display:flex; gap:8px;">
          <input type="file" ref="bgFileInput" accept="image/*" style="display:none;" @change="onBgFileChange">
          <button class="btn" @click="bgFileInput?.click()" style="padding:6px 12px; font-size:12px; flex:1;">Upload Photo</button>
          <button v-if="bgImageSrc" class="btn" @click="removeBgImage" style="padding:6px 12px; font-size:12px;">Remove</button>
        </div>

        <label class="field-label" style="margin-top:12px;">Brand Logo Overlay</label>
        <div style="display:flex; gap:8px;">
          <input type="file" ref="logoFileInput" accept="image/*" style="display:none;" @change="onLogoFileChange">
          <button class="btn" @click="logoFileInput?.click()" style="padding:6px 12px; font-size:12px; flex:1;">Upload Logo</button>
          <button v-if="logoImageSrc" class="btn" @click="removeLogo" style="padding:6px 12px; font-size:12px;">Remove</button>
        </div>
      </div>

      <!-- Content Input -->
      <div class="section">
        <div class="section-label">Content</div>
        <div v-if="state.template === 'stat'">
          <label class="field-label">Hero Stat Number (e.g. 99%, 10x, #1)</label>
          <input type="text" v-model="state.statNumber" placeholder="e.g. 10x or 99%">
        </div>
        
        <div>
          <label class="field-label">Title / Hook (*bold accent*)</label>
          <textarea v-model="state.titleText" placeholder="e.g. যা মনে আছে সেটাই বলি"></textarea>

          <label class="field-label">Body / Subtext (optional)</label>
          <textarea v-model="state.bodyText" placeholder="Supporting line or leave blank"></textarea>
        </div>

        <label class="field-label">Caption (for post)</label>
        <textarea v-model="state.captionText" placeholder="Write caption..."></textarea>

        <label class="field-label">Hashtags</label>
        <textarea v-model="state.hashtagsText" placeholder="#Hashtags"></textarea>
        <div class="hashtag-chips">
          <div v-for="tag in HASHTAG_PRESETS" :key="tag" class="hchip" @click="addHashtag(tag)">{{ tag }}</div>
        </div>
      </div>

      <!-- Saved Drafts -->
      <div class="section">
        <div class="section-label">Saved Drafts</div>
        <div style="display:flex; gap:8px; margin-bottom:8px;">
          <input type="text" v-model="draftName" placeholder="Draft name..." style="flex:1;">
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

    <!-- CANVAS AREA -->
    <div class="canvas-area">
      <div class="frame-wrap" id="frameWrap">
        <canvas ref="mainCanvas"></canvas>
      </div>

      <div class="actions">
        <button class="btn primary" @click="downloadPNG">⬇ Download PNG</button>
        <button class="btn" @click="copyImage">⧉ Copy Image</button>
        <button class="btn secondary" @click="copyCaption">📋 Copy Caption</button>
      </div>

      <button class="btn ghost" style="width:100%; max-width:520px; justify-content:center; margin-top:8px;" @click="openBatchModal">
        ⚡ Multi-Format Batch Export Previews
      </button>

      <div class="caption-preview">
        <div class="lbl">Ready-to-paste caption</div>
        <div class="txt" v-html="parsedCaption"></div>
      </div>
    </div>

    <!-- BATCH EXPORT MODAL -->
    <div class="modal-overlay" :class="{ show: showBatchModal }">
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">Multi-Format Batch Export Previews</div>
          <button class="modal-close" @click="showBatchModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="batch-grid" ref="batchGrid">
            <div v-for="(dims, ratio) in RATIO_DIMS" :key="ratio" class="batch-card">
              <div class="batch-card-title">{{ ratio }} Ratio</div>
              <div class="batch-canvas-wrap">
                <canvas :id="`batch-canvas-${ratio.replace(':', '-')}`"></canvas>
              </div>
              <button class="btn secondary" style="width:100%; font-size:11px;" @click="downloadBatchItem(ratio.toString())">Download Format</button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn ghost" @click="showBatchModal = false">Close</button>
          <button class="btn secondary" @click="downloadAllBatch">⬇ Download All Formats</button>
        </div>
      </div>
    </div>

    <!-- Toast system -->
    <div class="toast" :class="{ show: showToastFlag }">
      <span>{{ toastMsg }}</span>
    </div>
  </div>
</template>

<style scoped>
.app {
  display: grid;
  grid-template-columns: 380px 1fr;
  min-height: calc(100vh - 56px);
}

@media (max-width: 1024px) {
  .app { grid-template-columns: 1fr; }
  .canvas-area { order: -1; padding: 24px 16px 40px; }
}

.sidebar {
  background: var(--panel);
  border-right: 1px solid var(--line);
  padding: 24px;
  overflow-y: auto;
  height: calc(100vh - 56px);
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

label.field-label { display: block; font-size: 12px; color: var(--text-dim); margin: 12px 0 6px; }

input[type=text], textarea, select {
  width: 100%; background: var(--panel-2); border: 1px solid var(--line);
  color: var(--text); padding: 10px 12px; border-radius: 8px; font-size: 13.5px;
  font-family: var(--body); resize: vertical; box-sizing: border-box;
}

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

.template-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.tpl-btn {
  background: var(--panel-2); border: 1px solid var(--line); border-radius: 8px;
  padding: 10px; cursor: pointer; font-size: 12px; color: var(--text-dim); text-align: left;
}
.tpl-btn strong { display: block; font-size: 12.5px; color: var(--text); margin-bottom: 2px; }
.tpl-btn.active { border-color: var(--accent-2); background: rgba(255, 107, 74, 0.10); }

.theme-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.theme-swatch { height: 48px; border-radius: 8px; cursor: pointer; position: relative; overflow: hidden; border: 2px solid transparent; }
.theme-swatch.active { border-color: var(--text); }
.theme-swatch span { position: absolute; bottom: 4px; left: 6px; font-family: var(--mono); font-size: 9px; background: rgba(0,0,0,0.4); padding: 1px 5px; border-radius: 4px; color: #fff; }

.align-row { display: flex; gap: 6px; }
.align-btn { flex: 1; background: var(--panel-2); border: 1px solid var(--line); border-radius: 6px; padding: 8px 0; cursor: pointer; color: var(--text-dim); font-size: 14px; text-align: center; }
.align-btn.active { border-color: var(--accent); color: var(--text); }

.toggle-row { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
.switch { width: 38px; height: 22px; background: var(--panel-2); border: 1px solid var(--line); border-radius: 20px; position: relative; cursor: pointer; }
.switch.on { background: var(--accent); border-color: var(--accent); }
.switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; background: #fff; border-radius: 50%; transition: left .15s; }
.switch.on::after { left: 18px; }

.hashtag-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.hchip { font-family: var(--mono); font-size: 10.5px; background: var(--panel-2); border: 1px solid var(--line); padding: 4px 9px; border-radius: 14px; cursor: pointer; color: var(--text-dim); }

.color-row input[type=color] { width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--line); background: none; cursor: pointer; padding: 0; }

.canvas-area {
  display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
  padding: 32px 24px 60px; background: var(--bg); overflow-y: auto; height: calc(100vh - 56px); box-sizing: border-box;
}

.frame-wrap { max-width: 520px; width: 100%; position: relative; display: flex; justify-content: center; align-items: center; margin-bottom: 20px; }
.frame-wrap canvas { width: 100% !important; height: auto !important; border-radius: 12px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); border: 1px solid var(--line); display: block; }

.actions { display: flex; gap: 10px; width: 100%; max-width: 520px; flex-wrap: wrap; }
.btn { background: var(--panel-2); border: 1px solid var(--line); color: var(--text); padding: 10px 16px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; }
.btn.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
.btn.secondary { background: var(--panel); border-color: var(--line); }
.btn.ghost { background: transparent; border-color: var(--line); color: var(--text-dim); }

.caption-preview { max-width: 520px; width: 100%; margin-top: 20px; background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 16px; box-sizing: border-box; }
.caption-preview .lbl { font-family: var(--mono); font-size: 10px; color: var(--text-dim); text-transform: uppercase; margin-bottom: 8px; }
.caption-preview .txt { font-size: 13px; line-height: 1.5; color: var(--text); word-break: break-word; }

/* Modal & Toast */
.modal-overlay { position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.75); display: flex; align-items: center; justify-content: center; z-index: 1000; opacity: 0; pointer-events: none; transition: opacity 0.2s; }
.modal-overlay.show { opacity: 1; pointer-events: auto; }
.modal-container { background: var(--panel); border: 1px solid var(--line); border-radius: 16px; width: 90%; max-width: 900px; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; }
.modal-header { padding: 16px 24px; border-bottom: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center; }
.modal-title { font-weight: 700; font-size: 16px; }
.modal-close { background: none; border: none; color: var(--text-dim); font-size: 24px; cursor: pointer; }
.modal-body { padding: 24px; overflow-y: auto; flex: 1; }
.batch-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
.batch-card { background: var(--panel-2); border: 1px solid var(--line); border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
.batch-card-title { font-family: var(--mono); font-size: 11px; color: var(--text-dim); }
.batch-canvas-wrap canvas { width: 100% !important; height: auto !important; border-radius: 6px; display: block; }
.modal-footer { padding: 16px 24px; border-top: 1px solid var(--line); display: flex; justify-content: flex-end; gap: 12px; }

.toast { position: fixed; bottom: 24px; right: 24px; background: var(--panel-2); border: 1px solid var(--accent); color: var(--text); padding: 12px 20px; border-radius: 10px; font-weight: 600; font-size: 13px; opacity: 0; transform: translateY(20px); transition: all 0.25s; pointer-events: none; z-index: 2000; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
.toast.show { opacity: 1; transform: translateY(0); }
.draft-item { display: flex; justify-content: space-between; align-items: center; background: var(--panel-2); border: 1px solid var(--line); border-radius: 6px; padding: 6px 10px; margin-bottom: 6px; font-size: 12px; cursor: pointer; }
.draft-del-btn { background: none; border: none; color: var(--text-dim); cursor: pointer; }
</style>
