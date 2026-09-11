import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle } from "lucide-react";
import { TutorialStep } from './TutorialManager';

interface ProgressTrackerProps {
  currentStep: number;
  totalSteps: number;
  completedSteps: string[];
  steps: TutorialStep[];
}

export function ProgressTracker({ 
  currentStep, 
  totalSteps, 
  completedSteps, 
  steps 
}: ProgressTrackerProps) {
  const progressPercentage = Math.round((completedSteps.length / totalSteps) * 100);

  return (
    <Card className="fixed bottom-4 right-4 w-80 shadow-lg z-[9999] border-2 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-sm">پیشرفت آموزش</h4>
          <Badge variant="outline" className="text-xs">
            {completedSteps.length}/{totalSteps}
          </Badge>
        </div>
        
        <Progress value={progressPercentage} className="h-2 mb-3" />
        
        <div className="text-xs text-muted-foreground mb-3">
          {progressPercentage}% تکمیل شده
        </div>
        
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {steps.slice(Math.max(0, currentStep - 1), currentStep + 3).map((step, index) => {
            const actualIndex = Math.max(0, currentStep - 1) + index;
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = actualIndex === currentStep;
            
            return (
              <div
                key={step.id}
                className={`flex items-center gap-2 text-xs p-2 rounded ${
                  isCurrent ? 'bg-primary/10 text-primary' : 
                  isCompleted ? 'bg-success/10 text-success' : 'text-muted-foreground'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <Circle className="w-3 h-3" />
                )}
                <span className="truncate">
                  {actualIndex + 1}. {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}