import React, { useState, useEffect } from 'react';
import { StickyNote, Search, Plus, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { legalService, LawyerNote, LegalCase } from '@/services/legalService';
import { LawyerNoteCard } from './LawyerNoteCard';
import { LawyerNotesDialog } from './LawyerNotesDialog';
import { useToast } from '@/hooks/use-toast';

interface LawyerNotesSectionProps {
  cases: LegalCase[];
}

export function LawyerNotesSection({ cases }: LawyerNotesSectionProps) {
  const { toast } = useToast();
  const [notes, setNotes] = useState<LawyerNote[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<LawyerNote[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCase, setFilterCase] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isNewNoteOpen, setIsNewNoteOpen] = useState(false);
  const [selectedCaseForNewNote, setSelectedCaseForNewNote] = useState<string>('');
  const [editingNote, setEditingNote] = useState<LawyerNote | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [notes, searchTerm, filterCase, filterCategory, filterStatus]);

  const loadNotes = async () => {
    try {
      const allNotes = await legalService.getLawyerNotes();
      setNotes(allNotes);
    } catch (error) {
      console.error('Failed to load notes:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری یادداشت‌ها",
        variant: "destructive",
      });
    }
  };

  const applyFilters = () => {
    let result = [...notes];

    // Search filter
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(note =>
        note.content.toLowerCase().includes(lower) ||
        (note.title && note.title.toLowerCase().includes(lower))
      );
    }

    // Case filter
    if (filterCase !== 'all') {
      result = result.filter(note => note.caseId === filterCase);
    }

    // Category filter
    if (filterCategory !== 'all') {
      result = result.filter(note => note.category === filterCategory);
    }

    // Status filter
    if (filterStatus === 'starred') {
      result = result.filter(note => note.isStarred);
    } else if (filterStatus !== 'all') {
      result = result.filter(note => note.status === filterStatus);
    }

    // Sort by date (newest first)
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setFilteredNotes(result);
  };

  const handleNoteCreated = (note: LawyerNote) => {
    setNotes(prev => [note, ...prev]);
    setIsNewNoteOpen(false);
  };

  const handleNoteUpdated = (updatedNote: LawyerNote) => {
    setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
    setIsEditDialogOpen(false);
    setEditingNote(null);
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await legalService.deleteLawyerNote(noteId);
      setNotes(prev => prev.filter(n => n.id !== noteId));
      toast({
        title: "موفقیت",
        description: "یادداشت حذف شد",
      });
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در حذف یادداشت",
        variant: "destructive",
      });
    }
  };

  const handleToggleStar = async (noteId: string) => {
    try {
      await legalService.toggleNoteStar(noteId);
      setNotes(prev => prev.map(n =>
        n.id === noteId ? { ...n, isStarred: !n.isStarred } : n
      ));
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در به‌روزرسانی یادداشت",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (noteId: string) => {
    try {
      await legalService.toggleNoteStatus(noteId);
      setNotes(prev => prev.map(n =>
        n.id === noteId
          ? { ...n, status: n.status === 'pending' ? 'completed' : 'pending' }
          : n
      ));
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در به‌روزرسانی وضعیت",
        variant: "destructive",
      });
    }
  };

  const handleEditNote = (note: LawyerNote) => {
    setEditingNote(note);
    setIsEditDialogOpen(true);
  };

  const getCaseTitle = (caseId: string) => {
    const caseItem = cases.find(c => c.id === caseId);
    return caseItem?.title || 'نامشخص';
  };

  const stats = {
    total: notes.length,
    starred: notes.filter(n => n.isStarred).length,
    pending: notes.filter(n => n.status === 'pending').length,
    todayReminders: notes.filter(n =>
      n.reminderDate && new Date(n.reminderDate).toDateString() === new Date().toDateString()
    ).length
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <StickyNote className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">کل یادداشت‌ها</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">ستاره‌دار</p>
                <p className="text-2xl font-bold">{stats.starred}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                <span className="text-orange-500 font-bold">⏳</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">در انتظار</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                <span className="text-red-500 font-bold">🔔</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">یادآوری امروز</p>
                <p className="text-2xl font-bold">{stats.todayReminders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>یادداشت‌های وکیل</span>
            <Button onClick={() => {
              setSelectedCaseForNewNote('');
              setIsNewNoteOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              یادداشت جدید
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="جستجو..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>

            <Select value={filterCase} onValueChange={setFilterCase}>
              <SelectTrigger>
                <SelectValue placeholder="فیلتر پرونده" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه پرونده‌ها</SelectItem>
                {cases.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="دسته‌بندی" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه دسته‌ها</SelectItem>
                <SelectItem value="meeting-prep">آماده‌سازی جلسه</SelectItem>
                <SelectItem value="follow-up">پیگیری</SelectItem>
                <SelectItem value="important">مهم</SelectItem>
                <SelectItem value="reminder">یادآوری</SelectItem>
                <SelectItem value="general">عمومی</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                <SelectItem value="starred">ستاره‌دار</SelectItem>
                <SelectItem value="pending">در انتظار</SelectItem>
                <SelectItem value="completed">انجام شده</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes List */}
          <div className="space-y-3 mt-6">
            {filteredNotes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <StickyNote className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>یادداشتی یافت نشد</p>
              </div>
            ) : (
              filteredNotes.map(note => (
                <LawyerNoteCard
                  key={note.id}
                  note={note}
                  caseTitle={getCaseTitle(note.caseId)}
                  onDelete={handleDeleteNote}
                  onToggleStar={handleToggleStar}
                  onToggleStatus={handleToggleStatus}
                  onEdit={handleEditNote}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* New Note Dialog */}
      {isNewNoteOpen && (
        <LawyerNotesDialog
          open={isNewNoteOpen}
          onOpenChange={setIsNewNoteOpen}
          caseId={selectedCaseForNewNote || (cases[0]?.id || '')}
          caseTitle={getCaseTitle(selectedCaseForNewNote || cases[0]?.id)}
          onNoteSaved={handleNoteCreated}
          mode="create"
        />
      )}

      {/* Edit Note Dialog */}
      {editingNote && (
        <LawyerNotesDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          caseId={editingNote.caseId}
          caseTitle={getCaseTitle(editingNote.caseId)}
          onNoteSaved={handleNoteUpdated}
          mode="edit"
          existingNote={editingNote}
        />
      )}
    </div>
  );
}
