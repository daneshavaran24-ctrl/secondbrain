import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, Eye, Instagram, Send } from 'lucide-react';
import { Award } from '@/services/resumeService';
import { ResumeFileViewer } from './ResumeFileViewer';

interface ResumeAwardCardProps {
  award: Award;
  onEdit: () => void;
  onDelete: () => void;
}

export function ResumeAwardCard({ award, onEdit, onDelete }: ResumeAwardCardProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerType, setViewerType] = useState<'image' | 'video'>('image');
  const [viewerUrl, setViewerUrl] = useState('');

  const handleViewImage = () => {
    if (award.certificate_image_url) {
      setViewerUrl(award.certificate_image_url);
      setViewerType('image');
      setViewerOpen(true);
    }
  };

  const handleViewVideo = () => {
    if (award.video_url) {
      setViewerUrl(award.video_url);
      setViewerType('video');
      setViewerOpen(true);
    }
  };

  return (
    <>
      <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">{award.title}</h3>
            {award.category && (
              <Badge variant="secondary" className="mb-2">
                {award.category}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <p>
            <span className="font-medium">سازمان: </span>
            {award.issuing_organization}
          </p>
          <p>
            <span className="font-medium">تاریخ: </span>
            {new Date(award.award_date).toLocaleDateString('fa-IR')}
          </p>
          {award.description && (
            <p className="text-muted-foreground">{award.description}</p>
          )}
        </div>

        {award.certificate_image_url && (
          <div className="mt-4">
            <img
              src={award.certificate_image_url}
              alt={award.title}
              className="w-full h-48 object-cover rounded-lg cursor-pointer"
              onClick={handleViewImage}
            />
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full"
              onClick={handleViewImage}
            >
              <Eye className="w-4 h-4 mr-2" />
              مشاهده لوح تقدیر
            </Button>
          </div>
        )}

        {award.video_url && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2 w-full"
            onClick={handleViewVideo}
          >
            <Eye className="w-4 h-4 mr-2" />
            مشاهده ویدیو مراسم
          </Button>
        )}

        {award.media_links && Object.keys(award.media_links).length > 0 && (
          <div className="flex gap-2 mt-4">
            {award.media_links.instagram && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(award.media_links?.instagram, '_blank')}
              >
                <Instagram className="w-4 h-4 mr-2" />
                اینستاگرام
              </Button>
            )}
            {award.media_links.telegram && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(award.media_links?.telegram, '_blank')}
              >
                <Send className="w-4 h-4 mr-2" />
                تلگرام
              </Button>
            )}
          </div>
        )}
      </Card>

      <ResumeFileViewer
        url={viewerUrl}
        type={viewerType}
        title={award.title}
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </>
  );
}
