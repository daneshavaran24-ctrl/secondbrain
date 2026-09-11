import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ModernCard } from "./modern-card";
import { ModernButton } from "./modern-button";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <ModernCard 
      title=""
      className={cn("text-center py-12", className)}
      hover={false}
    >
      <div className="flex flex-col items-center space-y-6">
        <div className="p-6 bg-gradient-lux rounded-full text-lux-midnight opacity-60">
          {icon}
        </div>
        
        <div className="space-y-2">
          <h3 className="heading-secondary text-xl">{title}</h3>
          <p className="text-body max-w-md mx-auto">{description}</p>
        </div>
        
        {action && (
          <ModernButton
            onClick={action.onClick}
            icon={action.icon}
            magnetic
            glow
            className="bg-gradient-luxury-gold hover:bg-gradient-luxury-ember"
          >
            {action.label}
          </ModernButton>
        )}
      </div>
    </ModernCard>
  );
}