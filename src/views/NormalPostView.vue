<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue';
import { fitFontSize, drawRichLine } from '../utils/textHelper';

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

const PRESET_ACCENTS = [
  '#7C5CFC', '#C1552E', '#B6FF3C', '#FF8FAB', '#4FD1C5', '#FF2E4C', '#FF7D3B', '#20E298', '#FFFFFF'
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

const themeCategoryFilter = ref<'all' | 'dark' | 'vibrant' | 'light'>('all');
const isMobileDrawerOpen = ref(false);

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
const filteredThemes = computed(() => {
  if (themeCategoryFilter.value === 'all') return THEMES;
  return THEMES.filter(t => t.category === themeCategoryFilter.value);
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

/* ---------------- WATCHERS ---------------- */
watch(() => state, () => {
  render();
}, { deep: true });

/* ---------------- METHODS ---------------- */
const showToast = (msg: string) => {
  toastMsg.value = msg;
  showToastFlag.value = true;
  setTimeout(() => { showToastFlag.value = false; }, 2200);
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
};

const resetCustomColors = () => {
  state.customBg = '';
  state.customAccent = '';
  state.customText = '';
  showToast('Colors reset to active theme defaults');
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

/* ---------------- CANVAS ENGINE ---------------- */
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
  
  // Background Fill
  tempCtx.fillStyle = colors.bg;
  tempCtx.fillRect(0, 0, w, h);

  // Background Image
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
  loadDrafts();
  render();
});
</script>

<template>
  <div class="app">
    <!-- Mobile Backdrop -->
    <div 
      class="mobile-backdrop" 
      :class="{ open: isMobileDrawerOpen }" 
      @click="isMobileDrawerOpen = false"
    ></div>

    <!-- SIDEBAR CONTROLS -->
    <aside class="sidebar" :class="{ 'drawer-open': isMobileDrawerOpen }">
      <div class="mobile-drawer-handle" @click="isMobileDrawerOpen = !isMobileDrawerOpen">
        <span class="handle-bar"></span>
        <span class="handle-txt">{{ isMobileDrawerOpen ? 'Close Controls' : 'Tap to Open Controls' }}</span>
      </div>

      <!-- Platform & Ratio -->
      <section class="section">
        <h2 class="section-label">Platform</h2>
        <div class="platform-grid">
          <button 
            v-for="p in PLATFORMS" 
            :key="p.id" 
            class="platform-btn"
            :class="{ active: p.id === state.platform }"
            @click="selectPlatform(p.id)"
            :aria-label="`Select platform ${p.label}`"
          >
            <span class="pico" aria-hidden="true">{{ p.icon }}</span>{{ p.label }}
          </button>
        </div>
      </section>

      <section class="section">
        <h2 class="section-label">Image Ratio</h2>
        <div class="ratio-row">
          <button 
            v-for="r in PLATFORMS.find(x => x.id === state.platform)?.ratios" 
            :key="r"
            class="ratio-chip"
            :class="{ active: r === state.ratio }"
            @click="selectRatio(r)"
            :aria-label="`Select ratio ${r}`"
          >
            {{ r }}
          </button>
        </div>
      </section>

      <!-- Template & Fonts -->
      <section class="section">
        <h2 class="section-label">Layout Template</h2>
        <div class="template-grid">
          <div 
            v-for="t in TEMPLATES" 
            :key="t.id"
            class="tpl-btn"
            :class="{ active: t.id === state.template }"
            @click="selectTemplate(t.id)"
            role="button"
            tabindex="0"
          >
            <strong>{{ t.name }}</strong>{{ t.desc }}
          </div>
        </div>
      </section>

      <section class="section">
        <h2 class="section-label">Typography</h2>
        <label class="field-label" for="font-pairing-select">Font Pairing</label>
        <select id="font-pairing-select" v-model="state.fontPairing">
          <option v-for="f in FONT_PAIRINGS" :key="f.id" :value="f.id">
            {{ f.name }}
          </option>
        </select>
        
        <label class="field-label">Alignment</label>
        <div class="align-row">
          <button class="align-btn" :class="{ active: state.align === 'left' }" @click="selectAlignment('left')" aria-label="Align left">⯇</button>
          <button class="align-btn" :class="{ active: state.align === 'center' }" @click="selectAlignment('center')" aria-label="Align center">☰</button>
          <button class="align-btn" :class="{ active: state.align === 'right' }" @click="selectAlignment('right')" aria-label="Align right">⯈</button>
        </div>
        
        <div class="toggle-row">
          <label class="field-label" style="margin:0;">Auto-fit text size</label>
          <div class="switch" :class="{ on: state.autoFit }" @click="state.autoFit = !state.autoFit" role="switch" :aria-checked="state.autoFit"></div>
        </div>
      </section>

      <!-- Professional Theme & Color System -->
      <section class="section">
        <h2 class="section-label">Theme & Color System</h2>

        <!-- Filter Category Tabs -->
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

        <!-- Palette Card Grid -->
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

        <!-- Custom Color Overrides Box -->
        <div class="color-overrides-box">
          <div class="override-header">
            <span>Custom Color Overrides</span>
            <button class="btn tiny" @click="resetCustomColors">Reset Colors</button>
          </div>

          <div class="color-picker-grid">
            <div class="picker-item">
              <label>Background</label>
              <div class="picker-row">
                <input type="color" :value="state.customBg || getThemeDetails().bg" @input="e => setCustomColor('bg', (e.target as HTMLInputElement).value)" aria-label="Custom Background Color">
                <span class="hex-val">{{ state.customBg || getThemeDetails().bg }}</span>
              </div>
            </div>

            <div class="picker-item">
              <label>Accent</label>
              <div class="picker-row">
                <input type="color" :value="state.customAccent || getThemeDetails().accent" @input="e => setCustomColor('accent', (e.target as HTMLInputElement).value)" aria-label="Custom Accent Color">
                <span class="hex-val">{{ state.customAccent || getThemeDetails().accent }}</span>
              </div>
            </div>

            <div class="picker-item">
              <label>Text</label>
              <div class="picker-row">
                <input type="color" :value="state.customText || getThemeDetails().text" @input="e => setCustomColor('text', (e.target as HTMLInputElement).value)" aria-label="Custom Text Color">
                <span class="hex-val">{{ state.customText || getThemeDetails().text }}</span>
              </div>
            </div>
          </div>

          <div class="quick-swatches">
            <span style="font-size:10.5px; color:var(--studio-text-muted);">Quick Accent:</span>
            <div class="swatch-dots">
              <span 
                v-for="col in PRESET_ACCENTS" 
                :key="col"
                class="dot-btn"
                :style="{ backgroundColor: col }"
                @click="setCustomColor('accent', col)"
                role="button"
                :aria-label="`Select accent color ${col}`"
              ></span>
            </div>
          </div>
        </div>
      </section>

      <!-- Media Overlays -->
      <section class="section">
        <h2 class="section-label">Media Overlays</h2>
        <label class="field-label">Background Photo</label>
        <div style="display:flex; gap:8px;">
          <input type="file" ref="bgFileInput" accept="image/*" style="display:none;" @change="onBgFileChange">
          <button class="btn" @click="bgFileInput?.click()" style="padding:6px 12px; font-size:12px; flex:1;">Upload Photo</button>
          <button v-if="bgImageSrc" class="btn tiny danger" @click="removeBgImage">Remove</button>
        </div>

        <label class="field-label" style="margin-top:12px;">Brand Logo Overlay</label>
        <div style="display:flex; gap:8px;">
          <input type="file" ref="logoFileInput" accept="image/*" style="display:none;" @change="onLogoFileChange">
          <button class="btn" @click="logoFileInput?.click()" style="padding:6px 12px; font-size:12px; flex:1;">Upload Logo</button>
          <button v-if="logoImageSrc" class="btn tiny danger" @click="removeLogo">Remove</button>
        </div>
      </section>

      <!-- Content Input -->
      <section class="section">
        <h2 class="section-label">Content</h2>
        <div v-if="state.template === 'stat'">
          <label class="field-label" for="stat-input">Hero Stat Number (e.g. 99%, 10x, #1)</label>
          <input id="stat-input" type="text" v-model="state.statNumber" placeholder="e.g. 10x or 99%">
        </div>
        
        <div>
          <label class="field-label" for="title-input">Title / Hook (*bold accent*)</label>
          <textarea id="title-input" v-model="state.titleText" placeholder="e.g. যা মনে আছে সেটাই বলি"></textarea>

          <label class="field-label" for="body-input">Body / Subtext (optional)</label>
          <textarea id="body-input" v-model="state.bodyText" placeholder="Supporting line or leave blank"></textarea>
        </div>

        <label class="field-label" for="caption-input">Caption (for post)</label>
        <textarea id="caption-input" v-model="state.captionText" placeholder="Write caption..."></textarea>

        <label class="field-label" for="hashtags-input">Hashtags</label>
        <textarea id="hashtags-input" v-model="state.hashtagsText" placeholder="#Hashtags"></textarea>
        <div class="hashtag-chips">
          <button v-for="tag in HASHTAG_PRESETS" :key="tag" class="hchip" @click="addHashtag(tag)">{{ tag }}</button>
        </div>
      </section>

      <!-- Saved Drafts -->
      <section class="section">
        <h2 class="section-label">Saved Drafts</h2>
        <div style="display:flex; gap:8px; margin-bottom:8px;">
          <input type="text" v-model="draftName" placeholder="Draft name..." style="flex:1;" aria-label="Draft Name">
          <button class="btn" @click="saveDraft">Save</button>
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
      </section>
    </aside>

    <!-- CANVAS WORKSTATION AREA -->
    <div class="canvas-area">
      <!-- Mobile Drawer Open Toggle Bar -->
      <div class="mobile-drawer-toggle-bar">
        <button class="btn primary" @click="isMobileDrawerOpen = !isMobileDrawerOpen">
          ⚡ {{ isMobileDrawerOpen ? 'Close Controls Sheet' : 'Open Controls Drawer' }}
        </button>
      </div>

      <div class="frame-wrap" id="frameWrap">
        <canvas ref="mainCanvas"></canvas>
      </div>

      <div class="actions">
        <button class="btn primary" @click="downloadPNG">⬇ Download PNG</button>
        <button class="btn secondary" @click="copyImage">⧉ Copy Image</button>
        <button class="btn secondary" @click="copyCaption">📋 Copy Caption</button>
      </div>

      <button class="btn secondary" style="width:100%; max-width:520px; justify-content:center; margin-top:12px;" @click="openBatchModal">
        ⚡ Multi-Format Batch Export Previews
      </button>

      <div class="caption-preview">
        <div class="lbl">Ready-to-paste caption</div>
        <div class="txt" v-html="parsedCaption"></div>
      </div>
    </div>

    <!-- BATCH EXPORT MODAL -->
    <div class="modal-overlay" :class="{ show: showBatchModal }" role="dialog" aria-modal="true">
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">Multi-Format Batch Export Previews</div>
          <button class="modal-close" @click="showBatchModal = false" aria-label="Close modal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="batch-grid" ref="batchGrid">
            <div v-for="(dims, ratioKey) in RATIO_DIMS" :key="ratioKey" class="batch-card">
              <div class="batch-card-title">{{ ratioKey }} Ratio</div>
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

    <!-- Toast system -->
    <div class="toast" :class="{ show: showToastFlag }" role="status" aria-live="polite">
      <span>{{ toastMsg }}</span>
    </div>
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
  padding: var(--space-6);
  overflow-y: auto;
  height: calc(100vh - 60px);
  box-shadow: var(--elevation-1);
}

.mobile-drawer-handle, .mobile-backdrop, .mobile-drawer-toggle-bar {
  display: none;
}

.section { margin-bottom: var(--space-6); }
.section-label {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--studio-text-muted);
  margin-bottom: var(--space-3);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.section-label::after { content: ''; flex: 1; height: 1px; background: var(--studio-border); }

label.field-label { display: block; font-size: var(--text-xs); color: var(--studio-text-secondary); margin: var(--space-3) 0 var(--space-1); font-weight: 600; }

input[type=text], textarea, select {
  width: 100%; background: var(--studio-surface-elevated); border: 1px solid var(--studio-border);
  color: var(--studio-text-primary); padding: 10px 12px; border-radius: var(--radius-sharp); font-size: var(--text-sm);
  font-family: var(--font-body); resize: vertical; box-sizing: border-box; min-height: var(--min-touch-target);
  transition: border-color 0.15s;
}
input[type=text]:focus, textarea:focus, select:focus {
  border-color: var(--studio-accent-primary);
}

.platform-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-2); }
.platform-btn {
  min-height: var(--min-touch-target);
  background: var(--studio-surface-elevated); border: 1px solid var(--studio-border); border-radius: var(--radius-sharp);
  padding: 8px 4px; cursor: pointer; color: var(--studio-text-secondary); font-size: 11px;
  font-family: var(--font-mono); text-align: center; transition: all 0.15s;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
}
.platform-btn:hover { border-color: var(--studio-border-strong); color: var(--studio-text-primary); }
.platform-btn.active { border-color: var(--studio-accent-primary); color: var(--studio-text-primary); background: rgba(230, 57, 70, 0.15); font-weight: 700; }

