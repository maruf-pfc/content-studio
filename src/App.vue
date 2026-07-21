<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue';
import { wrapText, fitFontSize } from './utils/textHelper';

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
  
  showLiveOverlay: false,
  
  // News Card specific state
  newsLogoVisible: true,
  newsLogoSize: 60,
  newsLogoOffset: 0,
  newsHeadingMode: '2-line' as '1-line' | '2-line',
  newsEyebrowText: 'BREAKING NEWS',
  newsHeadlineText: 'এখানে আপনার মূল সংবাদ শিরোনামটি লিখুন',
  newsFooterDate: '',
  newsFooterCta: 'বিস্তারিত কমেন্টে',
  newsFooterUrl: 'www.telepathicthoughts.com',
  newsBannerColor: ''
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
  
  // Simple regex-based markdown parser
  let html = cap
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
    
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
  
  // Italics
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');
  
  // Inline Code
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');
  
  // Headings
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Newlines
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

// Image Utilities
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
      if (!blob) {
        showToast('Blob creation failed');
        return;
      }
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
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



function drawRichLine(
  context: CanvasRenderingContext2D,
  line: string,
  x: number,
  y: number,
  size: number,
  fontFamily: string,
  weight: string,
  accentColor: string,
  textColor: string,
  align: 'left' | 'center' | 'right'
) {
  context.save();
  context.textAlign = 'left';
  
  const words = line.split(/(\s+)/);
  
  let totalWidth = 0;
  for (const word of words) {
    const isAccent = word.startsWith('#') || (word.startsWith('*') && word.endsWith('*'));
    let cleanWord = word;
    if (word.startsWith('*') && word.endsWith('*')) {
      cleanWord = word.substring(1, word.length - 1);
    }
    
    if (isAccent) {
      context.font = `bold ${weight} ${size}px "${fontFamily}", sans-serif`;
    } else {
      context.font = `${weight} ${size}px "${fontFamily}", sans-serif`;
    }
    totalWidth += context.measureText(cleanWord).width;
  }
  
  let startX = x;
  if (align === 'center') {
    startX = x - totalWidth / 2;
  } else if (align === 'right') {
    startX = x - totalWidth;
  }
  
  let currentX = startX;
  for (const word of words) {
    const isAccent = word.startsWith('#') || (word.startsWith('*') && word.endsWith('*'));
    let cleanWord = word;
    if (word.startsWith('*') && word.endsWith('*')) {
      cleanWord = word.substring(1, word.length - 1);
    }
    
    if (isAccent) {
      context.fillStyle = accentColor;
      context.font = `bold ${weight} ${size}px "${fontFamily}", sans-serif`;
    } else {
      context.fillStyle = textColor;
      context.font = `${weight} ${size}px "${fontFamily}", sans-serif`;
    }
    
    context.fillText(cleanWord, currentX, y);
    currentX += context.measureText(cleanWord).width;
  }
  context.restore();
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

function renderGraphic(tempCanvas: HTMLCanvasElement, ratio: string, platformId: string, isThumbnail = false) {
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

  // 1b. Ambient Glows
  if (state.ambientGlow) {
    tempCtx.save();
    // Blob 1 top right
    const rad1 = tempCtx.createRadialGradient(w * 0.85, h * 0.15, 20, w * 0.85, h * 0.15, w * 0.45);
    rad1.addColorStop(0, hexToRgba(colors.accent, 0.22));
    rad1.addColorStop(1, 'rgba(0,0,0,0)');
    tempCtx.fillStyle = rad1;
    tempCtx.fillRect(0, 0, w, h);

    // Blob 2 bottom left
    const rad2 = tempCtx.createRadialGradient(w * 0.15, h * 0.88, 20, w * 0.15, h * 0.88, w * 0.4);
    rad2.addColorStop(0, hexToRgba(colors.accent, 0.16));
    rad2.addColorStop(1, 'rgba(0,0,0,0)');
    tempCtx.fillStyle = rad2;
    tempCtx.fillRect(0, 0, w, h);
    tempCtx.restore();
  }

  // 2. Draw Background Image Layer
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

  // 3. Draw Pattern Overlay
  if (state.patternType !== 'none') {
    tempCtx.save();
    tempCtx.globalAlpha = state.patternOpacity / 100;
    tempCtx.fillStyle = state.bgPatternColor || colors.accent;
    tempCtx.strokeStyle = state.bgPatternColor || colors.accent;
    
    const spacing = state.patternDensity * (w / 1000) * 1.5;
    
    if (state.patternType === 'dots') {
      for (let x = spacing / 2; x < w; x += spacing) {
        for (let y = spacing / 2; y < h; y += spacing) {
          tempCtx.beginPath();
          tempCtx.arc(x, y, w * 0.0025, 0, Math.PI * 2);
          tempCtx.fill();
        }
      }
    } else if (state.patternType === 'grid') {
      tempCtx.lineWidth = w * 0.001;
      tempCtx.beginPath();
      for (let x = 0; x < w; x += spacing) {
        tempCtx.moveTo(x, 0);
        tempCtx.lineTo(x, h);
      }
      for (let y = 0; y < h; y += spacing) {
        tempCtx.moveTo(0, y);
        tempCtx.lineTo(w, y);
      }
      tempCtx.stroke();
    } else if (state.patternType === 'stripes') {
      tempCtx.lineWidth = w * 0.0015;
      tempCtx.beginPath();
      for (let offset = -h; offset < w; offset += spacing) {
        tempCtx.moveTo(offset, 0);
        tempCtx.lineTo(offset + h, h);
      }
      tempCtx.stroke();
    } else if (state.patternType === 'noise') {
      const count = (w * h) * 0.0008 * (state.patternDensity / 30);
      for (let i = 0; i < count; i++) {
        const rx = Math.random() * w;
        const ry = Math.random() * h;
        const size = Math.random() * (w * 0.002) + 1;
        tempCtx.fillRect(rx, ry, size, size);
      }
    } else if (state.patternType === 'circles') {
      const rad1 = w * 0.32 * (state.patternDensity / 30);
      const rad2 = w * 0.22 * (state.patternDensity / 30);
      
      tempCtx.beginPath();
      tempCtx.ellipse(w * 0.88, h * 0.08, rad1, rad1, 0, 0, Math.PI * 2);
      tempCtx.fill();
      
      tempCtx.beginPath();
      tempCtx.ellipse(w * 0.06, h * 0.96, rad2, rad2, 0, 0, Math.PI * 2);
      tempCtx.fill();
    } else if (state.patternType === 'waves') {
      const amp = h * 0.1 * (state.patternDensity / 30);
      
      tempCtx.beginPath();
      tempCtx.moveTo(0, h * 0.85);
      tempCtx.bezierCurveTo(w * 0.25, h * 0.85 - amp, w * 0.75, h * 0.85 + amp, w, h * 0.8);
      tempCtx.lineTo(w, h);
      tempCtx.lineTo(0, h);
      tempCtx.closePath();
      tempCtx.fill();
      
      tempCtx.beginPath();
      tempCtx.moveTo(0, 0);
      tempCtx.lineTo(w, 0);
      tempCtx.bezierCurveTo(w * 0.7, amp, w * 0.3, h * 0.1, 0, h * 0.15);
      tempCtx.closePath();
      tempCtx.fill();
    } else if (state.patternType === 'geometric') {
      const sizeMult = state.patternDensity / 30;
      
      tempCtx.beginPath();
      tempCtx.moveTo(w * (1 - 0.3 * sizeMult), 0);
      tempCtx.lineTo(w, 0);
      tempCtx.lineTo(w, h * 0.4 * sizeMult);
      tempCtx.closePath();
      tempCtx.fill();
      
      tempCtx.beginPath();
      tempCtx.moveTo(0, h * (1 - 0.4 * sizeMult));
      tempCtx.lineTo(0, h);
      tempCtx.lineTo(w * 0.35 * sizeMult, h);
      tempCtx.closePath();
      tempCtx.fill();
    }
    tempCtx.restore();
  }

  // 4. Setup Alignment coordinates
  const align = state.align;
  tempCtx.textAlign = align;
  tempCtx.textBaseline = 'middle';
  
  let alignX = w / 2;
  if (align === 'left') alignX = pad;
  else if (align === 'right') alignX = w - pad;
  
  const maxTextWidth = w - pad * 2;
  
  // 5. Draw templates layout
  if (state.template === 'stat') {
    const heroText = state.statNumber?.trim() || '10x';
    
    // Giant stat number
    tempCtx.fillStyle = colors.accent;
    const heroSize = w * 0.28;
    tempCtx.font = `900 ${heroSize}px "${font.titleFont}", sans-serif`;
    tempCtx.fillText(heroText, alignX, h * 0.42);
    
    // Supporting label
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

    // Heading Title
    tempCtx.fillStyle = colors.text;
    const titleMaxHeight = h * 0.4;
    const startSize = state.autoFit ? w * 0.075 : (state.titleFontSize / 1000) * w;
    const fitTitle = fitFontSize(tempCtx, titleText, maxTextWidth, titleMaxHeight, startSize, font.titleFont, '800', 1.15, state.autoFit);
    
    const titleCenterY = h * 0.42;
    drawLines(tempCtx, fitTitle.lines, alignX, titleCenterY, fitTitle.size * 1.15, align, fitTitle.size, font.titleFont, '800', colors.accent, colors.text);

    // Body text below (with line-wrapped auto scaling to fit)
    if (bodyText) {
      tempCtx.fillStyle = colors.text;
      tempCtx.save();
      tempCtx.globalAlpha = 0.75;
      
      const bodyMaxHeight = h * 0.22;
      const bStartSize = state.autoFit ? w * 0.036 : (state.bodyFontSize / 1000) * w;
      const fitBody = fitFontSize(tempCtx, bodyText, maxTextWidth, bodyMaxHeight, bStartSize, font.bodyFont, '400', 1.35, state.autoFit);
      
      const bodyCenterY = h * 0.72;
      drawLines(tempCtx, fitBody.lines, alignX, bodyCenterY, fitBody.size * 1.35, align, fitBody.size, font.bodyFont, '400', colors.accent, colors.text);
      tempCtx.restore();
    }

  } else if (state.template === 'simple') {
    tempCtx.fillStyle = colors.text;
    const startSize = state.autoFit ? w * 0.09 : (state.titleFontSize / 1000) * w;
    const fit = fitFontSize(tempCtx, titleText, maxTextWidth, h * 0.5, startSize, font.titleFont, '800', 1.15, state.autoFit);
    drawLines(tempCtx, fit.lines, alignX, h * 0.5, fit.size * 1.15, align, fit.size, font.titleFont, '800', colors.accent, colors.text);

  } else {
    // Quote layout (Default) - Always Centered Quote Style
    const quoteAlignX = w / 2;
    const quoteAlign = 'center';

    tempCtx.save();
    tempCtx.fillStyle = colors.accent;
    tempCtx.textAlign = 'center';
    tempCtx.textBaseline = 'middle';
    // Elegant quote styling from Georgia serif
    tempCtx.font = `800 ${w * 0.12}px Georgia, serif`;
    tempCtx.fillText('"', quoteAlignX, h * 0.22);
    tempCtx.restore();

    // Quote Title Content
    tempCtx.fillStyle = colors.text;
    const startSize = state.autoFit ? w * 0.08 : (state.titleFontSize / 1000) * w;
    const fit = fitFontSize(tempCtx, titleText, maxTextWidth, h * 0.45, startSize, font.titleFont, '700', 1.2, state.autoFit);
    drawLines(tempCtx, fit.lines, quoteAlignX, h * 0.5, fit.size * 1.2, quoteAlign, fit.size, font.titleFont, '700', colors.accent, colors.text);

    // Quote Author / Body below (with line wrapping auto fit support)
    if (bodyText) {
      tempCtx.fillStyle = colors.accent;
      
      const bodyMaxHeight = h * 0.15;
      const bStartSize = state.autoFit ? w * 0.03 : (state.bodyFontSize / 1000) * w;
      const fitBody = fitFontSize(tempCtx, bodyText, maxTextWidth, bodyMaxHeight, bStartSize, font.bodyFont, '600', 1.3, state.autoFit);
      
      const authorTextLines = fitBody.lines.map((line, idx) => idx === 0 ? `— ${line}` : `  ${line}`);
      drawLines(tempCtx, authorTextLines, quoteAlignX, h * 0.78, fitBody.size * 1.3, quoteAlign, fitBody.size, font.bodyFont, '600', colors.accent, colors.text);
    }
  }

  // 6. Draw Logo Layer (if preset and not batch preview)
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

  // 7. Draw Watermark handle (centered at bottom)
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

// Batch Export Previews Generation
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

/* ---------------- MOUNTED LIFE CYCLE ---------------- */
onMounted(() => {
  loadStoredColors();
  loadDrafts();
  render();
});

defineExpose({
  state,
  wrapText,
  fitFontSize,
  renderGraphic
});
</script>

<template>
  <div class="app">
    <!-- SIDEBAR -->
    <div class="sidebar">
      <div class="brand">
        <div class="brand-mark">T</div>
        <div>
          <div class="brand-name">Content Studio</div>
          <div class="brand-sub">Telepathic Thoughts</div>
        </div>
      </div>

      <!-- 1. Platform & Ratio -->
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
        <div class="dims-label" style="text-align:left; margin-top:8px;">
          {{ currentPlatformRatioDims[0] }} × {{ currentPlatformRatioDims[1] }}px  ·  {{ currentPlatformObject.label }}
        </div>
      </div>

      <!-- 2. Template & Fonts -->
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

        <div v-if="!state.autoFit" style="margin-top: 10px; padding: 10px; background: var(--panel-2); border-radius: 8px; border: 1px solid var(--line); display: flex; flex-direction: column; gap: 8px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size: 11px; color: var(--text-dim);">Title Size</span>
            <input type="range" v-model.number="state.titleFontSize" min="20" max="150" style="width:120px;">
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size: 11px; color: var(--text-dim);">Body Size</span>
            <input type="range" v-model.number="state.bodyFontSize" min="12" max="80" style="width:120px;">
          </div>
        </div>
      </div>

      <!-- 3. Theme & Pattern -->
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
          <input type="color" :value="state.customAccent || '#7C5CFC'" @input="e => setCustomColor('accent', (e.target as HTMLInputElement).value)" title="Custom accent color" style="width:36px; height:36px; border-radius:8px; border:1px solid var(--line); background:none; cursor:pointer; padding:0;">
          <input type="color" :value="state.customBg || '#14121A'" @input="e => setCustomColor('bg', (e.target as HTMLInputElement).value)" title="Custom background color" style="width:36px; height:36px; border-radius:8px; border:1px solid var(--line); background:none; cursor:pointer; padding:0;">
          <input type="color" :value="state.customText || '#FFFFFF'" @input="e => setCustomColor('text', (e.target as HTMLInputElement).value)" title="Custom text color" style="width:36px; height:36px; border-radius:8px; border:1px solid var(--line); background:none; cursor:pointer; padding:0;">
          <button class="btn" style="padding:6px 12px; font-size:11px; align-self:center;" @click="resetCustomColors">Reset</button>
        </div>
        
        <div class="recent-colors-grid" style="margin-top:8px;">
          <div 
            v-for="col in state.recentColors" 
            :key="col"
            class="recent-color-dot"
            :style="{ backgroundColor: col }"
            @click="applyRecentColor(col)"
          ></div>
        </div>

        <label class="field-label" style="margin-top:12px;">Background Style</label>
        <select v-model="state.bgType">
          <option value="solid">Solid Color</option>
          <option value="gradient">Linear Gradient</option>
          <option value="radial">Radial Gradient</option>
        </select>

        <div v-if="state.bgType !== 'solid'" style="margin-top: 10px; padding: 10px; background: var(--panel-2); border-radius: 8px; border: 1px solid var(--line); display: flex; flex-direction: column; gap: 8px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size: 11px; color: var(--text-dim);">Gradient Color 2</span>
            <input type="color" v-model="state.bgGradientColor2" style="width:36px; height:36px; border-radius:8px; border:1px solid var(--line); background:none; cursor:pointer; padding:0;">
          </div>
          <div v-if="state.bgType === 'gradient'" style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size: 11px; color: var(--text-dim);">Angle</span>
            <input type="range" v-model.number="state.bgGradientAngle" min="0" max="360" style="width:120px;">
          </div>
        </div>

        <div class="toggle-row" style="margin-top:10px;">
          <label class="field-label">Ambient Glowing Blobs</label>
          <div class="switch" :class="{ on: state.ambientGlow }" @click="state.ambientGlow = !state.ambientGlow"></div>
        </div>
        
        <label class="field-label" style="margin-top:12px;">Overlay Pattern</label>
        <select v-model="state.patternType">
          <option value="none">None</option>
          <option value="circles">Corner Circles</option>
          <option value="dots">Dotted Grid</option>
          <option value="grid">Gridlines</option>
          <option value="stripes">Diagonal Stripes</option>
          <option value="noise">Grain Noise</option>
          <option value="waves">Organic Waves</option>
          <option value="geometric">Geometric Angles</option>
        </select>
        
        <div v-if="state.patternType !== 'none'" style="margin-top:10px; padding:10px; background:var(--panel-2); border-radius:8px; border:1px solid var(--line); display:flex; flex-direction:column; gap:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size: 11px; color: var(--text-dim);">Pattern Color</span>
            <input type="color" v-model="state.bgPatternColor" style="width:36px; height:36px; border-radius:8px; border:1px solid var(--line); background:none; cursor:pointer; padding:0;">
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:11px; color:var(--text-dim);">Opacity</span>
            <input type="range" v-model.number="state.patternOpacity" min="0" max="100" style="width:120px;">
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:11px; color:var(--text-dim);">Density / Spacing</span>
            <input type="range" v-model.number="state.patternDensity" min="5" max="100" style="width:120px;">
          </div>
        </div>
      </div>

      <!-- 4. Media Layer Overlays -->
      <div class="section">
        <div class="section-label">Media Overlays</div>
        <label class="field-label">Background Photo</label>
        <div style="display:flex; gap:8px;">
          <input type="file" ref="bgFileInput" accept="image/*" style="display:none;" @change="onBgFileChange">
          <button class="btn" @click="bgFileInput?.click()" style="padding:6px 12px; font-size:12px; flex:1; justify-content:center;">Upload Photo</button>
          <button v-if="bgImageSrc" class="btn" @click="removeBgImage" style="padding:6px 12px; font-size:12px;">Remove</button>
        </div>
        
        <div v-if="bgImageSrc" style="margin-top:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span style="font-size: 11px; color: var(--text-dim);">Scale</span>
            <input type="range" v-model.number="state.bgImageScale" min="10" max="200" style="width:120px;">
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span style="font-size: 11px; color: var(--text-dim);">Opacity</span>
            <input type="range" v-model.number="state.bgImageOpacity" min="0" max="100" style="width:120px;">
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span style="font-size: 11px; color: var(--text-dim);">Blur</span>
            <input type="range" v-model.number="state.bgImageBlur" min="0" max="30" style="width:120px;">
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span style="font-size: 11px; color: var(--text-dim);">Blend Mode</span>
            <select v-model="state.bgImageBlend" style="padding: 4px 6px; font-size:11px; width:120px;">
              <option value="normal">Normal</option>
              <option value="multiply">Multiply</option>
              <option value="screen">Screen</option>
              <option value="overlay">Overlay</option>
              <option value="darken">Darken</option>
              <option value="lighten">Lighten</option>
              <option value="color-dodge">Color Dodge</option>
              <option value="color-burn">Color Burn</option>
              <option value="difference">Difference</option>
              <option value="luminosity">Luminosity</option>
            </select>
          </div>
        </div>

        <label class="field-label" style="margin-top:12px;">Brand Logo Overlay</label>
        <div style="display:flex; gap:8px;">
          <input type="file" ref="logoFileInput" accept="image/*" style="display:none;" @change="onLogoFileChange">
          <button class="btn" @click="logoFileInput?.click()" style="padding:6px 12px; font-size:12px; flex:1; justify-content:center;">Upload Logo</button>
          <button v-if="logoImageSrc" class="btn" @click="removeLogo" style="padding:6px 12px; font-size:12px;">Remove</button>
        </div>
        
        <div v-if="logoImageSrc" style="margin-top:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span style="font-size: 11px; color: var(--text-dim);">Scale</span>
            <input type="range" v-model.number="state.logoScale" min="5" max="100" style="width:120px;">
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span style="font-size: 11px; color: var(--text-dim);">Opacity</span>
            <input type="range" v-model.number="state.logoOpacity" min="0" max="100" style="width:120px;">
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span style="font-size: 11px; color: var(--text-dim);">Position</span>
            <select v-model="state.logoPosition" style="padding: 4px 6px; font-size:11px; width:120px;">
              <option value="top-left">Top Left</option>
              <option value="top-right">Top Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="bottom-right">Bottom Right</option>
              <option value="center">Center</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 5. Content Input -->
      <div class="section">
        <div class="section-label">Content</div>
        <div v-if="state.template === 'stat'">
          <label class="field-label">Hero Stat Number (e.g. 99%, 10x, #1)</label>
          <input type="text" v-model="state.statNumber" placeholder="e.g. 10x or 99%" style="margin-bottom:12px; width:100%; box-sizing:border-box;">
        </div>
        <label class="field-label">Title / Hook</label>
        <textarea v-model="state.titleText" placeholder="e.g. যা মনে আছে সেটাই বলি"></textarea>

        <label class="field-label">Body / Subtext (optional)</label>
        <textarea v-model="state.bodyText" placeholder="Supporting line or leave blank"></textarea>

        <label class="field-label">Caption (for post)</label>
        <textarea v-model="state.captionText" placeholder="Write caption..."></textarea>
        <div class="char-count" :class="{ warn: isCaptionLengthWarning }">
          {{ currentCaptionLength }}/{{ currentPlatformObject.maxChars }}
        </div>

        <label class="field-label">Hashtags</label>
        <textarea v-model="state.hashtagsText" placeholder="#Hashtags"></textarea>
        <div class="hashtag-chips">
          <div 
            v-for="tag in HASHTAG_PRESETS" 
            :key="tag" 
            class="hchip"
            @click="addHashtag(tag)"
          >
            {{ tag }}
          </div>
        </div>
      </div>

      <!-- 6. Watermark -->
      <div class="section">
        <div class="section-label">Watermark</div>
        <div class="toggle-row">
          <label class="field-label">Show page handle</label>
          <div class="switch" :class="{ on: state.watermark }" @click="state.watermark = !state.watermark"></div>
        </div>
        <input type="text" v-model="state.watermarkText" style="margin-top:8px;">
      </div>

      <!-- 7. Saved Drafts -->
      <div class="section">
        <div class="section-label">Saved Drafts</div>
        <div style="display:flex; gap:8px; margin-bottom:8px;">
          <input type="text" v-model="draftName" placeholder="Draft name..." style="flex:1; padding:6px 10px; font-size:12px;">
          <button class="btn" @click="saveDraft" style="padding:6px 12px; font-size:12px;">Save</button>
        </div>
        <div class="draft-list-container">
          <div v-if="Object.keys(drafts).length === 0" style="font-size:11px; color:var(--text-dim); text-align:center; padding:8px;">
            No saved drafts
          </div>
          <div 
            v-for="(d, name) in drafts" 
            :key="name" 
            class="draft-item"
            style="margin-bottom: 6px;"
          >
            <span class="draft-name" @click="selectDraft(name.toString())">{{ name }}</span>
            <button class="draft-del-btn" @click="deleteDraft(name.toString())">
              <svg style="width:14px; height:14px;" viewBox="0 0 24 24">
                <path fill="currentColor" d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14V4zM6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- CANVAS AREA -->
    <div class="canvas-area">
      <div class="frame-wrap" id="frameWrap">
        <!-- Render 9:16 Phone frame chrome -->
        <div 
          v-if="state.ratio === '9:16'"
          class="device-chrome-wrap"
          style="width: 100%; box-sizing: border-box; padding: 46px 12px 32px 12px; border-radius: 34px; border: 12px solid #1a162b; background: #090710; position: relative; box-shadow: inset 0 0 20px rgba(0,0,0,0.8), 0 25px 60px rgba(0,0,0,0.5);"
        >
          <div class="chrome-phone-notch"></div>
          <div class="chrome-phone-header">
            <div>09:41</div>
            <div style="display:flex; gap: 6px; align-items:center;">
              <svg style="width:12px; height:12px;" viewBox="0 0 24 24"><path fill="currentColor" d="M2 22h20V2z"/></svg>
              <svg style="width:12px; height:12px;" viewBox="0 0 24 24"><path fill="currentColor" d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c3.9-3.89 10.21-3.89 14.1 0l1.9-1.9C21.6 15.93 22 13.97 22 12c0-4.97-4.03-9-9-9z"/></svg>
              <svg style="width:14px; height:14px;" viewBox="0 0 24 24"><path fill="currentColor" d="M17 5H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m4 4h2v6h-2V9z"/></svg>
            </div>
          </div>
          <canvas ref="mainCanvas" class="canvas-phone-styled"></canvas>
          
          <!-- Stories / Reels live overlay -->
          <div 
            v-if="state.showLiveOverlay"
            class="stories-overlay"
            style="position: absolute; top: 46px; left: 12px; right: 12px; bottom: 32px; border-radius: 18px; pointer-events: none; z-index: 4; display: flex; flex-direction: column; justify-content: flex-end; padding: 16px; background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 40%); color: #fff;"
          >
            <div class="right-actions" style="position: absolute; right: 12px; bottom: 120px; display: flex; flex-direction: column; gap: 16px; align-items: center; pointer-events: auto;">
              <div class="act" style="display:flex; flex-direction:column; align-items:center; font-size:16px;">
                <span>❤️</span>
                <span style="font-size:10px; font-weight:600; margin-top:2px;">24.5k</span>
              </div>
              <div class="act" style="display:flex; flex-direction:column; align-items:center; font-size:16px;">
                <span>💬</span>
                <span style="font-size:10px; font-weight:600; margin-top:2px;">1,102</span>
              </div>
              <div class="act" style="display:flex; flex-direction:column; align-items:center; font-size:16px;">
                <span>✈️</span>
                <span style="font-size:10px; font-weight:600; margin-top:2px;">8.9k</span>
              </div>
              <div class="act" style="font-size:16px; cursor:pointer;">•••</div>
            </div>
            <div class="bottom-user" style="display: flex; flex-direction: column; gap: 8px; pointer-events: auto; text-align: left;">
              <div class="user-row" style="display: flex; align-items: center; gap: 8px;">
                <div class="avatar" :style="logoImageSrc ? { backgroundImage: `url(${logoImageSrc})`, backgroundSize: 'cover', backgroundPosition: 'center', width: '28px', height: '28px', borderRadius: '50%' } : { width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }"></div>
                <div class="username" style="font-size: 12px; font-weight: 700;">{{ state.watermarkText || '@TelepathicThoughts' }}</div>
                <button class="follow-btn" style="background: rgba(255,255,255,0.25); border: none; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; cursor: pointer;">Follow</button>
              </div>
              <div class="caption" style="font-size: 11px; line-height: 1.4; max-width: 80%;">
                <strong>{{ state.watermarkText || '@TelepathicThoughts' }}</strong> 
                <span style="margin-left: 6px;">{{ state.captionText.substring(0, 70) + (state.captionText.length > 70 ? '...' : '') }}</span>
              </div>
            </div>
          </div>
          
          <div class="chrome-phone-home-indicator"></div>
        </div>

        <!-- Render 16:9 or 1.91:1 Browser frame chrome -->
        <div 
          v-else-if="state.ratio === '16:9' || state.ratio === '1.91:1'"
          class="device-chrome-wrap"
          style="width: 100%; box-sizing: border-box; padding: 0; border-radius: 14px; border: 2px solid var(--line); background: #120e22; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 25px 60px rgba(0,0,0,0.5);"
        >
          <div class="chrome-browser-header">
            <div class="dots">
              <div class="dot red"></div>
              <div class="dot yellow"></div>
              <div class="dot green"></div>
            </div>
            <div class="address-bar">
              contentstudio.live/{{ state.platform }}/{{ state.ratio }}
            </div>
          </div>
          <canvas ref="mainCanvas"></canvas>
        </div>

        <!-- Render 1:1 or 4:5 Social Feed frame chrome -->
        <div 
          v-else-if="state.ratio === '1:1' || state.ratio === '4:5'"
          class="chrome-feed-card"
        >
          <div class="feed-card-header">
            <!-- logoImageSrc is placed on the left side of handle as user requested! -->
            <div 
              class="feed-card-avatar"
              :style="logoImageSrc ? { backgroundImage: `url(${logoImageSrc})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' } : {}"
            ></div>
            <div class="feed-card-meta">
              <div class="feed-card-name">{{ state.watermarkText || '@TelepathicThoughts' }}</div>
              <div class="feed-card-sub">{{ currentPlatformObject.label }}</div>
            </div>
            <div style="margin-left: auto; color: var(--text-dim); cursor: pointer;">
              <svg style="width:20px; height:20px;" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            </div>
          </div>
          <canvas ref="mainCanvas"></canvas>
          <div class="feed-card-footer">
            <div class="feed-card-actions">
              <div class="feed-card-actions-left">
                <svg style="width:20px; height:20px; color: var(--accent-coral);" viewBox="0 0 24 24"><path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                <svg style="width:20px; height:20px;" viewBox="0 0 24 24"><path fill="currentColor" d="M9 22a1 1 0 0 1-1-1v-3H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5l-4 4H9z"/></svg>
                <svg style="width:20px; height:20px;" viewBox="0 0 24 24"><path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              </div>
              <div>
                <svg style="width:20px; height:20px;" viewBox="0 0 24 24"><path fill="currentColor" d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>
              </div>
            </div>
            <div class="feed-card-likes">1,245 likes</div>
          </div>
        </div>

        <!-- Fallback bare layout -->
        <canvas v-else ref="mainCanvas"></canvas>
      </div>

      <div class="dims-label" id="canvasDims"></div>

      <div class="actions">
        <button class="btn primary" @click="downloadPNG">⬇ Download PNG</button>
        <button class="btn" @click="copyImage">⧉ Copy Image</button>
        <button class="btn secondary" @click="copyCaption">📋 Copy Caption + Hashtags</button>
      </div>
      
      <div v-if="state.ratio === '9:16'" style="display:flex; justify-content:center; width:100%; max-width:520px; margin-bottom: 8px;">
        <button 
          class="btn ghost" 
          :class="{ primary: state.showLiveOverlay }" 
          style="width:100%; justify-content:center;" 
          @click="state.showLiveOverlay = !state.showLiveOverlay"
        >
          📱 {{ state.showLiveOverlay ? 'Hide' : 'Show' }} Social UI Overlay
        </button>
      </div>
      
      <button class="btn ghost" style="width:100%; max-width:520px; justify-content:center;" @click="openBatchModal">
        ⚡ Multi-Format Batch Export Previews
      </button>

      <div class="caption-preview">
        <div class="lbl">Ready-to-paste caption (with markdown)</div>
        <div class="txt" id="captionPreviewText" v-html="parsedCaption"></div>
      </div>
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
        <p style="margin-bottom: 20px; font-size:13px; color: var(--text-dim); line-height: 1.5;">
          Verify layout scaling across all aspect ratios before exporting in high quality.
        </p>
        <div class="batch-grid" ref="batchGrid">
          <div 
            v-for="(dims, ratio) in RATIO_DIMS" 
            :key="ratio" 
            class="batch-card"
          >
            <div class="batch-card-title">{{ ratio }} Ratio ({{ dims[0] }}x{{ dims[1] }}px)</div>
            <div class="batch-canvas-wrap">
              <canvas :id="`batch-canvas-${ratio.replace(':', '-')}`"></canvas>
            </div>
            <button class="btn secondary" style="width:100%; font-size:11px; padding:6px 10px;" @click="downloadBatchItem(ratio.toString())">
              Download Format
            </button>
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
    <svg style="width:16px; height:16px;" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg> 
    <span>{{ toastMsg }}</span>
  </div>
</template>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=JetBrains+Mono:wght@400;600&family=Outfit:wght@400;600;700;900&family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;600&family=Space+Grotesk:wght@600&family=Syne:wght@700;800&display=swap');

  :root {
    --bg: #14121A;
    --panel: #1C1926;
    --panel-2: #221E30;
    --line: #332E44;
    --accent: #7C5CFC;
    --accent-2: #FF6B4A;
    --text: #F5F3FF;
    --text-dim: #8B879C;
    --mono: 'JetBrains Mono', 'Courier New', monospace;
    --disp: 'Trebuchet MS', 'Arial Black', sans-serif;
    --body: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  }
  
  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--body);
    min-height: 100vh;
  }

  .app {
    display: grid;
    grid-template-columns: 380px 1fr;
    min-height: 100vh;
  }
  
  @media (max-width: 1024px) {
    .app { grid-template-columns: 1fr; }
    .canvas-area { order: -1; height: auto; padding: 24px 16px 40px; }
  }

  /* ---- Sidebar ---- */
  .sidebar {
    background: var(--panel);
    border-right: 1px solid var(--line);
    padding: 28px 24px 60px;
    overflow-y: auto;
    height: 100vh;
  }
  
  @media (max-width: 1024px) {
    .sidebar { height: auto; padding: 24px 16px 60px; }
  }

  .brand {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 28px;
  }
  
  .brand-mark {
    width: 34px; height: 34px; border-radius: 9px;
    background: linear-gradient(135deg, var(--accent), var(--accent-2));
    display: flex; align-items: center; justify-content: center;
    font-family: var(--disp); font-weight: 900; font-size: 16px;
    flex-shrink: 0;
  }
  
  .brand-name { font-family: var(--disp); font-weight: 900; font-size: 17px; letter-spacing: -0.02em; }
  .brand-sub { font-family: var(--mono); font-size: 10px; color: var(--text-dim); letter-spacing: 0.08em; text-transform: uppercase; }

  .section { margin-bottom: 26px; }
  
  .section-label {
    font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--text-dim); margin-bottom: 10px;
    display: flex; align-items: center; gap: 8px;
  }
  
  .section-label::after { content: ''; flex: 1; height: 1px; background: var(--line); }

  label.field-label { display: block; font-size: 12px; color: var(--text-dim); margin: 12px 0 6px; }
  
  input[type=text], textarea, select {
    width: 100%; background: var(--panel-2); border: 1px solid var(--line);
    color: var(--text); padding: 10px 12px; border-radius: 8px; font-size: 13.5px;
    font-family: var(--body); resize: vertical;
  }
  
  textarea { min-height: 64px; line-height: 1.4; }
  
  input[type=text]:focus, textarea:focus, select:focus {
    outline: none; border-color: var(--accent);
  }
  
  .char-count { font-family: var(--mono); font-size: 10px; color: var(--text-dim); text-align: right; margin-top: 4px; }
  .char-count.warn { color: var(--accent-2); }

  /* Platform grid */
  .platform-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  
  .platform-btn {
    background: var(--panel-2); border: 1px solid var(--line); border-radius: 8px;
    padding: 10px 4px; cursor: pointer; color: var(--text-dim); font-size: 10.5px;
    font-family: var(--mono); text-align: center; transition: all .12s;
  }
  
  .platform-btn .pico { font-size: 16px; display: block; margin-bottom: 4px; }
  .platform-btn.active { border-color: var(--accent); color: var(--text); background: rgba(124, 92, 252, 0.14); }
  .platform-btn:hover { border-color: var(--accent); }

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
  
  .tpl-btn strong { display: block; font-size: 12.5px; color: var(--text); margin-bottom: 2px; font-family: var(--body); }
  .tpl-btn.active { border-color: var(--accent-2); background: rgba(255, 107, 74, 0.10); }

  .theme-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  
  .theme-swatch {
    height: 52px; border-radius: 8px; cursor: pointer; border: 2px solid transparent;
    position: relative; overflow: hidden;
  }
  
  .theme-swatch.active { border-color: var(--text); }
  
  .theme-swatch span {
    position: absolute; bottom: 4px; left: 6px; font-family: var(--mono); font-size: 9px;
    background: rgba(0, 0, 0, 0.4); padding: 1px 5px; border-radius: 4px; color: #fff;
  }

  .align-row { display: flex; gap: 6px; }
  
  .align-btn {
    flex: 1; background: var(--panel-2); border: 1px solid var(--line); border-radius: 6px;
    padding: 8px 0; cursor: pointer; color: var(--text-dim); font-size: 14px; text-align: center;
  }
  
  .align-btn.active { border-color: var(--accent); color: var(--text); }

  .toggle-row { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
  .toggle-row .field-label { margin: 0; }
  
  .switch {
    width: 38px; height: 22px; background: var(--panel-2); border: 1px solid var(--line);
    border-radius: 20px; position: relative; cursor: pointer; flex-shrink: 0;
  }
  
  .switch.on { background: var(--accent); border-color: var(--accent); }
  
  .switch::after {
    content: ''; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px;
    background: #fff; border-radius: 50%; transition: left .15s;
  }
  
  .switch.on::after { left: 18px; }

  .hashtag-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
  
  .hchip {
    font-family: var(--mono); font-size: 10.5px; background: var(--panel-2);
    border: 1px solid var(--line); padding: 4px 9px; border-radius: 14px; cursor: pointer; color: var(--text-dim);
  }
  
  .hchip:hover { border-color: var(--accent-2); color: var(--text); }

  .color-row { display: flex; gap: 8px; margin-top: 8px; }
  
  .color-row input[type=color] {
    width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--line);
    background: none; cursor: pointer; padding: 0;
  }

  .recent-colors-grid {
    display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px;
  }
  .recent-color-dot {
    width: 20px; height: 20px; border-radius: 50%; border: 1px solid var(--line);
    cursor: pointer; transition: transform 0.15s;
  }
  .recent-color-dot:hover {
    transform: scale(1.15);
    border-color: var(--accent);
  }

  /* Range Inputs customization */
  input[type=range] {
    -webkit-appearance: none;
    background: var(--panel-2);
    height: 6px;
    border-radius: 4px;
    outline: none;
    border: 1px solid var(--line);
  }
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--accent);
    cursor: pointer;
  }

  /* ---- Canvas Area ---- */
  .canvas-area {
    display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
    padding: 40px 24px 60px; gap: 24px;
    overflow-y: auto;
    height: 100vh;
  }
  
  .frame-wrap {
    position: relative;
    filter: drop-shadow(0 30px 60px rgba(0, 0, 0, 0.45));
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    max-width: 460px;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  }
  
  .device-chrome-wrap {
    position: relative;
    border-radius: 24px;
    padding: 8px;
    background: #110e1a;
    border: 4px solid #2d2642;
    box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.8);
    display: flex;
    flex-direction: column;
    width: 100%;
    box-sizing: border-box;
  }

  .chrome-phone-header {
    height: 36px;
    width: 100%;
    position: absolute;
    top: 0; left: 0; right: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 24px;
    color: rgba(255, 255, 255, 0.9);
    font-size: 11px;
    font-weight: 600;
    z-index: 5;
    pointer-events: none;
  }
  
  .chrome-phone-notch {
    width: 110px;
    height: 20px;
    background: #000;
    border-radius: 0 0 12px 12px;
    position: absolute;
    top: 0; left: 50%;
    transform: translateX(-50%);
    z-index: 6;
    pointer-events: none;
  }
  
  .chrome-phone-home-indicator {
    height: 5px;
    width: 120px;
    background: rgba(255, 255, 255, 0.7);
    border-radius: 10px;
    position: absolute;
    bottom: 8px; left: 50%;
    transform: translateX(-50%);
    z-index: 5;
    pointer-events: none;
  }

  .chrome-browser-header {
    height: 38px;
    background: #1d182e;
    border-radius: 12px 12px 0 0;
    border-bottom: 1px solid var(--line);
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 16px;
    width: 100%;
  }
  
  .chrome-browser-header .dots {
    display: flex;
    gap: 6px;
  }
  .chrome-browser-header .dot {
    width: 10px; height: 10px; border-radius: 50%;
  }
  .chrome-browser-header .dot.red { background: #FF5F56; }
  .chrome-browser-header .dot.yellow { background: #FFBD2E; }
  .chrome-browser-header .dot.green { background: #27C93F; }
  
  .chrome-browser-header .address-bar {
    flex: 1;
    height: 22px;
    background: #131020;
    border-radius: 6px;
    border: 1px solid var(--line);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--mono);
    font-size: 9.5px;
    color: var(--text-dim);
  }

  .chrome-feed-card {
    background: #110e20;
    border: 1px solid var(--line);
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    width: 100%;
    box-sizing: border-box;
  }
  
  .feed-card-header {
    padding: 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    background: #19142d;
    border-bottom: 1px solid var(--line);
  }
  
  .feed-card-avatar {
    width: 32px; height: 32px; border-radius: 50%;
    background: linear-gradient(135deg, var(--accent), var(--accent-2));
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    flex-shrink: 0;
  }
  
  .feed-card-meta {
    display: flex;
    flex-direction: column;
  }
  
  .feed-card-name { font-size: 12.5px; font-weight: 700; color: var(--text); }
  .feed-card-sub { font-size: 10px; color: var(--text-dim); }
  
  .feed-card-footer {
    padding: 12px;
    background: #19142d;
    border-top: 1px solid var(--line);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .feed-card-actions {
    display: flex;
    justify-content: space-between;
    font-size: 18px;
    color: var(--text-dim);
  }
  .feed-card-actions-left {
    display: flex;
    gap: 12px;
  }
  .feed-card-likes { font-size: 12px; font-weight: 700; color: var(--text); }

  canvas {
    display: block;
    max-width: 100%;
    height: auto;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  }
  .canvas-phone-styled { border-radius: 18px; }

  .actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
  
  .btn {
    font-family: var(--body); font-weight: 600; font-size: 13px; padding: 10px 16px;
    border-radius: 8px; border: 1px solid var(--line); cursor: pointer; background: var(--panel);
    color: var(--text); display: flex; align-items: center; gap: 8px; transition: all .15s;
  }
  .btn:hover { border-color: var(--accent); background: rgba(124, 92, 252, 0.05); }
  .btn:active { transform: scale(0.97); }
  .btn.primary { background: linear-gradient(135deg, var(--accent), #6a4de0); border: none; }
  .btn.secondary { background: var(--accent-2); border: none; color: #1a0f0a; }
  .btn.secondary:hover { background: #ff8266; }
  .btn.ghost { background: transparent; border: 1px solid var(--line); }

  .toast {
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(20px);
    background: #fff; color: #111; padding: 10px 20px; border-radius: 24px; font-size: 13px;
    font-weight: 600; opacity: 0; transition: all .25s; pointer-events: none; z-index: 999;
    display: flex; align-items: center; gap: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.3);
  }
  .toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

  .caption-preview {
    width: 100%; max-width: 520px; background: var(--panel); border: 1px solid var(--line);
    border-radius: 12px; padding: 16px 18px;
  }
  .caption-preview .lbl { font-family: var(--mono); font-size: 10px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
  
  .caption-preview .txt { font-size: 13.5px; line-height: 1.6; color: var(--text); white-space: pre-wrap; }
  .caption-preview .txt strong { color: var(--text); font-weight: 700; }
  .caption-preview .txt em { font-style: italic; }
  .caption-preview .txt code { font-family: var(--mono); background: var(--panel-2); padding: 2px 6px; border-radius: 4px; font-size: 12px; color: var(--accent-2); }
  .caption-preview .txt h1 { font-size: 19px; font-weight: 800; margin: 10px 0 6px; color: var(--text); }
  .caption-preview .txt h2 { font-size: 16px; font-weight: 700; margin: 8px 0 4px; color: var(--text); }
  .caption-preview .txt h3 { font-size: 14px; font-weight: 700; margin: 6px 0 2px; color: var(--text); }
  .caption-preview .hash { color: var(--accent); }

  .dims-label { font-family: var(--mono); font-size: 11px; color: var(--text-dim); text-align: center; }

  /* Draft Items Styling */
  .draft-item {
    display: flex; justify-content: space-between; align-items: center;
    background: var(--panel-2); border: 1px solid var(--line);
    padding: 6px 10px; border-radius: 6px; font-size: 12px;
  }
  
  .draft-list-container {
    max-height: 150px;
    overflow-y: auto;
  }

  .draft-name { cursor: pointer; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .draft-name:hover { color: var(--accent); }
  .draft-del-btn { background: none; border: none; color: var(--text-dim); cursor: pointer; display: flex; align-items: center; padding: 2px; }
  .draft-del-btn:hover { color: var(--accent-2); }

  /* Modal Overlay (Batch Previews) */
  .modal-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(8, 6, 12, 0.85); backdrop-filter: blur(8px);
    z-index: 1000; display: flex; align-items: center; justify-content: center;
    opacity: 0; pointer-events: none; transition: opacity 0.3s;
    padding: 20px;
  }
  .modal-overlay.show { opacity: 1; pointer-events: auto; }
  
  .modal-container {
    background: var(--panel); border: 1px solid var(--line);
    border-radius: 16px; width: 100%; max-width: 960px; max-height: 90vh;
    display: flex; flex-direction: column; overflow: hidden;
    box-shadow: 0 30px 70px rgba(0,0,0,0.6);
  }
  
  .modal-header {
    padding: 20px 24px; border-bottom: 1px solid var(--line);
    display: flex; justify-content: space-between; align-items: center;
  }
  .modal-title { font-family: var(--disp); font-weight: 900; font-size: 18px; }
  .modal-close { background: none; border: none; color: var(--text-dim); font-size: 24px; cursor: pointer; }
  .modal-close:hover { color: var(--text); }
  
  .modal-body {
    padding: 24px; overflow-y: auto; flex: 1;
  }
  
  .batch-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 20px;
  }
  
  .batch-card {
    background: var(--panel-2); border: 1px solid var(--line);
    border-radius: 12px; padding: 12px; display: flex; flex-direction: column;
    align-items: center; gap: 12px;
  }
  .batch-card-title { font-family: var(--mono); font-size: 11px; color: var(--text-dim); text-align: center; }
  .batch-canvas-wrap {
    width: 100%; height: 180px; display: flex; align-items: center; justify-content: center;
    background: #090710; border-radius: 8px; overflow: hidden; border: 1px solid var(--line);
  }
  .batch-canvas-wrap canvas { max-width: 100%; max-height: 100%; object-fit: contain; }
  
  .modal-footer {
    padding: 16px 24px; border-top: 1px solid var(--line);
    display: flex; justify-content: flex-end; gap: 12px;
  }
</style>
