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
