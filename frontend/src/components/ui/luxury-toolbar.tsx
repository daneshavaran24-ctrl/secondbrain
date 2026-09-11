import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ModernCard } from "./modern-card";

interface LuxuryToolbarProps {
  children: ReactNode;
  className?: string;
}

export function LuxuryToolbar({ children, className }: LuxuryToolbarProps) {
  return (
    <ModernCard
      title=""
      className={cn("p-4 md:p-6 mb-6 md:mb-8", className)}
      hover={false}
      gradient
    >
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4 items-start sm:items-center">
        {children}
      </div>
    </ModernCard>
  );
}