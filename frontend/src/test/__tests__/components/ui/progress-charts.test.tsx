import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { ProgressCharts } from '@/components/ui/progress-charts'

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children }: any) => <div data-testid="pie">{children}</div>,
  Cell: () => <div data-testid="cell" />,
  Tooltip: () => <div data-testid="tooltip" />
}))

describe('ProgressCharts Component', () => {
  describe('تست جعبه‌سیاه (Black-box Testing)', () => {
    it('should render pie chart and progress rings', () => {
      const { getByTestId, getByText } = render(<ProgressCharts />)
      
      expect(getByTestId('responsive-container')).toBeInTheDocument()
      expect(getByTestId('pie-chart')).toBeInTheDocument()
      expect(getByText('پروژه‌ها')).toBeInTheDocument()
      expect(getByText('وظایف')).toBeInTheDocument()
      expect(getByText('ایده‌ها')).toBeInTheDocument()
      expect(getByText('جلسات')).toBeInTheDocument()
    })

    it('should display progress percentages correctly', () => {
      const { getByText } = render(<ProgressCharts />)
      
      expect(getByText('75%')).toBeInTheDocument() // پروژه‌ها
      expect(getByText('60%')).toBeInTheDocument() // وظایف
      expect(getByText('85%')).toBeInTheDocument() // ایده‌ها
      expect(getByText('40%')).toBeInTheDocument() // جلسات
    })
  })

  describe('تست عملکرد (Performance Testing)', () => {
    it('should render quickly with multiple data points', () => {
      const startTime = performance.now()
      render(<ProgressCharts />)
      const endTime = performance.now()
      
      // Should render in reasonable time
      expect(endTime - startTime).toBeLessThan(200)
    })
  })
})