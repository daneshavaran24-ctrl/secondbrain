import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PersianNumber } from '@/components/ui/persian-number';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, Send, MessageSquare, Mail, Phone, Paperclip, Plus, X, Tag, Users } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface TaskDelegationPanelProps {
  projectId?: string;
  domain?: string;
  organizationId?: string;
  onDelegationCreated?: () => void;
}

export function TaskDelegationPanel({ projectId, domain = 'personal', organizationId, onDelegationCreated }: TaskDelegationPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    delegatee_first_name: '',
    delegatee_last_name: '',
    delegatee_email: '',
    delegatee_phone: '',
    method: 'email' as 'email' | 'sms' | 'secretary',
    priority: 'medium' as 'high' | 'medium' | 'low',
    due_date: ''
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [ccInput, setCcInput] = useState('');
  const [requiresConfirmation, setRequiresConfirmation] = useState(false);
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const parseList = (val: string) =>
      val
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "خطا",
          description: "لطفاً وارد شوید",
          variant: "destructive"
        });
        return;
      }

      const tags = parseList(tagsInput);
      const ccList = parseList(ccInput);

      // Create delegation task
      const { data, error } = await supabase
        .from('delegation_tasks')
        .insert({
          delegator_id: user.id,
          title: formData.title,
          description: formData.description,
          delegatee_first_name: formData.delegatee_first_name,
          delegatee_last_name: formData.delegatee_last_name,
          delegatee_email: formData.delegatee_email,
          delegatee_phone: formData.delegatee_phone,
          delegatee_name: `${formData.delegatee_first_name} ${formData.delegatee_last_name}`.trim(),
          method: formData.method,
          priority: formData.priority,
          due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
          domain: domain,
          organization_id: organizationId,
          requires_confirmation: requiresConfirmation,
          cc_recipients: ccList,
          tags: tags
        })
        .select()
        .single();

      if (error) throw error;

      // Parallel: upload attachments + insert subtasks
      const uploadsPromise = (async () => {
        if (!files.length) return;
        for (const file of files) {
          const path = `${user.id}/delegations/${data.id}/${Date.now()}_${file.name}`;
          const { error: upErr } = await supabase.storage.from('attachments').upload(path, file, {
            upsert: false,
            contentType: file.type
          });
          if (upErr) {
            console.error('Upload error', upErr);
            continue;
          }
          await supabase
            .from('delegation_attachments')
            .insert({
              task_id: data.id,
              file_name: file.name,
              file_path: path,
              mime_type: file.type,
              file_size: file.size
            });
        }
      })();

      const subtasksPromise = (async () => {
        if (!subtasks.length) return;
        const rows = subtasks.map((title) => ({ delegation_task_id: data.id, title }));
        await supabase.from('delegation_subtasks').insert(rows);
      })();

      await Promise.all([uploadsPromise, subtasksPromise]);

      // Send notification based on method
      if (formData.method === 'email' && formData.delegatee_email) {
        await supabase.functions.invoke('send-delegation-email', {
          body: {
            taskId: data.id,
            email: formData.delegatee_email,
            delegateeName: `${formData.delegatee_first_name} ${formData.delegatee_last_name}`.trim(),
            title: formData.title,
            description: formData.description,
            dueDate: formData.due_date,
            cc: ccList,
            requiresConfirmation
          }
        });
      } else if (formData.method === 'sms' && formData.delegatee_phone) {
        await supabase.functions.invoke('send-delegation-sms', {
          body: {
            taskId: data.id,
            phone: formData.delegatee_phone,
            delegateeName: `${formData.delegatee_first_name} ${formData.delegatee_last_name}`.trim(),
            title: formData.title,
            description: formData.description,
            dueDate: formData.due_date
          }
        });
      } else if (formData.method === 'secretary') {
        await supabase.functions.invoke('send-secretary-delegation', {
          body: {
            taskId: data.id,
            title: formData.title,
            description: formData.description,
            dueDate: formData.due_date
          }
        });
      }

      toast({
        title: "موفقیت",
        description: "وظیفه با موفقیت واگذار شد",
        variant: "default"
      });

      setFormData({
        title: '',
        description: '',
        delegatee_first_name: '',
        delegatee_last_name: '',
        delegatee_email: '',
        delegatee_phone: '',
        method: 'email',
        priority: 'medium',
        due_date: ''
      });
      setTagsInput('');
      setCcInput('');
      setRequiresConfirmation(false);
      setSubtasks([]);
      setNewSubtask('');
      setFiles([]);
      setIsOpen(false);
      onDelegationCreated?.();

    } catch (error) {
      console.error('Error delegating task:', error);
      toast({
        title: "خطا",
        description: "خطا در واگذاری وظیفه",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <Phone className="h-4 w-4" />;
      case 'secretary': return <MessageSquare className="h-4 w-4" />;
      default: return <Send className="h-4 w-4" />;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'email': return 'ایمیل';
      case 'sms': return 'پیامک';
      case 'secretary': return 'کارتابل منشی';
      default: return method;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="btn-glass">
          <UserPlus className="h-4 w-4 ml-2" />
          واگذاری وظیفه
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto card-glass">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">واگذاری وظیفه جدید</DialogTitle>
          <DialogDescription>
            وظیفه‌ای را به شخص یا منشی واگذار کنید
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">عنوان وظیفه</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="عنوان وظیفه را وارد کنید"
                  required
                  className="input-glass"
                />
              </div>

              <div>
                <Label htmlFor="description">شرح وظیفه</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="توضیحات تفصیلی وظیفه"
                  rows={3}
                  className="input-glass"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="first_name">نام</Label>
                  <Input
                    id="first_name"
                    value={formData.delegatee_first_name}
                    onChange={(e) => setFormData({ ...formData, delegatee_first_name: e.target.value })}
                    placeholder="نام"
                    required
                    className="input-glass"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">نام خانوادگی</Label>
                  <Input
                    id="last_name"
                    value={formData.delegatee_last_name}
                    onChange={(e) => setFormData({ ...formData, delegatee_last_name: e.target.value })}
                    placeholder="نام خانوادگی"
                    required
                    className="input-glass"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="due_date">مهلت انجام</Label>
                <Input
                  id="due_date"
                  type="datetime-local"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="input-glass"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="method">روش ارسال</Label>
                <Select
                  value={formData.method}
                  onValueChange={(value: 'email' | 'sms' | 'secretary') =>
                    setFormData({ ...formData, method: value })
                  }
                >
                  <SelectTrigger className="input-glass">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        ایمیل
                      </div>
                    </SelectItem>
                    <SelectItem value="sms">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        پیامک
                      </div>
                    </SelectItem>
                    <SelectItem value="secretary">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        کارتابل منشی
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="phone">شماره موبایل</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.delegatee_phone}
                  onChange={(e) => setFormData({ ...formData, delegatee_phone: e.target.value })}
                  placeholder="09123456789"
                  required={formData.method === 'sms'}
                  className="input-glass"
                />
              </div>

              {formData.method === 'email' && (
                <div>
                  <Label htmlFor="email">ایمیل گیرنده</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.delegatee_email}
                    onChange={(e) => setFormData({ ...formData, delegatee_email: e.target.value })}
                    placeholder="example@email.com"
                    required
                    className="input-glass"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="priority">اولویت</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: 'high' | 'medium' | 'low') =>
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger className="input-glass">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">
                      <Badge variant="destructive" className="text-xs">بالا</Badge>
                    </SelectItem>
                    <SelectItem value="medium">
                      <Badge variant="secondary" className="text-xs">متوسط</Badge>
                    </SelectItem>
                    <SelectItem value="low">
                      <Badge variant="outline" className="text-xs">پایین</Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Advanced options toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Button type="button" variant="outline" onClick={() => setShowAdvanced((v) => !v)}>
                گزینه‌های پیشرفته
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {getMethodIcon(formData.method)}
                <span>ارسال از طریق {getMethodLabel(formData.method)}</span>
              </div>
            </div>

            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-lg border">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tags" className="flex items-center gap-2"><Tag className="h-4 w-4" /> برچسب‌ها</Label>
                    <Input
                      id="tags"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      placeholder="مثال: فوری، مالی، پیگیری"
                      className="input-glass"
                    />
                    {tagsInput && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {tagsInput.split(',').map((t, i) => (
                          <Badge key={i} variant="secondary" className="text-xs"><PersianNumber>{t.trim()}</PersianNumber></Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="cc" className="flex items-center gap-2"><Users className="h-4 w-4" /> رونوشت (CC)</Label>
                    <Input
                      id="cc"
                      value={ccInput}
                      onChange={(e) => setCcInput(e.target.value)}
                      placeholder="ایمیل‌ها را با ویرگول جدا کنید"
                      className="input-glass"
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-md p-3 border">
                    <div className="space-y-1">
                      <Label>نیاز به تایید دریافت</Label>
                      <p className="text-xs text-muted-foreground">در صورت فعال بودن، گیرنده باید دریافت را تایید کند</p>
                    </div>
                    <Switch checked={requiresConfirmation} onCheckedChange={setRequiresConfirmation} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="subtask">زیر‌وظایف</Label>
                    <div className="flex gap-2">
                      <Input id="subtask" value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} placeholder="افزودن زیر‌وظیفه" className="input-glass" />
                      <Button type="button" variant="secondary" onClick={() => {
                        if (!newSubtask.trim()) return;
                        setSubtasks((prev) => [...prev, newSubtask.trim()]);
                        setNewSubtask('');
                      }}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {subtasks.length > 0 && (
                      <>
                        <div className="mb-1 text-xs text-muted-foreground">
                          تعداد زیر‌وظایف: <PersianNumber>{subtasks.length}</PersianNumber>
                        </div>
                        <ul className="mt-2 space-y-2">
                          {subtasks.map((st, idx) => (
                            <li key={idx} className="flex items-center justify-between rounded-md border p-2 text-sm">
                              <span><PersianNumber>{st}</PersianNumber></span>
                              <Button type="button" variant="ghost" size="icon" onClick={() => setSubtasks((prev) => prev.filter((_, i) => i !== idx))}>
                                <X className="h-4 w-4" />
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="attachments" className="flex items-center gap-2"><Paperclip className="h-4 w-4" /> پیوست‌ها</Label>
                    <Input id="attachments" type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} className="input-glass" />
                    {files.length > 0 && (
                      <>
                        <div className="mb-1 text-xs text-muted-foreground">
                          تعداد فایل: <PersianNumber>{files.length}</PersianNumber>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {files.map((f, i) => (
                            <span key={i} className="rounded-md border px-2 py-1"><PersianNumber>{f.name}</PersianNumber></span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Message Preview */}
          <div className="rounded-md border p-4 bg-muted/30 space-y-2">
            <div className="text-sm font-medium text-foreground">پیش‌نمایش پیام (<PersianNumber>{getMethodLabel(formData.method)}</PersianNumber>)</div>
            {formData.method === 'email' && (
              <div className="text-sm space-y-1">
                <div><span className="font-semibold">Subject:</span> واگذاری وظیفه: <PersianNumber>{formData.title || 'بدون عنوان'}</PersianNumber></div>
                <div className="whitespace-pre-wrap text-muted-foreground">
                  <PersianNumber>
                    {`سلام ${`${formData.delegatee_first_name} ${formData.delegatee_last_name}`.trim() || 'همکار محترم'},
${formData.description || 'شرح وظیفه در بالا آمده است.'}
مهلت انجام: ${formData.due_date ? new Date(formData.due_date).toLocaleString('fa-IR') : '—'}
با تشکر`}
                  </PersianNumber>
                </div>
              </div>
            )}
            {formData.method === 'sms' && (
              <div className="text-sm text-muted-foreground">
                <PersianNumber>{`واگذاری: ${formData.title || 'بدون عنوان'} - مهلت: ${formData.due_date ? new Date(formData.due_date).toLocaleDateString('fa-IR') : '—'}`}</PersianNumber>
              </div>
            )}
            {formData.method === 'secretary' && (
              <div className="text-sm text-muted-foreground">
                <PersianNumber>{`ثبت در کارتابل منشی: «${formData.title || 'بدون عنوان'}». پیگیری تا مهلت ${formData.due_date ? new Date(formData.due_date).toLocaleDateString('fa-IR') : '—'}.`}</PersianNumber>
              </div>
            )}
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {getMethodIcon(formData.method)}
              <span>ارسال از طریق {getMethodLabel(formData.method)}</span>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                انصراف
              </Button>
              <Button type="submit" disabled={isLoading} className="btn-primary">
                {isLoading ? 'در حال ارسال...' : 'واگذاری وظیفه'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}