import React, { useState } from 'react';
import { Upload, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MeetingFileUploader } from '@/components/organizational/MeetingFileUploader';
import type { Meeting } from '@/types';

interface MeetingUploadButtonProps {
  meeting: Meeting;
  variant?: 'icon' | 'button';
  label?: string;
  onUploaded?: () => void;
}

export const MeetingUploadButton: React.FC<MeetingUploadButtonProps> = ({
  meeting,
  variant = 'button',
  label = 'آپلود فایل',
  onUploaded
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleUpdate = () => {
    onUploaded?.();
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1"
      >
        {variant === 'icon' ? (
          <Upload className="h-3 w-3" />
        ) : (
          <>
            <File className="h-3 w-3" />
            {label}
          </>
        )}
      </Button>

      <MeetingFileUploader
        meeting={meeting}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onUpdate={handleUpdate}
      />
    </>
  );
};