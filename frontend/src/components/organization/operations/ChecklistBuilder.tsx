import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { TextInputWithVoice } from '@/components/ui/text-input-with-voice';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ChecklistItem {
  id: string;
  text: string;
  required: boolean;
  hasNotes: boolean;
  hasAttachment: boolean;
  orderIndex: number;
}

interface ChecklistBuilderProps {
  organizationId?: string;
  onSuccess?: () => void;
  existingData?: any;
}

export function ChecklistBuilder({ organizationId, onSuccess, existingData }: ChecklistBuilderProps) {
  const [title, setTitle] = useState(existingData?.content?.title || '');
  const [description, setDescription] = useState(existingData?.content?.description || '');
  const [category, setCategory] = useState(existingData?.content?.category || '');
  const [items, setItems] = useState<ChecklistItem[]>(existingData?.content?.items || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addItem = () => {
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        text: '',
        required: false,
        hasNotes: false,
        hasAttachment: false,
        orderIndex: items.length,
      },
    ]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, field: keyof ChecklistItem, value: any) => {
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const moveItemUp = (id: string) => {
    const index = items.findIndex((i) => i.id === id);
    if (index <= 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    newItems.forEach((item, idx) => {
      item.orderIndex = idx;
    });
    setItems(newItems);
  };

  const moveItemDown = (id: string) => {
    const index = items.findIndex((i) => i.id === id);
    if (index >= items.length - 1) return;
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    newItems.forEach((item, idx) => {
      item.orderIndex = idx;
    });
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || items.length === 0) {
      toast.error('لطفاً عنوان و حداقل یک آیتم وارد کنید');
      return;
    }

    setIsSubmitting(true);
    try {
      const content = {
        type: 'checklist',
        title,
        description,
        category,
        items,
      };

      if (!organizationId) {
        toast.error('شناسه سازمان یافت نشد');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('کاربر وارد نشده است');
        return;
      }

      const { data: newOp, error: opError } = await supabase
        .from('organization_operations')
        .insert({ 
          organization_id: organizationId,
          user_id: user.id,
          title: title,
          operation_type: 'checklist',
          content: content as any 
        })
        .select()
        .single();

      if (opError) throw opError;

      // Save items
      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from('organization_checklist_items')
          .insert(
            items.map((item) => ({
              operations_id: newOp.id,
              text: item.text,
              required: item.required,
              has_notes: item.hasNotes,
              has_attachment: item.hasAttachment,
              order_index: item.orderIndex,
            }))
          );
        if (itemsError) throw itemsError;
      }

      toast.success('چک‌لیست با موفقیت ذخیره شد');
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'خطا در ذخیره چک‌لیست');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label>عنوان چک‌لیست</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان چک‌لیست..."
          />
        </div>

        <div>
          <Label>توضیحات</Label>
          <TextInputWithVoice
            value={description}
            onChange={setDescription}
            placeholder="توضیحات کلی..."
            type="textarea"
            rows={2}
          />
        </div>

        <div>
          <Label>دسته‌بندی</Label>
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="مثلاً: آنبوردینگ، دیپلویمنت، بررسی کیفیت"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-lg">آیتم‌های چک‌لیست</Label>
          <Button type="button" onClick={addItem} size="sm" variant="outline">
            <Plus className="h-4 w-4 ml-2" />
            افزودن آیتم
          </Button>
        </div>

        {items.map((item, index) => (
          <Card key={item.id}>
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => moveItemUp(item.id)}
                    disabled={index === 0}
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => moveItemDown(item.id)}
                    disabled={index === items.length - 1}
                  >
                    ↓
                  </Button>
                </div>

                <div className="flex-1 space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="text-muted-foreground font-mono mt-2">
                      {index + 1}.
                    </span>
                    <div className="flex-1">
                      <TextInputWithVoice
                        value={item.text}
                        onChange={(v) => updateItem(item.id, 'text', v)}
                        placeholder="متن آیتم چک‌لیست..."
                        type="textarea"
                        rows={2}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-4 pr-8">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`required-${item.id}`}
                        checked={item.required}
                        onCheckedChange={(checked) =>
                          updateItem(item.id, 'required', checked)
                        }
                      />
                      <Label htmlFor={`required-${item.id}`} className="text-xs">
                        الزامی
                      </Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`notes-${item.id}`}
                        checked={item.hasNotes}
                        onCheckedChange={(checked) =>
                          updateItem(item.id, 'hasNotes', checked)
                        }
                      />
                      <Label htmlFor={`notes-${item.id}`} className="text-xs">
                        نیاز به یادداشت
                      </Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`attach-${item.id}`}
                        checked={item.hasAttachment}
                        onCheckedChange={(checked) =>
                          updateItem(item.id, 'hasAttachment', checked)
                        }
                      />
                      <Label htmlFor={`attach-${item.id}`} className="text-xs">
                        نیاز به پیوست
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'در حال ذخیره...' : 'ذخیره چک‌لیست'}
        </Button>
      </div>
    </form>
  );
}
