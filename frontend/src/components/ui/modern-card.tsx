import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

interface ModernCardProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  gradient?: boolean;
}

export function ModernCard({ 
  title, 
  subtitle, 
  icon, 
  children, 
  className, 
  hover = true,
  glow = false,
  gradient = false
}: ModernCardProps) {
  return (
    <Card className={cn(
      "glass-card transition-elegant rounded-xl border-0 shadow-glass",
      hover && "hover-lift cursor-pointer interactive-card",
      glow && "hover:shadow-glow",
      gradient && "bg-gradient-card",
      className
    )}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-4">
          {icon && (
            <div className="p-3 bg-gradient-primary rounded-xl text-white shadow-elegant">
              {icon}
            </div>
          )}
          <div className="flex-1">
            <h3 className="heading-secondary mb-1">{title}</h3>
            {subtitle && (
              <p className="text-body opacity-80">{subtitle}</p>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );
}