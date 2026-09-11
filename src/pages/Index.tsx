import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import DomainSidebar from "@/components/DomainSidebar";
import { MinimalDashboard } from '@/components/ui/minimal-dashboard';
import { AnimatedSubtitle } from "@/components/ui/animated-subtitle";
import { FuturisticHero } from "@/components/ui/futuristic-hero";
import { FuturisticSection } from "@/components/ui/futuristic-section";
import { TestDataInitializer } from "@/components/ui/test-data-initializer";
import PageWrapper from "@/components/ui/page-wrapper";
import { CrossPlatformOptimized } from "@/components/ui/cross-platform-optimized";
import { MobileOptimizedNav } from "@/components/ui/mobile-optimized-nav";
import { OfflineBanner, OfflineIndicator } from "@/components/ui/offline-banner";
import { SmartAssistant } from "@/components/assistant/SmartAssistant";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";
import { useResponsiveBreakpoints } from "@/hooks/useResponsiveBreakpoints";
import { useServiceWorker } from "@/hooks/useOffline";
import { useWakeWord } from "@/hooks/useWakeWord";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const Index = () => {
  const isMobile = useIsMobile();
  const device = useDeviceDetection();
  const layout = useAdaptiveLayout();
  const { isTablet } = useResponsiveBreakpoints();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const location = useLocation();
  
  // Register service worker for offline support
  useServiceWorker();
  
  // Wake word detection to open assistant with "هی مورا"
  useWakeWord({
    autoStart: true,
    fallbackEnabled: true,
    onWakeWord: () => {
      console.log('[Index] Wake word detected, opening assistant');
      setAssistantOpen(true);
    }
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking auth:', error);
          setIsAuthenticated(false);
          setIsLoading(false);
          navigate('/auth');
          return;
        }

        if (!session) {
          setIsAuthenticated(false);
          setIsLoading(false);
          navigate('/auth');
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error in auth check:', error);
        setIsAuthenticated(false);
        navigate('/auth');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setIsAuthenticated(false);
        navigate('/auth');
      } else {
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const isHomePage = location.pathname === '/';

  // نمایش loading در حین بررسی احراز هویت
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-700">در حال بارگذاری...</span>
        </div>
      </div>
    );
  }

  // اگر احراز هویت نشده باشد، نمایش لودینگ
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-700">در حال انتقال به صفحه ورود...</span>
        </div>
      </div>
    );
  }

  return (
    <CrossPlatformOptimized
      className="min-h-screen gradient-mesh flex flex-col animate-blur-in"
      enableSafeArea={device.isNative}
      enableKeyboardHandling={device.type === 'mobile'}
      enableTouchOptimizations={device.touchCapable}
    >
      {/* Offline Status Banner */}
      <OfflineBanner />
      
      <Header onMenuClick={toggleSidebar} sidebarOpen={sidebarOpen} />
      <AnimatedSubtitle />

      {/* Mobile backdrop with gesture support */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={toggleSidebar}
          onTouchStart={(e) => {
            const startX = e.touches[0].clientX;
            const handleTouchMove = (moveEvent: TouchEvent) => {
              const currentX = moveEvent.touches[0].clientX;
              if (startX - currentX > 50) { // Swipe left to close
                toggleSidebar();
                document.removeEventListener('touchmove', handleTouchMove);
              }
            };
            document.addEventListener('touchmove', handleTouchMove);
            document.addEventListener('touchend', () => {
              document.removeEventListener('touchmove', handleTouchMove);
            }, { once: true });
          }}
        />
      )}

      <div className="flex-1 flex overflow-hidden">
        <main className={cn(
          "flex-1 overflow-auto transition-all duration-300 ease-out",
          // Mobile-first approach - no margins on mobile
          isMobile ? 'mr-0' : 
          sidebarOpen ? 
            (device.type === 'tablet' ? 'mr-64' : 'mr-72') : 
            'mr-16'
        )}>
          <div className={cn(
            "relative w-full max-w-full",
            // Mobile-optimized height accounting for bottom nav
            isMobile ? "min-h-[calc(100vh-8rem)] pb-20" : "min-h-screen",
            // Better overflow handling
            "overflow-x-hidden",
            // Mobile-optimized padding
            isMobile ? "px-3 py-4" : device.type === 'tablet' ? "px-4 py-4" : "px-6 py-6",
            device.isNative && "pb-safe pt-safe",
            // Smooth transitions with mobile-specific timing
            isMobile ? "transition-all duration-200 ease-out" : "transition-all duration-300 ease-in-out"
          )}>
            {isHomePage ? (
              <MinimalDashboard sidebarOpen={sidebarOpen} />
            ) : (
              <PageWrapper sidebarOpen={sidebarOpen} className={layout.padding[device.type]}>
                <Outlet context={{ sidebarOpen }} />
              </PageWrapper>
            )}
          </div>
        </main>
        <DomainSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <MobileOptimizedNav />
        </div>
      )}

      {/* Mobile Offline Indicator */}
      {isMobile && <OfflineIndicator />}

      {/* Smart Executive Assistant - with wake word control */}
      <SmartAssistant 
        isOpen={assistantOpen} 
        onOpenChange={setAssistantOpen} 
      />
    </CrossPlatformOptimized>
  );
};

export default Index;