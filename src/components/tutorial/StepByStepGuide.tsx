import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  CheckCircle, 
  Circle, 
  Target, 
  TrendingUp, 
  Building,
  BookOpen,
  Zap
} from "lucide-react";
import { TutorialStep, TutorialVariant } from './TutorialManager';

interface StepByStepGuideProps {
  isOpen: boolean;
  onClose: () => void;
  variant: TutorialVariant;
  steps: TutorialStep[];
  completedSteps: string[];
  onStartTutorial: () => void;
  onGoToStep: (stepIndex: number) => void;
}

const variantConfig = {
  personal: {
    title: "آموزش گام‌به‌گام برنامه‌ریزی فردی",
    icon: Target,
    color: "hsl(var(--primary))",
    description: "یاد بگیرید چگونه وظایف شخصی خود را به‌طور مؤثر مدیریت کنید"
  },
  professional: {
    title: "آموزش گام‌به‌گام برنامه‌ریزی حرفه‌ای",
    icon: TrendingUp,
    color: "hsl(var(--success))",
    description: "مهارت‌های مدیریت پروژه و کار تیمی را فرا بگیرید"
  },
  organizational: {
    title: "آموزش گام‌به‌گام برنامه‌ریزی سازمانی",
    icon: Building,
    color: "hsl(var(--accent))",
    description: "نحوه مدیریت استراتژیک و عملیاتی سازمان را بیاموزید"
  }
};

export function StepByStepGuide({ 
  isOpen, 
  onClose, 
  variant, 
  steps, 
  completedSteps,
  onStartTutorial,
  onGoToStep 
}: StepByStepGuideProps) {
  const config = variantConfig[variant];
  const IconComponent = config.icon;
  const completionRate = Math.round((completedSteps.length / steps.length) * 100);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div 
              className="p-2 text-white rounded-lg"
              style={{ backgroundColor: config.color }}
            >
              <IconComponent className="w-6 h-6" />
            </div>
            {config.title}
          </DialogTitle>
          <p className="text-muted-foreground mt-2">{config.description}</p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Overview */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">پیشرفت شما</h3>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {completedSteps.length} از {steps.length}
                </Badge>
              </div>
              
              <div className="w-full bg-secondary rounded-full h-3 mb-4">
                <div 
                  className="h-3 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${completionRate}%`,
                    backgroundColor: config.color 
                  }}
                />
              </div>
              
              <p className="text-sm text-muted-foreground">
                {completionRate}% تکمیل شده
              </p>
            </CardContent>
          </Card>

          {/* Tutorial Steps */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">مراحل آموزش</h3>
              </div>

              <div className="space-y-3">
                {steps.map((step, index) => {
                  const isCompleted = completedSteps.includes(step.id);
                  const isCurrent = !isCompleted && completedSteps.length === index;
                  
                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-all cursor-pointer hover:bg-muted/50 ${
                        isCurrent ? 'border-primary bg-primary/5' : 
                        isCompleted ? 'border-success/30 bg-success/5' : 'border-border'
                      }`}
                      onClick={() => !isCompleted && onGoToStep(index)}
                    >
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <CheckCircle className="w-6 h-6 text-success" />
                        ) : (
                          <Circle className={`w-6 h-6 ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`} />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className={`font-medium ${isCurrent ? 'text-primary' : ''}`}>
                          {index + 1}. {step.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {step.description}
                        </p>
                      </div>

                      {step.action && (
                        <Badge variant="secondary" className="text-xs">
                          {getActionLabel(step.action)}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={onStartTutorial}
              className="flex-1"
              size="lg"
            >
              <Play className="w-4 h-4 mr-2" />
              {completedSteps.length > 0 ? 'ادامه آموزش' : 'شروع آموزش'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={onClose}
              size="lg"
            >
              بستن
            </Button>
          </div>

          {/* Tips */}
          <Card>
            <CardContent className="p-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                <Zap className="w-5 h-5 text-primary" />
                نکات مهم
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• می‌توانید در هر زمان آموزش را متوقف و بعداً ادامه دهید</p>
                <p>• پیشرفت شما به‌طور خودکار ذخیره می‌شود</p>
                <p>• برای بهترین تجربه، مراحل را به ترتیب طی کنید</p>
                <p>• در صورت بروز مشکل، می‌توانید از بخش راهنمایی استفاده کنید</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getActionLabel(action: string): string {
  switch (action) {
    case 'click': return 'کلیک';
    case 'input': return 'ورودی';
    case 'navigate': return 'پیمایش';
    case 'observe': return 'مشاهده';
    default: return 'عمل';
  }
}