import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { convertIdeaToTask, getTaskPreview, ConvertIdeaToTaskData } from "@/utils/ideaToTaskConverter";
import { personalPlanningService } from "@/services/personalPlanningService";
import { professionalPlanningService } from "@/services/professionalPlanningService";
import { organizationalPlanningService } from "@/services/organizationalPlanningService";
import { cn } from "@/lib/utils";

interface ConvertToTaskDialogProps {
  idea: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConvertToTaskDialog({ idea, open, onOpenChange }: ConvertToTaskDialogProps) {
  const navigate = useNavigate();
  const [isConverting, setIsConverting] = useState(false);
  
  // Determine domain from idea
  const domain = idea.category?.includes('شخصی') || idea.category?.includes('فردی') 
    ? 'personal' 
    : idea.category?.includes('حرفه') 
    ? 'professional' 
    : 'organizational';
  
  const [taskData, setTaskData] = useState<ConvertIdeaToTaskData>(() => 
    convertIdeaToTask(idea, domain)
  );
  
  const handleConvert = async () => {
    setIsConverting(true);
    
    try {
      let createdTask;
      
      // Route to appropriate service based on domain
      if (taskData.domain === 'personal') {
        createdTask = personalPlanningService.createTask({
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          status: taskData.status,
          mainCategory: taskData.mainCategory as any,
          subCategory: taskData.subCategory,
          tags: taskData.tags,
          due_date: taskData.due_date,
          estimated_hours: taskData.estimated_hours,
        } as any);
      } else if (taskData.domain === 'professional') {
        createdTask = professionalPlanningService.createTask({
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          status: taskData.status,
          category: taskData.category,
          tags: taskData.tags,
          due_date: taskData.due_date,
          estimated_hours: taskData.estimated_hours,
        } as any);
      } else {
        createdTask = organizationalPlanningService.createTask({
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          status: taskData.status,
          category: taskData.category,
          tags: taskData.tags,
          due_date: taskData.due_date,
        } as any);
      }
      
      toast.success("وظیفه با موفقیت ایجاد شد", {
        description: `ایده "${idea.title}" به وظیفه ${getDomainLabel(taskData.domain)} تبدیل شد`,
        action: {
          label: "مشاهده وظیفه",
          onClick: () => {
            const routes = {
              personal: '/planning/personal',
              professional: '/planning/professional',
              organizational: '/planning/organizational'
            };
            navigate(routes[taskData.domain]);
          }
        }
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error converting idea to task:', error);
      toast.error("خطا در ایجاد وظیفه", {
        description: "لطفاً دوباره تلاش کنید"
      });
    } finally {
      setIsConverting(false);
    }
  };
  
  const getDomainLabel = (domain: string) => {
    const labels = {
      personal: 'فردی',
      professional: 'حرفه‌ای',
      organizational: 'سازمانی'
    };
    return labels[domain as keyof typeof labels];
  };
  
  const priorityLabels = {
    low: 'کم',
    medium: 'متوسط',
    high: 'بالا'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-primary" />
            تبدیل ایده به وظیفه
          </DialogTitle>
          <DialogDescription>
            ایده خود را به یک وظیفه قابل اجرا تبدیل کنید
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Preview Card */}
          <div className="p-4 bg-muted/50 rounded-lg border border-dashed space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              پیش‌نمایش وظیفه
            </div>
            <div className="text-sm text-muted-foreground whitespace-pre-line">
              {getTaskPreview(taskData)}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {taskData.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          
          {/* Edit Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">عنوان وظیفه *</Label>
              <Input
                id="title"
                value={taskData.title}
                onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                placeholder="عنوان وظیفه را وارد کنید"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">توضیحات</Label>
              <Textarea
                id="description"
                value={taskData.description}
                onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
                placeholder="توضیحات تکمیلی..."
                rows={6}
                className="resize-none"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">اولویت</Label>
                <Select
                  value={taskData.priority}
                  onValueChange={(value) => setTaskData({ ...taskData, priority: value as any })}
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{priorityLabels.low}</SelectItem>
                    <SelectItem value="medium">{priorityLabels.medium}</SelectItem>
                    <SelectItem value="high">{priorityLabels.high}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="domain">حوزه</Label>
                <Select
                  value={taskData.domain}
                  onValueChange={(value) => setTaskData({ ...taskData, domain: value as any })}
                >
                  <SelectTrigger id="domain">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">فردی</SelectItem>
                    <SelectItem value="professional">حرفه‌ای</SelectItem>
                    <SelectItem value="organizational">سازمانی</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>تاریخ سررسید</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !taskData.due_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {taskData.due_date 
                      ? new Date(taskData.due_date).toLocaleDateString('fa-IR')
                      : "انتخاب تاریخ"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={taskData.due_date ? new Date(taskData.due_date) : undefined}
                    onSelect={(date) => setTaskData({ 
                      ...taskData, 
                      due_date: date?.toISOString().split('T')[0] 
                    })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isConverting}
          >
            انصراف
          </Button>
          <Button
            onClick={handleConvert}
            disabled={!taskData.title.trim() || isConverting}
            className="gap-2"
          >
            {isConverting ? (
              <>
                <span className="animate-spin">⏳</span>
                در حال ایجاد...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                ایجاد وظیفه
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
