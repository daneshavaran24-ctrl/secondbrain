import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import Dashboard from '@/components/Dashboard'

// Mock child components
vi.mock('@/components/ui/progress-charts', () => ({
  ProgressCharts: () => <div data-testid="progress-charts">Progress Charts</div>
}))

vi.mock('@/components/Secretary/SecretaryRequestsPanel', () => ({
  SecretaryRequestsPanel: () => <div data-testid="secretary-panel">Secretary Panel</div>
}))

vi.mock('@/components/core/QuickActions', () => ({
  QuickActions: () => <div data-testid="quick-actions">Quick Actions</div>
}))

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('تست جعبه‌سیاه (Black-box Testing)', () => {
    it('should render main dashboard elements', () => {
      const { getByText } = render(<Dashboard />)

      // Check hero section
      expect(getByText('Mora')).toBeInTheDocument()
      expect(getByText(/مرکز کنترل هوشمند/)).toBeInTheDocument()

      // Check statistics cards
      expect(getByText('فعالیت‌های امروز')).toBeInTheDocument()
      expect(getByText('پروژه‌های فعال')).toBeInTheDocument()
      expect(getByText('ایده‌های جدید')).toBeInTheDocument()
      expect(getByText('جلسات این هفته')).toBeInTheDocument()
    })

    it('should display correct statistics values', () => {
      const { getByText } = render(<Dashboard />)

      // Check stat values
      expect(getByText('24')).toBeInTheDocument() // فعالیت‌های امروز
      expect(getByText('8')).toBeInTheDocument()  // پروژه‌های فعال
      expect(getByText('12')).toBeInTheDocument() // ایده‌های جدید
      expect(getByText('5')).toBeInTheDocument()  // جلسات
    })

    it('should render child components', () => {
      const { getByTestId } = render(<Dashboard />)

      expect(getByTestId('progress-charts')).toBeInTheDocument()
      expect(getByTestId('secretary-panel')).toBeInTheDocument()
      expect(getByTestId('quick-actions')).toBeInTheDocument()
    })
  })

  describe('تست عملکرد (Performance Testing)', () => {
    it('should render quickly', () => {
      const startTime = performance.now()
      render(<Dashboard />)
      const endTime = performance.now()

      // Should render in reasonable time
      expect(endTime - startTime).toBeLessThan(500)
    })
  })
})