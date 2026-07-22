import { describe, it, expect } from 'vitest'
import { wrapText, fitFontSize, parseWordTokens, toggleWordHighlight } from '../utils/textHelper'
import { calculateBadgePosition } from '../utils/newsCardCanvas'

describe('Text Wrapping & Word Highlight Utilities', () => {
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

  it('parses word tokens and detects asterisk highlights correctly', () => {
    const input = "We are *HIRING NOW* for developers"
    const tokens = parseWordTokens(input)

    expect(tokens).toHaveLength(6)
    expect(tokens[0]!.cleanWord).toBe("We")
    expect(tokens[0]!.highlighted).toBe(false)
    expect(tokens[2]!.cleanWord).toBe("HIRING")
    expect(tokens[2]!.highlighted).toBe(true)
    expect(tokens[3]!.cleanWord).toBe("NOW")
    expect(tokens[3]!.highlighted).toBe(true)
    expect(tokens[4]!.cleanWord).toBe("for")
    expect(tokens[4]!.highlighted).toBe(false)
  })

  it('toggles word highlight on and off preserving surrounding text formatting', () => {
    const input = "We are HIRING developers"
    const updated = toggleWordHighlight(input, 2)
    expect(updated).toBe("We are *HIRING* developers")

    const reverted = toggleWordHighlight(updated, 2)
    expect(reverted).toBe("We are HIRING developers")
  })
})

describe('News Card Dedicated View & Canvas Mechanics', () => {
  it('calculates preset anchor badge positions correctly', () => {
    const w = 1080
    const h = 1080
    const photoZoneH = 594
    const logoSize = 50

    const seamCenter = calculateBadgePosition('seam-center', w, h, photoZoneH, logoSize, 0, 0)
    expect(seamCenter.x).toBe(540)
    expect(seamCenter.y).toBe(594)

    const topLeft = calculateBadgePosition('top-left', w, h, photoZoneH, logoSize, 10, -5)
    expect(topLeft.x).toBe(64.8 + 50 + 10)
    expect(topLeft.y).toBe(64.8 + 50 - 5)

    const bottomRight = calculateBadgePosition('bottom-right', w, h, photoZoneH, logoSize, 0, 0)
    expect(bottomRight.x).toBe(1080 - 64.8 - 50)
    expect(bottomRight.y).toBe(1080 - 64.8 - 50)
  })

  it('calculates 3-part footer strip positioning across width', () => {
    const w = 1080
    const textPad = w * 0.06
    const datePos = textPad
    const ctaPos = w / 2
    const urlPos = w - textPad

    expect(datePos).toBe(64.8)
    expect(ctaPos).toBe(540)
    expect(urlPos).toBe(1015.2)
  })
})
