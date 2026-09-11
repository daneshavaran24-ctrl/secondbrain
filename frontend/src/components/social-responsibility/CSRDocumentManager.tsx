import { useState, useEffect } from "react";
import { socialResponsibilityService, CSRDocument } from "@/services/socialResponsibilityService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, Image, Video, Download, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface CSRDocumentManagerProps {
  projectId: string;
}

export function CSRDocumentManager({ projectId }: CSRDocumentManagerProps) {
  const [documents, setDocuments] = useState<CSRDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("document");
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDocuments();
  }, [projectId]);

  const loadDocuments = async () => {
    const data = await socialResponsibilityService.getProjectDocuments(projectId);
    setDocuments(data);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({ title: "لطفاً یک فایل انتخاب کنید", variant: "destructive" });
      return;
    }

    setUploading(true);
    const result = await socialResponsibilityService.uploadDocument(
      projectId,
      selectedFile,
      description,
      category
    );

    if (result) {
      toast({ title: "فایل با موفقیت آپلود شد" });
      setSelectedFile(null);
      setDescription("");
      setCategory("document");
      setOpen(false);
      loadDocuments();
    } else {
      toast({ title: "خطا در آپلود فایل", variant: "destructive" });
    }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    const success = await socialResponsibilityService.deleteDocument(id);
    if (success) {
      toast({ title: "فایل حذف شد" });
      loadDocuments();
    }
  };

  const getCategoryIcon = (cat: string | null) => {
    switch (cat) {
      case 'photo': return <Image className="h-5 w-5" />;
      case 'video': return <Video className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">مستندات پروژه</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 ml-2" />
              آپلود فایل
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>آپلود فایل جدید</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="file">انتخاب فایل</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </div>
              <div>
                <Label htmlFor="category">دسته‌بندی</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="photo">عکس</SelectItem>
                    <SelectItem value="video">ویدیو</SelectItem>
                    <SelectItem value="document">سند</SelectItem>
                    <SelectItem value="report">گزارش</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">توضیحات</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="توضیحات اختیاری..."
                />
              </div>
              <Button onClick={handleUpload} disabled={uploading} className="w-full">
                {uploading ? "در حال آپلود..." : "آپلود"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => (
          <Card key={doc.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {getCategoryIcon(doc.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{doc.file_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(doc.file_size)}
                  </p>
                  {doc.description && (
                    <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(doc.file_url, '_blank')}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(doc.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {documents.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          هیچ فایلی آپلود نشده است
        </div>
      )}
    </div>
  );
}