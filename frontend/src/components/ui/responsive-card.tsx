import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { useIsMobile } from "@/hooks/use-mobile";
import { AppIcon } from "./app-icon";

interface ResponsiveCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  action?: ReactNode;
  hover?: boolean;
  glow?: boolean;
}

export function ResponsiveCard({ 
  title, 
  children, 
  className, 
  icon, 
  action, 
  hover = false,
  glow = false 
}: ResponsiveCardProps) {
  const isMobile = useIsMobile();

  return (
    <Card className={cn(
      "bg-card border-border transition-all duration-300",
      hover && "hover:shadow-lg hover:-translate-y-1",
      glow && "shadow-luxury-soft",
      className
    )}>
      {title && (
        <CardHeader className={cn(
          "flex flex-row items-center justify-between space-y-0",
          isMobile ? "p-3 pb-2" : "p-6 pb-4"
        )}>
          <CardTitle className={cn(
            "flex items-center gap-2 truncate",
            isMobile ? "text-base" : "text-xl"
          )}>
            {icon && (
              <AppIcon size={isMobile ? "sm" : "md"}>
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
        isMobile ? "p-3 pt-0" : "p-6 pt-0"
      )}>
        {children}
      </CardContent>
    </Card>
  );
}