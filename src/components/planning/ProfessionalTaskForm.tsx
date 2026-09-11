import React, { useState, useEffect } from 'react';
import { PersonalTask } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Zap } from 'lucide-react';
import { PersianDatePicker } from '@/components/ui/persian-date-picker';
import { categoryService } from '@/services/categoryService';

interface ProfessionalTaskFormProps {
  task?: PersonalTask | null;
  onSubmit: (task: Omit<PersonalTask, 'id' | 'created_at' | 'updated_at' | 'progress'>) => void;
  onCancel: () => void;
}

const ProfessionalTaskForm: React.FC<ProfessionalTaskFormProps> = ({ task, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as PersonalTask['priority'],
    status: 'todo' as PersonalTask['status'],
    customCategory: '',
    due_date: '',
    estimated_hours: '',
    notes: '',
    tags: [] as string[],
    story_points: undefined as number | undefined,
  });
  const [newTag, setNewTag] = useState('');
  const [categorySuggestions, setCategorySuggestions] = useState<string[]>([]);

  useEffect(() => {
    // Initialize default categories
    categoryService.initializeDefaultCategories('professional');
    setCategorySuggestions(categoryService.getCustomCategories('professional'));

    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        status: task.status,
        customCategory: task.customCategory || '',
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        estimated_hours: task.estimated_hours?.toString() || '',
        notes: task.notes || '',
        tags: task.tags || [],
        story_points: task.story_points,
      });
    }
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('لطفاً عنوان وظیفه را وارد کنید');
      return;
    }

    // Save custom category if it's new
    if (formData.customCategory.trim()) {
      categoryService.addCustomCategory('professional', formData.customCategory.trim());
    }

    const taskData = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      priority: formData.priority,
      status: formData.status,
      customCategory: formData.customCategory.trim() || undefined,
      due_date: formData.due_date || undefined,
      estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours) : undefined,
      notes: formData.notes.trim() || undefined,
      tags: formData.tags,
      story_points: formData.story_points,
      // Compatibility fields for existing systems
      mainCategory: 'personal_life' as const,
      subCategory: 'work' as const,
    };

    onSubmit(taskData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({ ...prev, customCategory: value }));
    
    // Update suggestions based on input
    if (value) {
      const suggestions = categoryService.getSuggestedCategories('professional', value);
      setCategorySuggestions(suggestions);
    } else {
      setCategorySuggestions(categoryService.getCustomCategories('professional'));
    }
  };

  const addTag = () => {
    const tag = newTag.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-app-title">
              {task ? 'ویرایش وظیفه حرفه‌ای' : 'وظیفه حرفه‌ای جدید'}
            </h2>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-app-readable font-medium text-lg">
                عنوان وظیفه *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="عنوان وظیفه حرفه‌ای را وارد کنید"
                required
                className="text-lg p-3"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-app-readable font-medium text-lg">
                توضیحات
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="توضیحات تکمیلی درباره وظیفه حرفه‌ای"
                rows={4}
                className="text-lg p-3"
              />
            </div>

            {/* Priority, Status, Category */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-app-readable font-medium text-lg">اولویت</Label>
                <Select value={formData.priority} onValueChange={(value) => handleChange('priority', value)}>
                  <SelectTrigger className="text-lg p-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">بالا</SelectItem>
                    <SelectItem value="medium">متوسط</SelectItem>
                    <SelectItem value="low">پایین</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-app-readable font-medium text-lg">وضعیت</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                  <SelectTrigger className="text-lg p-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">انتظار</SelectItem>
                    <SelectItem value="in_progress">در حال انجام</SelectItem>
                    <SelectItem value="completed">تکمیل شده</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-app-readable font-medium text-lg">دسته‌بندی حرفه‌ای</Label>
                <div className="relative">
                  <Input
                    value={formData.customCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    placeholder="دسته‌بندی خود را تایپ کنید"
                    className="text-lg p-3"
                    list="category-suggestions"
                  />
                  <datalist id="category-suggestions">
                    {categorySuggestions.map((suggestion) => (
                      <option key={suggestion} value={suggestion} />
                    ))}
                  </datalist>
                </div>
                {categorySuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {categorySuggestions.slice(0, 5).map((suggestion) => (
                      <Badge
                        key={suggestion}
                        variant="outline"
                        className="cursor-pointer hover:bg-blue-50 text-sm"
                        onClick={() => handleCategoryChange(suggestion)}
                      >
                        {suggestion}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Due Date, Estimated Hours, and Story Points */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="due_date" className="text-app-readable font-medium text-lg">
                  تاریخ سررسید
                </Label>
                <PersianDatePicker
                  value={formData.due_date ? new Date(formData.due_date) : null}
                  onChange={(date) => {
                    const gregorianDate = date ? date.toISOString().split('T')[0] : '';
                    handleChange('due_date', gregorianDate);
                  }}
                  placeholder="تاریخ سررسید را انتخاب کنید"
                  className="text-lg p-3"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimated_hours" className="text-app-readable font-medium text-lg">
                  ساعت تخمینی
                </Label>
                <Input
                  id="estimated_hours"
                  type="number"
                  min="0"
                  value={formData.estimated_hours}
                  onChange={(e) => handleChange('estimated_hours', e.target.value)}
                  placeholder="ساعت مورد نیاز"
                  className="text-lg p-3"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="story_points" className="text-app-readable font-medium text-lg flex items-center gap-2">
                  <Zap className="h-4 w-4 text-tech-cyan" />
                  امتیاز داستان
                </Label>
                <Select value={formData.story_points?.toString() || undefined} onValueChange={(value) => handleChange('story_points', value ? parseInt(value) : undefined)}>
                  <SelectTrigger className="text-lg p-3">
                    <SelectValue placeholder="بدون امتیاز - انتخاب کنید" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - بسیار آسان</SelectItem>
                    <SelectItem value="2">2 - آسان</SelectItem>
                    <SelectItem value="3">3 - متوسط</SelectItem>
                    <SelectItem value="5">5 - متوسط به بالا</SelectItem>
                    <SelectItem value="8">8 - سخت</SelectItem>
                    <SelectItem value="13">13 - بسیار سخت</SelectItem>
                    <SelectItem value="21">21 - پیچیده</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label className="text-app-readable font-medium text-lg">برچسب‌ها</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="برچسب جدید"
                  className="flex-1 text-lg p-3"
                />
                <Button type="button" onClick={addTag} size="sm" className="px-4">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-sm cursor-pointer hover:bg-gray-300"
                      onClick={() => removeTag(tag)}
                    >
                      {tag}
                      <X className="h-3 w-3 mr-1" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-app-readable font-medium text-lg">
                یادداشت‌ها
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="یادداشت‌های مربوط به وظیفه حرفه‌ای"
                rows={3}
                className="text-lg p-3"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className="btn-professional flex-1 text-lg py-3"
              >
                {task ? 'بروزرسانی' : 'ایجاد'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1 text-lg py-3"
              >
                انصراف
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalTaskForm;