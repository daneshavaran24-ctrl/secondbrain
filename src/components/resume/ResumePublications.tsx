import { useState, useEffect } from 'react';
import { Plus, Loader2, BookOpen } from 'lucide-react';
import { MOCK_USER_ID } from '@/config/mockUser';
import { Button } from '@/components/ui/button';
import { ResumePublicationDialog } from './ResumePublicationDialog';
import { ResumePublicationCard } from './ResumePublicationCard';
import { getPublications, deletePublication, Publication } from '@/services/resumeService';
import { toast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/ui/empty-state';

export function ResumePublications() {
  const [loading, setLoading] = useState(true);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Publication | undefined>();

  useEffect(() => {
    loadPublications();
  }, []);

  const loadPublications = async () => {
    setLoading(true);
    try {
      const data = await getPublications(MOCK_USER_ID);
      setPublications(data);
    } catch (error) {
      console.error('Error loading publications:', error);
      toast({
        title: 'خطا در بارگذاری تالیفات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این تالیف مطمئن هستید؟')) return;

    try {
      await deletePublication(id);
      toast({ title: 'تالیف با موفقیت حذف شد' });
      loadPublications();
    } catch (error) {
      console.error('Error deleting publication:', error);
      toast({
        title: 'خطا در حذف تالیف',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (publication: Publication) => {
    setEditItem(publication);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditItem(undefined);
    loadPublications();
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
        <h2 className="text-2xl font-bold">تالیفات و انتشارات</h2>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          افزودن تالیف
        </Button>
      </div>

      {publications.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-12 h-12" />}
          title="هنوز تالیفی ثبت نکرده‌اید"
          description="کتاب‌ها و مقالات خود را اضافه کنید"
          action={{
            label: 'افزودن تالیف',
            onClick: () => setDialogOpen(true),
            icon: <Plus className="w-4 h-4" />,
          }}
        />
      ) : (
        <div className="space-y-4">
          {publications.map((publication) => (
            <ResumePublicationCard
              key={publication.id}
              publication={publication}
              onEdit={() => handleEdit(publication)}
              onDelete={() => publication.id && handleDelete(publication.id)}
            />
          ))}
        </div>
      )}

      <ResumePublicationDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        publication={editItem}
      />
    </div>
  );
}