.ratio-row { display: flex; gap: var(--space-2); flex-wrap: wrap; }
.ratio-chip {
  min-height: 36px;
  background: var(--studio-surface-elevated); border: 1px solid var(--studio-border); border-radius: var(--radius-pill);
  padding: 6px 14px; font-size: 11.5px; font-family: var(--font-mono); cursor: pointer; color: var(--studio-text-secondary);
  display: flex; align-items: center; justify-content: center; transition: all 0.15s;
}
.ratio-chip:hover { border-color: var(--studio-border-strong); color: var(--studio-text-primary); }
.ratio-chip.active { background: var(--studio-accent-primary); border-color: var(--studio-accent-primary); color: #fff; font-weight: 700; }

.template-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2); }
.tpl-btn {
  min-height: 54px;
  background: var(--studio-surface-elevated); border: 1px solid var(--studio-border); border-radius: var(--radius-card);
  padding: 10px; cursor: pointer; font-size: 12px; color: var(--studio-text-secondary); text-align: left; transition: all 0.15s;
}
.tpl-btn:hover { border-color: var(--studio-border-strong); }
.tpl-btn strong { display: block; font-size: 12.5px; color: var(--studio-text-primary); margin-bottom: 2px; }
.tpl-btn.active { border-color: var(--studio-accent-primary); background: rgba(230, 57, 70, 0.12); }

