import { useState, useEffect } from 'react';
import { Phone, Search, Plus, Video, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { companyCallsService, CompanyCall } from '@/services/companyCallsService';
import { CompanyCallForm } from './CompanyCallForm';
import { CompanyCallCard } from './CompanyCallCard';
import { CompanyCallStats } from './CompanyCallStats';

interface CallsSectionProps {
  companyId: string;
}

export const CompanyCallsSection = ({ companyId }: CallsSectionProps) => {
  const [calls, setCalls] = useState<CompanyCall[]>([]);
  const [filteredCalls, setFilteredCalls] = useState<CompanyCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCall, setEditingCall] = useState<CompanyCall | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadCalls();
  }, [companyId]);

  useEffect(() => {
    filterCalls();
  }, [calls, searchQuery, statusFilter, typeFilter]);

  const loadCalls = async () => {
    try {
      setLoading(true);
      const data = await companyCallsService.getCalls(companyId);
      setCalls(data);
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'بارگذاری تماس‌ها با خطا مواجه شد',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterCalls = () => {
    let filtered = calls;

    if (searchQuery) {
      filtered = filtered.filter(call =>
        call.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        call.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        call.summary?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(call => call.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(call => call.call_type === typeFilter);
    }

    setFilteredCalls(filtered);
  };

  const handleOpenDialog = (call?: CompanyCall) => {
    setEditingCall(call || null);
    setIsDialogOpen(true);
  };

  const handleSave = async (callData: Partial<CompanyCall>) => {
    try {
      if (editingCall) {
        await companyCallsService.updateCall(editingCall.id, callData);
        toast({ title: 'تماس با موفقیت بروزرسانی شد' });
      } else {
        await companyCallsService.createCall(companyId, callData);
        toast({ title: 'تماس با موفقیت ثبت شد' });
      }
      setIsDialogOpen(false);
      setEditingCall(null);
      loadCalls();
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'عملیات با خطا مواجه شد',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (callId: string) => {
    if (!confirm('آیا از حذف این تماس اطمینان دارید؟')) return;

    try {
      await companyCallsService.deleteCall(callId);
      toast({ title: 'تماس با موفقیت حذف شد' });
      loadCalls();
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'حذف تماس با خطا مواجه شد',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CompanyCallStats companyId={companyId} />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              تماس‌های کاری
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 ml-2" />
                  تماس جدید
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingCall ? 'ویرایش تماس' : 'ثبت تماس جدید'}
                  </DialogTitle>
                </DialogHeader>
                <CompanyCallForm
                  companyId={companyId}
                  call={editingCall}
                  onSave={handleSave}
                  onCancel={() => setIsDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="جستجو در تماس‌ها..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="نوع تماس" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                <SelectItem value="phone">تلفنی</SelectItem>
                <SelectItem value="video">ویدیویی</SelectItem>
                <SelectItem value="online_meeting">جلسه آنلاین</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                <SelectItem value="scheduled">برنامه‌ریزی شده</SelectItem>
                <SelectItem value="completed">انجام شده</SelectItem>
                <SelectItem value="cancelled">لغو شده</SelectItem>
                <SelectItem value="missed">از دست رفته</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredCalls.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Phone className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>هیچ تماسی یافت نشد</p>
              </div>
            ) : (
              filteredCalls.map((call) => (
                <CompanyCallCard
                  key={call.id}
                  call={call}
                  onEdit={() => handleOpenDialog(call)}
                  onDelete={() => handleDelete(call.id)}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
