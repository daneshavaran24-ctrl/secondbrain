import { Phone, Video, Monitor, Edit, Trash2, Clock, Calendar, User, Building2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CompanyCall } from '@/services/companyCallsService';
import { format } from 'date-fns';
import { faIR } from 'date-fns/locale';

interface CompanyCallCardProps {
  call: CompanyCall;
  onEdit: () => void;
  onDelete: () => void;
}

export const CompanyCallCard = ({ call, onEdit, onDelete }: CompanyCallCardProps) => {
  const getCallTypeIcon = () => {
    switch (call.call_type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'online_meeting':
        return <Monitor className="h-4 w-4" />;
      default:
        return <Phone className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    switch (call.status) {
      case 'completed':
        return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'scheduled':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'missed':
        return 'bg-red-500/10 text-red-700 dark:text-red-400';
      case 'cancelled':
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
      default:
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
    }
  };

  const getPriorityColor = () => {
    switch (call.priority) {
      case 'urgent':
        return 'bg-red-500/10 text-red-700 dark:text-red-400';
      case 'high':
        return 'bg-orange-500/10 text-orange-700 dark:text-orange-400';
      case 'low':
        return 'bg-green-500/10 text-green-700 dark:text-green-400';
      default:
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
    }
  };

  const getStatusLabel = () => {
    const labels: Record<string, string> = {
      completed: 'انجام شده',
      scheduled: 'برنامه‌ریزی شده',
      missed: 'از دست رفته',
      cancelled: 'لغو شده',
      in_progress: 'در حال انجام',
    };
    return labels[call.status] || call.status;
  };

  const needsFollowUp = call.follow_up_date && new Date(call.follow_up_date) <= new Date();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${getStatusColor()}`}>
                {getCallTypeIcon()}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{call.title}</h3>
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(call.call_date), 'PPP', { locale: faIR })}
                  </div>
                  {call.duration > 0 && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {call.duration} دقیقه
                    </div>
                  )}
                </div>
              </div>
            </div>

            {call.contact_name && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{call.contact_name}</span>
                {call.contact_phone && (
                  <span className="text-muted-foreground">• {call.contact_phone}</span>
                )}
              </div>
            )}

            {call.contact_organization && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>{call.contact_organization}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={getStatusColor()}>
                {getStatusLabel()}
              </Badge>
              <Badge variant="outline" className={getPriorityColor()}>
                {call.priority === 'urgent' && 'فوری'}
                {call.priority === 'high' && 'بالا'}
                {call.priority === 'medium' && 'متوسط'}
                {call.priority === 'low' && 'کم'}
              </Badge>
              {call.category && (
                <Badge variant="secondary">
                  {call.category === 'sales' && 'فروش'}
                  {call.category === 'support' && 'پشتیبانی'}
                  {call.category === 'follow_up' && 'پیگیری'}
                  {call.category === 'negotiation' && 'مذاکره'}
                </Badge>
              )}
              {call.direction === 'inbound' && (
                <Badge variant="outline">تماس ورودی</Badge>
              )}
            </div>

            {call.summary && (
              <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                {call.summary}
              </p>
            )}

            {call.outcome && (
              <div className="text-sm">
                <span className="font-medium">نتیجه:</span> {call.outcome}
              </div>
            )}

            {needsFollowUp && (
              <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400 bg-orange-500/10 p-2 rounded">
                <AlertCircle className="h-4 w-4" />
                <span>نیاز به پیگیری</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
