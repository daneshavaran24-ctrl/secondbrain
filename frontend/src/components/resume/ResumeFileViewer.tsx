import { useState } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ResumeFileViewerProps {
  url: string;
  type: 'image' | 'pdf' | 'video';
  title: string;
  open: boolean;
  onClose: () => void;
}

export function ResumeFileViewer({ url, type, title, open, onClose }: ResumeFileViewerProps) {
  const [zoom, setZoom] = useState(100);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="relative overflow-auto max-h-[70vh]">
          {type === 'image' && (
            <div className="space-y-4">
              <div className="flex justify-center gap-2">
                <Button variant="outline" size="sm" onClick={handleZoomOut}>
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="px-4 py-2 text-sm">{zoom}%</span>
                <Button variant="outline" size="sm" onClick={handleZoomIn}>
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex justify-center">
                <img
                  src={url}
                  alt={title}
                  style={{ transform: `scale(${zoom / 100})` }}
                  className="transition-transform"
                />
              </div>
            </div>
          )}

          {type === 'pdf' && (
            <iframe
              src={url}
              className="w-full h-[600px] rounded-lg"
              title={title}
            />
          )}

          {type === 'video' && (
            <video
              src={url}
              controls
              className="w-full rounded-lg"
            >
              مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند
            </video>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
