import { useState, useEffect, useMemo } from 'react';

export interface ResponsiveBreakpoints {
  isXs: boolean;
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isXl: boolean;
  is2Xl: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  aspectRatio: number;
  isTouch: boolean;
}

const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

const getBreakpointInfo = (width: number, height: number): ResponsiveBreakpoints => {
  const isXs = width < BREAKPOINTS.sm; // < 640px
  const isSm = width >= BREAKPOINTS.sm && width < BREAKPOINTS.md; // 640-767px
  const isMd = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg; // 768-1023px
  const isLg = width >= BREAKPOINTS.lg && width < BREAKPOINTS.xl; // 1024-1279px
  const isXl = width >= BREAKPOINTS.xl && width < BREAKPOINTS['2xl']; // 1280-1535px
  const is2Xl = width >= BREAKPOINTS['2xl']; // >= 1536px

  const isMobile = isXs || isSm; // < 768px (consistent with useIsMobile / Tailwind md)
  const isTablet = isMd; // 768-1023px
  const isDesktop = isLg || isXl || is2Xl; // >= 1024px

  const orientation = width > height ? 'landscape' : 'portrait';
  const aspectRatio = width / height;
  const isTouch = typeof window !== 'undefined' && 'ontouchstart' in window;

  const screenSize = isXs ? 'xs' : isSm ? 'sm' : isMd ? 'md' : isLg ? 'lg' : isXl ? 'xl' : '2xl';

  return {
    isXs, isSm, isMd, isLg, isXl, is2Xl,
    isMobile, isTablet, isDesktop,
    screenSize: screenSize as ResponsiveBreakpoints['screenSize'],
    width, height, orientation, aspectRatio, isTouch
  };
};

export function useResponsiveBreakpoints(): ResponsiveBreakpoints {
  const [breakpoints, setBreakpoints] = useState<ResponsiveBreakpoints>(() => {
    if (typeof window === 'undefined') {
      return {
        isXs: false, isSm: false, isMd: false, isLg: true, isXl: false, is2Xl: false,
        isMobile: false, isTablet: false, isDesktop: true,
        screenSize: 'lg', width: 1920, height: 1080,
        orientation: 'landscape', aspectRatio: 1.78, isTouch: false
      };
    }

    return getBreakpointInfo(window.innerWidth, window.innerHeight);
  });

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleResize = () => {
      // Debounce resize events for better performance
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setBreakpoints(getBreakpointInfo(window.innerWidth, window.innerHeight));
      }, 100);
    };

    const handleOrientationChange = () => {
      // Handle orientation changes with a slight delay for mobile devices
      setTimeout(() => {
        setBreakpoints(getBreakpointInfo(window.innerWidth, window.innerHeight));
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return breakpoints;
}

export function useResponsiveValue<T>(values: {
  xs: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
}): T {
  const { screenSize } = useResponsiveBreakpoints();
  
  return values[screenSize] ?? values.xs;
}

// Legacy support for existing code
export function useResponsiveLegacyValue<T>(values: {
  mobile: T;
  tablet?: T;
  desktop?: T;
}): T {
  const { isMobile, isTablet, isDesktop } = useResponsiveBreakpoints();
  
  if (isMobile) return values.mobile;
  if (isTablet) return values.tablet ?? values.mobile;
  if (isDesktop) return values.desktop ?? values.tablet ?? values.mobile;
  return values.mobile;
}