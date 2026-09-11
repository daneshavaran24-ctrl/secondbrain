import { CSRProject } from "@/services/socialResponsibilityService";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ModernButton } from "@/components/ui/modern-button";
import {
  Heart,
  TreePine,
  GraduationCap,
  MoreHorizontal,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  Users,
  Target,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface CSRProjectCardProps {
  project: CSRProject;
  onEdit: (project: CSRProject) => void;
  onDelete: (id: string) => void;
}

const typeIcons = {
  charity: Heart,
  environment: TreePine,
  education: GraduationCap,
  other: MoreHorizontal,
};

const typeLabels = {
  charity: "خیریه",
  environment: "محیط زیست",
  education: "آموزش",
  other: "سایر",
};

const statusLabels = {
  planning: "برنامه‌ریزی",
  active: "فعال",
  completed: "تکمیل شده",
  on_hold: "معلق",
};

const priorityColors = {
  low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  high: "bg-red-500/10 text-red-500 border-red-500/20",
};

export function CSRProjectCard({
  project,
  onEdit,
  onDelete,
}: CSRProjectCardProps) {
  const Icon = typeIcons[project.type];

  const calculateProgress = () => {
    if (project.start_date && project.end_date) {
      const start = new Date(project.start_date).getTime();
      const end = new Date(project.end_date).getTime();
      const now = Date.now();
      if (now >= end) return 100;
      if (now <= start) return 0;
      return Math.round(((now - start) / (end - start)) * 100);
    }
    return project.status === "completed" ? 100 : project.status === "active" ? 50 : 0;
  };

  const progress = calculateProgress();

  return (
    <div
      className="border rounded-xl bg-card hover:shadow-lg transition-all p-6 space-y-4 cursor-pointer"
      onClick={() => {
        // Navigate to detail page
        window.location.href = `/csr-project/${project.id}`;
      }}
    >
      <div className="flex items-start justify-between" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 rounded-lg bg-gradient-lux">
            <Icon className="h-5 w-5 text-lux-midnight" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{project.title}</h3>
            {project.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {project.description}
              </p>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <ModernButton variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </ModernButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(project)}>
              <Edit className="h-4 w-4 ml-2" />
              ویرایش
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(project.id)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 ml-2" />
              حذف
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{typeLabels[project.type]}</Badge>
        <Badge variant="outline">{statusLabels[project.status]}</Badge>
        <Badge className={priorityColors[project.priority]}>
          {project.priority === "low" ? "کم" : project.priority === "medium" ? "متوسط" : "بالا"}
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-1">
            <Target className="h-3 w-3" />
            پیشرفت
          </span>
          <span className="font-medium">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-muted/30 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">تاریخ شروع</p>
          <p className="text-xs font-semibold">
            {project.start_date ? new Date(project.start_date).toLocaleDateString("fa-IR") : "-"}
          </p>
        </div>
        <div className="bg-muted/30 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">بودجه</p>
          <p className="text-xs font-semibold">
            {project.budget ? `${(Number(project.budget) / 1000000).toFixed(0)}م` : "-"}
          </p>
        </div>
        <div className="bg-muted/30 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">شرکا</p>
          <p className="text-xs font-semibold">{project.partners?.length || 0}</p>
        </div>
      </div>

      {project.tags && project.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {project.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {project.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{project.tags.length - 3}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
