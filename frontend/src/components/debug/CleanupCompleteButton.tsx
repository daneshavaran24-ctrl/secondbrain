/**
 * دکمه تکمیل پاکسازی نهایی
 */

import { ModernButton } from '@/components/ui/modern-button'
import { executeCompleteDataCleanup } from '@/utils/completeDataCleanup'
import { immediateFullCleanup } from '@/utils/localStorageCleanup'
import { Trash2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function CleanupCompleteButton() {
  const handleFinalCleanup = async () => {
    try {
      toast.info('شروع پاکسازی فوری کامل...')
      
      // پاکسازی فوری localStorage
      const cleanupResult = immediateFullCleanup()
      toast.success(cleanupResult.message)
      
      // پاکسازی کامل سیستم
      await executeCompleteDataCleanup()
      
      toast.success('🎉 پاکسازی کامل انجام شد - سیستم آماده کاربر جدید است!', {
        description: 'صفحه در حال بارگیری مجدد...'
      })
      
      // reload فوری صفحه
      setTimeout(() => {
        window.location.reload()
      }, 1000)
      
    } catch (error) {
      console.error('خطا در پاکسازی کامل:', error)
      toast.error('خطا در پاکسازی کامل')
    }
  }

  return (
    <ModernButton
      onClick={handleFinalCleanup}
      className="fixed bottom-4 left-4 z-50 bg-green-600 hover:bg-green-700 text-white shadow-lg"
      size="sm"
    >
      <CheckCircle className="w-4 h-4 mr-2" />
      تکمیل پاکسازی
    </ModernButton>
  )
}