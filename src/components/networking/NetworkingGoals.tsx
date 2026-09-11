import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Target, Trash2, Edit, Check } from "lucide-react";
import { networkingService, NetworkingGoal } from "@/services/networkingService";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { faIR } from "date-fns/locale";

interface NetworkingGoalsProps {
  companyId?: string;
  organizationId?: string;
}

export function NetworkingGoals({ companyId, organizationId }: NetworkingGoalsProps) {
  const [goals, setGoals] = useState<NetworkingGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<NetworkingGoal | null>(null);
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
    try {
      await networkingService.updateGoal(goal.id, { 
        current_count: newCount,
        status: newCount >= goal.target_count ? "completed" : "active"
      });
      loadGoals();
    } catch (error) {
      toast({ title: "خطا در بروزرسانی", variant: "destructive" });
    }
  };

  const categoryLabels: Record<string, string> = {
    contacts: "مخاطبین جدید",
    meetings: "جلسات",
    introductions: "معرفی‌ها",
    partnerships: "مشارکت‌ها",
    referrals: "ارجاعات",
  };

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
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">اهداف نتورکینگ</h3>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="h-4 w-4 ml-2" />
          هدف جدید
        </Button>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-12">
          <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">هنوز هدفی تعریف نشده است</p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 ml-2" />
            اضافه کردن اولین هدف
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {goals.map(goal => {
            const progress = Math.round((goal.current_count / goal.target_count) * 100);
            const isCompleted = goal.status === "completed";

            return (
              <Card key={goal.id} className={isCompleted ? "border-green-500" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{goal.title}</h4>
                        {isCompleted && (
                          <Check className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      {goal.description && (
                        <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        {goal.category && (
                          <span>{categoryLabels[goal.category] || goal.category}</span>
                        )}
                        {goal.deadline && (
                          <span>مهلت: {format(new Date(goal.deadline), "PPP", { locale: faIR })}</span>
                        )}
                      </div>
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
                      <span className="text-sm font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {!isCompleted && (
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateProgress(goal, 1)}
                      >
                        +۱
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateProgress(goal, -1)}
                        disabled={goal.current_count <= 0}
                      >
                        -۱
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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