/* Theme UI */
.theme-cat-tabs {
  display: flex; gap: 4px; background: var(--studio-bg); padding: 3px;
  border-radius: var(--radius-sharp); border: 1px solid var(--studio-border); margin-bottom: var(--space-3);
}
.cat-tab {
  flex: 1; min-height: 32px; background: transparent; border: none; color: var(--studio-text-secondary);
  font-family: var(--font-mono); font-size: 10px; font-weight: 700; padding: 4px 0;
  border-radius: var(--radius-sharp); cursor: pointer; text-align: center; transition: all 0.15s;
}
.cat-tab.active { background: var(--studio-accent-primary); color: #fff; }

.theme-card-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2); margin-bottom: var(--space-3);
}

.palette-card {
  min-height: 54px;
  background: var(--studio-surface-elevated); border: 1px solid var(--studio-border); border-radius: var(--radius-card);
  padding: 8px; cursor: pointer; position: relative; transition: all 0.18s ease;
  display: flex; flex-direction: column; gap: 6px; text-align: left;
}
.palette-card:hover { border-color: var(--studio-accent-primary); transform: translateY(-1px); }
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
  background: var(--studio-surface-elevated); border: 1px solid var(--studio-border); border-radius: var(--radius-card);
  padding: var(--space-3); display: flex; flex-direction: column; gap: var(--space-2);
}
.override-header { display: flex; justify-content: space-between; align-items: center; font-size: 11px; font-weight: 700; }

