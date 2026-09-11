import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import Dashboard from '@/components/Dashboard'

describe('Smoke Tests - تست دود', () => {
  describe('Critical Path Testing', () => {
    it('should load application without crashing', () => {
      expect(() => {
        render(<Dashboard />)
      }).not.toThrow()
    })

    it('should display main application title', () => {
      const { getByText } = render(<Dashboard />)
      expect(getByText('Mora')).toBeInTheDocument()
    })

    it('should render key dashboard sections', () => {
      const { getByText } = render(<Dashboard />)

      // Critical sections that must always work
      expect(getByText(/مرکز کنترل هوشمند/)).toBeInTheDocument()
      expect(getByText('آمار کلیدی')).toBeInTheDocument()
      expect(getByText('پیشنهادات هوشمند')).toBeInTheDocument()
    })

    it('should render without console errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

      render(<Dashboard />)

      expect(consoleSpy).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('Persian/RTL Support Smoke Test', () => {
    it('should contain Persian text content', () => {
      const { container } = render(<Dashboard />)

      const textContent = container.textContent || ''

      // Should contain Persian characters
      expect(textContent).toMatch(/[\u0600-\u06FF]/)
    })

    it('should handle RTL layout properly', () => {
      const { getByText } = render(<Dashboard />)

      // Persian text should be present and readable
      expect(getByText('Mora')).toBeInTheDocument()
      expect(getByText(/هوشمند/)).toBeInTheDocument()
    })
  })

  describe('Responsive Layout Smoke Test', () => {
    it('should render on mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      expect(() => {
        render(<Dashboard />)
      }).not.toThrow()

      const { getByText } = render(<Dashboard />)
      expect(getByText('Mora')).toBeInTheDocument()
    })
  })
})