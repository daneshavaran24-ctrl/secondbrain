/**
 * Media Upload Component for Gratitude Journal
 * کامپوننت آپلود رسانه برای دفتر شکرگذاری
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Link2, Image, Video, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MediaFile, GratitudeLink, enhancedGratitudeService } from '@/services/enhancedGratitudeService';

interface MediaUploadProps {
  mediaFiles: MediaFile[];
  links: GratitudeLink[];
  onMediaChange: (media: MediaFile[]) => void;
  onLinksChange: (links: GratitudeLink[]) => void;
  userId?: string;
  disabled?: boolean;
}

export function MediaUpload({ 
  mediaFiles, 
  links, 
  onMediaChange, 
  onLinksChange, 
  userId,
  disabled = false 
}: MediaUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !userId) return;

    setIsUploading(true);
    try {
      const uploadedFiles: MediaFile[] = [];
      
      for (const file of Array.from(files)) {
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "خطا",
            description: `فایل ${file.name} بیش از ۱۰ مگابایت است`,
            variant: "destructive"
          });
          continue;
        }

        // Check file type
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
          toast({
            title: "خطا", 
            description: `فرمت فایل ${file.name} پشتیبانی نمی‌شود`,
            variant: "destructive"
          });
          continue;
        }

        const uploadedFile = await enhancedGratitudeService.uploadMedia(file, userId);
        uploadedFiles.push(uploadedFile);
      }

      if (uploadedFiles.length > 0) {
        onMediaChange([...mediaFiles, ...uploadedFiles]);
        toast({
          title: "آپلود موفق",
          description: `${uploadedFiles.length} فایل آپلود شد`
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "خطا در آپلود",
        description: "امکان آپلود فایل وجود ندارد",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const removeMedia = async (mediaId: string) => {
    const mediaToRemove = mediaFiles.find(m => m.id === mediaId);
    if (mediaToRemove && userId) {
      try {
        await enhancedGratitudeService.deleteMedia(mediaToRemove.url);
      } catch (error) {
        console.warn('Failed to delete media from storage:', error);
      }
    }
    onMediaChange(mediaFiles.filter(m => m.id !== mediaId));
  };

  const addLink = () => {
    if (!newLinkUrl.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً آدرس لینک را وارد کنید",
        variant: "destructive"
      });
      return;
    }

    // Simple URL validation
    try {
      new URL(newLinkUrl);
    } catch {
      toast({
        title: "خطا",
        description: "آدرس لینک معتبر نیست",
        variant: "destructive"
      });
      return;
    }

    const newLink: GratitudeLink = {
      id: crypto.randomUUID(),
      url: newLinkUrl,
      title: newLinkTitle.trim() || undefined,
      description: undefined
    };

    onLinksChange([...links, newLink]);
    setNewLinkUrl('');
    setNewLinkTitle('');
    
    toast({
      title: "لینک اضافه شد",
      description: "لینک به شکرگذاری شما اضافه شد"
    });
  };

  const removeLink = (linkId: string) => {
    onLinksChange(links.filter(l => l.id !== linkId));
  };

  return (
    <div className="space-y-6">
      {/* Media Upload Section */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <Label className="text-sm font-medium">تصاویر و ویدیوها</Label>
            
            {/* Upload Button */}
            <div className="flex items-center gap-2">
              <input
                type="file"
                id="media-upload"
                multiple
                accept="image/*,video/*"
                onChange={handleFileUpload}
                disabled={disabled || !userId}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploading || disabled || !userId}
                onClick={() => document.getElementById('media-upload')?.click()}
              >
                {isUploading ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                    در حال آپلود...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    افزودن رسانه
                  </>
                )}
              </Button>
              {!userId && (
                <span className="text-xs text-muted-foreground">
                  برای آپلود رسانه، ابتدا وارد سیستم شوید
                </span>
              )}
            </div>

            {/* Uploaded Media Display */}
            {mediaFiles.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {mediaFiles.map((media) => (
                  <div key={media.id} className="relative group">
                    <div className="border rounded-lg overflow-hidden bg-muted">
                      {media.type === 'image' ? (
                        <img
                          src={media.url}
                          alt={media.filename}
                          className="w-full h-24 object-cover"
                        />
                      ) : (
                        <div className="w-full h-24 flex items-center justify-center">
                          <Video className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="absolute top-1 right-1">
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeMedia(media.id)}
                        disabled={disabled}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="absolute bottom-1 left-1">
                      <Badge variant="secondary" className="text-xs">
                        {media.type === 'image' ? <Image className="h-3 w-3" /> : <Video className="h-3 w-3" />}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Links Section */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <Label className="text-sm font-medium">لینک‌های مفید</Label>
            
            {/* Add Link Form */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input
                  placeholder="آدرس لینک (https://...)"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  disabled={disabled}
                  className="md:col-span-2"
                />
                <Input
                  placeholder="عنوان (اختیاری)"
                  value={newLinkTitle}
                  onChange={(e) => setNewLinkTitle(e.target.value)}
                  disabled={disabled}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLink}
                disabled={disabled || !newLinkUrl.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                افزودن لینک
              </Button>
            </div>

            {/* Links Display */}
            {links.length > 0 && (
              <div className="space-y-2">
                {links.map((link) => (
                  <div key={link.id} className="flex items-center justify-between p-2 border rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 flex-1">
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline truncate block"
                        >
                          {link.title || link.url}
                        </a>
                        {link.title && (
                          <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeLink(link.id)}
                      disabled={disabled}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}