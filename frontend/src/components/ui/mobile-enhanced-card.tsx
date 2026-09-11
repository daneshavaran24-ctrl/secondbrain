import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { useIsMobile } from "@/hooks/use-mobile";
import { AppIcon } from "./app-icon";

interface MobileEnhancedCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  action?: ReactNode;
  onClick?: () => void;
  hover?: boolean;
  glow?: boolean;
  variant?: 'default' | 'compact' | 'touch-friendly';
}

export function MobileEnhancedCard({ 
  title, 
  children, 
  className, 
  icon, 
  action, 
  onClick,
  hover = false,
  glow = false,
  variant = 'default'
}: MobileEnhancedCardProps) {
  const isMobile = useIsMobile();

  const variantClasses = {
    default: '',
    compact: isMobile ? 'p-2' : 'p-4',
    'touch-friendly': isMobile ? 'min-h-[44px]' : ''
  };

  return (
    <Card 
      className={cn(
        "bg-card border-border transition-all duration-300",
        hover && "hover:shadow-lg hover:-translate-y-1",
        glow && "shadow-luxury-soft",
        onClick && "cursor-pointer touch-manipulation",
        onClick && isMobile && "active:scale-95",
        variantClasses[variant],
        className
      )}
      onClick={onClick}
    >
      {title && (
        <CardHeader className={cn(
          "flex flex-row items-center justify-between space-y-0",
          isMobile ? "p-3 pb-2" : "p-6 pb-4",
          variant === 'compact' && isMobile && "p-2 pb-1"
        )}>
          <CardTitle className={cn(
            "flex items-center gap-2 truncate",
            isMobile ? "text-sm" : "text-xl",
            variant === 'compact' && "text-sm"
          )}>
            {icon && (
              <AppIcon size={isMobile || variant === 'compact' ? "sm" : "md"}>
                {icon}
              </AppIcon>
            )}
            <span className="truncate">{title}</span>
          </CardTitle>
          {action && (
            <div className="flex-shrink-0 ml-2">
              {action}
            </div>
          )}
        </CardHeader>
      )}
      <CardContent className={cn(
        isMobile ? "p-3 pt-0" : "p-6 pt-0",
        variant === 'compact' && isMobile && "p-2 pt-0"
      )}>
        {children}
      </CardContent>
    </Card>
  );
}

interface MobileCardGridProps {
  children: ReactNode;
  className?: string;
  cols?: number;
  gap?: 'sm' | 'md' | 'lg';
}

export function MobileCardGrid({ 
  children, 
  className,
  cols = 1,
  gap = 'md'
}: MobileCardGridProps) {
  const isMobile = useIsMobile();

  const gapClasses = {
    sm: isMobile ? 'gap-2' : 'gap-3',
    md: isMobile ? 'gap-3' : 'gap-4',
    lg: isMobile ? 'gap-4' : 'gap-6'
  };

  const gridCols = isMobile ? Math.min(cols, 2) : cols;

  return (
    <div className={cn(
      'grid',
      `grid-cols-${gridCols}`,
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
}