import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@/components/ui/theme-provider'
import { Toaster } from '@/components/ui/toaster'

// Test providers wrapper
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="light" storageKey="test-theme">
        {children}
        <Toaster />
      </ThemeProvider>
    </BrowserRouter>
  )
}

// Custom render function
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Test data generators
export const mockProgressData = [
  { name: 'پروژه‌ها', value: 75, color: 'hsl(var(--primary))', icon: null },
  { name: 'وظایف', value: 60, color: 'hsl(var(--secondary))', icon: null },
  { name: 'ایده‌ها', value: 85, color: 'hsl(var(--accent))', icon: null },
  { name: 'جلسات', value: 40, color: 'hsl(var(--muted))', icon: null },
]

export const mockSecretaryNotification = {
  id: '1',
  type: 'delegation' as const,
  title: 'تست اعلان',
  message: 'این یک اعلان تست است',
  read: false,
  created_at: new Date().toISOString(),
  user_id: 'test-user'
}

export const mockSecretaryRequest = {
  id: '1',
  type: 'meeting_schedule' as const,
  title: 'تست درخواست',
  description: 'این یک درخواست تست است',
  status: 'pending' as const,
  priority: 'medium' as const,
  deadline: new Date().toISOString(),
  created_at: new Date().toISOString(),
  user_id: 'test-user'
}

// Mock API responses
export const mockApiResponse = {
  success: (data: any) => Promise.resolve({ data, error: null }),
  error: (message: string) => Promise.resolve({ data: null, error: { message } })
}