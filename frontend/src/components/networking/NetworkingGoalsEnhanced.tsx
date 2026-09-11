import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Target, Trash2, Edit, Check, Sparkles, Clock, Filter, AlertTriangle, PartyPopper } from "lucide-react";
import { networkingService, NetworkingGoal } from "@/services/networkingService";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format, differenceInDays, isPast } from "date-fns";
import { faIR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

interface NetworkingGoalsProps {
  companyId?: string;
  organizationId?: string;
}

// Goal templates
const goalTemplates = [
  { title: "۵ مخاطب جدید در ماه", description: "اضافه کردن ۵ مخاطب جدید به شبکه", target_count: 5, category: "contacts" },
  { title: "۳ جلسه هفتگی", description: "برگزاری ۳ جلسه نتورکینگ در هفته", target_count: 3, category: "meetings" },
  { title: "۲ معرفی در ماه", description: "معرفی ۲ نفر از شبکه به یکدیگر", target_count: 2, category: "introductions" },
  { title: "۱ شراکت جدید", description: "ایجاد یک مشارکت تجاری جدید", target_count: 1, category: "partnerships" },
];

const categoryLabels: Record<string, string> = {
  contacts: "مخاطبین جدید",
  meetings: "جلسات",
  introductions: "معرفی‌ها",
  partnerships: "مشارکت‌ها",
  referrals: "ارجاعات",
};

const categoryColors: Record<string, string> = {
  contacts: "bg-blue-500/10 text-blue-500",
  meetings: "bg-green-500/10 text-green-500",
  introductions: "bg-purple-500/10 text-purple-500",
  partnerships: "bg-yellow-500/10 text-yellow-500",
  referrals: "bg-pink-500/10 text-pink-500",
};

export function NetworkingGoalsEnhanced({ companyId, organizationId }: NetworkingGoalsProps) {
  const [goals, setGoals] = useState<NetworkingGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingGoal, setEditingGoal] = useState<NetworkingGoal | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    target_count: "5",
    category: "contacts",
    deadline: "",
  });

  useEffect(() => {
    loadGoals();
  }, [companyId, organizationId]);

  const loadGoals = async () => {
    try {
      const data = await networkingService.getGoals(companyId, organizationId);
      setGoals(data);
    } catch (error) {
      console.error("Error loading goals:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      target_count: "5",
      category: "contacts",
      deadline: "",
    });
    setEditingGoal(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({ title: "عنوان هدف الزامی است", variant: "destructive" });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const goalData = {
        user_id: user.id,
        company_id: companyId || null,
        organization_id: organizationId || null,
        title: formData.title,
        description: formData.description || null,
        target_count: parseInt(formData.target_count) || 5,
        current_count: editingGoal?.current_count || 0,
        category: formData.category || null,
        deadline: formData.deadline || null,
        status: "active",
      };

      if (editingGoal) {
        await networkingService.updateGoal(editingGoal.id, goalData);
        toast({ title: "هدف بروزرسانی شد" });
      } else {
        await networkingService.createGoal(goalData);
        toast({ title: "هدف اضافه شد" });
      }

      setShowForm(false);
      resetForm();
      loadGoals();
    } catch (error) {
      console.error("Error saving goal:", error);
      toast({ title: "خطا در ذخیره هدف", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await networkingService.deleteGoal(id);
      setGoals(prev => prev.filter(g => g.id !== id));
      toast({ title: "هدف حذف شد" });
    } catch (error) {
      toast({ title: "خطا در حذف هدف", variant: "destructive" });
    }
  };

  const handleUpdateProgress = async (goal: NetworkingGoal, increment: number) => {
    const newCount = Math.max(0, Math.min(goal.target_count, goal.current_count + increment));
    const wasCompleted = goal.status === "completed";
    const isNowCompleted = newCount >= goal.target_count;

    try {
      await networkingService.updateGoal(goal.id, { 
        current_count: newCount,
        status: isNowCompleted ? "completed" : "active"
      });

      // Trigger confetti on completion
      if (!wasCompleted && isNowCompleted) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#3b82f6', '#f59e0b'],
        });
        toast({ title: "🎉 تبریک! هدف تکمیل شد!" });
      }

      loadGoals();
    } catch (error) {
      toast({ title: "خطا در بروزرسانی", variant: "destructive" });
    }
  };

  const handleUseTemplate = (template: typeof goalTemplates[0]) => {
    setFormData({
      title: template.title,
      description: template.description,
      target_count: template.target_count.toString(),
      category: template.category,
      deadline: "",
    });
    setShowTemplates(false);
    setShowForm(true);
  };

  const getDeadlineStatus = (deadline: string | null | undefined) => {
    if (!deadline) return null;
    const days = differenceInDays(new Date(deadline), new Date());
    if (isPast(new Date(deadline))) {
      return { label: "گذشته", variant: "destructive" as const, icon: AlertTriangle };
    }
    if (days <= 3) {
      return { label: `${days} روز مانده`, variant: "warning" as const, icon: Clock };
    }
    return { label: `${days} روز مانده`, variant: "outline" as const, icon: Clock };
  };

  const filteredGoals = goals.filter(goal => {
    if (filter === "active") return goal.status === "active";
    if (filter === "completed") return goal.status === "completed";
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">اهداف نتورکینگ</h3>
          <Badge variant="secondary">{goals.length}</Badge>
        </div>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={(v: "all" | "active" | "completed") => setFilter(v)}>
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 ml-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه</SelectItem>
              <SelectItem value="active">فعال</SelectItem>
              <SelectItem value="completed">تکمیل شده</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setShowTemplates(true)}>
            <Sparkles className="h-4 w-4 ml-2" />
            قالب‌ها
          </Button>
          <Button onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="h-4 w-4 ml-2" />
            هدف جدید
          </Button>
        </div>
      </div>

      {filteredGoals.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <Target className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">هنوز هدفی تعریف نشده است</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button variant="outline" onClick={() => setShowTemplates(true)}>
              <Sparkles className="h-4 w-4 ml-2" />
              شروع با قالب
            </Button>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 ml-2" />
              هدف سفارشی
            </Button>
          </div>
        </div>
      ) : (
        <AnimatePresence>
          <div className="grid gap-4">
            {filteredGoals.map((goal, index) => {
              const progress = Math.round((goal.current_count / goal.target_count) * 100);
              const isCompleted = goal.status === "completed";
              const deadlineStatus = getDeadlineStatus(goal.deadline);

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`transition-all ${isCompleted ? "border-green-500 bg-green-500/5" : ""}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium">{goal.title}</h4>
                            {isCompleted && (
                              <Badge className="bg-green-500">
                                <PartyPopper className="h-3 w-3 ml-1" />
                                تکمیل شده
                              </Badge>
                            )}
                            {goal.category && (
                              <Badge variant="outline" className={categoryColors[goal.category] || ""}>
                                {categoryLabels[goal.category] || goal.category}
                              </Badge>
                            )}
                          </div>
                          {goal.description && (
                            <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                          )}
                          {deadlineStatus && (
                            <div className="flex items-center gap-1 mt-2">
                              <deadlineStatus.icon className="h-3 w-3" />
                              <span className={`text-xs ${deadlineStatus.variant === 'destructive' ? 'text-destructive' : 'text-muted-foreground'}`}>
                                {deadlineStatus.label}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingGoal(goal);
                              setFormData({
                                title: goal.title,
                                description: goal.description || "",
                                target_count: goal.target_count.toString(),
                                category: goal.category || "contacts",
                                deadline: goal.deadline || "",
                              });
                              setShowForm(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(goal.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm">
                            {goal.current_count} از {goal.target_count}
                          </span>
                          <span className={`text-sm font-medium ${progress >= 100 ? 'text-green-500' : ''}`}>
                            {progress}%
                          </span>
                        </div>
                        <div className="relative">
                          <Progress 
                            value={progress} 
                            className={`h-3 ${isCompleted ? '[&>div]:bg-green-500' : ''}`} 
                          />
                        </div>
                      </div>

                      {!isCompleted && (
                        <div className="mt-3 flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleUpdateProgress(goal, 1)}
                            className="gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            ۱+
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateProgress(goal, -1)}
                            disabled={goal.current_count <= 0}
                          >
                            ۱-
                          </Button>
                          {goal.target_count - goal.current_count <= 3 && goal.target_count - goal.current_count > 0 && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleUpdateProgress(goal, goal.target_count - goal.current_count)}
                            >
                              <Check className="h-3 w-3 ml-1" />
                              تکمیل
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}

      {/* Templates Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              قالب‌های آماده
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            {goalTemplates.map((template, i) => (
              <Card 
                key={i} 
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleUseTemplate(template)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{template.title}</h4>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </div>
                    <Badge variant="outline" className={categoryColors[template.category]}>
                      {categoryLabels[template.category]}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGoal ? "ویرایش هدف" : "افزودن هدف جدید"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>عنوان هدف *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="مثال: ارتباط با ۵ سرمایه‌گذار"
              />
            </div>

            <div className="space-y-2">
              <Label>توضیحات</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="جزئیات بیشتر..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>تعداد هدف</Label>
                <Input
                  type="number"
                  value={formData.target_count}
                  onChange={(e) => setFormData({ ...formData, target_count: e.target.value })}
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label>دسته‌بندی</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contacts">مخاطبین جدید</SelectItem>
                    <SelectItem value="meetings">جلسات</SelectItem>
                    <SelectItem value="introductions">معرفی‌ها</SelectItem>
                    <SelectItem value="partnerships">مشارکت‌ها</SelectItem>
                    <SelectItem value="referrals">ارجاعات</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>مهلت</Label>
              <Input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
                انصراف
              </Button>
              <Button type="submit">
                {editingGoal ? "بروزرسانی" : "افزودن"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
