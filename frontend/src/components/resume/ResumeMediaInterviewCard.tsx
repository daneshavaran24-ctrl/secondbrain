import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, Eye, Headphones, Video } from 'lucide-react';
import { MediaInterview } from '@/services/resumeService';
import { ResumeFileViewer } from './ResumeFileViewer';

interface ResumeMediaInterviewCardProps {
  interview: MediaInterview;
  onEdit: () => void;
  onDelete: () => void;
}

export function ResumeMediaInterviewCard({ interview, onEdit, onDelete }: ResumeMediaInterviewCardProps) {
  const [viewerOpen, setViewerOpen] = useState(false);

  const getIcon = () => {
    switch (interview.content_type) {
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'podcast':
        return <Headphones className="w-5 h-5" />;
      default:
        return <Eye className="w-5 h-5" />;
    }
  };

  const getContentTypeLabel = () => {
    switch (interview.content_type) {
      case 'video':
        return 'ویدیو';
      case 'podcast':
        return 'پادکست';
      default:
        return 'متنی';
    }
  };

  const isYouTubeOrAparat = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('aparat.com');
  };

  return (
    <>
      <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">{interview.title}</h3>
            <div className="flex gap-2 mb-2">
              <Badge variant="secondary">{getContentTypeLabel()}</Badge>
              <Badge variant="outline">{interview.media_source}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {new Date(interview.interview_date).toLocaleDateString('fa-IR')}
            </p>
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

        {interview.description && (
          <p className="text-sm text-muted-foreground mb-4">{interview.description}</p>
        )}

        {interview.topics && interview.topics.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {interview.topics.map((topic, index) => (
              <Badge key={index} variant="outline">
                {topic}
              </Badge>
            ))}
          </div>
        )}

        {interview.content_url && (
          <div className="space-y-2">
            {interview.content_type === 'video' && isYouTubeOrAparat(interview.content_url) && (
              <div className="aspect-video">
                <iframe
                  src={interview.content_url.replace('watch?v=', 'embed/')}
                  className="w-full h-full rounded"
                  allowFullScreen
                />
              </div>
            )}

            {interview.content_type === 'podcast' && !isYouTubeOrAparat(interview.content_url) && (
              <audio controls className="w-full">
                <source src={interview.content_url} />
              </audio>
            )}

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() =>
                isYouTubeOrAparat(interview.content_url!)
                  ? window.open(interview.content_url, '_blank')
                  : setViewerOpen(true)
              }
            >
              {getIcon()}
              <span className="mr-2">مشاهده محتوا</span>
            </Button>
          </div>
        )}
      </Card>

      {interview.content_url && !isYouTubeOrAparat(interview.content_url) && (
        <ResumeFileViewer
          url={interview.content_url}
          type={interview.content_type === 'video' ? 'video' : interview.content_type === 'podcast' ? 'video' : 'pdf'}
          title={interview.title}
          open={viewerOpen}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}
