import React, { useState, useEffect } from 'react';
import { StepByStepGuide } from './StepByStepGuide';
import { TutorialOverlay } from './TutorialOverlay';
import { ProgressTracker } from './ProgressTracker';

export type TutorialVariant = 'personal' | 'professional' | 'organizational';
export type TutorialStep = {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: 'click' | 'input' | 'navigate' | 'observe';
  actionData?: any;
  validation?: () => boolean;
};

interface TutorialManagerProps {
  isOpen: boolean;
  onClose: () => void;
  variant: TutorialVariant;
  onComplete?: () => void;
}

export function TutorialManager({ isOpen, onClose, variant, onComplete }: TutorialManagerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const steps = getTutorialSteps(variant);

  useEffect(() => {
    if (isOpen) {
      // Load progress from localStorage
      const savedProgress = localStorage.getItem(`tutorial-${variant}-progress`);
      if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        setCompletedSteps(progress.completedSteps || []);
        setCurrentStep(progress.currentStep || 0);
      }
    }
  }, [isOpen, variant]);

  const handleStepComplete = (stepId: string) => {
    const newCompletedSteps = [...completedSteps, stepId];
    setCompletedSteps(newCompletedSteps);
    
    // Save progress
    localStorage.setItem(`tutorial-${variant}-progress`, JSON.stringify({
      completedSteps: newCompletedSteps,
      currentStep: currentStep + 1
    }));

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Tutorial complete
      onComplete?.();
      setIsActive(false);
    }
  };

  const handleStartTutorial = () => {
    setIsActive(true);
    setCurrentStep(0);
    setCompletedSteps([]);
  };

  const handleSkipStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsActive(false);
    }
  };

  const handleGoToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  if (!isOpen) return null;

  return (
    <>
      <StepByStepGuide
        isOpen={!isActive}
        onClose={onClose}
        variant={variant}
        steps={steps}
        completedSteps={completedSteps}
        onStartTutorial={handleStartTutorial}
        onGoToStep={handleGoToStep}
      />
      
      {isActive && (
        <>
          <TutorialOverlay
            step={steps[currentStep]}
            onComplete={() => handleStepComplete(steps[currentStep].id)}
            onSkip={handleSkipStep}
            onClose={() => setIsActive(false)}
          />
          
          <ProgressTracker
            currentStep={currentStep}
            totalSteps={steps.length}
            completedSteps={completedSteps}
            steps={steps}
          />
        </>
      )}
    </>
  );
}

function getTutorialSteps(variant: TutorialVariant): TutorialStep[] {
  const baseSteps: TutorialStep[] = [
    {
      id: 'welcome',
      title: 'خوش آمدید!',
      description: 'به سیستم برنامه‌ریزی هوشمند خوش آمدید. ما شما را قدم به قدم راهنمایی می‌کنیم.',
      action: 'observe'
    },
    {
      id: 'create-task',
      title: 'ایجاد اولین وظیفه',
      description: 'روی دکمه "وظیفه جدید" کلیک کنید تا اولین وظیفه خود را ایجاد کنید.',
      targetSelector: '[data-tutorial="new-task-button"]',
      position: 'bottom',
      action: 'click'
    },
    {
      id: 'fill-task-form',
      title: 'پر کردن فرم وظیفه',
      description: 'عنوان، توضیحات و اولویت وظیفه خود را وارد کنید.',
      targetSelector: '[data-tutorial="task-form"]',
      position: 'right',
      action: 'input'
    },
    {
      id: 'set-priority',
      title: 'تنظیم اولویت',
      description: 'سطح اهمیت وظیفه را انتخاب کنید: بالا، متوسط یا پایین.',
      targetSelector: '[data-tutorial="priority-select"]',
      position: 'top',
      action: 'click'
    },
    {
      id: 'set-due-date',
      title: 'تعیین مهلت',
      description: 'تاریخ مهلت انجام وظیفه را با استفاده از تقویم فارسی انتخاب کنید.',
      targetSelector: '[data-tutorial="due-date"]',
      position: 'left',
      action: 'click'
    },
    {
      id: 'save-task',
      title: 'ذخیره وظیفه',
      description: 'روی دکمه "ذخیره" کلیک کنید تا وظیفه ایجاد شود.',
      targetSelector: '[data-tutorial="save-button"]',
      position: 'bottom',
      action: 'click'
    }
  ];

  const viewSteps: TutorialStep[] = [
    {
      id: 'switch-views',
      title: 'تغییر نما',
      description: 'بین نماهای مختلف مانند لیست، تقویم و کانبان جابجا شوید.',
      targetSelector: '[data-tutorial="view-tabs"]',
      position: 'bottom',
      action: 'click'
    },
    {
      id: 'kanban-view',
      title: 'نمای کانبان',
      description: 'در این نما می‌توانید وظایف را با کشیدن و رها کردن جابجا کنید.',
      targetSelector: '[data-tutorial="kanban-board"]',
      position: 'top',
      action: 'observe'
    }
  ];

  const aiSteps: TutorialStep[] = [
    {
      id: 'ai-mentor',
      title: 'استفاده از منتور AI',
      description: 'از منتور هوش مصنوعی برای دریافت مشاوره و راهنمایی استفاده کنید.',
      targetSelector: '[data-tutorial="ai-mentor"]',
      position: 'left',
      action: 'click'
    }
  ];

  // Customize based on variant
  if (variant === 'professional') {
    return [
      ...baseSteps,
      {
        id: 'assign-team',
        title: 'تعیین مسئول',
        description: 'فرد یا تیم مسئول انجام وظیفه را مشخص کنید.',
        targetSelector: '[data-tutorial="assignee-select"]',
        position: 'right',
        action: 'click'
      },
      ...viewSteps,
      ...aiSteps
    ];
  }

  if (variant === 'organizational') {
    return [
      ...baseSteps,
      {
        id: 'set-kpi',
        title: 'تعیین KPI',
        description: 'شاخص‌های عملکرد کلیدی برای این وظیفه تعین کنید.',
        targetSelector: '[data-tutorial="kpi-section"]',
        position: 'top',
        action: 'input'
      },
      ...viewSteps,
      {
        id: 'dashboard-analytics',
        title: 'داشبورد تحلیلی',
        description: 'از داشبورد برای پیگیری پیشرفت کلی پروژه‌ها استفاده کنید.',
        targetSelector: '[data-tutorial="analytics-dashboard"]',
        position: 'bottom',
        action: 'observe'
      },
      ...aiSteps
    ];
  }

  return [...baseSteps, ...viewSteps, ...aiSteps];
}