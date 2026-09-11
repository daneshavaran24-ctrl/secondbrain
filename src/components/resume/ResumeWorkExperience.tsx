import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MOCK_USER_ID } from '@/config/mockUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { getWorkExperience, deleteWorkExperience, type WorkExperience } from '@/services/resumeService';
import { Plus, Briefcase, Loader2, Trash2, Edit, ExternalLink } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { ResumeWorkExperienceDialog } from './ResumeWorkExperienceDialog';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export function ResumeWorkExperience() {
  const [loading, setLoading] = useState(false);
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<WorkExperience | null>(null);

  useEffect(() => {
    loadWorkExperience();
  }, []);

  const loadWorkExperience = async () => {
    setLoading(true);
    try {
      const data = await getWorkExperience(MOCK_USER_ID);
      setWorkExperience(data);
    } catch (error: any) {
      console.error('Error loading work experience:', error);
      toast.error('خطا در بارگذاری سوابق کاری');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWorkExperience(id);
      toast.success('مورد با موفقیت حذف شد');
      loadWorkExperience();
    } catch (error: any) {
      console.error('Error deleting work experience:', error);
      toast.error('خطا در حذف مورد');
    }
  };

  const handleEdit = (item: WorkExperience) => {
    setEditItem(item);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditItem(null);
    loadWorkExperience();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">سوابق کاری</h3>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          افزودن سابقه کاری
        </Button>
      </div>

      {workExperience.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="w-12 h-12" />}
          title="هنوز سابقه کاری ثبت نشده"
          description="برای شروع، سوابق کاری خود را اضافه کنید"
          action={{
            label: 'افزودن سابقه',
            onClick: () => setDialogOpen(true),
            icon: <Plus className="w-4 h-4" />
          }}
        />
      ) : (
        <div className="space-y-4">
          {workExperience.map((item) => (
            <Card key={item.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{item.job_title}</CardTitle>
                      {!item.end_date && (
                        <Badge variant="secondary">در حال حاضر</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-muted-foreground">{item.company_name}</p>
                      {item.company_website && (
                        <a 
                          href={item.company_website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(item.start_date), 'yyyy/MM')} -{' '}
                      {item.end_date ? format(new Date(item.end_date), 'yyyy/MM') : 'اکنون'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        if (confirm('آیا از حذف این مورد مطمئن هستید؟')) {
                          handleDelete(item.id!);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {item.description && (
                    <p className="text-muted-foreground">{item.description}</p>
                  )}
                  
                  {item.responsibilities && item.responsibilities.length > 0 && (
                    <div>
                      <p className="font-medium mb-1">مسئولیت‌ها:</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {item.responsibilities.map((resp, idx) => (
                          <li key={idx}>{resp}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {item.achievements && item.achievements.length > 0 && (
                    <div>
                      <p className="font-medium mb-1">دستاوردها:</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {item.achievements.map((ach, idx) => (
                          <li key={idx}>{ach}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ResumeWorkExperienceDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        editItem={editItem}
      />
    </div>
  );
}