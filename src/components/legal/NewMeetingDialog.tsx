import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LawyerMeeting {
  id: string;
  caseId: string;
  lawyer: string;
  date: string;
  duration: number;
  summary: string;
  recommendations: string[];
  cost: number;
  nextActions: string[];
}

interface NewMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMeetingCreated: (meeting: LawyerMeeting) => void;
  availableCases: Array<{ id: string; title: string; lawyer: string; }>;
  preSelectedCaseId?: string | null;
}

export const NewMeetingDialog: React.FC<NewMeetingDialogProps> = ({
  open,
  onOpenChange,
  onMeetingCreated,
  availableCases,
  preSelectedCaseId
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    caseId: '',
    lawyer: '',
    date: '',
    duration: '',
    summary: '',
    recommendations: '',
    cost: '',
    nextActions: ''
  });

  // Pre-select case if provided
  React.useEffect(() => {
    if (preSelectedCaseId && availableCases.length > 0) {
      const selectedCase = availableCases.find(c => c.id === preSelectedCaseId);
      if (selectedCase) {
        setFormData(prev => ({
          ...prev,
          caseId: preSelectedCaseId,
          lawyer: selectedCase.lawyer
        }));
      }
    }
  }, [preSelectedCaseId, availableCases]);

  const handleCaseChange = (caseId: string) => {
    const selectedCase = availableCases.find(c => c.id === caseId);
    setFormData(prev => ({
      ...prev,
      caseId,
      lawyer: selectedCase?.lawyer || ''
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.caseId || !formData.lawyer || !formData.date || !formData.summary) {
      toast({
        title: "خطا",
        description: "لطفاً فیلدهای الزامی را پر کنید",
        variant: "destructive",
      });
      return;
    }

    const newMeeting: LawyerMeeting = {
      id: Date.now().toString(),
      caseId: formData.caseId,
      lawyer: formData.lawyer,
      date: formData.date,
      duration: parseInt(formData.duration) || 60,
      summary: formData.summary,
      recommendations: formData.recommendations.split('\n').filter(r => r.trim()),
      cost: parseInt(formData.cost) || 0,
      nextActions: formData.nextActions.split('\n').filter(a => a.trim())
    };

    onMeetingCreated(newMeeting);
    
    // Reset form
    setFormData({
      caseId: '',
      lawyer: '',
      date: '',
      duration: '',
      summary: '',
      recommendations: '',
      cost: '',
      nextActions: ''
    });
    
    onOpenChange(false);
    
    toast({
      title: "موفقیت",
      description: "جلسه با موفقیت ایجاد شد",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            جلسه جدید با وکیل
          </DialogTitle>
          <DialogDescription>
            اطلاعات جلسه جدید با وکیل را وارد کنید
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="caseId">پرونده مرتبط *</Label>
            <Select value={formData.caseId} onValueChange={handleCaseChange}>
              <SelectTrigger>
                <SelectValue placeholder="انتخاب پرونده" />
              </SelectTrigger>
              <SelectContent>
                {availableCases.map((case_) => (
                  <SelectItem key={case_.id} value={case_.id}>
                    {case_.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lawyer">وکیل *</Label>
              <Input
                id="lawyer"
                value={formData.lawyer}
                onChange={(e) => setFormData(prev => ({ ...prev, lawyer: e.target.value }))}
                placeholder="نام وکیل"
                readOnly={!!formData.caseId}
              />
            </div>
            <div>
              <Label htmlFor="date">تاریخ جلسه *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                مدت جلسه (دقیقه)
              </Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                placeholder="60"
              />
            </div>
            <div>
              <Label htmlFor="cost" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                هزینه (تومان)
              </Label>
              <Input
                id="cost"
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="summary">خلاصه جلسه *</Label>
            <Textarea
              id="summary"
              value={formData.summary}
              onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
              placeholder="خلاصه‌ای از مباحث جلسه..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="recommendations">توصیه‌ها</Label>
            <Textarea
              id="recommendations"
              value={formData.recommendations}
              onChange={(e) => setFormData(prev => ({ ...prev, recommendations: e.target.value }))}
              placeholder="هر توصیه را در یک خط جداگانه بنویسید"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="nextActions">اقدامات بعدی</Label>
            <Textarea
              id="nextActions"
              value={formData.nextActions}
              onChange={(e) => setFormData(prev => ({ ...prev, nextActions: e.target.value }))}
              placeholder="هر اقدام را در یک خط جداگانه بنویسید"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              انصراف
            </Button>
            <Button type="submit">
              ایجاد جلسه
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};