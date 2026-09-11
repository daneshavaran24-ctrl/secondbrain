import { useState, useEffect } from 'react';
import { Plus, Loader2, Trophy } from 'lucide-react';
import { MOCK_USER_ID } from '@/config/mockUser';
import { Button } from '@/components/ui/button';
import { ResumeAwardDialog } from './ResumeAwardDialog';
import { ResumeAwardCard } from './ResumeAwardCard';
import { getAwards, deleteAward, Award } from '@/services/resumeService';
import { toast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/ui/empty-state';

export function ResumeAwards() {
  const [loading, setLoading] = useState(true);
  const [awards, setAwards] = useState<Award[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Award | undefined>();

  useEffect(() => {
    loadAwards();
  }, []);

  const loadAwards = async () => {
    setLoading(true);
    try {
      const data = await getAwards(MOCK_USER_ID);
      setAwards(data);
    } catch (error) {
      console.error('Error loading awards:', error);
      toast({
        title: 'خطا در بارگذاری افتخارات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این افتخار مطمئن هستید؟')) return;

    try {
      await deleteAward(id);
      toast({ title: 'افتخار با موفقیت حذف شد' });
      loadAwards();
    } catch (error) {
      console.error('Error deleting award:', error);
      toast({
        title: 'خطا در حذف افتخار',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (award: Award) => {
    setEditItem(award);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditItem(undefined);
    loadAwards();
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
        <h2 className="text-2xl font-bold">افتخارات و جوایز</h2>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          افزودن افتخار
        </Button>
      </div>

      {awards.length === 0 ? (
        <EmptyState
          icon={<Trophy className="w-12 h-12" />}
          title="هنوز افتخاری ثبت نکرده‌اید"
          description="افتخارات و جوایز خود را اضافه کنید"
          action={{
            label: 'افزودن افتخار',
            onClick: () => setDialogOpen(true),
            icon: <Plus className="w-4 h-4" />,
          }}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {awards.map((award) => (
            <ResumeAwardCard
              key={award.id}
              award={award}
              onEdit={() => handleEdit(award)}
              onDelete={() => award.id && handleDelete(award.id)}
            />
          ))}
        </div>
      )}

      <ResumeAwardDialog open={dialogOpen} onClose={handleDialogClose} award={editItem} />
    </div>
  );
}