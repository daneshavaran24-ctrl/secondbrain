import React, { useState } from 'react';
import { PersonalTask } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PersianDatePicker } from '@/components/ui/persian-date-picker';
import { AppIcon } from '@/components/ui/app-icon';
import { Plus, Zap } from 'lucide-react';

interface QuickTaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: Omit<PersonalTask, 'id' | 'created_at' | 'updated_at' | 'progress'>) => void;
  domain?: 'personal' | 'professional' | 'organizational';
}

export function QuickTaskForm({ open, onOpenChange, onSubmit, domain = 'personal' }: QuickTaskFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    priority: 'medium' as PersonalTask['priority'],
    due_date: '',
    mainCategory: 'personal_life' as PersonalTask['mainCategory'],
    subCategory: 'personal' as PersonalTask['subCategory'],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      return;
    }

    const taskData = {
      title: formData.title.trim(),
      description: '',
      priority: formData.priority,
      status: 'todo' as PersonalTask['status'],
      mainCategory: formData.mainCategory,
      subCategory: formData.subCategory,
      due_date: formData.due_date || undefined,
      tags: [],
    };

    onSubmit(taskData);
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      priority: 'medium',
      due_date: '',
      mainCategory: 'personal_life',
      subCategory: 'personal',
    });
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AppIcon size="sm">
              <Plus />
            </AppIcon>
            وظیفه جدید
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              عنوان وظیفه *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="عنوان وظیفه را وارد کنید"
              required
              autoFocus
            />
          </div>

          {/* Priority and Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">اولویت</Label>
              <Select value={formData.priority} onValueChange={(value) => handleChange('priority', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">🔴 بالا</SelectItem>
                  <SelectItem value="medium">🟡 متوسط</SelectItem>
                  <SelectItem value="low">🟢 پایین</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">سررسید</Label>
              <PersianDatePicker
                value={formData.due_date ? new Date(formData.due_date) : null}
                onChange={(date) => {
                  const gregorianDate = date ? date.toISOString().split('T')[0] : '';
                  handleChange('due_date', gregorianDate);
                }}
                placeholder="انتخاب تاریخ"
              />
            </div>
          </div>

          {/* Category (only for personal domain) */}
          {domain === 'personal' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">دسته اصلی</Label>
                <Select value={formData.mainCategory} onValueChange={(value) => {
                  handleChange('mainCategory', value);
                  const defaultSubCategory = value === 'personal_development' ? 'spiritual_development' : 'personal';
                  handleChange('subCategory', defaultSubCategory);
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal_life">زندگی شخصی</SelectItem>
                    <SelectItem value="personal_development">رشد فردی</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">زیردسته</Label>
                <Select value={formData.subCategory} onValueChange={(value) => handleChange('subCategory', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.mainCategory === 'personal_life' ? (
                      <>
                        <SelectItem value="personal">شخصی</SelectItem>
                        <SelectItem value="family">خانواده</SelectItem>
                        <SelectItem value="health">سلامت</SelectItem>
                        <SelectItem value="work">کار</SelectItem>
                        <SelectItem value="learning">یادگیری</SelectItem>
                        <SelectItem value="finance">مالی</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="spiritual_development">رشد معنوی</SelectItem>
                        <SelectItem value="educational_development">رشد آموزشی</SelectItem>
                        <SelectItem value="moral_development">رشد اخلاقی</SelectItem>
                        <SelectItem value="social_development">رشد اجتماعی</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">
              <AppIcon size="xs">
                <Zap />
              </AppIcon>
              ایجاد
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              انصراف
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}