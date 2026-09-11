import React, { useState } from 'react';
import { Image, Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  onImageSelect: (base64Image: string) => void;
  onRemove: () => void;
  disabled?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelect, onRemove, disabled }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'خطا',
        description: 'لطفاً یک فایل تصویری انتخاب کنید',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'خطا',
        description: 'حجم فایل نباید بیشتر از 5 مگابایت باشد',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreview(result);
        onImageSelect(result);
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: 'خطا',
        description: 'خطا در پردازش تصویر',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onRemove();
  };

  if (preview) {
    return (
      <div className="relative inline-block">
        <img src={preview} alt="Preview" className="w-20 h-20 object-cover rounded-lg" />
        <Button
          size="icon"
          variant="destructive"
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
          onClick={handleRemove}
          disabled={disabled}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  return (
    <div>
      <input
        type="file"
        id="image-upload"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isLoading}
      />
      <label htmlFor="image-upload">
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled || isLoading}
          asChild
        >
          <span className="cursor-pointer">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Image className="w-4 h-4" />
            )}
          </span>
        </Button>
      </label>
    </div>
  );
};

export default ImageUpload;
