import { Capacitor } from '@capacitor/core';
import { StatusBar, Style as StatusBarStyle } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';

export interface PlatformCapabilities {
  hasNativeNavigation: boolean;
  hasStatusBar: boolean;
  hasSafeArea: boolean;
  hasHapticFeedback: boolean;
  hasFileSystem: boolean;
  hasCamera: boolean;
  hasGeolocation: boolean;
  hasPushNotifications: boolean;
  hasBackButton: boolean;
}

export class PlatformManager {
  static async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      // Hide splash screen after app is loaded
      await SplashScreen.hide();
      
      // Configure status bar
      await this.configureStatusBar();
      
      // Set up keyboard handling
      await this.setupKeyboard();
      
      // Set up back button handling
      this.setupBackButton();
      
    } catch (error) {
      console.warn('Platform initialization error:', error);
    }
  }

  static async configureStatusBar(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      await StatusBar.setStyle({
        style: isDark ? StatusBarStyle.Dark : StatusBarStyle.Light
      });

      if (Capacitor.getPlatform() === 'android') {
        await StatusBar.setBackgroundColor({ 
          color: isDark ? '#1a1a1a' : '#ffffff' 
        });
      }
    } catch (error) {
      console.warn('StatusBar configuration error:', error);
    }
  }

  static async setupKeyboard(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      Keyboard.addListener('keyboardWillShow', (info) => {
        document.body.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
        document.body.classList.add('keyboard-open');
      });

      Keyboard.addListener('keyboardWillHide', () => {
        document.body.style.removeProperty('--keyboard-height');
        document.body.classList.remove('keyboard-open');
      });
    } catch (error) {
      console.warn('Keyboard setup error:', error);
    }
  }

  static setupBackButton(): void {
    if (Capacitor.getPlatform() !== 'android') return;

    document.addEventListener('ionBackButton', (ev: any) => {
      ev.detail.register(-1, () => {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          // Exit app logic here
          console.log('Exit app requested');
        }
      });
    });
  }

  static getCapabilities(): PlatformCapabilities {
    const isNative = Capacitor.isNativePlatform();
    const platform = Capacitor.getPlatform();

    return {
      hasNativeNavigation: isNative,
      hasStatusBar: isNative,
      hasSafeArea: platform === 'ios',
      hasHapticFeedback: isNative,
      hasFileSystem: isNative || 'showDirectoryPicker' in window,
      hasCamera: isNative || 'mediaDevices' in navigator,
      hasGeolocation: 'geolocation' in navigator,
      hasPushNotifications: isNative || 'serviceWorker' in navigator,
      hasBackButton: platform === 'android'
    };
  }

  static async triggerHapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light'): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      // Fallback vibration for web
      if ('vibrate' in navigator) {
        const patterns = { light: 50, medium: 100, heavy: 200 };
        navigator.vibrate(patterns[type]);
      }
      return;
    }

    try {
      // Use Haptics plugin if available
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      const styles = { 
        light: ImpactStyle.Light, 
        medium: ImpactStyle.Medium, 
        heavy: ImpactStyle.Heavy 
      };
      await Haptics.impact({ style: styles[type] });
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  }

  static isSafeAreaSupported(): boolean {
    return CSS.supports('padding-top: env(safe-area-inset-top)');
  }

  static getViewportHeight(): string {
    // Use dynamic viewport units when available, fallback to vh
    if (CSS.supports('height: 100dvh')) {
      return '100dvh';
    }
    return '100vh';
  }

  static isLandscape(): boolean {
    if ('orientation' in screen) {
      return Math.abs((screen.orientation as any).angle) === 90;
    }
    return window.innerWidth > window.innerHeight;
  }

  static async requestFullscreen(element?: Element): Promise<void> {
    if (!document.fullscreenEnabled) return;

    const target = element || document.documentElement;
    try {
      await target.requestFullscreen();
    } catch (error) {
      console.warn('Fullscreen request failed:', error);
    }
  }

  static async exitFullscreen(): Promise<void> {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (error) {
        console.warn('Exit fullscreen failed:', error);
      }
    }
  }
}