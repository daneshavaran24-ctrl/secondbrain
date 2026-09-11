import { useMemo } from 'react';
import { useDeviceDetection } from './useDeviceDetection';

export interface AdaptiveLayoutConfig {
  columns: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  spacing: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
  padding: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
  fontSize: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
  navigation: 'bottom-tabs' | 'sidebar' | 'drawer' | 'top-nav';
  containerMaxWidth: string;
  enableSafeArea: boolean;
}

export function useAdaptiveLayout(customConfig?: Partial<AdaptiveLayoutConfig>): AdaptiveLayoutConfig {
  const device = useDeviceDetection();

  const defaultConfig: AdaptiveLayoutConfig = useMemo(() => {
    const isMobile = device.type === 'mobile';
    const isTablet = device.type === 'tablet';
    const isNative = device.isNative;

    return {
      columns: {
        mobile: 1,
        tablet: 2,
        desktop: 3
      },
      spacing: {
        mobile: 'gap-3',
        tablet: 'gap-4 md:gap-6',
        desktop: 'gap-6 lg:gap-8'
      },
      padding: {
        mobile: isNative ? 'p-3 pt-safe pb-safe' : 'p-3',
        tablet: 'p-4 md:p-6',
        desktop: 'p-6 lg:p-8'
      },
      fontSize: {
        mobile: 'text-sm',
        tablet: 'text-base',
        desktop: 'text-lg'
      },
      navigation: isMobile 
        ? (isNative ? 'bottom-tabs' : 'drawer')
        : isTablet 
          ? 'sidebar'
          : 'top-nav',
      containerMaxWidth: isMobile ? 'max-w-full' : isTablet ? 'max-w-4xl' : 'max-w-7xl',
      enableSafeArea: isNative
    };
  }, [device]);

  return useMemo(() => ({
    ...defaultConfig,
    ...customConfig
  }), [defaultConfig, customConfig]);
}

export function useResponsiveValue<T>(values: {
  mobile: T;
  tablet?: T;
  desktop?: T;
}): T {
  const device = useDeviceDetection();
  
  return useMemo(() => {
    switch (device.type) {
      case 'mobile':
        return values.mobile;
      case 'tablet':
        return values.tablet ?? values.mobile;
      case 'desktop':
        return values.desktop ?? values.tablet ?? values.mobile;
      default:
        return values.mobile;
    }
  }, [device.type, values]);
}

export function useBreakpointClass(classes: {
  mobile: string;
  tablet?: string;
  desktop?: string;
}): string {
  const device = useDeviceDetection();
  
  return useMemo(() => {
    const baseClass = classes.mobile;
    const tabletClass = classes.tablet ? ` md:${classes.tablet}` : '';
    const desktopClass = classes.desktop ? ` lg:${classes.desktop}` : '';
    
    return `${baseClass}${tabletClass}${desktopClass}`;
  }, [classes, device.type]);
}