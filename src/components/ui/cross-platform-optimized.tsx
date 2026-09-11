import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { useAdaptiveLayout } from '@/hooks/useAdaptiveLayout';
import { PlatformAware } from './platform-aware';
import { AdaptiveContainer } from './adaptive-container';

interface CrossPlatformOptimizedProps {
  children: ReactNode;
  className?: string;
  enableSafeArea?: boolean;
  enableKeyboardHandling?: boolean;
  enableTouchOptimizations?: boolean;
}

export function CrossPlatformOptimized({
  children,
  className,
  enableSafeArea = true,
  enableKeyboardHandling = true,
  enableTouchOptimizations = true
}: CrossPlatformOptimizedProps) {
  const device = useDeviceDetection();
  const layout = useAdaptiveLayout();

  const wrapperClasses = cn(
    'w-full h-full',
    // Safe area handling for native apps
    enableSafeArea && device.isNative && 'safe-area-padding',
    // Keyboard handling for mobile
    enableKeyboardHandling && device.type === 'mobile' && 'keyboard-offset',
    // Touch optimizations
    enableTouchOptimizations && device.touchCapable && 'touch-pan-y',
    // Platform-specific classes
    device.platform === 'ios' && 'ios-scroll-fix',
    device.platform === 'android' && 'android-scroll-fix',
    // Viewport handling
    'dvh-full',
    className
  );

  return (
    <div className={wrapperClasses}>
      {children}
    </div>
  );
}

interface ResponsiveTextProps {
  children: ReactNode;
  variant?: 'body' | 'caption' | 'heading' | 'title';
  className?: string;
}

export function ResponsiveText({ 
  children, 
  variant = 'body', 
  className 
}: ResponsiveTextProps) {
  const device = useDeviceDetection();
  
  const sizeClasses = {
    body: {
      mobile: 'text-sm',
      tablet: 'text-base',
      desktop: 'text-lg'
    },
    caption: {
      mobile: 'text-xs',
      tablet: 'text-sm',
      desktop: 'text-base'
    },
    heading: {
      mobile: 'text-lg',
      tablet: 'text-xl',
      desktop: 'text-2xl'
    },
    title: {
      mobile: 'text-xl',
      tablet: 'text-2xl',
      desktop: 'text-3xl'
    }
  };

  const responsiveClass = sizeClasses[variant][device.type];

  return (
    <span className={cn(responsiveClass, 'font-persian', className)}>
      {children}
    </span>
  );
}

interface TouchOptimizedButtonProps {
  children: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

export function TouchOptimizedButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className,
  disabled = false
}: TouchOptimizedButtonProps) {
  const device = useDeviceDetection();

  // Adjust button size based on device and touch capability
  const buttonSize = device.touchCapable ? 
    { sm: 'min-h-[44px] px-4', md: 'min-h-[48px] px-6', lg: 'min-h-[52px] px-8' }[size] :
    { sm: 'h-8 px-3', md: 'h-10 px-4', lg: 'h-12 px-6' }[size];

  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'hover:bg-accent hover:text-accent-foreground'
  };

  const buttonClasses = cn(
    'inline-flex items-center justify-center rounded-md text-sm font-medium',
    'transition-colors focus-visible:outline-none focus-visible:ring-2',
    'focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
    buttonSize,
    variantClasses[variant],
    // Touch-specific optimizations
    device.touchCapable && 'active:scale-95 transition-transform',
    className
  );

  return (
    <button 
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  );
}

interface AdaptiveNavigationProps {
  children: ReactNode;
  className?: string;
}

export function AdaptiveNavigation({ children, className }: AdaptiveNavigationProps) {
  const device = useDeviceDetection();
  const layout = useAdaptiveLayout();

  return (
    <PlatformAware showOn={['mobile']}>
      <nav className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-background/95 backdrop-blur border-t border-border',
        device.isNative && 'pb-safe',
        className
      )}>
        <div className="flex items-center justify-around h-16">
          {children}
        </div>
      </nav>
    </PlatformAware>
  );
}

interface LazyLoadedContentProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

export function LazyLoadedContent({ 
  children, 
  fallback, 
  className 
}: LazyLoadedContentProps) {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {isIntersecting ? children : fallback}
    </div>
  );
}