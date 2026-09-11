import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: "active" | "inactive" | "pending" | "success" | "error" | "warning";
  text?: string;
  pulse?: boolean;
  className?: string;
}

export function StatusBadge({ status, text, pulse = false, className }: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "active":
        return {
          color: "bg-medical-green text-white",
          dotColor: "bg-medical-green",
          text: text || "فعال"
        };
      case "inactive":
        return {
          color: "bg-muted text-muted-foreground",
          dotColor: "bg-muted-foreground",
          text: text || "غیرفعال"
        };
      case "pending":
        return {
          color: "bg-medical-amber text-white",
          dotColor: "bg-medical-amber",
          text: text || "در انتظار"
        };
      case "success":
        return {
          color: "bg-medical-green text-white",
          dotColor: "bg-medical-green",
          text: text || "موفق"
        };
      case "error":
        return {
          color: "bg-destructive text-destructive-foreground",
          dotColor: "bg-destructive",
          text: text || "خطا"
        };
      case "warning":
        return {
          color: "bg-medical-amber text-white",
          dotColor: "bg-medical-amber",
          text: text || "هشدار"
        };
      default:
        return {
          color: "bg-muted text-muted-foreground",
          dotColor: "bg-muted-foreground",
          text: text || status
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge className={cn(
      "flex items-center gap-2 text-xs font-medium",
      config.color,
      className
    )}>
      <div className={cn(
        "w-2 h-2 rounded-full",
        config.dotColor,
        pulse && "animate-pulse"
      )} />
      {config.text}
    </Badge>
  );
}