import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { ModernButton } from "@/components/ui/modern-button";
import { Progress } from "@/components/ui/progress";
import { CSRProject } from "@/services/socialResponsibilityService";
import { CSRTemplates, CSRTemplate } from "../CSRTemplates";
import { BasicInfoStep } from "./BasicInfoStep";
import { TimelineBudgetStep } from "./TimelineBudgetStep";
import { StakeholdersStep } from "./StakeholdersStep";
import { DetailsStep } from "./DetailsStep";
import { ArrowRight, ArrowLeft } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(3, "عنوان باید حداقل 3 کاراکتر باشد"),
  description: z.string().optional(),
  type: z.enum(["charity", "environment", "education", "other"]),
  status: z.enum(["planning", "active", "completed", "on_hold"]),
  priority: z.enum(["low", "medium", "high"]),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  budget: z.number().optional(),
  currency: z.string().default("IRR"),
  partners: z.array(z.string()).default([]),
  beneficiaries: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
});

interface CSRProjectWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: CSRProject;
  onSubmit: (data: Partial<CSRProject>) => void;
}

const STEPS = [
  { id: 1, title: "اطلاعات اولیه" },
  { id: 2, title: "زمان‌بندی و بودجه" },
  { id: 3, title: "ذینفعان" },
  { id: 4, title: "جزئیات" },
];

export function CSRProjectWizard({
  open,
  onOpenChange,
  project,
  onSubmit,
}: CSRProjectWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showTemplates, setShowTemplates] = useState(!project);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: project?.title || "",
      description: project?.description || "",
      type: (project?.type as any) || "charity",
      status: (project?.status as any) || "planning",
      priority: (project?.priority as any) || "medium",
      start_date: project?.start_date || "",
      end_date: project?.end_date || "",
      budget: project?.budget ? Number(project.budget) : undefined,
      currency: project?.currency || "IRR",
      partners: project?.partners || [],
      beneficiaries: project?.beneficiaries || [],
      tags: project?.tags || [],
    },
  });

  const handleTemplateSelect = (template: CSRTemplate) => {
    form.setValue("type", template.preset.type);
    form.setValue("priority", template.preset.priority);
    form.setValue("tags", template.preset.tags);
    if (template.preset.beneficiaries) {
      form.setValue("beneficiaries", template.preset.beneficiaries);
    }
    setShowTemplates(false);
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    const data: Partial<CSRProject> = {
      ...values,
      budget: values.budget ? Number(values.budget) : undefined,
    };

    onSubmit(data);
    form.reset();
    setCurrentStep(0);
    setShowTemplates(!project);
    onOpenChange(false);
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  if (showTemplates) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>پروژه CSR جدید</DialogTitle>
          </DialogHeader>

          <CSRTemplates onSelect={handleTemplateSelect} />

          <div className="flex justify-center pt-4">
            <ModernButton
              variant="outline"
              onClick={() => setShowTemplates(false)}
            >
              شروع با فرم خالی
            </ModernButton>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {project ? "ویرایش پروژه CSR" : "پروژه CSR جدید"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>مرحله {currentStep + 1} از {STEPS.length}</span>
              <span>{STEPS[currentStep].title}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Steps Navigation */}
          <div className="flex justify-between">
            {STEPS.map((step, index) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(index)}
                className={`flex-1 text-xs py-2 px-1 border-b-2 transition-colors ${
                  index === currentStep
                    ? "border-primary text-primary font-semibold"
                    : index < currentStep
                    ? "border-primary/30 text-muted-foreground"
                    : "border-muted text-muted-foreground"
                }`}
              >
                {step.title}
              </button>
            ))}
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {currentStep === 0 && <BasicInfoStep form={form} />}
              {currentStep === 1 && <TimelineBudgetStep form={form} />}
              {currentStep === 2 && <StakeholdersStep form={form} />}
              {currentStep === 3 && <DetailsStep form={form} />}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4">
                <ModernButton
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                >
                  <ArrowRight className="h-4 w-4 ml-2" />
                  قبلی
                </ModernButton>

                <div className="flex gap-2">
                  <ModernButton
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    انصراف
                  </ModernButton>

                  {currentStep < STEPS.length - 1 ? (
                    <ModernButton type="button" onClick={nextStep} magnetic>
                      بعدی
                      <ArrowLeft className="h-4 w-4 mr-2" />
                    </ModernButton>
                  ) : (
                    <ModernButton type="submit" magnetic glow>
                      {project ? "ذخیره تغییرات" : "ایجاد پروژه"}
                    </ModernButton>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
