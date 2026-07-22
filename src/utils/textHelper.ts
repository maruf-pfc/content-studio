export function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const paragraphs = text.split('\n');
  const lines: string[] = [];
  
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/);
    let line = '';
    for (const w of words) {
      if (!w) continue;
      const test = line ? line + ' ' + w : w;
      
      const measureText = test.replace(/\*/g, '');
      if (context.measureText(measureText).width > maxWidth && line) {
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    if (paragraph === '' && paragraphs.length > 1) {
      lines.push('');
    }
  }
  return lines;
}

export function fitFontSize(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxHeight: number,
  startSize: number,
  fontFamily: string,
  weight: string,
  lineHeightMult: number,
  autoFit: boolean
) {
  let size = startSize;
  context.font = `${weight} ${size}px "${fontFamily}", sans-serif`;
  let lines = wrapText(context, text, maxWidth);
  let totalHeight = lines.length * size * lineHeightMult;
  
  if (autoFit) {
    while (totalHeight > maxHeight && size > 16) {
      size -= 2;
      context.font = `${weight} ${size}px "${fontFamily}", sans-serif`;
      lines = wrapText(context, text, maxWidth);
      totalHeight = lines.length * size * lineHeightMult;
    }
  }
  return { size, lines };
}

export interface WordToken {
  word: string;
  cleanWord: string;
  highlighted: boolean;
  index: number;
}

export function parseWordTokens(text: string): WordToken[] {
  const rawWords = text.trim().split(/\s+/).filter(Boolean);
  const tokens: WordToken[] = [];
  let insideHighlight = false;

  for (let i = 0; i < rawWords.length; i++) {
    const raw = rawWords[i];
    if (!raw) continue;

    let isHighlighted = false;
    let clean = raw;

    if (raw.startsWith('*') && raw.endsWith('*') && raw.length > 1) {
      clean = raw.slice(1, -1);
      isHighlighted = true;
    } else if (raw.startsWith('*')) {
      clean = raw.slice(1);
      insideHighlight = true;
      isHighlighted = true;
    } else if (raw.endsWith('*')) {
      clean = raw.slice(0, -1);
      isHighlighted = insideHighlight;
      insideHighlight = false;
    } else {
      isHighlighted = insideHighlight;
      clean = raw.replace(/\*/g, '');
    }

    tokens.push({
      word: raw,
      cleanWord: clean,
      highlighted: isHighlighted,
      index: i
    });
  }

  return tokens;
}

export function toggleWordHighlight(fullText: string, targetIndex: number): string {
  const tokens = parseWordTokens(fullText);
  const token = tokens[targetIndex];
  if (!token) return fullText;

  token.highlighted = !token.highlighted;

  const resultWords: string[] = [];
  let i = 0;
  while (i < tokens.length) {
    const currentToken = tokens[i];
    if (!currentToken) break;

    if (currentToken.highlighted) {
      const group: string[] = [];
      while (i < tokens.length && tokens[i]?.highlighted) {
        const item = tokens[i];
        if (item) group.push(item.cleanWord);
        i++;
      }
      resultWords.push(`*${group.join(' ')}*`);
    } else {
      resultWords.push(currentToken.cleanWord);
      i++;
    }
  }

  return resultWords.join(' ');
}

export function drawRichLine(
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
  
  const tokens = parseWordTokens(line);
  let totalWidth = 0;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (!t) continue;
    const wordText = t.cleanWord + (i < tokens.length - 1 ? ' ' : '');
    context.font = t.highlighted
      ? `bold ${Math.round(size)}px "${fontFamily}", sans-serif`
      : `${weight} ${Math.round(size)}px "${fontFamily}", sans-serif`;
    totalWidth += context.measureText(wordText).width;
  }
  
  let startX = x;
  if (align === 'center') {
    startX = x - totalWidth / 2;
  } else if (align === 'right') {
    startX = x - totalWidth;
  }
  
  let currentX = startX;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (!t) continue;
    const wordText = t.cleanWord + (i < tokens.length - 1 ? ' ' : '');
    
    if (t.highlighted) {
      context.fillStyle = accentColor;
      context.font = `bold ${Math.round(size)}px "${fontFamily}", sans-serif`;
    } else {
      context.fillStyle = textColor;
      context.font = `${weight} ${Math.round(size)}px "${fontFamily}", sans-serif`;
    }
    
    context.fillText(wordText, currentX, y);
    currentX += context.measureText(wordText).width;
  }
  context.restore();
}