.color-picker-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.picker-item label { display: block; font-size: 9.5px; color: var(--studio-text-secondary); margin-bottom: 3px; font-family: var(--font-mono); }
.picker-row { display: flex; align-items: center; gap: 4px; background: var(--studio-surface); border: 1px solid var(--studio-border); padding: 3px 5px; border-radius: var(--radius-sharp); min-height: 36px; }
.picker-row input[type=color] { width: 22px; height: 22px; border-radius: 4px; border: none; background: none; cursor: pointer; padding: 0; }
.hex-val { font-family: var(--font-mono); font-size: 9px; color: var(--studio-text-secondary); text-transform: uppercase; overflow: hidden; text-overflow: ellipsis; }

.quick-swatches { display: flex; align-items: center; justify-content: space-between; margin-top: 2px; }
.swatch-dots { display: flex; gap: 6px; }
.dot-btn { width: 18px; height: 18px; border-radius: 50%; cursor: pointer; border: 1px solid rgba(255,255,255,0.2); transition: transform 0.15s; }
.dot-btn:hover { transform: scale(1.25); }

.align-row { display: flex; gap: 6px; }
.align-btn { flex: 1; min-height: var(--min-touch-target); background: var(--studio-surface-elevated); border: 1px solid var(--studio-border); border-radius: var(--radius-sharp); padding: 8px 0; cursor: pointer; color: var(--studio-text-secondary); font-size: 14px; text-align: center; }
.align-btn.active { border-color: var(--studio-accent-primary); color: var(--studio-text-primary); }

