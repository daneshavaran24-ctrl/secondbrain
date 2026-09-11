import React from 'react';
import { Star, Trash2, Edit, Volume2, Calendar, CheckCircle, Circle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LawyerNote } from '@/services/legalService';
import { format } from 'date-fns';
import { faIR } from 'date-fns/locale';

interface LawyerNoteCardProps {
  note: LawyerNote;
  caseTitle: string;
  onDelete: (noteId: string) => void;
  onToggleStar: (noteId: string) => void;
  onToggleStatus: (noteId: string) => void;
  onEdit: (note: LawyerNote) => void;
}

export function LawyerNoteCard({
  note,
  caseTitle,
  onDelete,
  onToggleStar,
  onToggleStatus,
  onEdit
}: LawyerNoteCardProps) {
  const categoryLabels = {
    'meeting-prep': 'آماده‌سازی جلسه',
    'follow-up': 'پیگیری',
    'important': 'مهم',
    'reminder': 'یادآوری',
    'general': 'عمومی'
  };

  const categoryColors = {
    'meeting-prep': 'bg-blue-500/10 text-blue-700 border-blue-200',
    'follow-up': 'bg-purple-500/10 text-purple-700 border-purple-200',
    'important': 'bg-red-500/10 text-red-700 border-red-200',
    'reminder': 'bg-orange-500/10 text-orange-700 border-orange-200',
    'general': 'bg-gray-500/10 text-gray-700 border-gray-200'
  };

  const isOverdue = note.reminderDate && new Date(note.reminderDate) < new Date() && note.status === 'pending';
  const isToday = note.reminderDate && new Date(note.reminderDate).toDateString() === new Date().toDateString();

  return (
    <Card className={`transition-all hover:shadow-md ${note.isStarred ? 'border-yellow-300 bg-yellow-50/30' : ''} ${isOverdue ? 'border-red-300 bg-red-50/30' : ''}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleStar(note.id)}
                  className="p-1 h-auto"
                >
                  <Star className={`h-4 w-4 ${note.isStarred ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} />
                </Button>
                
                {note.title && (
                  <h4 className="font-semibold text-foreground">{note.title}</h4>
                )}
                
                <Badge variant="outline" className="text-xs">
                  پرونده: {caseTitle}
                </Badge>
              </div>

              {/* Metadata badges */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={categoryColors[note.category]}>
                  {categoryLabels[note.category]}
                </Badge>
                
                <span className="text-xs text-muted-foreground">
                  📅 {format(new Date(note.createdAt), 'yyyy/MM/dd HH:mm', { locale: faIR })}
                </span>

                {note.reminderDate && (
                  <Badge variant={isToday ? 'default' : 'outline'} className={isOverdue ? 'bg-red-500 text-white' : ''}>
                    <Calendar className="h-3 w-3 mr-1" />
                    یادآوری: {format(new Date(note.reminderDate), 'yyyy/MM/dd')}
                  </Badge>
                )}

                {note.hasAudio && (
                  <Badge variant="outline" className="text-blue-600">
                    <Volume2 className="h-3 w-3 mr-1" />
                    دارای فایل صوتی
                  </Badge>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleStatus(note.id)}
                  className="p-1 h-auto"
                >
                  {note.status === 'completed' ? (
                    <Badge className="bg-green-500/10 text-green-700 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      انجام شده
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-orange-600">
                      <Circle className="h-3 w-3 mr-1" />
                      در انتظار
                    </Badge>
                  )}
                </Button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(note)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(note.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="text-sm text-foreground whitespace-pre-wrap pr-8">
            {note.content}
          </div>

          {/* Audio player */}
          {note.audioUrl && (
            <div className="pr-8">
              <audio controls className="w-full h-8" src={note.audioUrl}>
                مرورگر شما از پخش صوت پشتیبانی نمی‌کند
              </audio>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
