import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, GripVertical, Trash2, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface FormBuilderProps {
  organizationId: string;
}

export function FormBuilder({ organizationId }: FormBuilderProps) {
  const [fields, setFields] = useState<FormField[]>([]);
  const [formTitle, setFormTitle] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const fieldTypes = [
    { value: 'text', label: 'متن کوتاه' },
    { value: 'textarea', label: 'متن بلند' },
    { value: 'number', label: 'عدد' },
    { value: 'date', label: 'تاریخ' },
    { value: 'select', label: 'لیست کشویی' },
    { value: 'checkbox', label: 'چک‌باکس' },
    { value: 'radio', label: 'رادیو باتن' },
    { value: 'file', label: 'آپلود فایل' }
  ];

  const addField = (type: string) => {
    const newField: FormField = {
      id: crypto.randomUUID(),
      type,
      label: `فیلد ${fields.length + 1}`,
      placeholder: '',
      required: false,
      options: type === 'select' || type === 'radio' || type === 'checkbox' ? ['گزینه 1'] : undefined
    };
    setFields([...fields, newField]);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const deleteField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const renderFieldEditor = (field: FormField) => (
    <Card key={field.id} className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="cursor-move mt-2">
            <GripVertical className="w-5 h-5 text-muted-foreground" />
          </div>
          
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{fieldTypes.find(t => t.value === field.type)?.label}</Badge>
              <Input
                value={field.label}
                onChange={(e) => updateField(field.id, { label: e.target.value })}
                placeholder="عنوان فیلد"
                className="flex-1"
              />
            </div>

            <Input
              value={field.placeholder || ''}
              onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
              placeholder="متن راهنما (placeholder)"
            />

            {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (
              <div className="space-y-2">
                <Label>گزینه‌ها:</Label>
                {field.options?.map((option, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(field.options || [])];
                        newOptions[idx] = e.target.value;
                        updateField(field.id, { options: newOptions });
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newOptions = field.options?.filter((_, i) => i !== idx);
                        updateField(field.id, { options: newOptions });
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    updateField(field.id, { 
                      options: [...(field.options || []), `گزینه ${(field.options?.length || 0) + 1}`] 
                    });
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  افزودن گزینه
                </Button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => updateField(field.id, { required: e.target.checked })}
                className="rounded"
              />
              <Label>الزامی</Label>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteField(field.id)}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <Input
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="عنوان فرم..."
            className="text-lg font-semibold"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <Eye className="w-4 h-4 mr-2" />
            پیش‌نمایش
          </Button>
          <Button>
            ذخیره فرم
          </Button>
        </div>
      </div>

      <Tabs defaultValue="builder">
        <TabsList>
          <TabsTrigger value="builder">طراحی فرم</TabsTrigger>
          <TabsTrigger value="settings">تنظیمات</TabsTrigger>
          <TabsTrigger value="workflow">گردش کار</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>فیلدهای موجود</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {fieldTypes.map((type) => (
                  <Button
                    key={type.value}
                    variant="outline"
                    size="sm"
                    onClick={() => addField(type.value)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {type.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div>
            {fields.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  برای شروع، یک فیلد اضافه کنید
                </CardContent>
              </Card>
            ) : (
              fields.map(renderFieldEditor)
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardContent className="py-6">
              <p className="text-muted-foreground">تنظیمات فرم به زودی...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflow">
          <Card>
            <CardContent className="py-6">
              <p className="text-muted-foreground">تعریف گردش کار تایید به زودی...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{formTitle || 'پیش‌نمایش فرم'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label>
                  {field.label}
                  {field.required && <span className="text-destructive">*</span>}
                </Label>
                {field.type === 'textarea' ? (
                  <textarea className="w-full border rounded p-2" placeholder={field.placeholder} rows={3} />
                ) : field.type === 'select' ? (
                  <select className="w-full border rounded p-2">
                    {field.options?.map((opt, idx) => (
                      <option key={idx}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <Input type={field.type} placeholder={field.placeholder} />
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
