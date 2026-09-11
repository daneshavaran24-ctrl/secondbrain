import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface ResponsiveHeadingProps {
  children: ReactNode;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
}

export function ResponsiveHeading({ 
  children, 
  level, 
  className,
  weight = 'bold' 
}: ResponsiveHeadingProps) {
  const isMobile = useIsMobile();
  const Component = `h${level}` as keyof JSX.IntrinsicElements;

  const sizeClasses = {
    1: isMobile ? 'text-2xl' : 'text-3xl lg:text-4xl',
    2: isMobile ? 'text-xl' : 'text-2xl lg:text-3xl',
    3: isMobile ? 'text-lg' : 'text-xl lg:text-2xl',
    4: isMobile ? 'text-base' : 'text-lg',
    5: isMobile ? 'text-sm' : 'text-base',
    6: isMobile ? 'text-xs' : 'text-sm'
  };

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  };

  return (
    <Component className={cn(
      sizeClasses[level],
      weightClasses[weight],
      'text-foreground',
      className
    )}>
      {children}
    </Component>
  );
}

interface ResponsiveTextProps {
  children: ReactNode;
  size?: 'xs' | 'sm' | 'base' | 'lg';
  className?: string;
  variant?: 'default' | 'muted' | 'secondary';
}

export function ResponsiveText({ 
  children, 
  size = 'base',
  className,
  variant = 'default'
}: ResponsiveTextProps) {
  const isMobile = useIsMobile();

  const sizeClasses = {
    xs: isMobile ? 'text-xs' : 'text-sm',
    sm: isMobile ? 'text-sm' : 'text-base',
    base: isMobile ? 'text-base' : 'text-lg',
    lg: isMobile ? 'text-lg' : 'text-xl'
  };

  const variantClasses = {
    default: 'text-foreground',
    muted: 'text-muted-foreground',
    secondary: 'text-secondary-foreground'
  };

  return (
    <p className={cn(
      sizeClasses[size],
      variantClasses[variant],
      className
    )}>
      {children}
    </p>
  );
}