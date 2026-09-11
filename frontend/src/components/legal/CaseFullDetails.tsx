import React, { useState } from 'react';
import { Calendar, FileText, Download, Share2, Eye, Clock, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LegalCase, LawyerMeeting, LegalDocument } from '@/services/legalService';
import { DocumentViewerDialog } from './DocumentViewerDialog';
import { format } from 'date-fns';

interface CaseFullDetailsProps {
  legalCase: LegalCase;
  meetings: LawyerMeeting[];
  documents: LegalDocument[];
}

export function CaseFullDetails({ legalCase, meetings, documents }: CaseFullDetailsProps) {
  const [selectedDocument, setSelectedDocument] = useState<LegalDocument | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  };

  const getDocumentTypeLabel = (type: string) => {
    const types = {
      contract: 'قرارداد',
      petition: 'دادخواست',
      judgment: 'رأی',
      evidence: 'مدرک',
      correspondence: 'مکاتبات'
    };
    return types[type as keyof typeof types] || type;
  };

  const sortedMeetings = [...meetings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const sortedDocuments = [...documents].sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>اطلاعات کلی پرونده</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">نوع پرونده:</p>
              <p className="font-medium">
                {legalCase.type === 'civil' ? 'حقوقی' :
                 legalCase.type === 'commercial' ? 'تجاری' :
                 legalCase.type === 'family' ? 'خانواده' :
                 legalCase.type === 'criminal' ? 'کیفری' : 'اداری'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">تاریخ ایجاد:</p>
              <p className="font-medium">{format(new Date(legalCase.createdAt), 'yyyy/MM/dd')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">وکیل مسئول:</p>
              <p className="font-medium">{legalCase.lawyer}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">طرف مقابل:</p>
              <p className="font-medium">{legalCase.opponent}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">دادگاه:</p>
              <p className="font-medium">{legalCase.court}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">هزینه کل پرونده:</p>
              <p className="font-medium text-lg">{formatCurrency(legalCase.totalCost)}</p>
            </div>
          </div>
          
          {legalCase.nextHearing && (
            <>
              <Separator />
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-yellow-600" />
                  <p className="font-medium text-yellow-800">جلسه بعدی</p>
                </div>
                <p className="text-yellow-700">{format(new Date(legalCase.nextHearing), 'yyyy/MM/dd')}</p>
              </div>
            </>
          )}
          
          {legalCase.description && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-2">توضیحات پرونده:</p>
                <p className="text-sm leading-relaxed">{legalCase.description}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Meetings History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            تاریخچه جلسات ({meetings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {meetings.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">هیچ جلسه‌ای ثبت نشده است</p>
          ) : (
            <div className="space-y-4">
              {sortedMeetings.map((meeting, index) => (
                <Card key={meeting.id} className="border border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium">جلسه با {meeting.lawyer}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(meeting.date), 'yyyy/MM/dd')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {meeting.duration} دقیقه
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {formatCurrency(meeting.cost)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">خلاصه جلسه:</p>
                        <p className="text-sm mt-1">{meeting.summary}</p>
                      </div>
                      
                      {meeting.recommendations?.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">توصیه‌ها:</p>
                          <ul className="text-sm mt-1 space-y-1">
                            {meeting.recommendations.map((rec, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {meeting.nextActions?.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">اقدامات بعدی:</p>
                          <ul className="text-sm mt-1 space-y-1">
                            {meeting.nextActions.map((action, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="w-1 h-1 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            اسناد پرونده ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">هیچ سندی آپلود نشده است</p>
          ) : (
            <div className="space-y-3">
              {sortedDocuments.map((doc) => (
                <Card key={doc.id} className="border border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <p className="font-medium">{doc.name}</p>
                          <Badge variant="outline" className="text-xs">
                            {getDocumentTypeLabel(doc.type)}
                          </Badge>
                          {doc.isShared && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                              <Share2 className="h-3 w-3 ml-1" />
                              اشتراک‌گذاری شده
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                          <span>تاریخ آپلود: {format(new Date(doc.uploadDate), 'yyyy/MM/dd')}</span>
                        </div>
                        
                        {doc.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {doc.tags.map((tag, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setSelectedDocument(doc);
                            setViewerOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setSelectedDocument(doc);
                            setViewerOpen(true);
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <DocumentViewerDialog
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        document={selectedDocument}
      />
    </div>
  );
}