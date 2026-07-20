import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../App.vue'

describe('App', () => {
  it('mounts renders properly', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('Content Studio')
  })

  it('correctly splits multi-line text input into separate lines', () => {
    const wrapper = mount(App)
    const vm = wrapper.vm as any

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    const multilineInput = "First line of text\nSecond line of text\nThird line of text"
    const lines = vm.wrapText(ctx, multilineInput, 1000)

    expect(lines).toHaveLength(3)
    expect(lines[0]).toBe("First line of text")
    expect(lines[1]).toBe("Second line of text")
    expect(lines[2]).toBe("Third line of text")
  })

  it('handles automatic word wrapping inside paragraphs along with explicit newlines', () => {
    const wrapper = mount(App)
    const vm = wrapper.vm as any

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    // Using a narrow maxWidth to force automatic wrapping
    const multilineInput = "A very long paragraph that will definitely wrap\nShort paragraph"
    const lines = vm.wrapText(ctx, multilineInput, 50)

    // First paragraph should be split into multiple lines, while the second remains separate
    expect(lines.length).toBeGreaterThan(2)
    expect(lines[lines.length - 1]).toBe("Short paragraph")
  })
})
