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
