import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  platform: 'ios' | 'android' | 'web' | 'windows' | 'macos' | 'linux';
  browser: 'chrome' | 'safari' | 'firefox' | 'edge' | 'other';
  isNative: boolean;
  isPWA: boolean;
  screenSize: {
    width: number;
    height: number;
    aspectRatio: number;
  };
  devicePixelRatio: number;
  orientation: 'portrait' | 'landscape';
  touchCapable: boolean;
  darkMode: boolean;
}

export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => getInitialDeviceInfo());

  function getInitialDeviceInfo(): DeviceInfo {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Device type detection
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const isDesktop = width >= 1024;
    
    const type: DeviceInfo['type'] = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';
    
    // Platform detection
    const isNative = Capacitor.isNativePlatform();
    const platform: DeviceInfo['platform'] = isNative 
      ? Capacitor.getPlatform() as 'ios' | 'android'
      : userAgent.includes('mac') ? 'macos'
      : userAgent.includes('win') ? 'windows'
      : userAgent.includes('linux') ? 'linux'
      : 'web';
    
    // Browser detection
    const browser: DeviceInfo['browser'] = 
      userAgent.includes('chrome') ? 'chrome'
      : userAgent.includes('safari') ? 'safari'
      : userAgent.includes('firefox') ? 'firefox'
      : userAgent.includes('edge') ? 'edge'
      : 'other';
    
    // PWA detection
    const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                  (window.navigator as any).standalone === true ||
                  document.referrer.includes('android-app://');
    
    return {
      type,
      platform,
      browser,
      isNative,
      isPWA,
      screenSize: {
        width,
        height,
        aspectRatio: width / height
      },
      devicePixelRatio: window.devicePixelRatio || 1,
      orientation: width > height ? 'landscape' : 'portrait',
      touchCapable: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches
    };
  }

  useEffect(() => {
    const handleResize = () => {
      setDeviceInfo(getInitialDeviceInfo());
    };

    const handleOrientationChange = () => {
      // Delay to ensure dimensions are updated
      setTimeout(() => {
        setDeviceInfo(getInitialDeviceInfo());
      }, 100);
    };

    const handleColorSchemeChange = (e: MediaQueryListEvent) => {
      setDeviceInfo(prev => ({ ...prev, darkMode: e.matches }));
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    mediaQuery.addEventListener('change', handleColorSchemeChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      mediaQuery.removeEventListener('change', handleColorSchemeChange);
    };
  }, []);

  return deviceInfo;
}