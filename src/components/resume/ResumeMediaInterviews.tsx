import { useState, useEffect } from 'react';
import { Plus, Loader2, Mic } from 'lucide-react';
import { MOCK_USER_ID } from '@/config/mockUser';
import { Button } from '@/components/ui/button';
import { ResumeMediaInterviewDialog } from './ResumeMediaInterviewDialog';
import { ResumeMediaInterviewCard } from './ResumeMediaInterviewCard';
import { getMediaInterviews, deleteMediaInterview, MediaInterview } from '@/services/resumeService';
import { toast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/ui/empty-state';

export function ResumeMediaInterviews() {
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState<MediaInterview[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<MediaInterview | undefined>();

  useEffect(() => {
    loadInterviews();
  }, []);

  const loadInterviews = async () => {
    setLoading(true);
    try {
      const data = await getMediaInterviews(MOCK_USER_ID);
      setInterviews(data);
    } catch (error) {
      console.error('Error loading interviews:', error);
      toast({
        title: 'خطا در بارگذاری مصاحبه‌ها',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این مصاحبه مطمئن هستید؟')) return;

    try {
      await deleteMediaInterview(id);
      toast({ title: 'مصاحبه با موفقیت حذف شد' });
      loadInterviews();
    } catch (error) {
      console.error('Error deleting interview:', error);
      toast({
        title: 'خطا در حذف مصاحبه',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (interview: MediaInterview) => {
    setEditItem(interview);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditItem(undefined);
    loadInterviews();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">مصاحبه‌ها و رسانه</h2>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          افزودن مصاحبه
        </Button>
      </div>

      {interviews.length === 0 ? (
        <EmptyState
          icon={<Mic className="w-12 h-12" />}
          title="هنوز مصاحبه‌ای ثبت نکرده‌اید"
          description="مصاحبه‌های رسانه‌ای خود را اضافه کنید"
          action={{
            label: 'افزودن مصاحبه',
            onClick: () => setDialogOpen(true),
            icon: <Plus className="w-4 h-4" />,
          }}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {interviews.map((interview) => (
            <ResumeMediaInterviewCard
              key={interview.id}
              interview={interview}
              onEdit={() => handleEdit(interview)}
              onDelete={() => interview.id && handleDelete(interview.id)}
            />
          ))}
        </div>
      )}

      <ResumeMediaInterviewDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        interview={editItem}
      />
    </div>
  );
}