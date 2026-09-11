import React from 'react';
import { Calendar, FileText, DollarSign, Users, AlertTriangle, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LegalCase, LawyerMeeting, LegalDocument } from '@/services/legalService';
import { format } from 'date-fns';

interface CaseDashboardProps {
  legalCase: LegalCase;
  meetings: LawyerMeeting[];
  documents: LegalDocument[];
  onNewMeeting: () => void;
  onUploadDocument: () => void;
  onNewDeadline: () => void;
}

export function CaseDashboard({ 
  legalCase, 
  meetings, 
  documents, 
  onNewMeeting, 
  onUploadDocument, 
  onNewDeadline 
}: CaseDashboardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-500/10 text-green-700 border-green-200',
      pending: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
      completed: 'bg-blue-500/10 text-blue-700 border-blue-200',
      suspended: 'bg-red-500/10 text-red-700 border-red-200'
    };
    return variants[status as keyof typeof variants] || variants.pending;
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: 'bg-red-500/10 text-red-700 border-red-200',
      medium: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
      low: 'bg-green-500/10 text-green-700 border-green-200'
    };
    return variants[priority as keyof typeof variants] || variants.medium;
  };

  return (
    <div className="space-y-6">
      {/* Case Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{legalCase.title}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={getStatusBadge(legalCase.status)}>
              {legalCase.status === 'active' ? 'فعال' :
               legalCase.status === 'pending' ? 'در انتظار' :
               legalCase.status === 'completed' ? 'تمام شده' : 'متوقف'}
            </Badge>
            <Badge className={getPriorityBadge(legalCase.priority)}>
              {legalCase.priority === 'high' ? 'بالا' :
               legalCase.priority === 'medium' ? 'متوسط' : 'پایین'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">وکیل:</p>
              <p className="font-medium">{legalCase.lawyer}</p>
            </div>
            <div>
              <p className="text-muted-foreground">طرف مقابل:</p>
              <p className="font-medium">{legalCase.opponent}</p>
            </div>
            <div>
              <p className="text-muted-foreground">دادگاه:</p>
              <p className="font-medium">{legalCase.court}</p>
            </div>
            <div>
              <p className="text-muted-foreground">هزینه کل:</p>
              <p className="font-medium">{formatCurrency(legalCase.totalCost)}</p>
            </div>
          </div>
          {legalCase.description && (
            <div className="mt-4">
              <p className="text-muted-foreground text-sm">توضیحات:</p>
              <p className="text-sm mt-1">{legalCase.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next Hearing Alert */}
      {legalCase.nextHearing && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">جلسه بعدی</p>
                <p className="text-sm text-yellow-700">
                  {format(new Date(legalCase.nextHearing), 'yyyy/MM/dd')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">جلسات</p>
                <p className="text-2xl font-bold">{meetings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">اسناد</p>
                <p className="text-2xl font-bold">{documents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">هزینه جلسات</p>
                <p className="text-lg font-bold">
                  {formatCurrency(meetings.reduce((sum, m) => sum + m.cost, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">اقدامات سریع</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button onClick={onNewMeeting} className="w-full">
              <Plus className="h-4 w-4 ml-2" />
              جلسه جدید
            </Button>
            <Button onClick={onUploadDocument} variant="outline" className="w-full">
              <Plus className="h-4 w-4 ml-2" />
              آپلود سند
            </Button>
            <Button onClick={onNewDeadline} variant="outline" className="w-full">
              <Calendar className="h-4 w-4 ml-2" />
              تنظیم مهلت
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {meetings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">آخرین جلسه</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">تاریخ:</span>
                <span className="font-medium">{format(new Date(meetings[0].date), 'yyyy/MM/dd')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">مدت:</span>
                <span className="font-medium">{meetings[0].duration} دقیقه</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">خلاصه:</p>
                <p className="text-sm">{meetings[0].summary}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}