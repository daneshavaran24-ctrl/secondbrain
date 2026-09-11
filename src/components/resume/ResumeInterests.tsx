import { useState, useEffect } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { MOCK_USER_ID } from '@/config/mockUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getInterests, createInterest, deleteInterest, Interest } from '@/services/resumeService';
import { toast } from '@/hooks/use-toast';

export function ResumeInterests() {
  const [loading, setLoading] = useState(true);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newInterest, setNewInterest] = useState({ interest_name: '', category: '' });

  useEffect(() => {
    loadInterests();
  }, []);

  const loadInterests = async () => {
    setLoading(true);
    try {
      const data = await getInterests(MOCK_USER_ID);
      setInterests(data);
    } catch (error) {
      console.error('Error loading interests:', error);
      toast({
        title: 'خطا در بارگذاری علایق',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInterest.interest_name.trim()) return;

    try {
      await createInterest({
        user_id: MOCK_USER_ID,
        interest_name: newInterest.interest_name.trim(),
        category: newInterest.category.trim() || undefined,
      });
      toast({ title: 'علاقه با موفقیت افزوده شد' });
      setNewInterest({ interest_name: '', category: '' });
      setDialogOpen(false);
      loadInterests();
    } catch (error) {
      console.error('Error adding interest:', error);
      toast({
        title: 'خطا در افزودن علاقه',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteInterest(id);
      toast({ title: 'علاقه حذف شد' });
      loadInterests();
    } catch (error) {
      console.error('Error deleting interest:', error);
      toast({
        title: 'خطا در حذف علاقه',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Group interests by category
  const groupedInterests = interests.reduce((acc, interest) => {
    const category = interest.category || 'سایر';
    if (!acc[category]) acc[category] = [];
    acc[category].push(interest);
    return acc;
  }, {} as Record<string, Interest[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">علایق و تفریحات</h2>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          افزودن علاقه
        </Button>
      </div>

      {interests.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>هنوز علاقه‌ای ثبت نکرده‌اید</p>
          <Button variant="link" onClick={() => setDialogOpen(true)}>
            اولین علاقه خود را اضافه کنید
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedInterests).map(([category, categoryInterests]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold mb-3">{category}</h3>
              <div className="flex flex-wrap gap-2">
                {categoryInterests.map((interest) => (
                  <Badge
                    key={interest.id}
                    variant="secondary"
                    className="text-base py-2 px-4 hover:bg-secondary/80 cursor-pointer"
                  >
                    {interest.interest_name}
                    <X
                      className="w-4 h-4 mr-2 hover:text-destructive"
                      onClick={() => interest.id && handleDelete(interest.id)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>افزودن علاقه جدید</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <Label>نام علاقه *</Label>
              <Input
                value={newInterest.interest_name}
                onChange={(e) => setNewInterest({ ...newInterest, interest_name: e.target.value })}
                required
                placeholder="مثلاً: شطرنج، نقاشی، مطالعه..."
              />
            </div>
            <div>
              <Label>دسته‌بندی</Label>
              <Input
                value={newInterest.category}
                onChange={(e) => setNewInterest({ ...newInterest, category: e.target.value })}
                placeholder="مثلاً: ورزشی، هنری، علمی..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                انصراف
              </Button>
              <Button type="submit">افزودن</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
