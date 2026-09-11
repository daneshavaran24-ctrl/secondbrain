import React, { useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { LegalCase } from '@/services/legalService';

interface NewDeadlineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeadlineSet: (caseId: string, deadline: string, notes?: string) => void;
  availableCases: Array<{ id: string; title: string; }>;
  preSelectedCaseId?: string | null;
}

export function NewDeadlineDialog({ 
  open, 
  onOpenChange, 
  onDeadlineSet,
  availableCases,
  preSelectedCaseId
}: NewDeadlineDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    caseId: '',
    deadlineDate: '',
    deadlineTime: '',
    notes: '',
    reminderDays: '7'
  });

  // Pre-select case if provided
  React.useEffect(() => {
    if (preSelectedCaseId) {
      setFormData(prev => ({ ...prev, caseId: preSelectedCaseId }));
    }
  }, [preSelectedCaseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.caseId || !formData.deadlineDate) {
      toast({
        title: "خطا",
        description: "لطفاً پرونده و تاریخ مهلت را انتخاب کنید",
        variant: "destructive",
      });
      return;
    }

    try {
      // Combine date and time if time is provided
      let deadlineDateTime = formData.deadlineDate;
      if (formData.deadlineTime) {
        deadlineDateTime += `T${formData.deadlineTime}:00`;
      }

      onDeadlineSet(formData.caseId, deadlineDateTime, formData.notes);
      
      toast({
        title: "موفقیت",
        description: "مهلت با موفقیت تنظیم شد",
      });

      // Reset form
      setFormData({
        caseId: '',
        deadlineDate: '',
        deadlineTime: '',
        notes: '',
        reminderDays: '7'
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در تنظیم مهلت",
        variant: "destructive",
      });
    }
  };

  const selectedCase = availableCases.find(c => c.id === formData.caseId);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="تنظیم مهلت جدید"
      description="مهلت جلسه یا رویداد حقوقی را تنظیم کنید"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="case-select">پرونده مرتبط *</Label>
          <Select
            value={formData.caseId}
            onValueChange={(value) => setFormData(prev => ({ ...prev, caseId: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="پرونده را انتخاب کنید" />
            </SelectTrigger>
            <SelectContent>
              {availableCases.map((case_) => (
                <SelectItem key={case_.id} value={case_.id}>
                  {case_.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedCase && (
            <p className="text-sm text-muted-foreground mt-1">
              پرونده انتخاب شده: {selectedCase.title}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="deadline-date">تاریخ مهلت *</Label>
            <Input
              id="deadline-date"
              type="date"
              value={formData.deadlineDate}
              onChange={(e) => setFormData(prev => ({ ...prev, deadlineDate: e.target.value }))}
            />
          </div>
          
          <div>
            <Label htmlFor="deadline-time">ساعت (اختیاری)</Label>
            <Input
              id="deadline-time"
              type="time"
              value={formData.deadlineTime}
              onChange={(e) => setFormData(prev => ({ ...prev, deadlineTime: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="reminder-days">یادآوری قبل از مهلت</Label>
          <Select
            value={formData.reminderDays}
            onValueChange={(value) => setFormData(prev => ({ ...prev, reminderDays: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">۱ روز قبل</SelectItem>
              <SelectItem value="3">۳ روز قبل</SelectItem>
              <SelectItem value="7">۱ هفته قبل</SelectItem>
              <SelectItem value="14">۲ هفته قبل</SelectItem>
              <SelectItem value="30">۱ ماه قبل</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="notes">یادداشت (اختیاری)</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="توضیحات اضافی در مورد این مهلت..."
            rows={3}
          />
        </div>

        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              یادآوری {formData.reminderDays} روز قبل از مهلت ارسال خواهد شد
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button type="submit">
            <Calendar className="h-4 w-4 mr-2" />
            تنظیم مهلت
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}