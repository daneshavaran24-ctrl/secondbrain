import { useState } from 'react';
import { Upload, X, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { organizationService } from '@/services/organizationService';

interface OrganizationLogoUploadProps {
  organizationId: string;
  currentLogoUrl?: string;
  onUploadComplete?: (url: string) => void;
}

export function OrganizationLogoUpload({ 
  organizationId, 
  currentLogoUrl,
  onUploadComplete 
}: OrganizationLogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentLogoUrl || null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('لطفاً فقط تصویر انتخاب کنید');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('حجم فایل نباید بیشتر از 5 مگابایت باشد');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    const url = await organizationService.uploadOrganizationLogo(organizationId, file);
    setUploading(false);

    if (url && onUploadComplete) {
      onUploadComplete(url);
    }
  };

  const handleDelete = async () => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید لوگو را حذف کنید؟')) return;

    const success = await organizationService.deleteOrganizationLogo(organizationId);
    if (success) {
      setPreview(null);
      if (onUploadComplete) {
        onUploadComplete('');
      }
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-foreground">
        لوگوی سازمان
      </label>
      
      <div className="flex items-start gap-4">
        <div className="relative w-32 h-32 rounded-xl border-2 border-dashed border-border bg-accent/10 flex items-center justify-center overflow-hidden group">
          {preview ? (
            <>
              <img 
                src={preview} 
                alt="Organization logo" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={handleDelete}
                  disabled={uploading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <Building2 className="w-12 h-12 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => document.getElementById('logo-upload')?.click()}
            >
              <Upload className="w-4 h-4 ml-2" />
              {uploading ? 'در حال آپلود...' : 'انتخاب تصویر'}
            </Button>
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            فرمت‌های مجاز: JPG, PNG, WebP, SVG
            <br />
            حداکثر حجم: 5 مگابایت
          </p>
        </div>
      </div>
    </div>
  );
}
