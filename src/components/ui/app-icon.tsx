import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppIconProps {
  children: ReactNode;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function AppIcon({ children, size = "md", className }: AppIconProps) {
  const isMobile = useIsMobile();
  
  const sizeClasses = {
    xs: isMobile ? "h-3 w-3" : "h-4 w-4",
    sm: isMobile ? "h-4 w-4" : "h-5 w-5",
    md: isMobile ? "h-5 w-5" : "h-6 w-6",
    lg: isMobile ? "h-6 w-6" : "h-8 w-8",
    xl: isMobile ? "h-8 w-8" : "h-10 w-10"
  };

  return (
    <span className={cn(sizeClasses[size], className)}>
      {children}
    </span>
  );
}