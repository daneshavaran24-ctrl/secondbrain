/**
 * صفحه نمایش تکمیل پاکسازی
 */

import { useEffect } from 'react'
import { ModernCard } from '@/components/ui/modern-card'
import { ModernButton } from '@/components/ui/modern-button'
import { CheckCircle2, Home, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { executeFinalCleanup } from '@/utils/finalCleanupExecutor'
import { toast } from 'sonner'

export default function CleanupCompletePage() {
  const navigate = useNavigate()

  useEffect(() => {
    // اجرای پاکسازی نهایی
    executeFinalCleanup()
  }, [])

  const handleGoHome = () => {
    navigate('/')
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 flex items-center justify-center p-4">
      <ModernCard title="پاکسازی کامل" className="max-w-md w-full p-8 text-center space-y-6">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            پاکسازی کامل شد!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            تمام داده‌های تستی حذف شد و داشبورد آماده استفاده است.
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <ModernButton 
            onClick={handleGoHome}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            بازگشت به داشبورد
          </ModernButton>
          
          <ModernButton 
            variant="outline" 
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            بارگیری مجدد
          </ModernButton>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
          <p>✅ پایگاه داده Supabase پاک شد</p>
          <p>✅ حافظه محلی تمیز شد</p>
          <p>✅ آمار داشبورد به‌روزرسانی شد</p>
        </div>
      </ModernCard>
    </div>
  )
}