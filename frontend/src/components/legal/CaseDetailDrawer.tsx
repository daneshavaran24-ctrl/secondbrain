import React, { useState, useEffect } from 'react';
import { X, BarChart3, FileText, StickyNote } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LegalCase, LawyerMeeting, LegalDocument, LawyerNote, legalService } from '@/services/legalService';
import { CaseDashboard } from './CaseDashboard';
import { CaseFullDetails } from './CaseFullDetails';
import { LawyerNotesDialog } from './LawyerNotesDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface CaseDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  legalCase: LegalCase;
  meetings: LawyerMeeting[];
  documents: LegalDocument[];
  onNewMeeting: () => void;
  onUploadDocument: () => void;
  onNewDeadline: () => void;
}

export function CaseDetailDrawer({ 
  open, 
  onOpenChange, 
  legalCase, 
  meetings, 
  documents,
  onNewMeeting,
  onUploadDocument,
  onNewDeadline
}: CaseDetailDrawerProps) {
  const { toast } = useToast();
  const [lawyerNotes, setLawyerNotes] = useState<LawyerNote[]>([]);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);

  // Load lawyer notes for this case
  useEffect(() => {
    if (open && legalCase) {
      const loadNotes = async () => {
        try {
          const notes = await legalService.getNotesByCase(legalCase.id);
          setLawyerNotes(notes);
        } catch (error) {
          console.error('Failed to load lawyer notes:', error);
        }
      };
      loadNotes();
    }
  }, [open, legalCase]);

  const handleNoteSaved = async (note: LawyerNote) => {
    try {
      const savedNote = await legalService.createLawyerNote({
        caseId: legalCase.id,
        content: note.content,
        hasAudio: note.hasAudio,
        audioUrl: note.audioUrl,
        type: 'lawyer_notes',
        userId: 'default', // This should come from auth context
        category: note.category || 'general',
        isStarred: note.isStarred || false,
        status: note.status || 'pending',
        title: note.title,
        reminderDate: note.reminderDate
      });
      
      setLawyerNotes(prev => [...prev, savedNote]);
      
      toast({
        title: "موفقیت",
        description: "یادداشت ذخیره شد"
      });
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: "خطا",
        description: "خطا در ذخیره یادداشت",
        variant: "destructive"
      });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await legalService.deleteLawyerNote(noteId);
      setLawyerNotes(prev => prev.filter(n => n.id !== noteId));
      
      toast({
        title: "حذف شد",
        description: "یادداشت حذف شد"
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "خطا",
        description: "خطا در حذف یادداشت",
        variant: "destructive"
      });
    }
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full sm:w-[600px] lg:w-[800px] p-0 overflow-hidden">
        <div className="h-full flex flex-col">
          <SheetHeader className="p-6 pb-4 flex-shrink-0 border-b">
            <div className="flex items-start justify-between">
              <div>
                <SheetTitle className="text-right text-lg">{legalCase.title}</SheetTitle>
                <p className="text-sm text-muted-foreground text-right">
                  جزئیات و اطلاعات کامل پرونده
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="dashboard" className="h-full flex flex-col">
              <div className="px-6 pt-4 pb-2 flex-shrink-0">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="dashboard" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    داشبورد
                  </TabsTrigger>
                  <TabsTrigger value="details" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    اطلاعات کامل
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="flex items-center gap-2">
                    <StickyNote className="h-4 w-4" />
                    یادداشت‌ها ({lawyerNotes.length})
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto">
                <TabsContent value="dashboard" className="p-6 pt-2 m-0">
                  <CaseDashboard
                    legalCase={legalCase}
                    meetings={meetings}
                    documents={documents}
                    onNewMeeting={onNewMeeting}
                    onUploadDocument={onUploadDocument}
                    onNewDeadline={onNewDeadline}
                  />
                </TabsContent>

                <TabsContent value="details" className="p-6 pt-2 m-0">
                  <CaseFullDetails
                    legalCase={legalCase}
                    meetings={meetings}
                    documents={documents}
                  />
                </TabsContent>

                <TabsContent value="notes" className="p-6 pt-2 m-0">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">یادداشت‌های وکیل</h3>
                      <Button onClick={() => setIsNotesDialogOpen(true)}>
                        <StickyNote className="h-4 w-4 mr-2" />
                        یادداشت جدید
                      </Button>
                    </div>

                    {lawyerNotes.length === 0 ? (
                      <Card>
                        <CardContent className="p-8 text-center">
                          <StickyNote className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            هنوز یادداشتی برای این پرونده ثبت نشده است
                          </p>
                          <Button 
                            className="mt-4" 
                            onClick={() => setIsNotesDialogOpen(true)}
                          >
                            اولین یادداشت را ایجاد کنید
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-3">
                        {lawyerNotes.map((note) => (
                          <Card key={note.id} className="relative">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <CardTitle className="text-sm">
                                    یادداشت {format(new Date(note.createdAt), 'yyyy/MM/dd HH:mm')}
                                  </CardTitle>
                                  {note.hasAudio && (
                                    <Badge variant="secondary" className="text-xs">
                                      دارای فایل صوتی
                                    </Badge>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {note.content}
                              </p>
                              {note.hasAudio && note.audioUrl && (
                                <div className="mt-3 p-2 bg-muted rounded-md">
                                  <audio controls className="w-full h-8">
                                    <source src={note.audioUrl} type="audio/webm" />
                                    مرورگر شما از پخش فایل صوتی پشتیبانی نمی‌کند.
                                  </audio>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </SheetContent>

      <LawyerNotesDialog
        open={isNotesDialogOpen}
        onOpenChange={setIsNotesDialogOpen}
        caseId={legalCase.id}
        caseTitle={legalCase.title}
        onNoteSaved={handleNoteSaved}
      />
    </Sheet>
  );
}