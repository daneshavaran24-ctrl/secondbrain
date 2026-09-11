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
import { Loader2, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

const Index = () => {
  const isMobile = useIsMobile();
  const device = useDeviceDetection();
  const layout = useAdaptiveLayout();
  const { isTablet, isDesktop } = useResponsiveBreakpoints();
  const navigate = useNavigate();
  // sidebar فقط روی desktop (≥1024px) به‌صورت پیش‌فرض باز است
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 1024;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const location = useLocation();

  // بستن sidebar هنگام resize به کوچک‌تر از desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Register service worker for offline support
  useServiceWorker();
  
  // Wake word detection to open assistant with "هی مورا"
  useWakeWord({
    autoStart: true,
    fallbackEnabled: true,
    onWakeWord: () => {
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
      <div className="loading-screen gradient-mesh">
        <div className="loading-logo">
          <Brain className="h-7 w-7 text-white" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-foreground">مورا</p>
          <p className="text-xs text-muted-foreground">در حال بارگذاری...</p>
        </div>
        <div className="loading-dots">
          <span /><span /><span />
        </div>
      </div>
    );
  }

  // اگر احراز هویت نشده باشد، نمایش لودینگ
  if (!isAuthenticated) {
    return (
      <div className="loading-screen gradient-mesh">
        <div className="loading-logo">
          <Brain className="h-7 w-7 text-white" />
        </div>
        <div className="loading-dots">
          <span /><span /><span />
        </div>
      </div>
    );
  }

  return (
    <CrossPlatformOptimized
      className="h-screen overflow-hidden gradient-mesh flex flex-col animate-blur-in"
      enableSafeArea={device.isNative}
      enableKeyboardHandling={device.type === 'mobile'}
      enableTouchOptimizations={device.touchCapable}
    >
      {/* DomainSidebar wrapped in a zero-dimension absolute div so it is
          removed from the flex flow (Safari bug: fixed flex children steal space).
          position:fixed inside renders relative to this full-screen container. */}
      <div className="absolute w-0 h-0">
        <DomainSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      </div>

      {/* Mobile/tablet backdrop */}
      {!isDesktop && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={toggleSidebar}
          onTouchStart={(e) => {
            const startX = e.touches[0].clientX;
            const handleTouchMove = (moveEvent: TouchEvent) => {
              const currentX = moveEvent.touches[0].clientX;
              if (startX - currentX > 50) {
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

      <OfflineBanner />
      <Header onMenuClick={toggleSidebar} sidebarOpen={sidebarOpen} />
      <AnimatedSubtitle />

      <main className={cn(
        "flex-1 overflow-auto transition-all duration-300 ease-out",
        !isDesktop ? 'mr-0' : sidebarOpen ? 'mr-72' : 'mr-16'
      )}>
        <div className={cn(
          "relative w-full max-w-full content-area",
          isMobile ? "min-h-[calc(100vh-8rem)] pb-20" : "min-h-screen",
          "overflow-x-hidden",
          isMobile ? "px-3 py-4" : device.type === 'tablet' ? "px-4 py-4" : "px-6 py-6",
          device.isNative && "pb-safe pt-safe",
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

      {isMobile && <MobileOptimizedNav />}
      {isMobile && <OfflineIndicator />}

      <SmartAssistant
        isOpen={assistantOpen}
        onOpenChange={setAssistantOpen}
      />
    </CrossPlatformOptimized>
  );
};

export default Index;