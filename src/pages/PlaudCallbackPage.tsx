import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { plaudService } from '@/services/plaudService'
import { toast } from 'sonner'

export const PlaudCallbackPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')

  useEffect(() => {
    handleCallback()
  }, [])

  const handleCallback = async () => {
    try {
      const code = searchParams.get('code')
      const error = searchParams.get('error')

      if (error) {
        throw new Error(error)
      }

      if (!code) {
        throw new Error('No authorization code received')
      }

      await plaudService.connectAccount(code)
      
      setStatus('success')
      toast.success('Plaud AI با موفقیت متصل شد')
      
      setTimeout(() => {
        navigate('/gadgets')
      }, 2000)
    } catch (error) {
      console.error('Plaud callback error:', error)
      setStatus('error')
      toast.error('خطا در اتصال به Plaud AI')
      
      setTimeout(() => {
        navigate('/gadgets')
      }, 3000)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        {status === 'processing' && (
          <>
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">در حال اتصال به Plaud AI...</p>
          </>
        )}
        {status === 'success' && (
          <p className="text-green-500">اتصال موفق! در حال انتقال...</p>
        )}
        {status === 'error' && (
          <p className="text-red-500">خطا در اتصال. در حال بازگشت...</p>
        )}
      </div>
    </div>
  )
}
