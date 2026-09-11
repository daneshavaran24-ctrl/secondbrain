import { useState, useEffect } from 'react'
import { Usb, Link2, XCircle, Settings as SettingsIcon } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { ModernButton } from '@/components/ui/modern-button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { hiDockService, HiDockConnection } from '@/services/hiDockService'
import { toast } from 'sonner'

export const HiDockConnectionCard = () => {
  const [connection, setConnection] = useState<HiDockConnection | null>(null)
  const [isPairing, setIsPairing] = useState(false)
  const [deviceSerial, setDeviceSerial] = useState('')
  const [deviceName, setDeviceName] = useState('Hi Dock H1')
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    loadConnection()
  }, [])

  const loadConnection = async () => {
    try {
      const conn = await hiDockService.getConnection()
      setConnection(conn)
    } catch (error) {
      console.error('Error loading Hi Dock connection:', error)
    }
  }

  const handlePair = async () => {
    if (!deviceSerial.trim()) {
      toast.error('لطفاً شماره سریال دستگاه را وارد کنید')
      return
    }

    try {
      setIsPairing(true)
      await hiDockService.pairDevice(deviceSerial, deviceName)
      toast.success('Hi Dock H1 با موفقیت متصل شد')
      await loadConnection()
      setDeviceSerial('')
    } catch (error) {
      console.error('Error pairing Hi Dock:', error)
      toast.error('خطا در اتصال به Hi Dock H1')
    } finally {
      setIsPairing(false)
    }
  }

  const handleUnpair = async () => {
    if (!connection) return
    
    try {
      await hiDockService.unpairDevice(connection.id)
      toast.success('اتصال قطع شد')
      setConnection(null)
    } catch (error) {
      console.error('Error unpairing Hi Dock:', error)
      toast.error('خطا در قطع اتصال')
    }
  }

  const handleToggleSetting = async (key: keyof HiDockConnection, value: boolean) => {
    if (!connection) return
    
    try {
      await hiDockService.updateConnectionSettings(connection.id, { [key]: value } as any)
      setConnection({ ...connection, [key]: value })
      toast.success('تنظیمات به‌روز شد')
    } catch (error) {
      console.error('Error updating settings:', error)
      toast.error('خطا در به‌روزرسانی تنظیمات')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Usb className="h-5 w-5" />
              Hi Dock H1
            </CardTitle>
            <CardDescription>
              داک چندمنظوره با قابلیت ضبط و تبدیل صدا به متن
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
          <div className="space-y-4">
            <div>
              <Label htmlFor="serial">شماره سریال دستگاه</Label>
              <Input
                id="serial"
                value={deviceSerial}
                onChange={(e) => setDeviceSerial(e.target.value)}
                placeholder="مثال: HIDOCK-123456"
              />
            </div>
            <div>
              <Label htmlFor="name">نام دستگاه (اختیاری)</Label>
              <Input
                id="name"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
              />
            </div>
            <ModernButton
              onClick={handlePair}
              loading={isPairing}
              icon={<Link2 className="h-4 w-4" />}
              className="w-full"
            >
              اتصال به Hi Dock
            </ModernButton>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">شماره سریال:</span>
              <span className="font-medium font-mono">{connection.device_serial}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">نوع اتصال:</span>
              <span className="font-medium">{connection.connection_type === 'usb' ? 'USB-C' : 'Bluetooth'}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">آخرین Import:</span>
              <span className="font-medium">
                {connection.last_import_at 
                  ? new Date(connection.last_import_at).toLocaleString('fa-IR')
                  : 'هرگز'
                }
              </span>
            </div>
            
            <div className="flex gap-2">
              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogTrigger asChild>
                  <ModernButton
                    variant="outline"
                    icon={<SettingsIcon className="h-4 w-4" />}
                    className="flex-1"
                  >
                    تنظیمات
                  </ModernButton>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>تنظیمات Hi Dock H1</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Import خودکار</Label>
                      <Switch
                        checked={connection.auto_import}
                        onCheckedChange={(checked) => handleToggleSetting('auto_import', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>پردازش خودکار</Label>
                      <Switch
                        checked={connection.auto_process}
                        onCheckedChange={(checked) => handleToggleSetting('auto_process', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Import فایل صوتی</Label>
                      <Switch
                        checked={connection.import_audio}
                        onCheckedChange={(checked) => handleToggleSetting('import_audio', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Import متن</Label>
                      <Switch
                        checked={connection.import_transcript}
                        onCheckedChange={(checked) => handleToggleSetting('import_transcript', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Import خلاصه</Label>
                      <Switch
                        checked={connection.import_summary}
                        onCheckedChange={(checked) => handleToggleSetting('import_summary', checked)}
                      />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <ModernButton
                onClick={handleUnpair}
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