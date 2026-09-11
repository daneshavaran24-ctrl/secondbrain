import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { FileText, X, Plus, Check, ChevronsUpDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { ContentItem } from '@/pages/CulturalContentPage';
import { PDFUploadModal } from '@/components/cultural-content/PDFUploadModal';
import { categoryService } from '@/services/categoryService';
import { cn } from '@/lib/utils';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  contentTypes: ContentItem['type'][];
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  contentTypes
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    coverImage: '',
    link: '',
    type: contentTypes[0] || 'book',
    status: 'planning' as ContentItem['status'],
    category: '',
    tags: '',
    rating: undefined as number | undefined,
    pdfFile: '',
    pdfUrl: ''
  });
  
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  // Initialize categories on mount
  useEffect(() => {
    categoryService.initializeDefaultCategories('cultural');
    setCategories(categoryService.getCustomCategories('cultural'));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "خطا",
        description: "عنوان الزامی است.",
        variant: "destructive"
      });
      return;
    }

    const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);

    onAdd({
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      coverImage: formData.coverImage.trim() || undefined,
      link: formData.link.trim() || undefined,
      type: formData.type as ContentItem['type'],
      status: formData.status,
      category: formData.category.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      rating: formData.rating,
      progress: 0,
      pdfFile: formData.pdfFile.trim() || undefined,
      pdfUrl: formData.pdfUrl.trim() || undefined
    });

    // Reset form
    setFormData({
      title: '',
      description: '',
      coverImage: '',
      link: '',
      type: contentTypes[0] || 'book',
      status: 'planning',
      category: '',
      tags: '',
      rating: undefined,
      pdfFile: '',
      pdfUrl: ''
    });
    setUploadedImage('');

    onClose();
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      coverImage: '',
      link: '',
      type: contentTypes[0] || 'book',
      status: 'planning',
      category: '',
      tags: '',
      rating: undefined,
      pdfFile: '',
      pdfUrl: ''
    });
    setUploadedImage('');
    setNewCategory('');
    setCategoryOpen(false);
    onClose();
  };

  const handleAddCategory = () => {
    const trimmedCategory = newCategory.trim();
    if (trimmedCategory && !categories.includes(trimmedCategory)) {
      categoryService.addCustomCategory('cultural', trimmedCategory);
      const updatedCategories = categoryService.getCustomCategories('cultural');
      setCategories(updatedCategories);
      setFormData(prev => ({ ...prev, category: trimmedCategory }));
      setNewCategory('');
      setCategoryOpen(false);
      toast({
        title: "دسته‌بندی اضافه شد",
        description: `دسته‌بندی "${trimmedCategory}" با موفقیت اضافه شد.`,
      });
    }
  };

  const handlePDFUpload = (data: { pdfFile?: string; pdfUrl?: string; title: string }) => {
    setFormData(prev => ({
      ...prev,
      title: prev.title || data.title,
      pdfFile: data.pdfFile || '',
      pdfUrl: data.pdfUrl || ''
    }));
  };

  const getTypeLabel = (type: ContentItem['type']): string => {
    switch (type) {
      case 'book': return 'کتاب';
      case 'article': return 'مقاله';
      case 'movie': return 'فیلم';
      case 'series': return 'سریال';
      case 'youtube': return 'یوتیوب';
      case 'podcast': return 'پادکست';
      case 'audiobook': return 'کتاب صوتی';
      default: return type;
    }
  };

  const getStatusLabel = (status: ContentItem['status'], type?: ContentItem['type']): string => {
    const isWatchableContent = type && ['movie', 'series', 'youtube'].includes(type);
    const isListenableContent = type && ['podcast', 'audiobook'].includes(type);
    const isReadableContent = type && ['book', 'article'].includes(type);
    
    switch (status) {
      case 'planning':
        if (isWatchableContent) return 'در صف تماشا';
        if (isListenableContent) return 'در صف شنیدن';
        if (isReadableContent) return 'در صف مطالعه';
        return 'در صف';
      case 'in-progress':
        if (isWatchableContent) return 'در حال تماشا';
        if (isListenableContent) return 'در حال شنیدن';
        if (isReadableContent) return 'در حال خواندن';
        return 'در جریان';
      case 'completed':
        if (isWatchableContent) return 'دیده شده';
        if (isListenableContent) return 'شنیده شده';
        if (isReadableContent) return 'خوانده شده';
        return 'تمام شده';
      case 'archived': return 'بایگانی';
      default: return status;
    }
  };

  // Image processing helper
  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }

      img.onload = () => {
        const maxSize = 1200;
        let { width, height } = img;
        
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "خطا",
        description: "فقط فایل‌های تصویری مجاز هستند.",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "خطا", 
        description: "حجم فایل نباید بیشتر از ۱۰ مگابایت باشد.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessingImage(true);
    try {
      const resizedImageUrl = await resizeImage(file);
      setUploadedImage(resizedImageUrl);
      setFormData(prev => ({ ...prev, coverImage: resizedImageUrl }));
      
      if (file.size > 2 * 1024 * 1024) { // Show warning if original was > 2MB
        toast({
          title: "تصویر بهینه‌سازی شد",
          description: "حجم تصویر برای ذخیره‌سازی کاهش یافت.",
        });
      }
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در پردازش تصویر.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingImage(false);
    }
  };

  // Clear uploaded image
  const clearUploadedImage = () => {
    setUploadedImage('');
    setFormData(prev => ({ ...prev, coverImage: '' }));
  };

  // Get image label based on content type
  const getImageLabel = (): string => {
    if (formData.type === 'book') return 'تصویر جلد کتاب';
    if (formData.type === 'article') return 'تصویر مقاله';
    if (formData.type === 'movie' || formData.type === 'series') return 'پوستر فیلم/سریال';
    return 'تصویر';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]" dir="rtl">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-right pr-8">افزودن آیتم جدید</DialogTitle>
          <DialogDescription className="text-right pr-8">
            اطلاعات آیتم جدید را وارد کنید
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">عنوان *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="عنوان آیتم را وارد کنید"
                required
              />
            </div>

            {contentTypes.length > 1 && (
              <div className="space-y-2">
                <Label htmlFor="type">نوع محتوا</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as ContentItem['type'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contentTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {getTypeLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">توضیحات</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="توضیحات کوتاه در مورد این آیتم..."
              rows={3}
            />
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label>دسته‌بندی</Label>
            <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={categoryOpen}
                  className="w-full justify-between"
                >
                  {formData.category
                    ? categories.find((category) => category === formData.category)
                    : "انتخاب دسته‌بندی..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput 
                    placeholder="جستجو در دسته‌بندی‌ها..." 
                    value={newCategory}
                    onValueChange={setNewCategory}
                  />
                  <CommandList>
                    <CommandEmpty>
                      <div className="p-2">
                        <p className="text-sm text-muted-foreground mb-2">دسته‌بندی یافت نشد</p>
                        {newCategory && (
                          <Button
                            onClick={handleAddCategory}
                            size="sm"
                            className="w-full"
                          >
                            <Plus className="h-4 w-4 ml-2" />
                            افزودن "{newCategory}"
                          </Button>
                        )}
                      </div>
                    </CommandEmpty>
                    <CommandGroup>
                      {categories.map((category) => (
                        <CommandItem
                          key={category}
                          value={category}
                          onSelect={(currentValue) => {
                            setFormData(prev => ({ 
                              ...prev, 
                              category: currentValue === formData.category ? "" : currentValue 
                            }));
                            setCategoryOpen(false);
                            setNewCategory('');
                          }}
                        >
                          <Check
                            className={cn(
                              "ml-2 h-4 w-4",
                              formData.category === category ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {category}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    {newCategory && !categories.includes(newCategory) && (
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => handleAddCategory()}
                        >
                          <Plus className="ml-2 h-4 w-4" />
                          افزودن "{newCategory}"
                        </CommandItem>
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* PDF Upload Section for Books and Articles */}
          {(formData.type === 'book' || formData.type === 'article') && (
            <div className="space-y-2">
              <Label>فایل PDF</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPDFModalOpen(true)}
                  className="flex-1"
                >
                  <FileText className="h-4 w-4 ml-2" />
                  {formData.pdfFile || formData.pdfUrl ? 'تغییر PDF' : 'افزودن PDF'}
                </Button>
                {(formData.pdfFile || formData.pdfUrl) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, pdfFile: '', pdfUrl: '' }))}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {(formData.pdfFile || formData.pdfUrl) && (
                <div className="text-xs text-muted-foreground">
                  PDF اضافه شده: {formData.pdfFile ? 'فایل آپلود شده' : 'لینک PDF'}
                </div>
              )}
            </div>
          )}

          {/* Image Upload Section */}
          <div className="space-y-4">
            <Label>{getImageLabel()}</Label>
            
            {/* Image Preview */}
            {(uploadedImage || formData.coverImage) && (
              <div className="relative inline-block">
                <img
                  src={uploadedImage || formData.coverImage}
                  alt="پیش‌نمایش"
                  className="w-32 h-32 object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2"
                  onClick={clearUploadedImage}
                >
                  ×
                </Button>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="imageUpload">آپلود تصویر</Label>
                <Input
                  id="imageUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isProcessingImage}
                />
                {isProcessingImage && (
                  <p className="text-xs text-muted-foreground">در حال پردازش تصویر...</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverImage">یا URL تصویر</Label>
                <Input
                  id="coverImage"
                  type="url"
                  value={formData.coverImage}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, coverImage: e.target.value }));
                    if (e.target.value) setUploadedImage('');
                  }}
                  placeholder="https://example.com/cover.jpg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="link">لینک خارجی</Label>
              <Input
                id="link"
                type="url"
                value={formData.link}
                onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">وضعیت</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as ContentItem['status'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">{getStatusLabel('planning', formData.type)}</SelectItem>
                  <SelectItem value="in-progress">{getStatusLabel('in-progress', formData.type)}</SelectItem>
                  <SelectItem value="completed">{getStatusLabel('completed', formData.type)}</SelectItem>
                  <SelectItem value="archived">بایگانی</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Quick Status Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  type="button"
                  variant={formData.status === 'planning' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, status: 'planning' }))}
                >
                  {getStatusLabel('planning', formData.type)}
                </Button>
                <Button
                  type="button"
                  variant={formData.status === 'in-progress' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, status: 'in-progress' }))}
                >
                  {getStatusLabel('in-progress', formData.type)}
                </Button>
                <Button
                  type="button"
                  variant={formData.status === 'completed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, status: 'completed' }))}
                >
                  {getStatusLabel('completed', formData.type)}
                </Button>
                <Button
                  type="button"
                  variant={formData.status === 'archived' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, status: 'archived' }))}
                >
                  بایگانی
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rating">امتیاز (1-5)</Label>
              <Select
                value={formData.rating?.toString() || ''}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  rating: value === "none" ? undefined : parseInt(value) 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب امتیاز" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون امتیاز</SelectItem>
                  <SelectItem value="1">⭐ 1</SelectItem>
                  <SelectItem value="2">⭐ 2</SelectItem>
                  <SelectItem value="3">⭐ 3</SelectItem>
                  <SelectItem value="4">⭐ 4</SelectItem>
                  <SelectItem value="5">⭐ 5</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">برچسب‌ها</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="برچسب‌ها را با کاما جدا کنید"
            />
            <p className="text-xs text-muted-foreground">
              مثال: علمی تخیلی، کلاسیک، پیشنهادی
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              انصراف
            </Button>
            <Button type="submit">
              افزودن آیتم
            </Button>
          </div>
        </form>
      </DialogContent>

      <PDFUploadModal
        isOpen={isPDFModalOpen}
        onClose={() => setIsPDFModalOpen(false)}
        onUpload={handlePDFUpload}
      />
    </Dialog>
  );
};