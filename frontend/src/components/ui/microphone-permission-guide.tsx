import React, { useEffect, useState } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, Chrome, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MicrophonePermissionGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

type BrowserType = 'chrome' | 'firefox' | 'safari' | 'edge' | 'unknown';

export const MicrophonePermissionGuide: React.FC<MicrophonePermissionGuideProps> = ({
  isOpen,
  onClose,
}) => {
  const [browser, setBrowser] = useState<BrowserType>('unknown');

  useEffect(() => {
    const detectBrowser = (): BrowserType => {
      const userAgent = navigator.userAgent.toLowerCase();
      
      if (userAgent.includes('edg/')) return 'edge';
      if (userAgent.includes('chrome')) return 'chrome';
      if (userAgent.includes('firefox')) return 'firefox';
      if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'safari';
      
      return 'unknown';
    };

    setBrowser(detectBrowser());
  }, []);

  const getBrowserIcon = () => {
    switch (browser) {
      case 'chrome':
      case 'edge':
        return <Chrome className="h-6 w-6 text-primary" />;
      case 'firefox':
        return <Chrome className="h-6 w-6 text-orange-500" />;
      case 'safari':
        return <Chrome className="h-6 w-6 text-blue-500" />;
      default:
        return <ExternalLink className="h-6 w-6 text-primary" />;
    }
  };

  const getBrowserInstructions = () => {
    switch (browser) {
      case 'chrome':
        return (
          <ol className="list-decimal list-inside space-y-3 text-sm text-foreground pr-2">
            <li>روی آیکون قفل 🔒 یا دوربین 📷 در نوار آدرس (سمت چپ) کلیک کنید</li>
            <li>در منوی باز شده، گزینه "Site settings" یا "تنظیمات سایت" را انتخاب کنید</li>
            <li>در قسمت "Microphone" یا "میکروفون"، گزینه "Allow" یا "مجاز" را انتخاب کنید</li>
            <li>صفحه را رفرش کنید (کلید F5 یا Ctrl+R)</li>
            <li>دوباره روی دکمه ضبط کلیک کنید</li>
          </ol>
        );
      case 'edge':
        return (
          <ol className="list-decimal list-inside space-y-3 text-sm text-foreground pr-2">
            <li>روی آیکون قفل 🔒 در نوار آدرس (سمت چپ) کلیک کنید</li>
            <li>گزینه "Permissions for this site" یا "مجوزها برای این سایت" را انتخاب کنید</li>
            <li>در قسمت "Microphone"، گزینه "Allow" را انتخاب کنید</li>
            <li>صفحه را رفرش کنید (F5)</li>
          </ol>
        );
      case 'firefox':
        return (
          <ol className="list-decimal list-inside space-y-3 text-sm text-foreground pr-2">
            <li>روی آیکون میکروفون 🎤 با علامت ضربدر در نوار آدرس کلیک کنید</li>
            <li>روی "X" کنار "Blocked Temporarily" کلیک کنید</li>
            <li>یا در منو، "Clear This Permission" را انتخاب کنید</li>
            <li>صفحه را رفرش کنید</li>
            <li>وقتی پیام دسترسی نمایش داده شد، "Allow" را انتخاب کنید</li>
          </ol>
        );
      case 'safari':
        return (
          <ol className="list-decimal list-inside space-y-3 text-sm text-foreground pr-2">
            <li>به منوی Safari بروید و "Settings" یا "تنظیمات" را انتخاب کنید</li>
            <li>تب "Websites" را انتخاب کنید</li>
            <li>در سمت چپ، "Microphone" را انتخاب کنید</li>
            <li>برای این سایت، گزینه "Allow" را انتخاب کنید</li>
            <li>صفحه را رفرش کنید</li>
          </ol>
        );
      default:
        return (
          <ol className="list-decimal list-inside space-y-3 text-sm text-foreground pr-2">
            <li>به تنظیمات مرورگر خود بروید</li>
            <li>بخش "Privacy" یا "حریم خصوصی" را پیدا کنید</li>
            <li>دسترسی میکروفون را برای این سایت فعال کنید</li>
            <li>صفحه را رفرش کنید</li>
          </ol>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          <Alert className="relative border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5 shadow-lg">
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-2 top-2 h-6 w-6 p-0"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-3 mb-4">
              {getBrowserIcon()}
              <AlertTitle className="text-lg font-bold m-0">
                راهنمای فعال‌سازی میکروفون
              </AlertTitle>
            </div>

            <AlertDescription className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                {getBrowserInstructions()}
              </div>

              <div className="pt-4 border-t border-border/30">
                <p className="text-sm text-muted-foreground mb-3">
                  <strong>💡 نکته:</strong> اگر این روش کار نکرد:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground pr-4">
                  <li>مطمئن شوید که میکروفون به کامپیوتر متصل است</li>
                  <li>برنامه‌های دیگری که از میکروفون استفاده می‌کنند را ببندید</li>
                  <li>مرورگر را ببندید و دوباره باز کنید</li>
                  <li>در صورت نیاز، کامپیوتر را ریستارت کنید</li>
                </ul>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button onClick={onClose} variant="default" size="sm">
                  متوجه شدم
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
