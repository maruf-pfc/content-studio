import { fitFontSize, drawRichLine } from './textHelper';

export interface NewsCardState {
  headlineText: string;
  copyrightText: string;
  
  photoZonePercent: number; // e.g. 55 (range 35 to 75)
  photoOffsetX: number;
  photoOffsetY: number;
  photoScale: number; // e.g. 1.0 (range 0.5 to 3.0)
  
  sampledColorOverride: string; // empty string means auto-sample
  bannerColorOverride: string; // empty string means use theme bg
  accentColorOverride: string; // empty string means use theme accent
  textColorOverride: string; // empty string means use theme text
  
  logoVisible: boolean;
  logoAnchor: 'top-left' | 'top-center' | 'top-right' | 'seam-left' | 'seam-center' | 'seam-right' | 'bottom-left' | 'bottom-right';
  logoOffsetX: number;
  logoOffsetY: number;
  logoSize: number;
  
  autoFit: boolean;
  titleFontSize: number;
  align: 'left' | 'center' | 'right';
  fontFamily: string;
}

export function sampleBottomColor(img: HTMLImageElement): string {
  try {
    const canvas = document.createElement('canvas');
    const sampleWidth = Math.min(img.width, 200);
    const sampleHeight = Math.min(img.height, 200);
    canvas.width = sampleWidth;
    canvas.height = sampleHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '#14121A';

    ctx.drawImage(img, 0, 0, sampleWidth, sampleHeight);
    const stripY = Math.floor(sampleHeight * 0.82);
    const stripH = sampleHeight - stripY;
    const imgData = ctx.getImageData(0, stripY, sampleWidth, stripH);
    const data = imgData.data;

    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3] ?? 0;
      if (alpha > 50) {
        rSum += data[i] ?? 0;
        gSum += data[i + 1] ?? 0;
        bSum += data[i + 2] ?? 0;
        count++;
      }
    }

    if (count === 0) return '#14121A';
    const r = Math.round(rSum / count);
    const g = Math.round(gSum / count);
    const b = Math.round(bSum / count);

    return `rgb(${r}, ${g}, ${b})`;
  } catch {
    return '#14121A';
  }
}

export function parseRgb(colorStr: string): { r: number; g: number; b: number } {
  if (!colorStr) return { r: 20, g: 18, b: 26 };
  
  if (colorStr.startsWith('rgb')) {
    const matches = colorStr.match(/\d+/g);
    if (matches && matches.length >= 3) {
      return {
        r: parseInt(matches[0] ?? '20', 10),
        g: parseInt(matches[1] ?? '18', 10),
        b: parseInt(matches[2] ?? '26', 10)
      };
    }
  }

  let hex = colorStr.replace('#', '');
  if (hex.length === 3) {
    hex = (hex[0] ?? '') + (hex[0] ?? '') + (hex[1] ?? '') + (hex[1] ?? '') + (hex[2] ?? '') + (hex[2] ?? '');
  }
  if (hex.length >= 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      return { r, g, b };
    }
  }
  return { r: 20, g: 18, b: 26 };
}

export function calculateBadgePosition(
  anchor: NewsCardState['logoAnchor'],
  w: number,
  h: number,
  photoZoneH: number,
  logoSize: number,
  offsetX: number,
  offsetY: number
): { x: number; y: number } {
  const pad = w * 0.06;
  let baseX = w / 2;
  let baseY = photoZoneH;

  switch (anchor) {
    case 'top-left':
      baseX = pad + logoSize;
      baseY = pad + logoSize;
      break;
    case 'top-center':
      baseX = w / 2;
      baseY = pad + logoSize;
      break;
    case 'top-right':
      baseX = w - pad - logoSize;
      baseY = pad + logoSize;
      break;
    case 'seam-left':
      baseX = pad + logoSize;
      baseY = photoZoneH;
      break;
    case 'seam-center':
      baseX = w / 2;
      baseY = photoZoneH;
      break;
    case 'seam-right':
      baseX = w - pad - logoSize;
      baseY = photoZoneH;
      break;
    case 'bottom-left':
      baseX = pad + logoSize;
      baseY = h - pad - logoSize;
      break;
    case 'bottom-right':
      baseX = w - pad - logoSize;
      baseY = h - pad - logoSize;
      break;
  }

  return {
    x: baseX + offsetX,
    y: baseY + offsetY
  };
}

