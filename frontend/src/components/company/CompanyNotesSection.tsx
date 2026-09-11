import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { companyService, CompanyNote } from '@/services/companyService';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Star, Paperclip } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CompanyFileUploader } from './CompanyFileUploader';
import { CompanyFile, getCompanyNoteFiles } from '@/services/companyFileService';

interface NotesSectionProps {
  companyId: string;
}

const CATEGORIES = [
  { value: 'meeting', label: 'جلسه' },
  { value: 'idea', label: 'ایده' },
  { value: 'decision', label: 'تصمیم' },
  { value: 'reminder', label: 'یادآوری' },
  { value: 'general', label: 'عمومی' },
];

export function CompanyNotesSection({ companyId }: NotesSectionProps) {
  const [notes, setNotes] = useState<CompanyNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<CompanyNote | null>(null);
  const [formData, setFormData] = useState<Partial<CompanyNote>>({
    title: '',
    content: '',
    category: 'general',
    is_important: false,
  });
  const [noteFiles, setNoteFiles] = useState<CompanyFile[]>([]);

  useEffect(() => {
    loadNotes();
  }, [companyId]);

  const loadNotes = async () => {
    setIsLoading(true);
    const data = await companyService.getNotes(companyId);
    setNotes(data);
    setIsLoading(false);
  };

  const handleOpenDialog = async (note?: CompanyNote) => {
    if (note) {
      setEditingNote(note);
      setFormData(note);
      // بارگذاری فایل‌های یادداشت
      const files = await getCompanyNoteFiles(note.id);
      setNoteFiles(files);
    } else {
      setEditingNote(null);
      setFormData({
        title: '',
        content: '',
        category: 'general',
        is_important: false,
      });
      setNoteFiles([]);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title) {
      toast.error('عنوان یادداشت الزامی است');
      return;
    }

    if (editingNote) {
      const success = await companyService.updateNote(editingNote.id, formData);
      if (success) {
        toast.success('یادداشت با موفقیت بروزرسانی شد');
        setIsDialogOpen(false);
        loadNotes();
      } else {
        toast.error('خطا در بروزرسانی یادداشت');
      }
    } else {
      const note = await companyService.createNote(companyId, formData);
      if (note) {
        toast.success('یادداشت با موفقیت ایجاد شد');
        setIsDialogOpen(false);
        loadNotes();
      } else {
        toast.error('خطا در ایجاد یادداشت');
      }
    }
  };

  const handleDelete = async (noteId: string) => {
    if (confirm('آیا از حذف این یادداشت اطمینان دارید؟')) {
      const success = await companyService.deleteNote(noteId);
      if (success) {
        toast.success('یادداشت با موفقیت حذف شد');
        loadNotes();
      } else {
        toast.error('خطا در حذف یادداشت');
      }
    }
  };

  const toggleImportant = async (note: CompanyNote) => {
    const success = await companyService.updateNote(note.id, {
      is_important: !note.is_important,
    });
    if (success) {
      loadNotes();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>یادداشت‌ها و اسناد</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="w-4 h-4" />
                یادداشت جدید
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingNote ? 'ویرایش یادداشت' : 'یادداشت جدید'}</DialogTitle>
              </DialogHeader>
              
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="content">محتوا</TabsTrigger>
                  <TabsTrigger value="files" className="gap-2">
                    فایل‌ها
                    {noteFiles.length > 0 && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                        {noteFiles.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="content" className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>عنوان *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="عنوان یادداشت"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>محتوا</Label>
                    <Textarea
                      value={formData.content || ''}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="محتوای یادداشت"
                      rows={8}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>دسته‌بندی</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
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

                    <div className="flex items-center space-x-2 pt-8">
                      <Checkbox
                        id="important"
                        checked={formData.is_important}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, is_important: checked as boolean })
                        }
                      />
                      <label
                        htmlFor="important"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        یادداشت مهم
                      </label>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="files" className="py-4">
                  {editingNote ? (
                    <CompanyFileUploader
                      noteId={editingNote.id}
                      files={noteFiles}
                      onFilesChange={setNoteFiles}
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Paperclip className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>ابتدا یادداشت را ذخیره کنید تا بتوانید فایل پیوست کنید</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  انصراف
                </Button>
                <Button onClick={handleSave}>ذخیره</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">هیچ یادداشتی یافت نشد</p>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className={`p-4 border rounded-lg hover:bg-muted/50 ${
                    note.is_important ? 'border-yellow-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium">{note.title}</h3>
                      {note.is_important && <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />}
                      <Badge variant="outline">
                        {CATEGORIES.find((c) => c.value === note.category)?.label}
                      </Badge>
                      {note.attachments && Array.isArray(note.attachments) && note.attachments.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Paperclip className="h-3 w-3" />
                          <span>{note.attachments.length} فایل</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleImportant(note)}
                      >
                        <Star
                          className={`w-4 h-4 ${
                            note.is_important ? 'fill-yellow-500 text-yellow-500' : ''
                          }`}
                        />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleOpenDialog(note)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(note.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {note.content && (
                    <p className="text-sm text-muted-foreground mb-2 whitespace-pre-wrap">
                      {note.content}
                    </p>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {new Date(note.created_at).toLocaleDateString('fa-IR')}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
