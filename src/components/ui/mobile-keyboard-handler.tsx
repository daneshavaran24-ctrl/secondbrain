import { useEffect, useState } from 'react';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

interface MobileKeyboardHandlerProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileKeyboardHandler({ children, className }: MobileKeyboardHandlerProps) {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const device = useDeviceDetection();

  useEffect(() => {
    if (!device.isNative || device.type !== 'mobile') return;

    let initialViewportHeight = window.visualViewport?.height || window.innerHeight;

    const handleViewportChange = () => {
      if (window.visualViewport) {
        const currentHeight = window.visualViewport.height;
        const heightDiff = initialViewportHeight - currentHeight;
        
        if (heightDiff > 150) { // Keyboard is likely open
          setKeyboardHeight(heightDiff);
          setIsKeyboardOpen(true);
          document.documentElement.style.setProperty('--keyboard-height', `${heightDiff}px`);
        } else {
          setKeyboardHeight(0);
          setIsKeyboardOpen(false);
          document.documentElement.style.setProperty('--keyboard-height', '0px');
        }
      }
    };

    // Listen for viewport changes (keyboard open/close)
    window.visualViewport?.addEventListener('resize', handleViewportChange);
    
    // Fallback for older browsers
    window.addEventListener('resize', handleViewportChange);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('resize', handleViewportChange);
      document.documentElement.style.setProperty('--keyboard-height', '0px');
    };
  }, [device.isNative, device.type]);

  return (
    <div 
      className={className}
      style={{
        paddingBottom: isKeyboardOpen ? `${keyboardHeight}px` : undefined,
        transition: 'padding-bottom 0.3s ease-out'
      }}
    >
      {children}
    </div>
  );
}