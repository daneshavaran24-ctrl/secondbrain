import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, Eye, ExternalLink, BookOpen } from 'lucide-react';
import { Publication } from '@/services/resumeService';
import { ResumeFileViewer } from './ResumeFileViewer';

interface ResumePublicationCardProps {
  publication: Publication;
  onEdit: () => void;
  onDelete: () => void;
}

export function ResumePublicationCard({ publication, onEdit, onDelete }: ResumePublicationCardProps) {
  const [viewerOpen, setViewerOpen] = useState(false);

  return (
    <>
      <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="flex gap-4">
          {publication.cover_image_url ? (
            <img
              src={publication.cover_image_url}
              alt={publication.title}
              className="w-32 h-40 object-cover rounded shadow-md cursor-pointer hover:scale-105 transition-transform"
              onClick={() => window.open(publication.cover_image_url, '_blank')}
            />
          ) : (
            <div className="w-32 h-40 bg-muted rounded flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-muted-foreground" />
            </div>
          )}

          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-semibold mb-2">{publication.title}</h3>
                {publication.publication_type && (
                  <Badge variant="secondary" className="mb-2">
                    {publication.publication_type}
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

            <div className="space-y-1 text-sm">
              {publication.publisher && (
                <p>
                  <span className="font-medium">ناشر: </span>
                  {publication.publisher}
                </p>
              )}
              <p>
                <span className="font-medium">تاریخ انتشار: </span>
                {new Date(publication.publication_date).toLocaleDateString('fa-IR')}
              </p>
              {publication.isbn && (
                <p>
                  <span className="font-medium">شابک: </span>
                  {publication.isbn}
                </p>
              )}
              {publication.co_authors && publication.co_authors.length > 0 && (
                <p>
                  <span className="font-medium">نویسندگان مشترک: </span>
                  {publication.co_authors.join('، ')}
                </p>
              )}
            </div>

            {publication.description && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {publication.description}
              </p>
            )}

            <div className="flex gap-2 mt-4">
              {publication.pdf_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewerOpen(true)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  پیش‌نمایش PDF
                </Button>
              )}
              {publication.external_link && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(publication.external_link, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  دانلود/خرید
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {publication.pdf_url && (
        <ResumeFileViewer
          url={publication.pdf_url}
          type="pdf"
          title={publication.title}
          open={viewerOpen}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}
