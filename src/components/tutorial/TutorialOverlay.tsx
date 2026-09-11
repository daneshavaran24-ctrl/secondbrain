import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  ArrowLeft, 
  ArrowUp, 
  ArrowDown,
  X,
  SkipForward,
  CheckCircle,
  MousePointer,
  Keyboard,
  Eye
} from "lucide-react";
import { TutorialStep } from './TutorialManager';

interface TutorialOverlayProps {
  step: TutorialStep;
  onComplete: () => void;
  onSkip: () => void;
  onClose: () => void;
}

export function TutorialOverlay({ step, onComplete, onSkip, onClose }: TutorialOverlayProps) {
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [overlayPosition, setOverlayPosition] = useState({ x: 0, y: 0 });
  const [isHighlighted, setIsHighlighted] = useState(false);

  useEffect(() => {
    if (step.targetSelector) {
      const element = document.querySelector(step.targetSelector) as HTMLElement;
      setTargetElement(element);
      
      if (element) {
        // Calculate overlay position
        const rect = element.getBoundingClientRect();
        const position = getOverlayPosition(rect, step.position || 'bottom');
        setOverlayPosition(position);
        
        // Highlight the target element
        highlightElement(element);
        setIsHighlighted(true);
        
        // Add click listener for click actions
        if (step.action === 'click') {
          const handleClick = () => {
            setTimeout(() => onComplete(), 500); // Delay to show the action
          };
          element.addEventListener('click', handleClick, { once: true });
          
          return () => {
            element.removeEventListener('click', handleClick);
          };
        }
      }
    }
    
    return () => {
      if (targetElement) {
        removeHighlight(targetElement);
      }
    };
  }, [step, targetElement, onComplete]);

  const highlightElement = (element: HTMLElement) => {
    element.style.position = 'relative';
    element.style.zIndex = '9999';
    element.style.boxShadow = '0 0 0 4px hsl(var(--primary)), 0 0 0 8px hsl(var(--primary) / 0.3)';
    element.style.borderRadius = '8px';
    element.style.transition = 'all 0.3s ease';
  };

  const removeHighlight = (element: HTMLElement) => {
    element.style.boxShadow = '';
    element.style.zIndex = '';
  };

  const getOverlayPosition = (targetRect: DOMRect, position: string) => {
    const padding = 16;
    
    switch (position) {
      case 'top':
        return {
          x: targetRect.left + targetRect.width / 2,
          y: targetRect.top - padding
        };
      case 'bottom':
        return {
          x: targetRect.left + targetRect.width / 2,
          y: targetRect.bottom + padding
        };
      case 'left':
        return {
          x: targetRect.left - padding,
          y: targetRect.top + targetRect.height / 2
        };
      case 'right':
        return {
          x: targetRect.right + padding,
          y: targetRect.top + targetRect.height / 2
        };
      default:
        return {
          x: window.innerWidth / 2,
          y: window.innerHeight / 2
        };
    }
  };

  const getArrowIcon = () => {
    if (!step.position) return null;
    
    switch (step.position) {
      case 'top': return <ArrowDown className="w-4 h-4" />;
      case 'bottom': return <ArrowUp className="w-4 h-4" />;
      case 'left': return <ArrowRight className="w-4 h-4" />;
      case 'right': return <ArrowLeft className="w-4 h-4" />;
      default: return null;
    }
  };

  const getActionIcon = () => {
    switch (step.action) {
      case 'click': return <MousePointer className="w-4 h-4" />;
      case 'input': return <Keyboard className="w-4 h-4" />;
      case 'observe': return <Eye className="w-4 h-4" />;
      default: return null;
    }
  };

  // Backdrop to darken the rest of the page
  const backdropStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9998,
    pointerEvents: 'none'
  };

  // Overlay card position
  const cardStyle: React.CSSProperties = {
    position: 'fixed',
    left: step.targetSelector ? overlayPosition.x : '50%',
    top: step.targetSelector ? overlayPosition.y : '50%',
    transform: step.targetSelector ? 
      `translate(-50%, ${step.position === 'top' ? '0' : step.position === 'bottom' ? '-100%' : '-50%'})` :
      'translate(-50%, -50%)',
    zIndex: 10000,
    maxWidth: '360px',
    pointerEvents: 'auto'
  };

  return (
    <>
      {/* Backdrop */}
      <div style={backdropStyle} />
      
      {/* Tutorial Card */}
      <Card style={cardStyle} className="shadow-xl border-2 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              {getActionIcon()}
              <h3 className="font-semibold text-lg">{step.title}</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <p className="text-muted-foreground mb-6">
            {step.description}
          </p>
          
          {step.targetSelector && getArrowIcon() && (
            <div className="flex justify-center mb-4 text-primary">
              {getArrowIcon()}
            </div>
          )}
          
          {step.action && (
            <Badge variant="outline" className="mb-4">
              {getActionLabel(step.action)}
            </Badge>
          )}
          
          <div className="flex gap-2">
            {step.action !== 'click' && (
              <Button onClick={onComplete} size="sm" className="flex-1">
                <CheckCircle className="w-4 h-4 mr-2" />
                تکمیل شد
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={onSkip} 
              size="sm"
              className="flex-1"
            >
              <SkipForward className="w-4 h-4 mr-2" />
              رد کردن
            </Button>
          </div>
          
          {step.action === 'click' && (
            <p className="text-xs text-muted-foreground mt-3 text-center">
              روی المان برجسته شده کلیک کنید
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function getActionLabel(action: string): string {
  switch (action) {
    case 'click': return 'کلیک کنید';
    case 'input': return 'وارد کنید';
    case 'navigate': return 'پیمایش کنید';
    case 'observe': return 'مشاهده کنید';
    default: return 'انجام دهید';
  }
}