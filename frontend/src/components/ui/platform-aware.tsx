import React, { ReactNode } from 'react';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

interface PlatformAwareProps {
  children: ReactNode;
  showOn?: Array<'mobile' | 'tablet' | 'desktop' | 'ios' | 'android' | 'web' | 'windows' | 'macos' | 'linux' | 'native' | 'pwa'>;
  hideOn?: Array<'mobile' | 'tablet' | 'desktop' | 'ios' | 'android' | 'web' | 'windows' | 'macos' | 'linux' | 'native' | 'pwa'>;
  fallback?: ReactNode;
}

export function PlatformAware({ 
  children, 
  showOn, 
  hideOn, 
  fallback = null 
}: PlatformAwareProps) {
  const device = useDeviceDetection();

  const shouldShow = () => {
    // Check hideOn conditions first
    if (hideOn) {
      const shouldHide = hideOn.some(condition => {
        switch (condition) {
          case 'mobile':
          case 'tablet': 
          case 'desktop':
            return device.type === condition;
          case 'ios':
          case 'android':
          case 'web':
          case 'windows':
          case 'macos':
          case 'linux':
            return device.platform === condition;
          case 'native':
            return device.isNative;
          case 'pwa':
            return device.isPWA;
          default:
            return false;
        }
      });
      
      if (shouldHide) return false;
    }

    // If no showOn conditions, show by default (unless hideOn matched)
    if (!showOn) return true;

    // Check showOn conditions
    return showOn.some(condition => {
      switch (condition) {
        case 'mobile':
        case 'tablet':
        case 'desktop':
          return device.type === condition;
        case 'ios':
        case 'android':
        case 'web':
        case 'windows':
        case 'macos':
        case 'linux':
          return device.platform === condition;
        case 'native':
          return device.isNative;
        case 'pwa':
          return device.isPWA;
        default:
          return false;
      }
    });
  };

  return shouldShow() ? <>{children}</> : <>{fallback}</>;
}

interface ConditionalWrapperProps {
  condition: boolean;
  wrapper: (children: ReactNode) => ReactNode;
  children: ReactNode;
}

export function ConditionalWrapper({ 
  condition, 
  wrapper, 
  children 
}: ConditionalWrapperProps) {
  return condition ? wrapper(children) : <>{children}</>;
}

interface ResponsiveLayoutProps {
  children: ReactNode;
  mobileLayout?: (children: ReactNode) => ReactNode;
  tabletLayout?: (children: ReactNode) => ReactNode;
  desktopLayout?: (children: ReactNode) => ReactNode;
}

export function ResponsiveLayout({ 
  children,
  mobileLayout,
  tabletLayout,
  desktopLayout
}: ResponsiveLayoutProps) {
  const device = useDeviceDetection();

  const getLayout = () => {
    switch (device.type) {
      case 'mobile':
        return mobileLayout || ((children: ReactNode) => children);
      case 'tablet':
        return tabletLayout || mobileLayout || ((children: ReactNode) => children);
      case 'desktop':
        return desktopLayout || tabletLayout || mobileLayout || ((children: ReactNode) => children);
      default:
        return (children: ReactNode) => children;
    }
  };

  return <>{getLayout()(children)}</>;
}