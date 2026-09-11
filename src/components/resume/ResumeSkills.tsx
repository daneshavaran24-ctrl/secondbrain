import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MOCK_USER_ID } from '@/config/mockUser';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { getSkills, deleteSkill, type Skill } from '@/services/resumeService';
import { Plus, Zap, Loader2, Trash2, Edit } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { ResumeSkillDialog } from './ResumeSkillDialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const proficiencyLevels = {
  beginner: { label: 'مبتدی', value: 25, color: 'bg-blue-500' },
  intermediate: { label: 'متوسط', value: 50, color: 'bg-green-500' },
  advanced: { label: 'پیشرفته', value: 75, color: 'bg-orange-500' },
  expert: { label: 'متخصص', value: 100, color: 'bg-red-500' }
};

export function ResumeSkills() {
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Skill | null>(null);

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    setLoading(true);
    try {
      const data = await getSkills(MOCK_USER_ID);
      setSkills(data);
    } catch (error: any) {
      console.error('Error loading skills:', error);
      toast.error('خطا در بارگذاری مهارت‌ها');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSkill(id);
      toast.success('مورد با موفقیت حذف شد');
      loadSkills();
    } catch (error: any) {
      console.error('Error deleting skill:', error);
      toast.error('خطا در حذف مورد');
    }
  };

  const handleEdit = (item: Skill) => {
    setEditItem(item);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditItem(null);
    loadSkills();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Group skills by category
  const skillsByCategory = skills.reduce((acc, skill) => {
    const category = skill.category || 'سایر';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">مهارت‌ها</h3>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          افزودن مهارت
        </Button>
      </div>

      {skills.length === 0 ? (
        <EmptyState
          icon={<Zap className="w-12 h-12" />}
          title="هنوز مهارتی ثبت نشده"
          description="برای شروع، مهارت‌های خود را اضافه کنید"
          action={{
            label: 'افزودن مهارت',
            onClick: () => setDialogOpen(true),
            icon: <Plus className="w-4 h-4" />
          }}
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
            <div key={category}>
              <h4 className="text-md font-semibold mb-3">{category}</h4>
              <div className="grid gap-4 md:grid-cols-2">
                {categorySkills.map((skill) => {
                  const level = proficiencyLevels[skill.proficiency_level || 'intermediate'];
                  return (
                    <Card key={skill.id} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h5 className="font-medium">{skill.skill_name}</h5>
                          {skill.years_of_experience && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {skill.years_of_experience} سال تجربه
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(skill)}>
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              if (confirm('آیا از حذف این مورد مطمئن هستید؟')) {
                                handleDelete(skill.id!);
                              }
                            }}
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">سطح:</span>
                          <Badge variant="secondary">{level.label}</Badge>
                        </div>
                        <Progress value={level.value} className="h-2" />
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <ResumeSkillDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        editItem={editItem}
      />
    </div>
  );
}