import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { Habit } from '@/services/habitTrackerService';
import { Smile, Palette } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface HabitManagerProps {
  open: boolean;
  onClose: () => void;
  onSave: (habit: Partial<Habit>) => void;
  habit?: Habit | null;
}

const CATEGORIES = [
  { value: 'health', label: 'سلامتی' },
  { value: 'productivity', label: 'بهره‌وری' },
  { value: 'social', label: 'اجتماعی' },
  { value: 'wellness', label: 'رفاه' },
];

const COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316',
];

export const HabitManager: React.FC<HabitManagerProps> = ({ open, onClose, onSave, habit }) => {
  const [formData, setFormData] = useState<Partial<Habit>>({
    title: habit?.title || '',
    emoji: habit?.emoji || '✅',
    description: habit?.description || '',
    category: habit?.category || 'wellness',
    color: habit?.color || '#10b981',
    target_days: habit?.target_days || 7,
  });

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    if (habit) {
      setFormData({
        title: habit.title || '',
        emoji: habit.emoji || '✅',
        description: habit.description || '',
        category: habit.category || 'wellness',
        color: habit.color || '#10b981',
        target_days: habit.target_days || 7,
      });
    } else {
      setFormData({
        title: '',
        emoji: '✅',
        description: '',
        category: 'wellness',
        color: '#10b981',
        target_days: 7,
      });
    }
  }, [habit]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setFormData({ ...formData, emoji: emojiData.emoji });
    setShowEmojiPicker(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {habit ? 'ویرایش عادت' : 'افزودن عادت جدید'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Emoji Picker */}
          <div className="space-y-2">
            <Label>ایموجی</Label>
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start gap-2"
                >
                  <span className="text-2xl">{formData.emoji}</span>
                  <Smile className="h-4 w-4 text-muted-foreground" />
                  انتخاب ایموجی
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 border-0" align="start">
                <EmojiPicker onEmojiClick={handleEmojiClick} width={350} height={400} />
              </PopoverContent>
            </Popover>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">عنوان عادت</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="مثلاً: ورزش صبحگاهی"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">توضیحات (اختیاری)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="توضیح مختصری درباره این عادت..."
              rows={3}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">دسته‌بندی</Label>
            <Select
              value={formData.category}
              onValueChange={(value: any) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>رنگ</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className="w-10 h-10 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: color,
                    border: formData.color === color ? '3px solid white' : '2px solid transparent',
                    boxShadow: formData.color === color ? '0 0 0 2px black' : 'none',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Target Days */}
          <div className="space-y-2">
            <Label htmlFor="target">هدف (روز در هفته)</Label>
            <Select
              value={formData.target_days?.toString()}
              onValueChange={(value) => setFormData({ ...formData, target_days: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} روز در هفته
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              انصراف
            </Button>
            <Button type="submit">
              {habit ? 'ذخیره تغییرات' : 'افزودن عادت'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