export function renderNewsCardCanvas(
  canvas: HTMLCanvasElement,
  state: NewsCardState,
  photoImg: HTMLImageElement | null,
  logoImg: HTMLImageElement | null,
  themeBg: string,
  themeAccent: string,
  themeText: string,
  dims: [number, number] = [1080, 1080]
) {
  const w = dims[0];
  const h = dims[1];
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const photoZoneH = h * ((state.photoZonePercent || 55) / 100);
  const footerH = h * 0.07;
  const textZoneY = photoZoneH;
  const textZoneH = h - photoZoneH - footerH;

  const bgColor = state.bannerColorOverride || themeBg || '#14121A';
  const accentColor = state.accentColorOverride || themeAccent || '#FFE600';
  const textColor = state.textColorOverride || themeText || '#FFFFFF';

  // 1. Solid base background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, w, h);

  // 2. Render Photo Zone with transform (pan/zoom)
  let sampledEdgeColor = bgColor;
  if (photoImg) {
    sampledEdgeColor = state.sampledColorOverride || sampleBottomColor(photoImg);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, photoZoneH);
    ctx.clip();

    const imgW = photoImg.width;
    const imgH = photoImg.height;
    const imgRatio = imgW / imgH;
    const zoneRatio = w / photoZoneH;

    let baseW = w;
    let baseH = photoZoneH;
    if (imgRatio > zoneRatio) {
      baseH = photoZoneH;
      baseW = baseH * imgRatio;
    } else {
      baseW = w;
      baseH = baseW / imgRatio;
    }

    const drawW = baseW * state.photoScale;
    const drawH = baseH * state.photoScale;
    const centerX = w / 2 + state.photoOffsetX;
    const centerY = photoZoneH / 2 + state.photoOffsetY;

    ctx.translate(centerX, centerY);
    ctx.drawImage(photoImg, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  } else {
    ctx.save();
    ctx.fillStyle = '#1e1b2e';
    ctx.fillRect(0, 0, w, photoZoneH);
    ctx.fillStyle = '#6e6785';
    ctx.font = `600 ${w * 0.038}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📸 Upload or Drag Photo Here', w / 2, photoZoneH / 2);
    ctx.restore();
  }

  // 3. Render Blended Transition Zone
  const blendHeight = h * 0.24;
  const blendStartY = Math.max(0, photoZoneH - blendHeight * 0.6);
  const blendEndY = Math.min(h - footerH, photoZoneH + blendHeight * 0.4);

  const bgRgb = parseRgb(bgColor);
  const { r, g, b } = bgRgb;

  ctx.save();
  const grad = ctx.createLinearGradient(0, blendStartY, 0, blendEndY);

  // Smooth ease-in-out alpha curve fading photo directly into banner background color
  grad.addColorStop(0.0, `rgba(${r}, ${g}, ${b}, 0.0)`);
  grad.addColorStop(0.2, `rgba(${r}, ${g}, ${b}, 0.10)`);
  grad.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.38)`);
  grad.addColorStop(0.65, `rgba(${r}, ${g}, ${b}, 0.78)`);
  grad.addColorStop(0.88, `rgba(${r}, ${g}, ${b}, 0.96)`);
  grad.addColorStop(1.0, `rgba(${r}, ${g}, ${b}, 1.0)`);

  ctx.fillStyle = grad;
  ctx.fillRect(0, blendStartY, w, blendEndY - blendStartY + 1);
  ctx.restore();

  // Solid fill below blend
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, Math.floor(blendEndY), w, h - blendEndY);

  // 4. Render Headline Text in Text Zone
  const textPad = w * 0.07;
  const maxTextWidth = w - textPad * 2;
  const headline = state.headlineText.trim() || 'এখানে আপনার সংবাদ *শিরোনাম* লিখুন';

  let alignX = w / 2;
  if (state.align === 'left') alignX = textPad;
  else if (state.align === 'right') alignX = w - textPad;

  const fontFam = state.fontFamily || 'Outfit';
  const startFontSize = state.autoFit ? w * 0.072 : (state.titleFontSize / 1000) * w;
  const lineHeightMult = 1.25;

  const fit = fitFontSize(
    ctx,
    headline,
    maxTextWidth,
    textZoneH - 20,
    startFontSize,
    fontFam,
    '800',
    lineHeightMult,
    state.autoFit
  );

  const totalHeight = fit.lines.length * fit.size * lineHeightMult;
  const textCenterY = textZoneY + textZoneH / 2 + 10;
  let currentY = textCenterY - totalHeight / 2 + (fit.size * lineHeightMult) / 2;

  ctx.save();
  ctx.textBaseline = 'middle';
  for (const line of fit.lines) {
    drawRichLine(
      ctx,
      line,
      alignX,
      currentY,
      fit.size,
      fontFam,
      '800',
      accentColor,
      textColor,
      state.align
    );
    currentY += fit.size * lineHeightMult;
  }
  ctx.restore();

  // 5. Render Logo Badge
  if (state.logoVisible && logoImg) {
    ctx.save();
    const badgeRadius = state.logoSize || 50;
    const pos = calculateBadgePosition(
      state.logoAnchor,
      w,
      h,
      photoZoneH,
      badgeRadius,
      state.logoOffsetX || 0,
      state.logoOffsetY || 0
    );

    const ringThickness = Math.max(4, Math.round(badgeRadius * 0.08));

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, badgeRadius + ringThickness, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, badgeRadius, 0, Math.PI * 2);
    ctx.clip();

    const lw = logoImg.width;
    const lh = logoImg.height;
    const lRatio = lw / lh;
    let lsw = lw, lsh = lh, lsx = 0, lsy = 0;

    if (lRatio > 1) {
      lsw = lh;
      lsx = (lw - lh) / 2;
    } else {
      lsh = lw;
      lsy = (lh - lw) / 2;
    }

    ctx.drawImage(
      logoImg,
      lsx, lsy, lsw, lsh,
      pos.x - badgeRadius, pos.y - badgeRadius,
      badgeRadius * 2, badgeRadius * 2
    );
    ctx.restore();
  }

  // 6. Render Footer Copyright Strip
  const footerY = h - footerH;
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(textPad, footerY);
  ctx.lineTo(w - textPad, footerY);
  ctx.stroke();

  const footerText = state.copyrightText.trim() || '© TelepathicThoughts';
  const footerFontSize = w * 0.024;
  ctx.font = `600 ${footerFontSize}px "${fontFam}", sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(footerText, w / 2, footerY + footerH / 2);
  ctx.restore();
}
