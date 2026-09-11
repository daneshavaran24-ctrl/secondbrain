import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2 } from 'lucide-react';
import { Affiliation } from '@/services/resumeService';

interface ResumeAffiliationCardProps {
  affiliation: Affiliation;
  onEdit: () => void;
  onDelete: () => void;
}

export function ResumeAffiliationCard({ affiliation, onEdit, onDelete }: ResumeAffiliationCardProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long' });
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">{affiliation.organization_name}</h3>
          <p className="text-sm text-muted-foreground mb-2">{affiliation.position}</p>
          {affiliation.category && (
            <Badge variant="secondary">{affiliation.category}</Badge>
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

      <div className="text-sm text-muted-foreground mb-4">
        {formatDate(affiliation.start_date)} -{' '}
        {affiliation.end_date ? formatDate(affiliation.end_date) : 'در حال حاضر'}
      </div>

      {affiliation.description && (
        <p className="text-sm text-muted-foreground mb-4">{affiliation.description}</p>
      )}

      {affiliation.responsibilities && affiliation.responsibilities.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">مسئولیت‌ها:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {affiliation.responsibilities.map((resp, index) => (
              <li key={index}>{resp}</li>
            ))}
          </ul>
        </div>
      )}

      {affiliation.media_urls && Object.keys(affiliation.media_urls).length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {Object.values(affiliation.media_urls).map((url, index) => (
            <img
              key={index}
              src={url}
              alt={`رویداد ${index + 1}`}
              className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-80"
              onClick={() => window.open(url, '_blank')}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
