import { useState, useEffect } from 'react'
import { Mic, Link2, RefreshCw, XCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { ModernButton } from '@/components/ui/modern-button'
import { Badge } from '@/components/ui/badge'
import { plaudService, PlaudConnection } from '@/services/plaudService'
import { toast } from 'sonner'

export const PlaudConnectionCard = () => {
  const [connection, setConnection] = useState<PlaudConnection | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    loadConnection()
  }, [])

  const loadConnection = async () => {
    try {
      const conn = await plaudService.getConnection()
      setConnection(conn)
    } catch (error) {
      console.error('Error loading Plaud connection:', error)
    }
  }

  const handleConnect = async () => {
    try {
      setIsConnecting(true)
      const authUrl = await plaudService.getAuthorizationUrl()
      window.location.href = authUrl
    } catch (error) {
      console.error('Error connecting to Plaud:', error)
      toast.error('خطا در اتصال به Plaud AI')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleSync = async () => {
    try {
      setIsSyncing(true)
      await plaudService.syncRecordings()
      toast.success('همگام‌سازی با موفقیت انجام شد')
      await loadConnection()
    } catch (error) {
      console.error('Error syncing Plaud recordings:', error)
      toast.error('خطا در همگام‌سازی ضبط‌ها')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleDisconnect = async () => {
    if (!connection) return
    
    try {
      await plaudService.disconnectAccount(connection.id)
      toast.success('اتصال قطع شد')
      setConnection(null)
    } catch (error) {
      console.error('Error disconnecting Plaud:', error)
      toast.error('خطا در قطع اتصال')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Plaud AI
            </CardTitle>
            <CardDescription>
              دستگاه ضبط هوشمند جلسات با قابلیت تبدیل صدا به متن
            </CardDescription>
          </div>
          {connection && (
            <Badge variant={connection.status === 'active' ? 'default' : 'secondary'}>
              {connection.status === 'active' ? 'متصل' : 'قطع'}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {!connection ? (
          <div className="text-center py-6">
            <Mic className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-muted-foreground mb-4">
              برای دریافت خودکار ضبط‌های جلسات، Plaud AI را متصل کنید
            </p>
            <ModernButton
              onClick={handleConnect}
              loading={isConnecting}
              icon={<Link2 className="h-4 w-4" />}
            >
              اتصال به Plaud AI
            </ModernButton>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">آخرین همگام‌سازی:</span>
              <span className="font-medium">
                {connection.last_sync_at 
                  ? new Date(connection.last_sync_at).toLocaleString('fa-IR')
                  : 'هرگز'
                }
              </span>
            </div>
            
            <div className="flex gap-2">
              <ModernButton
                onClick={handleSync}
                loading={isSyncing}
                icon={<RefreshCw className="h-4 w-4" />}
                variant="outline"
                className="flex-1"
              >
                همگام‌سازی
              </ModernButton>
              
              <ModernButton
                onClick={handleDisconnect}
                icon={<XCircle className="h-4 w-4" />}
                variant="destructive"
              >
                قطع اتصال
              </ModernButton>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
