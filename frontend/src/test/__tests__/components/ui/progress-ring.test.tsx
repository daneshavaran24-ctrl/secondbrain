import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ProgressRing } from '@/components/ui/progress-ring'

describe('ProgressRing Component', () => {
  describe('تست جعبه‌سیاه (Black-box Testing)', () => {
    it('should render with default props', () => {
      const { getByText } = render(<ProgressRing progress={50} />)
      expect(getByText('50%')).toBeInTheDocument()
    })

    it('should handle progress boundaries correctly', () => {
      const { rerender, getByText } = render(<ProgressRing progress={0} />)
      expect(getByText('0%')).toBeInTheDocument()

      rerender(<ProgressRing progress={100} />)
      expect(getByText('100%')).toBeInTheDocument()

      rerender(<ProgressRing progress={150} />)
      expect(getByText('150%')).toBeInTheDocument()
    })

    it('should hide text when showText is false', () => {
      const { queryByText } = render(<ProgressRing progress={75} showText={false} />)
      expect(queryByText('75%')).not.toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const { container } = render(
        <ProgressRing progress={30} className="custom-class" />
      )
      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('تست جعبه‌سفید (White-box Testing)', () => {
    it('should calculate circumference correctly', () => {
      const size = 80
      const strokeWidth = 8
      const radius = (size - strokeWidth) / 2
      const expectedCircumference = 2 * Math.PI * radius

      const { container } = render(
        <ProgressRing progress={50} size={size} strokeWidth={strokeWidth} />
      )
      
      const progressCircle = container.querySelector('circle:last-child')
      expect(progressCircle).toHaveAttribute(
        'stroke-dasharray', 
        expectedCircumference.toString()
      )
    })

    it('should apply custom color correctly', () => {
      const customColor = 'hsl(120, 100%, 50%)'
      const { container } = render(
        <ProgressRing progress={60} color={customColor} />
      )
      
      const progressCircle = container.querySelector('circle:last-child')
      expect(progressCircle).toHaveAttribute('stroke', customColor)
    })
  })
})