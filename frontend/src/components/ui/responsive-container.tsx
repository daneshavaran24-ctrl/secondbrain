import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  variant?: 'page' | 'section' | 'full' | 'centered';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export function ResponsiveContainer({ 
  children, 
  className,
  variant = 'section',
  padding = 'md',
  maxWidth = '2xl'
}: ResponsiveContainerProps) {
  const isMobile = useIsMobile();

  const variantClasses = {
    page: 'min-h-screen',
    section: 'w-full',
    full: 'w-full min-h-screen',
    centered: 'w-full flex flex-col items-center justify-center min-h-[50vh]'
  };

  const paddingClasses = {
    none: '',
    sm: isMobile ? 'p-3' : 'p-4',
    md: isMobile ? 'p-4' : 'p-6',
    lg: isMobile ? 'p-6' : 'p-8 lg:p-12'
  };

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-full'
  };

  return (
    <div className={cn(
      variantClasses[variant],
      paddingClasses[padding],
      maxWidthClasses[maxWidth],
      'mx-auto w-full',
      className
    )}>
      {children}
    </div>
  );
}

interface ResponsiveSectionProps {
  children: ReactNode;
  className?: string;
  spacing?: 'sm' | 'md' | 'lg';
}

export function ResponsiveSection({ 
  children, 
  className,
  spacing = 'md'
}: ResponsiveSectionProps) {
  const isMobile = useIsMobile();

  const spacingClasses = {
    sm: isMobile ? 'space-y-3' : 'space-y-4',
    md: isMobile ? 'space-y-4' : 'space-y-6',
    lg: isMobile ? 'space-y-6' : 'space-y-8'
  };

  return (
    <div className={cn(
      spacingClasses[spacing],
      className
    )}>
      {children}
    </div>
  );
}