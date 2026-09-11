import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Brain, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalysisProgressIndicatorProps {
  status: "pending" | "processing" | "completed" | "failed";
  startTime?: Date;
  className?: string;
}

interface AnalysisStage {
  id: string;
  label: string;
  icon: any;
  description: string;
}

const stages: AnalysisStage[] = [
  {
    id: "queued",
    label: "در صف تحلیل",
    icon: Clock,
    description: "درخواست شما در صف پردازش قرار گرفت"
  },
  {
    id: "processing",
    label: "در حال تحلیل هوش مصنوعی",
    icon: Brain,
    description: "هوش مصنوعی در حال بررسی جامع ایده شماست"
  },
  {
    id: "finalizing",
    label: "در حال نهایی‌سازی",
    icon: Sparkles,
    description: "آماده‌سازی نتایج تحلیل"
  },
  {
    id: "completed",
    label: "تحلیل کامل شد",
    icon: CheckCircle2,
    description: "نتایج تحلیل آماده نمایش است"
  }
];

export function AnalysisProgressIndicator({ 
  status, 
  startTime,
  className 
}: AnalysisProgressIndicatorProps) {
  const [progress, setProgress] = useState(0);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (status === "pending") {
      setProgress(15);
      setCurrentStageIndex(0);
    } else if (status === "processing") {
      setCurrentStageIndex(1);
      
      // Simulate progress for processing stage
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 85) {
            setCurrentStageIndex(2);
            return Math.min(prev + 1, 95);
          }
          return Math.min(prev + 2, 85);
        });
      }, 500);
      
      return () => clearInterval(interval);
    } else if (status === "completed") {
      setProgress(100);
      setCurrentStageIndex(3);
    } else if (status === "failed") {
      setProgress(0);
    }
  }, [status]);

  // Calculate elapsed time
  useEffect(() => {
    if (!startTime || status === "completed" || status === "failed") return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, status]);

  const estimatedTimeRemaining = () => {
    if (status === "completed") return 0;
    if (status === "pending") return 20;
    if (status === "processing") {
      const remaining = Math.max(0, 20 - elapsedTime);
      return remaining;
    }
    return 0;
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds} ثانیه`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')} دقیقه`;
  };

  if (status === "failed") {
    return (
      <Card className={cn("border-destructive/50 bg-destructive/5", className)}>
        <CardContent className="p-6">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
              <span className="text-2xl">❌</span>
            </div>
            <div>
              <h3 className="font-semibold text-destructive">خطا در تحلیل</h3>
              <p className="text-sm text-muted-foreground mt-1">
                متأسفانه تحلیل با خطا مواجه شد. لطفاً دوباره تلاش کنید.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentStage = stages[currentStageIndex];
  const Icon = currentStage.icon;

  return (
    <Card className={cn("border-primary/30 bg-primary/5 backdrop-blur-sm", className)}>
      <CardContent className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              {status === "completed" ? (
                <CheckCircle2 className="w-5 h-5 text-primary" />
              ) : (
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{currentStage.label}</h3>
              <p className="text-sm text-muted-foreground">{currentStage.description}</p>
            </div>
          </div>
          {status !== "completed" && (
            <div className="text-left">
              <div className="text-2xl font-bold text-primary">{Math.round(progress)}%</div>
              <div className="text-xs text-muted-foreground">
                {estimatedTimeRemaining() > 0 && (
                  <>~{formatTime(estimatedTimeRemaining())}</>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>شروع</span>
            <span>در حال انجام</span>
            <span>اتمام</span>
          </div>
        </div>

        {/* Stages */}
        <div className="grid grid-cols-4 gap-2">
          {stages.map((stage, index) => {
            const StageIcon = stage.icon;
            const isActive = index === currentStageIndex;
            const isCompleted = index < currentStageIndex;
            
            return (
              <div
                key={stage.id}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-lg transition-all",
                  isActive && "bg-primary/10 border border-primary/30",
                  isCompleted && "bg-muted/50",
                  !isActive && !isCompleted && "opacity-40"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                  isActive && "bg-primary text-primary-foreground",
                  isCompleted && "bg-primary/20 text-primary",
                  !isActive && !isCompleted && "bg-muted"
                )}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <StageIcon className="w-4 h-4" />
                  )}
                </div>
                <span className={cn(
                  "text-xs text-center font-medium",
                  isActive && "text-primary",
                  isCompleted && "text-muted-foreground"
                )}>
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        {status === "processing" && (
          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-muted-foreground">در حال تحلیل SWOT</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse animation-delay-200" />
              <span className="text-muted-foreground">شناسایی ریسک‌ها</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse animation-delay-400" />
              <span className="text-muted-foreground">تولید اقدامات پیشنهادی</span>
            </div>
          </div>
        )}

        {status === "completed" && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
            <p className="text-sm text-primary font-medium">
              ✨ تحلیل با موفقیت تکمیل شد! نتایج در زیر نمایش داده می‌شود.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
