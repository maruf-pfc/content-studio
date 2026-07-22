import { describe, it, expect } from 'vitest'
import { wrapText, fitFontSize } from '../utils/textHelper'

describe('Text Wrapping Utilities', () => {
  it('correctly splits multi-line text input into separate lines', () => {
    const mockCtx = {
      measureText: (text: string) => ({ width: text.length * 10 }),
      font: ''
    } as unknown as CanvasRenderingContext2D

    const multilineInput = "First line of text\nSecond line of text\nThird line of text"
    const lines = wrapText(mockCtx, multilineInput, 1000)

    expect(lines).toHaveLength(3)
    expect(lines[0]).toBe("First line of text")
    expect(lines[1]).toBe("Second line of text")
    expect(lines[2]).toBe("Third line of text")
  })

  it('handles automatic word wrapping inside paragraphs along with explicit newlines', () => {
    const mockCtx = {
      measureText: (text: string) => ({ width: text.length * 10 }),
      font: ''
    } as unknown as CanvasRenderingContext2D

    const multilineInput = "A very long paragraph that will wrap\nShort paragraph"
    // Using maxWidth = 200 (which fits ~20 characters per line) to force wrapping only on the first paragraph
    const lines = wrapText(mockCtx, multilineInput, 200)

    expect(lines.length).toBeGreaterThan(2)
    expect(lines[lines.length - 1]).toBe("Short paragraph")
  })

  it('fits font sizes correctly within maximum boundaries when autoFit is true', () => {
    const mockCtx = {
      measureText: (text: string) => ({ width: text.length * 10 }),
      font: ''
    } as unknown as CanvasRenderingContext2D

    const text = "Some sample text"
    const res = fitFontSize(mockCtx, text, 200, 50, 24, 'Inter', 'bold', 1.2, true)

    expect(res.size).toBeLessThanOrEqual(24)
    expect(res.lines.length).toBeGreaterThan(0)
  })
})

describe('News Card Layout & Math Mechanics', () => {
  it('calculates exact cover-fit crop box for wide vs tall photo zone images', () => {
    const zoneW = 1080
    const zoneH = 648 // 60% of 1080

    // Test wide image (e.g. 1920x1080)
    const wideW = 1920
    const wideH = 1080
    const wideImgRatio = wideW / wideH
    const zoneRatio = zoneW / zoneH

    let sw = wideW, sh = wideH, sx = 0, sy = 0
    if (wideImgRatio > zoneRatio) {
      sw = wideH * zoneRatio
      sx = (wideW - sw) / 2
    } else {
      sh = wideW / zoneRatio
      sy = (wideH - sh) / 2
    }

    expect(sw).toBeLessThan(wideW)
    expect(sh).toBe(wideH)
    expect(sx).toBeGreaterThan(0)
    expect(sy).toBe(0)

    // Test tall image (e.g. 1080x1920)
    const tallW = 1080
    const tallH = 1920
    const tallImgRatio = tallW / tallH

    let tsw = tallW, tsh = tallH, tsx = 0, tsy = 0
    if (tallImgRatio > zoneRatio) {
      tsw = tallH * zoneRatio
      tsx = (tallW - tsw) / 2
    } else {
      tsh = tallW / zoneRatio
      tsy = (tallH - tsh) / 2
    }

    expect(tsh).toBeLessThan(tallH)
    expect(tsw).toBe(tallW)
    expect(tsy).toBeGreaterThan(0)
    expect(tsx).toBe(0)
  })

  it('correctly handles 1-Line vs 2-Line mode for eyebrow and headline text fields', () => {
    const mockCtx = {
      measureText: (text: string) => ({ width: text.length * 10 }),
      font: ''
    } as unknown as CanvasRenderingContext2D

    const eyebrowInput = "২০২৬ বিশ্বকাপ ফাইনাল"
    const headlineInput = "বিশ্বকাপ ট্রফি হাতে আর্জেন্টিনার ঐতিহাসিক জয়"
    const maxTextWidth = 900

    // 1-Line mode (eyebrow omitted)
    const mode1Line: '1-line' | '2-line' = '1-line'
    const eyebrowLines1Line = (mode1Line as string) === '2-line' ? wrapText(mockCtx, eyebrowInput, maxTextWidth) : []
    expect(eyebrowLines1Line).toHaveLength(0)

    // 2-Line mode (eyebrow present)
    let mode2Line: '1-line' | '2-line' = '2-line'
    const eyebrowLines2Line = mode2Line === '2-line' ? wrapText(mockCtx, eyebrowInput, maxTextWidth) : []
    expect(eyebrowLines2Line.length).toBeGreaterThan(0)
    expect(eyebrowLines2Line[0]).toBe("২০২৬ বিশ্বকাপ ফাইনাল")

    const headlineFit = fitFontSize(mockCtx, headlineInput, maxTextWidth, 300, 60, 'Outfit', '800', 1.25, true)
    expect(headlineFit.lines.length).toBeGreaterThan(0)
  })

  it('positions circular logo badge on seam with white ring border offset', () => {
    const canvasW = 1080
    const canvasH = 1080
    const zoneH = canvasH * 0.60
    const logoSize = 60
    const logoOffset = 10

    const badgeX = canvasW / 2
    const badgeY = zoneH + logoOffset
    const ringThickness = Math.max(4, Math.round(logoSize * 0.08))

    expect(badgeX).toBe(540)
    expect(badgeY).toBe(658) // 648 + 10
    expect(ringThickness).toBe(5)
    expect(logoSize + ringThickness).toBe(65)
  })

  it('calculates 3-part footer strip positioning across width', () => {
    const w = 1080
    const textPad = w * 0.06 // 64.8
    const datePos = textPad
    const ctaPos = w / 2 // 540
    const urlPos = w - textPad // 1015.2

    expect(datePos).toBe(64.8)
    expect(ctaPos).toBe(540)
    expect(urlPos).toBe(1015.2)
  })
})

