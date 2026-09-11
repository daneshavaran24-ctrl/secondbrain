import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
  gradient?: boolean;
}

export function SectionHeader({
  title,
  subtitle,
  icon,
  action,
  className,
  gradient = false
}: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 gap-4", className)}>
      <div className="flex items-center gap-3 md:gap-4">
        {icon && (
          <div className="p-2 md:p-3 bg-gradient-luxury-gold rounded-xl text-white shadow-luxury-soft flex-shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className={cn(
            "text-lg md:text-xl font-semibold mb-1 truncate",
            gradient && "heading-primary"
          )}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-body text-xs md:text-sm">{subtitle}</p>
          )}
        </div>
      </div>
      {action && (
        <div className="flex gap-2 md:gap-3 flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}