.toggle-row { display: flex; align-items: center; justify-content: space-between; min-height: var(--min-touch-target); margin-top: 10px; }
.switch { width: 44px; height: 24px; background: var(--studio-surface-elevated); border: 1px solid var(--studio-border); border-radius: var(--radius-pill); position: relative; cursor: pointer; transition: all 0.2s; }
.switch.on { background: var(--studio-accent-primary); border-color: var(--studio-accent-primary); }
.switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; background: #fff; border-radius: 50%; transition: left 0.15s; }
.switch.on::after { left: 22px; }

.hashtag-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.hchip { min-height: 32px; font-family: var(--font-mono); font-size: 10.5px; background: var(--studio-surface-elevated); border: 1px solid var(--studio-border); padding: 4px 10px; border-radius: var(--radius-pill); cursor: pointer; color: var(--studio-text-secondary); display: flex; align-items: center; }
.hchip:hover { border-color: var(--studio-border-strong); color: var(--studio-text-primary); }

.canvas-area {
  display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
  padding: var(--space-6) var(--space-6) var(--space-12); background: var(--studio-bg); overflow-y: auto; height: calc(100vh - 60px); box-sizing: border-box;
}

.frame-wrap { max-width: 520px; width: 100%; position: relative; display: flex; justify-content: center; align-items: center; margin-bottom: 20px; }
.frame-wrap canvas { width: 100% !important; height: auto !important; border-radius: var(--radius-card); box-shadow: var(--elevation-3); border: 1px solid var(--studio-border); display: block; }

