import { ReactNode } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ModernButtonProps extends ButtonProps {
  children: ReactNode;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  magnetic?: boolean;
  glow?: boolean;
}

export function ModernButton({
  children,
  loading = false,
  icon,
  iconPosition = "left",
  magnetic = false,
  glow = false,
  className,
  disabled,
  ...props
}: ModernButtonProps) {
  return (
    <Button
      disabled={disabled || loading}
      className={cn(
        "transition-elegant font-futuristic font-medium tracking-wide",
        "rounded-xl shadow-elegant border-0",
        magnetic && "btn-magnetic",
        glow && "hover:shadow-glow",
        loading && "opacity-70 pointer-events-none",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3">
        {loading && (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {!loading && icon && iconPosition === "left" && (
          <span className="text-current opacity-90">{icon}</span>
        )}
        <span className="font-medium">{children}</span>
        {!loading && icon && iconPosition === "right" && (
          <span className="text-current opacity-90">{icon}</span>
        )}
      </div>
    </Button>
  );
}