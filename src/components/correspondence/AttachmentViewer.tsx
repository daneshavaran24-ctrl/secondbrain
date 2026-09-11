import { useState } from "react";
import { FileText, Image as ImageIcon, File, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Attachment {
  id: string;
  type: 'file' | 'image' | 'pdf' | 'link';
  name: string;
  url: string;
  size?: number;
}

interface AttachmentViewerProps {
  attachments: Attachment[];
}

export function AttachmentViewer({ attachments }: AttachmentViewerProps) {
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="h-4 w-4" />;
      case 'pdf': return <FileText className="h-4 w-4" />;
      case 'link': return <ExternalLink className="h-4 w-4" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleView = (attachment: Attachment) => {
    if (attachment.type === 'link') {
      window.open(attachment.url, '_blank');
    } else {
      setSelectedAttachment(attachment);
    }
  };

  return (
    <>
      <div className="space-y-2">
        <div className="text-sm font-medium text-muted-foreground">پیوست‌ها:</div>
        <div className="flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <Button
              key={attachment.id}
              variant="outline"
              size="sm"
              onClick={() => handleView(attachment)}
              className="flex items-center gap-2"
            >
              {getIcon(attachment.type)}
              <span className="truncate max-w-[150px]">{attachment.name}</span>
              {attachment.size && (
                <span className="text-xs text-muted-foreground">
                  ({formatSize(attachment.size)})
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>

      <Dialog open={!!selectedAttachment} onOpenChange={() => setSelectedAttachment(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedAttachment?.name}</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto">
            {selectedAttachment?.type === 'image' && (
              <img
                src={selectedAttachment.url}
                alt={selectedAttachment.name}
                className="w-full h-auto"
              />
            )}
            {selectedAttachment?.type === 'pdf' && (
              <iframe
                src={selectedAttachment.url}
                className="w-full h-[70vh]"
                title={selectedAttachment.name}
              />
            )}
            {selectedAttachment?.type === 'file' && (
              <div className="text-center p-8">
                <File className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">
                  نمایش پیش‌نمایش برای این فایل در دسترس نیست
                </p>
                <Button asChild>
                  <a href={selectedAttachment.url} download target="_blank" rel="noopener noreferrer">
                    دانلود فایل
                  </a>
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
