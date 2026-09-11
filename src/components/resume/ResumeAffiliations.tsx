import { useState, useEffect } from 'react';
import { Plus, Loader2, Users } from 'lucide-react';
import { MOCK_USER_ID } from '@/config/mockUser';
import { Button } from '@/components/ui/button';
import { ResumeAffiliationDialog } from './ResumeAffiliationDialog';
import { ResumeAffiliationCard } from './ResumeAffiliationCard';
import { getAffiliations, deleteAffiliation, Affiliation } from '@/services/resumeService';
import { toast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/ui/empty-state';

export function ResumeAffiliations() {
  const [loading, setLoading] = useState(true);
  const [affiliations, setAffiliations] = useState<Affiliation[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Affiliation | undefined>();

  useEffect(() => {
    loadAffiliations();
  }, []);

  const loadAffiliations = async () => {
    setLoading(true);
    try {
      const data = await getAffiliations(MOCK_USER_ID);
      setAffiliations(data);
    } catch (error) {
      console.error('Error loading affiliations:', error);
      toast({
        title: 'خطا در بارگذاری عضویت‌ها',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این عضویت مطمئن هستید؟')) return;

    try {
      await deleteAffiliation(id);
      toast({ title: 'عضویت با موفقیت حذف شد' });
      loadAffiliations();
    } catch (error) {
      console.error('Error deleting affiliation:', error);
      toast({
        title: 'خطا در حذف عضویت',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (affiliation: Affiliation) => {
    setEditItem(affiliation);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditItem(undefined);
    loadAffiliations();
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
        <h2 className="text-2xl font-bold">عضویت‌ها و فعالیت‌های اجتماعی</h2>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          افزودن عضویت
        </Button>
      </div>

      {affiliations.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title="هنوز عضویتی ثبت نکرده‌اید"
          description="عضویت‌ها و فعالیت‌های اجتماعی خود را اضافه کنید"
          action={{
            label: 'افزودن عضویت',
            onClick: () => setDialogOpen(true),
            icon: <Plus className="w-4 h-4" />,
          }}
        />
      ) : (
        <div className="space-y-4">
          {affiliations.map((affiliation) => (
            <ResumeAffiliationCard
              key={affiliation.id}
              affiliation={affiliation}
              onEdit={() => handleEdit(affiliation)}
              onDelete={() => affiliation.id && handleDelete(affiliation.id)}
            />
          ))}
        </div>
      )}

      <ResumeAffiliationDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        affiliation={editItem}
      />
    </div>
  );
}