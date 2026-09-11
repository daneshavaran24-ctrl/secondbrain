import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MOCK_USER_ID } from '@/config/mockUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { getEducation, deleteEducation, type Education } from '@/services/resumeService';
import { Plus, GraduationCap, Loader2, Trash2, Edit } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { ResumeEducationDialog } from './ResumeEducationDialog';

export function ResumeEducation() {
  const [loading, setLoading] = useState(false);
  const [education, setEducation] = useState<Education[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Education | null>(null);

  useEffect(() => {
    loadEducation();
  }, []);

  const loadEducation = async () => {
    setLoading(true);
    try {
      const data = await getEducation(MOCK_USER_ID);
      setEducation(data);
    } catch (error: any) {
      console.error('Error loading education:', error);
      toast.error('خطا در بارگذاری سوابق تحصیلی');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEducation(id);
      toast.success('مورد با موفقیت حذف شد');
      loadEducation();
    } catch (error: any) {
      console.error('Error deleting education:', error);
      toast.error('خطا در حذف مورد');
    }
  };

  const handleEdit = (item: Education) => {
    setEditItem(item);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditItem(null);
    loadEducation();
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
        <h3 className="text-lg font-semibold">سوابق تحصیلی</h3>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          افزودن مدرک تحصیلی
        </Button>
      </div>

      {education.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="w-12 h-12" />}
          title="هنوز مدرک تحصیلی ثبت نشده"
          description="برای شروع، مدارک تحصیلی خود را اضافه کنید"
          action={{
            label: 'افزودن مدرک',
            onClick: () => setDialogOpen(true),
            icon: <Plus className="w-4 h-4" />
          }}
        />
      ) : (
        <div className="space-y-4">
          {education.map((item) => (
            <Card key={item.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{item.degree}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{item.university}</p>
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
                <div className="space-y-2 text-sm">
                  {item.field_of_study && (
                    <p><span className="text-muted-foreground">رشته:</span> {item.field_of_study}</p>
                  )}
                  {(item.start_year || item.end_year) && (
                    <p>
                      <span className="text-muted-foreground">سال:</span>{' '}
                      {item.start_year} - {item.end_year || 'در حال تحصیل'}
                    </p>
                  )}
                  {item.description && (
                    <p className="text-muted-foreground mt-2">{item.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ResumeEducationDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        editItem={editItem}
      />
    </div>
  );
}