import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, RefreshCw, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { AnalysisHistoryItem } from "@/services/analysisHistoryService";
import { cn } from "@/lib/utils";
import { IdeaPdfExportButton } from "./IdeaPdfExportButton";

interface AnalysisHistoryCardProps {
  item: AnalysisHistoryItem;
  onView: (item: AnalysisHistoryItem) => void;
  onDelete: (id: string) => void;
  onRetry: (id: string) => void;
}

export function AnalysisHistoryCard({ 
  item, 
  onView, 
  onDelete, 
  onRetry 
}: AnalysisHistoryCardProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed":
        return {
          icon: CheckCircle2,
          label: "موفق",
          className: "bg-green-500/10 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400"
        };
      case "failed":
        return {
          icon: XCircle,
          label: "ناموفق",
          className: "bg-red-500/10 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400"
        };
      case "processing":
        return {
          icon: Loader2,
          label: "در حال انجام",
          className: "bg-blue-500/10 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400"
        };
      case "pending":
        return {
          icon: Clock,
          label: "در صف",
          className: "bg-yellow-500/10 text-yellow-700 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-400"
        };
      default:
        return {
          icon: Clock,
          label: "نامشخص",
          className: "bg-muted text-muted-foreground border-border"
        };
    }
  };

  const getDomainLabel = (domain: string) => {
    const labels: Record<string, string> = {
      personal: "شخصی",
      professional: "حرفه‌ای",
      organizational: "سازمانی"
    };
    return labels[domain] || domain;
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      high: "بالا",
      medium: "متوسط",
      low: "کم"
    };
    return labels[priority] || priority;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "همین الان";
    if (diffMins < 60) return `${diffMins} دقیقه پیش`;
    if (diffHours < 24) return `${diffHours} ساعت پیش`;
    if (diffDays < 7) return `${diffDays} روز پیش`;
    
    return date.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateDuration = () => {
    if (item.status !== "completed") return null;
    
    const start = new Date(item.created_at).getTime();
    const end = new Date(item.updated_at).getTime();
    const durationSeconds = Math.floor((end - start) / 1000);
    
    if (durationSeconds < 60) return `${durationSeconds} ثانیه`;
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')} دقیقه`;
  };

  const statusConfig = getStatusConfig(item.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="interactive-card hover:border-primary/30 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="heading-tertiary line-clamp-2 group-hover:text-primary transition-colors">
            {item.idea.title}
          </CardTitle>
          <Badge className={cn(statusConfig.className, "flex items-center gap-1 flex-shrink-0")}>
            <StatusIcon className={cn("w-3 h-3", item.status === "processing" && "animate-spin")} />
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {item.idea.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {item.idea.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            {getDomainLabel(item.idea.domain)}
          </Badge>
          <Badge variant="outline" className="text-xs">
            اولویت: {getPriorityLabel(item.idea.priority)}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatDate(item.created_at)}</span>
          </div>
          {calculateDuration() && (
            <div className="flex items-center gap-1">
              <span>مدت: {calculateDuration()}</span>
            </div>
          )}
        </div>

        {item.error_message && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-2 text-xs text-destructive">
            {item.error_message}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {item.status === "completed" && (
            <>
              <Button
                variant="default"
                size="sm"
                className="flex-1 interactive-button"
                onClick={() => onView(item)}
              >
                <Eye className="w-3 h-3 mr-1" />
                مشاهده نتایج
              </Button>
              <IdeaPdfExportButton idea={item.idea} size="sm" showDropdown={false} />
            </>
          )}
          
          {item.status === "failed" && (
            <Button
              variant="default"
              size="sm"
              className="flex-1 interactive-button"
              onClick={() => onRetry(item.id)}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              تلاش مجدد
            </Button>
          )}

          {(item.status === "pending" || item.status === "processing") && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled
            >
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              در حال پردازش...
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            className="interactive-button border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
