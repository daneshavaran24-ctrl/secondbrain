import { Heart, TreePine, GraduationCap, Users, Hospital, Recycle } from "lucide-react";
import { ModernCard } from "@/components/ui/modern-card";
import { cn } from "@/lib/utils";

export interface CSRTemplate {
  id: string;
  title: string;
  description: string;
  icon: typeof Heart;
  color: string;
  preset: {
    type: "charity" | "environment" | "education" | "other";
    tags: string[];
    beneficiaries?: string[];
    priority: "low" | "medium" | "high";
  };
}

export const CSR_TEMPLATES: CSRTemplate[] = [
  {
    id: "charity_children",
    title: "کمک به کودکان",
    description: "پروژه‌های حمایت از کودکان یتیم و نیازمند",
    icon: Heart,
    color: "text-pink-500",
    preset: {
      type: "charity",
      tags: ["کودکان", "خیریه", "حمایت"],
      beneficiaries: ["کودکان یتیم", "خانواده‌های نیازمند"],
      priority: "high",
    },
  },
  {
    id: "tree_planting",
    title: "کاشت درخت",
    description: "پروژه‌های کاشت درخت و احیای جنگل‌ها",
    icon: TreePine,
    color: "text-green-500",
    preset: {
      type: "environment",
      tags: ["محیط زیست", "درختکاری", "احیا"],
      beneficiaries: ["جامعه محلی", "نسل‌های آینده"],
      priority: "medium",
    },
  },
  {
    id: "education_support",
    title: "حمایت آموزشی",
    description: "پشتیبانی از دانش‌آموزان و دانشجویان نیازمند",
    icon: GraduationCap,
    color: "text-blue-500",
    preset: {
      type: "education",
      tags: ["آموزش", "دانش‌آموزان", "بورس"],
      beneficiaries: ["دانش‌آموزان", "دانشجویان"],
      priority: "high",
    },
  },
  {
    id: "health_care",
    title: "خدمات بهداشتی",
    description: "ارائه خدمات بهداشتی و درمانی رایگان",
    icon: Hospital,
    color: "text-red-500",
    preset: {
      type: "other",
      tags: ["سلامت", "درمان", "پزشکی"],
      beneficiaries: ["بیماران نیازمند", "سالمندان"],
      priority: "high",
    },
  },
  {
    id: "community_development",
    title: "توسعه جامعه",
    description: "پروژه‌های توسعه زیرساخت‌های محلی",
    icon: Users,
    color: "text-purple-500",
    preset: {
      type: "other",
      tags: ["توسعه", "زیرساخت", "جامعه"],
      beneficiaries: ["جامعه محلی", "ساکنان منطقه"],
      priority: "medium",
    },
  },
  {
    id: "waste_management",
    title: "مدیریت پسماند",
    description: "پروژه‌های بازیافت و مدیریت زباله",
    icon: Recycle,
    color: "text-teal-500",
    preset: {
      type: "environment",
      tags: ["بازیافت", "پسماند", "محیط زیست"],
      beneficiaries: ["شهروندان", "محیط زیست"],
      priority: "medium",
    },
  },
];

interface CSRTemplatesProps {
  onSelect: (template: CSRTemplate) => void;
}

export function CSRTemplates({ onSelect }: CSRTemplatesProps) {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">شروع با قالب آماده</h3>
        <p className="text-sm text-muted-foreground">
          یک قالب انتخاب کنید تا فرم به طور خودکار پر شود
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CSR_TEMPLATES.map((template) => {
          const Icon = template.icon;
          return (
            <div
              key={template.id}
              onClick={() => onSelect(template)}
              className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 rounded-xl border bg-card p-6 hover:bg-accent"
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className={cn(
                  "p-3 rounded-full bg-muted",
                  template.color
                )}>
                  <Icon className="h-8 w-8" />
                </div>
                <div>
                  <h4 className="font-semibold">{template.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {template.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
