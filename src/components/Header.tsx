import { useState, useEffect } from "react";
import { Bell, Search, Settings, Menu, ChevronDown, MapPin, Clock, HelpCircle, Plus, Calendar as CalendarIcon, BookOpen, FileText, User, LogOut, Shield } from "lucide-react";
import SettingsModal from "./SettingsModal";
import HelpModal from "./HelpModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationCenter, notificationService } from "@/components/ui/notification-center";
import { TouchOptimizedButton, ResponsiveText } from "@/components/ui/cross-platform-optimized";
import { PlatformAware } from "@/components/ui/platform-aware";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useNavigate, useLocation } from "react-router-dom";
import { PersianNumber } from "@/components/ui/persian-number";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_NAMES } from "@/types/user-management";
import { hasCapability } from "@/utils/roleAccess";
import { toPersianNumbers } from "@/utils/persian-numbers";
import { cn } from "@/lib/utils";
import { OfflineChip } from "@/components/ui/luxe/OfflineChip";

interface HeaderProps {
  onMenuClick: () => void;
  sidebarOpen?: boolean;
}

const Header = ({ onMenuClick, sidebarOpen = true }: HeaderProps) => {
  const isMobile = useIsMobile();
  const device = useDeviceDetection();
  const layout = useAdaptiveLayout();
  const [searchValue, setSearchValue] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // به‌روزرسانی ساعت و تاریخ هر ثانیه
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      setCurrentTime(toPersianNumbers(timeString));
    };

    updateTime(); // اجرای فوری
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // تابع دریافت تاریخ شمسی فعلی
  const getCurrentPersianDate = () => {
    const now = new Date();
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      weekday: 'long',
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    }).format(now);
  };

  // به‌روزرسانی شمارش اعلانات
  useEffect(() => {
    const updateNotificationCount = () => {
      setUnreadNotifications(notificationService.getUnreadCount());
    };
    
    updateNotificationCount(); // اجرای فوری
    
    // بررسی تغییرات هر 5 ثانیه
    const interval = setInterval(updateNotificationCount, 5000);
    return () => clearInterval(interval);
  }, []);

  const navigate = useNavigate();
  const location = useLocation();

  // استفاده از AuthContext
  const { user: currentUser, role: currentRole, isLoading, signOut } = useAuth();

  // نام نمایشی کاربر
  const displayName = currentUser?.display_name || 
    `${currentUser?.first_name || ''} ${currentUser?.last_name || ''}`.trim() || 
    'کاربر';

  // سازمان کاربر
  const organizationName = 'Mora System';

  // خروج از سیستم
  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // بررسی دسترسی مدیریت کاربران
  const canManageUsers = hasCapability(currentRole, 'مدیریت کاربران');

  // تابع به‌روزرسانی شمارش اعلانات
  const handleNotificationChange = () => {
    setUnreadNotifications(notificationService.getUnreadCount());
  };
  return (
    <header className={cn(
      "glass-sidebar border-b border-border/50",
      "flex items-center justify-between shadow-glass animate-fade-in",
      "transition-all duration-300 z-50",
      isMobile ? "h-14 px-3" : "h-16 px-4 md:px-6",
      isMobile ? 'mr-0' : sidebarOpen ? 'mr-72' : 'mr-16',
      device.isNative && 'pt-safe',
      isMobile && "min-h-[44px] touch-manipulation"
    )} dir="rtl">
      {/* Right Section - Menu & Brand */}
      <div className="flex items-center gap-4">
        <PlatformAware showOn={['mobile']}>
          <TouchOptimizedButton
            onClick={onMenuClick}
            variant="ghost"
            size="md"
            className="h-9 w-9"
          >
            <Menu className="h-4 w-4" />
          </TouchOptimizedButton>
        </PlatformAware>

        {/* Brand */}
        <div className="flex items-center gap-3">
          <PlatformAware hideOn={['mobile']}>
            <ResponsiveText variant="heading">مورا</ResponsiveText>
          </PlatformAware>
        </div>

        {/* Enhanced Status Indicators */}
        <PlatformAware hideOn={['mobile', 'tablet']}>
          <div className="flex items-center gap-3">
            {/* Time Badge */}
            <Badge variant="outline" className="text-xs bg-background/50 h-6 font-mono">
              <Clock className="h-3 w-3 ml-1" />
              <span className="font-medium">{currentTime}</span>
            </Badge>
            
            {/* Persian Date Badge */}
            <Badge variant="outline" className="text-xs bg-background/50 h-6 border-r pr-2">
              <CalendarIcon className="h-3 w-3 ml-1" />
              <span className="font-medium text-xs truncate max-w-32">{getCurrentPersianDate()}</span>
            </Badge>
          </div>
        </PlatformAware>
        
        {/* Mobile Time Only */}
        <PlatformAware showOn={['mobile']}>
          <Badge variant="outline" className="text-xs bg-background/50 h-6 font-mono">
            <Clock className="h-3 w-3 ml-1" />
            <span className="font-medium">{currentTime}</span>
          </Badge>
        </PlatformAware>
      </div>

      {/* Center Section - Search Only */}
      <div className={cn("flex-1 max-w-lg", isMobile ? "mx-1" : "mx-2 md:mx-6")}>
        <div className="relative">
          <Search className={cn("absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground", isMobile ? "h-3 w-3" : "h-4 w-4")} />
          <Input
            placeholder={isMobile ? "جستجو..." : "جستجو در دانش، جلسات، وظایف..."}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className={cn(
              "input-app-standard bg-background/60 border-border/50 rounded-lg focus:bg-background focus:shadow-glow transition-elegant text-right",
              isMobile ? "pr-8 pl-2 h-8 text-xs placeholder:text-xs" : "pr-10 pl-4 h-9 text-xs placeholder:text-xs"
            )}
            dir="rtl"
          />
          {searchValue && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border/50 rounded-lg shadow-floating z-50 p-2" dir="rtl">
              <div className="text-xs text-muted-foreground p-2 text-right">پیشنهادات جستجو...</div>
            </div>
          )}
        </div>
      </div>

      {/* Left Section - User Actions */}
      <div className="flex items-center gap-1 md:gap-2">
        <OfflineChip compact={isMobile} className="mr-1" />
        {/* Quick Actions - Hidden on mobile to save space */}
        {!isMobile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hover-lift transition-elegant h-9 w-9"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-background border border-border/50 shadow-floating">
              <DropdownMenuItem
                className="cursor-pointer hover:bg-muted text-right"
                onClick={() => navigate('/meetings')}
              >
                <CalendarIcon className="h-4 w-4 ml-2" />
                ایجاد جلسه
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer hover:bg-muted text-right"
                onClick={() => navigate('/personal-journal')}
              >
                <BookOpen className="h-4 w-4 ml-2" />
                یادداشت جدید
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer hover:bg-muted text-right"
                onClick={() => navigate('/documentation')}
              >
                <FileText className="h-4 w-4 ml-2" />
                مستندات سیستم
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Notifications */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="relative hover-lift transition-elegant h-9 w-9"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
          >
            <Bell className="h-4 w-4" />
            {unreadNotifications > 0 && (
              <Badge className="absolute -top-0.5 -right-0.5 h-5 w-5 text-xs bg-destructive border-2 border-background flex items-center justify-center font-persian-nums rounded-full">
                <PersianNumber>{unreadNotifications}</PersianNumber>
              </Badge>
            )}
          </Button>
          <NotificationCenter
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
            onNotificationChange={handleNotificationChange}
          />
        </div>

        {/* Theme Toggle - always visible */}
        <ThemeToggle />

        {/* Help - Hidden on mobile */}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="hover-lift transition-elegant h-9 w-9"
            onClick={() => setIsHelpOpen(true)}
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        )}

        {/* Settings */}
        <Button
          variant="ghost"
          size="icon"
          className="hover-lift transition-elegant h-9 w-9"
          onClick={() => setIsSettingsOpen(true)}
        >
          <Settings className="h-4 w-4" />
        </Button>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 pr-2 border-r border-border/50 cursor-pointer hover:bg-muted/50 rounded-lg p-2 transition-all">
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
              <Avatar className="h-8 w-8 shadow-card hover-scale transition-elegant">
                <AvatarImage 
                  src={currentUser?.avatar_url || "/placeholder-avatar.jpg"} 
                  alt={displayName} 
                />
                <AvatarFallback className="bg-gradient-professional text-white font-bold text-xs">
                  {displayName.split(' ')[0]?.slice(0, 2) || 'کا'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-right">
                <div className="flex items-center gap-1 flex-row-reverse">
                  {currentRole && (
                    <Badge variant="outline" className="text-xs">
                      {ROLE_NAMES[currentRole]}
                    </Badge>
                  )}
                  <p className="text-sm font-medium text-foreground">
                    {isLoading ? 'در حال بارگذاری...' : displayName}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground text-right">{organizationName}</p>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 text-right" side="bottom">
            <DropdownMenuItem onClick={() => navigate('/profile')} className="text-right flex flex-row-reverse">
              <span>پروفایل کاربری</span>
              <User className="mr-2 h-4 w-4" />
            </DropdownMenuItem>
            
            {canManageUsers && (
              <DropdownMenuItem onClick={() => navigate('/admin/users')} className="text-right flex flex-row-reverse">
                <span>مدیریت کاربران</span>
                <Shield className="mr-2 h-4 w-4" />
              </DropdownMenuItem>
            )}
            
            <DropdownMenuItem onClick={() => setIsSettingsOpen(true)} className="text-right flex flex-row-reverse">
              <span>تنظیمات</span>
              <Settings className="mr-2 h-4 w-4" />
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={handleSignOut} className="text-right flex flex-row-reverse">
              <span>خروج</span>
              <LogOut className="mr-2 h-4 w-4" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Modals */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </header>
  );
};

export default Header;