.actions { display: flex; gap: 10px; width: 100%; max-width: 520px; flex-wrap: wrap; }
.btn {
  min-height: var(--min-touch-target);
  background: var(--studio-surface-elevated); border: 1px solid var(--studio-border); color: var(--studio-text-primary);
  padding: 10px 18px; border-radius: var(--radius-sharp); font-weight: 700; font-size: var(--text-sm);
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.15s;
}
.btn:hover { border-color: var(--studio-border-strong); }
.btn.primary { background: var(--studio-accent-primary); border-color: var(--studio-accent-primary); color: #fff; flex: 1; box-shadow: 0 4px 14px rgba(230, 57, 70, 0.35); }
.btn.secondary { background: var(--studio-surface); border-color: var(--studio-border); }
.btn.tiny { min-height: 32px; padding: 4px 10px; font-size: 11px; }
.btn.danger { background: rgba(255,77,77,0.15); color: #ff4d4d; border-color: rgba(255,77,77,0.3); }

.caption-preview { max-width: 520px; width: 100%; margin-top: 20px; background: var(--studio-surface); border: 1px solid var(--studio-border); border-radius: var(--radius-card); padding: var(--space-4); box-sizing: border-box; }
.caption-preview .lbl { font-family: var(--font-mono); font-size: 10px; color: var(--studio-text-muted); text-transform: uppercase; margin-bottom: 8px; }
.caption-preview .txt { font-size: 13px; line-height: 1.5; color: var(--studio-text-primary); word-break: break-word; }

/* Modal & Toast */
.modal-overlay { position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.75); display: flex; align-items: center; justify-content: center; z-index: 1000; opacity: 0; pointer-events: none; transition: opacity 0.2s; }
.modal-overlay.show { opacity: 1; pointer-events: auto; }
.modal-container { background: var(--studio-surface); border: 1px solid var(--studio-border); border-radius: var(--radius-modal); width: 90%; max-width: 900px; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: var(--elevation-3); }
.modal-header { padding: 16px 24px; border-bottom: 1px solid var(--studio-border); display: flex; justify-content: space-between; align-items: center; }
.modal-title { font-weight: 800; font-size: 16px; font-family: var(--font-display); }
.modal-close { background: none; border: none; color: var(--studio-text-muted); font-size: 24px; cursor: pointer; }
.modal-body { padding: 24px; overflow-y: auto; flex: 1; }
.batch-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
.batch-card { background: var(--studio-surface-elevated); border: 1px solid var(--studio-border); border-radius: var(--radius-card); padding: 12px; display: flex; flex-direction: column; gap: 10px; }
.batch-card-title { font-family: var(--font-mono); font-size: 11px; color: var(--studio-text-muted); }
.batch-canvas-wrap canvas { width: 100% !important; height: auto !important; border-radius: 6px; display: block; }
.modal-footer { padding: 16px 24px; border-top: 1px solid var(--studio-border); display: flex; justify-content: flex-end; gap: 12px; }

.toast { position: fixed; bottom: 24px; right: 24px; background: var(--studio-surface-elevated); border: 1px solid var(--studio-accent-primary); color: var(--studio-text-primary); padding: 12px 20px; border-radius: var(--radius-card); font-weight: 700; font-size: var(--text-sm); opacity: 0; transform: translateY(20px); transition: all 0.25s; pointer-events: none; z-index: 2000; box-shadow: var(--elevation-3); }
.toast.show { opacity: 1; transform: translateY(0); }
.draft-item { display: flex; justify-content: space-between; align-items: center; background: var(--studio-surface-elevated); border: 1px solid var(--studio-border); border-radius: var(--radius-sharp); padding: 8px 12px; margin-bottom: 6px; font-size: 12px; cursor: pointer; min-height: 40px; }
.draft-del-btn { background: none; border: none; color: var(--studio-text-muted); cursor: pointer; min-width: 32px; min-height: 32px; display: flex; align-items: center; justify-content: center; }

/* Responsive Drawer for Screens < 1024px */
@media (max-width: 1023px) {
  .app {
    grid-template-columns: 1fr;
    position: relative;
  }

  .canvas-area {
    order: -1;
    padding: var(--space-4) var(--space-3) var(--space-12);
    height: auto;
    min-height: calc(100vh - 60px);
  }

  .mobile-drawer-toggle-bar {
    display: block;
    width: 100%;
    max-width: 520px;
    margin-bottom: var(--space-4);
  }

  .sidebar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 80vh;
    z-index: 500;
    border-radius: var(--radius-modal) var(--radius-modal) 0 0;
    border-top: 1px solid var(--studio-border);
    transform: translateY(calc(100% - 48px));
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: var(--elevation-3);
  }

  .sidebar.drawer-open {
    transform: translateY(0);
  }

  .mobile-drawer-handle {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 8px 0 var(--space-3);
    cursor: pointer;
  }

  .handle-bar {
    width: 40px;
    height: 4px;
    border-radius: var(--radius-pill);
    background: var(--studio-border-strong);
  }

  .handle-txt {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--studio-accent-primary);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 700;
  }

  .mobile-backdrop {
    display: block;
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 450;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s ease;
  }

  .mobile-backdrop.open {
    opacity: 1;
    pointer-events: auto;
  }
}
</style>
