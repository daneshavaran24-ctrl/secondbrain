import { supabase } from '@/integrations/supabase/client';
import { getStoredUser } from '@/lib/api';

export interface LegalCase {
  id: string;
  title: string;
  type: 'civil' | 'commercial' | 'family' | 'criminal' | 'administrative';
  status: 'active' | 'pending' | 'completed' | 'suspended';
  lawyer: string;
  opponent: string;
  court: string;
  nextHearing?: string;
  description: string;
  totalCost: number;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
  organizationId?: string;
  userId: string;
}

export interface LawyerMeeting {
  id: string;
  caseId: string;
  lawyer: string;
  date: string;
  duration: number;
  summary: string;
  recommendations: string[];
  cost: number;
  nextActions: string[];
  organizationId?: string;
  userId: string;
}

export interface LegalDocument {
  id: string;
  caseId: string;
  name: string;
  type: 'contract' | 'petition' | 'judgment' | 'evidence' | 'correspondence';
  uploadDate: string;
  tags: string[];
  isShared: boolean;
  organizationId?: string;
  userId: string;
  // Storage-related fields
  storageBucket?: string;
  storagePath?: string;
  mimeType?: string;
  size?: number;
}

export interface LawyerNote {
  id: string;
  caseId: string;
  content: string;
  hasAudio: boolean;
  audioUrl?: string | null;
  createdAt: string;
  updatedAt?: string;
  type: 'lawyer_notes';
  organizationId?: string;
  userId?: string;
  // New fields
  title?: string;
  category: 'meeting-prep' | 'follow-up' | 'important' | 'reminder' | 'general';
  isStarred: boolean;
  reminderDate?: string;
  status: 'pending' | 'completed';
}

class LegalService {
  private get STORAGE_KEYS() {
    const user = getStoredUser();
    const prefix = user?.id ? `legal_${user.id}` : 'legal';
    return {
      CASES: `${prefix}_cases`,
      MEETINGS: `${prefix}_meetings`,
      DOCUMENTS: `${prefix}_documents`,
      LAWYER_NOTES: `${prefix}_notes`,
    };
  }

  // Local Storage Methods
  async saveCasesToStorage(cases: LegalCase[]): Promise<void> {
    localStorage.setItem(this.STORAGE_KEYS.CASES, JSON.stringify(cases));
  }

  async loadCasesFromStorage(): Promise<LegalCase[]> {
    const stored = localStorage.getItem(this.STORAGE_KEYS.CASES);
    return stored ? JSON.parse(stored) : [];
  }

  async saveMeetingsToStorage(meetings: LawyerMeeting[]): Promise<void> {
    localStorage.setItem(this.STORAGE_KEYS.MEETINGS, JSON.stringify(meetings));
  }

  async loadMeetingsFromStorage(): Promise<LawyerMeeting[]> {
    const stored = localStorage.getItem(this.STORAGE_KEYS.MEETINGS);
    return stored ? JSON.parse(stored) : [];
  }

  async saveDocumentsToStorage(documents: LegalDocument[]): Promise<void> {
    localStorage.setItem(this.STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents));
  }

  async loadDocumentsFromStorage(): Promise<LegalDocument[]> {
    const stored = localStorage.getItem(this.STORAGE_KEYS.DOCUMENTS);
    return stored ? JSON.parse(stored) : [];
  }

  // Supabase Methods - convert between interface and DB formats
  private mapCaseToSupabase(legalCase: LegalCase) {
    return {
      id: legalCase.id,
      case_number: legalCase.id,
      title: legalCase.title,
      case_type: legalCase.type,
      status: legalCase.status,
      judge: legalCase.lawyer,
      opposing_party: legalCase.opponent,
      court: legalCase.court,
      next_hearing_date: legalCase.nextHearing || null,
      description: legalCase.description,
      domain: 'personal',
      user_id: legalCase.userId,
    };
  }

  private mapCaseFromSupabase(dbCase: any): LegalCase {
    return {
      id: dbCase.id,
      title: dbCase.title || '',
      type: (dbCase.case_type || dbCase.type || 'civil') as LegalCase['type'],
      status: (dbCase.status || 'active') as LegalCase['status'],
      lawyer: dbCase.judge || dbCase.lawyer || '',
      opponent: dbCase.opposing_party || dbCase.opponent || '',
      court: dbCase.court || '',
      nextHearing: dbCase.next_hearing_date || dbCase.next_hearing || undefined,
      description: dbCase.description || '',
      totalCost: dbCase.total_cost || 0,
      priority: (dbCase.priority || 'medium') as LegalCase['priority'],
      organizationId: dbCase.organization_id || undefined,
      userId: dbCase.user_id,
      createdAt: dbCase.created_at,
    };
  }

  private mapMeetingToSupabase(meeting: LawyerMeeting) {
    return {
      id: meeting.id,
      case_id: meeting.caseId,
      lawyer: meeting.lawyer,
      meeting_date: meeting.date,
      duration: meeting.duration,
      summary: meeting.summary,
      recommendations: meeting.recommendations,
      cost: meeting.cost,
      next_actions: meeting.nextActions,
      organization_id: meeting.organizationId || null,
      user_id: meeting.userId
    };
  }

  private mapMeetingFromSupabase(dbMeeting: any): LawyerMeeting {
    return {
      id: dbMeeting.id,
      caseId: dbMeeting.case_id,
      lawyer: dbMeeting.lawyer,
      date: dbMeeting.meeting_date,
      duration: dbMeeting.duration,
      summary: dbMeeting.summary,
      recommendations: dbMeeting.recommendations || [],
      cost: dbMeeting.cost,
      nextActions: dbMeeting.next_actions || [],
      organizationId: dbMeeting.organization_id,
      userId: dbMeeting.user_id
    };
  }

  async saveCaseToSupabase(legalCase: LegalCase): Promise<void> {
    try {
      const dbCase = this.mapCaseToSupabase(legalCase);
      const { error } = await supabase
        .from('legal_cases')
        .upsert([dbCase]);
      
      if (error) throw error;
    } catch (error) {
      console.warn('Failed to save case to Supabase, using local storage:', error);
    }
  }

  async saveMeetingToSupabase(meeting: LawyerMeeting): Promise<void> {
    try {
      const { error } = await supabase
        .from('meetings')
        .upsert([{
          id: meeting.id,
          title: `جلسه با ${meeting.lawyer}`,
          meeting_date: meeting.date,
          duration: meeting.duration,
          notes: meeting.summary,
          domain: 'legal',
          user_id: meeting.userId,
          organization_id: meeting.organizationId || null
        }]);
      
      if (error) throw error;
    } catch (error) {
      console.warn('Failed to save meeting to Supabase, using local storage:', error);
    }
  }

  async loadCasesFromSupabase(organizationId?: string): Promise<LegalCase[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('legal_cases')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return (data || []).map(this.mapCaseFromSupabase);
    } catch (error) {
      console.warn('Failed to load cases from Supabase, using local storage:', error);
      return [];
    }
  }

  async loadMeetingsFromSupabase(organizationId?: string): Promise<LawyerMeeting[]> {
    try {
      let query = supabase.from('meetings').select('*').eq('domain', 'legal');
      
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return (data || []).map((m: any) => ({
        id: m.id,
        caseId: '',
        lawyer: '',
        date: m.meeting_date,
        duration: m.duration || 0,
        summary: m.notes || '',
        recommendations: [],
        cost: 0,
        nextActions: [],
        organizationId: m.organization_id,
        userId: m.user_id
      }));
    } catch (error) {
      console.warn('Failed to load meetings from Supabase, using local storage:', error);
      return [];
    }
  }

  // Public API Methods
  async createCase(caseData: Omit<LegalCase, 'id' | 'createdAt'>): Promise<LegalCase> {
    const newCase: LegalCase = {
      ...caseData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };

    // همیشه به backend ذخیره می‌کنیم
    await this.saveCaseToSupabase(newCase);

    // ذخیره محلی برای آفلاین
    const cases = await this.loadCasesFromStorage();
    cases.push(newCase);
    await this.saveCasesToStorage(cases);

    return newCase;
  }

  async createMeeting(meetingData: Omit<LawyerMeeting, 'id'>): Promise<LawyerMeeting> {
    const newMeeting: LawyerMeeting = {
      ...meetingData,
      id: Date.now().toString()
    };

    // Save to Supabase if organization exists
    if (newMeeting.organizationId) {
      await this.saveMeetingToSupabase(newMeeting);
    }

    // Always save to local storage as backup
    const meetings = await this.loadMeetingsFromStorage();
    meetings.push(newMeeting);
    await this.saveMeetingsToStorage(meetings);

    return newMeeting;
  }

  async getCases(organizationId?: string): Promise<LegalCase[]> {
    // اول از backend بارگذاری کن
    const remote = await this.loadCasesFromSupabase(organizationId);
    if (remote.length > 0) {
      await this.saveCasesToStorage(remote); // ذخیره محلی برای دسترسی آفلاین
      return remote;
    }
    // fallback به localStorage
    return this.loadCasesFromStorage();
  }

  async getMeetings(organizationId?: string): Promise<LawyerMeeting[]> {
    if (organizationId) {
      return this.loadMeetingsFromSupabase(organizationId);
    }
    return this.loadMeetingsFromStorage();
  }

  async getDocuments(organizationId?: string): Promise<LegalDocument[]> {
    return this.loadDocumentsFromStorage();
  }

  // Document management methods
  async createDocument(documentData: Omit<LegalDocument, 'id'>): Promise<LegalDocument> {
    const newDocument: LegalDocument = {
      ...documentData,
      id: Date.now().toString()
    };

    // Always save to local storage
    const documents = await this.loadDocumentsFromStorage();
    documents.push(newDocument);
    await this.saveDocumentsToStorage(documents);

    return newDocument;
  }

  // Deadline management methods  
  async updateCaseDeadline(caseId: string, deadline: string, notes?: string): Promise<void> {
    try {
      // Update in Supabase if available
      const { error } = await supabase
        .from('legal_cases')
        .update({ 
          next_hearing: deadline,
          updated_at: new Date().toISOString()
        })
        .eq('id', caseId);

      if (error) {
        console.warn('Failed to update deadline in Supabase:', error);
      }
    } catch (error) {
      console.warn('Supabase not available, updating local storage only:', error);
    }

    // Update local storage
    const cases = await this.loadCasesFromStorage();
    const caseIndex = cases.findIndex(c => c.id === caseId);
    if (caseIndex !== -1) {
      cases[caseIndex].nextHearing = deadline;
      await this.saveCasesToStorage(cases);
    }
  }

  // Helper methods for case details
  async getCaseById(caseId: string, organizationId?: string): Promise<LegalCase | null> {
    const cases = await this.getCases(organizationId);
    return cases.find(c => c.id === caseId) || null;
  }

  async getMeetingsByCase(caseId: string, organizationId?: string): Promise<LawyerMeeting[]> {
    const meetings = await this.getMeetings(organizationId);
    return meetings.filter(m => m.caseId === caseId);
  }

  async getDocumentsByCase(caseId: string, organizationId?: string): Promise<LegalDocument[]> {
    const documents = await this.getDocuments(organizationId);
    return documents.filter(d => d.caseId === caseId);
  }

  // Lawyer Notes Methods
  async saveNotesToStorage(notes: LawyerNote[]): Promise<void> {
    localStorage.setItem(this.STORAGE_KEYS.LAWYER_NOTES, JSON.stringify(notes));
  }

  async loadNotesFromStorage(): Promise<LawyerNote[]> {
    const stored = localStorage.getItem(this.STORAGE_KEYS.LAWYER_NOTES);
    return stored ? JSON.parse(stored) : [];
  }

  async createLawyerNote(noteData: Omit<LawyerNote, 'id' | 'createdAt'>): Promise<LawyerNote> {
    const newNote: LawyerNote = {
      ...noteData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };

    const notes = await this.loadNotesFromStorage();
    notes.push(newNote);
    await this.saveNotesToStorage(notes);

    return newNote;
  }

  async getLawyerNotes(organizationId?: string): Promise<LawyerNote[]> {
    return this.loadNotesFromStorage();
  }

  async getNotesByCase(caseId: string, organizationId?: string): Promise<LawyerNote[]> {
    const notes = await this.getLawyerNotes(organizationId);
    return notes.filter(n => n.caseId === caseId);
  }

  async deleteLawyerNote(noteId: string): Promise<void> {
    const notes = await this.loadNotesFromStorage();
    const filteredNotes = notes.filter(n => n.id !== noteId);
    await this.saveNotesToStorage(filteredNotes);
  }

  async updateLawyerNote(noteId: string, updates: Partial<LawyerNote>): Promise<LawyerNote> {
    const notes = await this.loadNotesFromStorage();
    const noteIndex = notes.findIndex(n => n.id === noteId);
    
    if (noteIndex === -1) {
      throw new Error('Note not found');
    }

    const updatedNote = {
      ...notes[noteIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    notes[noteIndex] = updatedNote;
    await this.saveNotesToStorage(notes);
    
    return updatedNote;
  }

  async searchNotes(query: string, organizationId?: string): Promise<LawyerNote[]> {
    const notes = await this.getLawyerNotes(organizationId);
    const lowerQuery = query.toLowerCase();
    
    return notes.filter(note => 
      note.content.toLowerCase().includes(lowerQuery) ||
      (note.title && note.title.toLowerCase().includes(lowerQuery))
    );
  }

  async getNotesByCategory(category: string, organizationId?: string): Promise<LawyerNote[]> {
    const notes = await this.getLawyerNotes(organizationId);
    return notes.filter(n => n.category === category);
  }

  async getStarredNotes(organizationId?: string): Promise<LawyerNote[]> {
    const notes = await this.getLawyerNotes(organizationId);
    return notes.filter(n => n.isStarred);
  }

  async toggleNoteStatus(noteId: string): Promise<void> {
    const notes = await this.loadNotesFromStorage();
    const noteIndex = notes.findIndex(n => n.id === noteId);
    
    if (noteIndex !== -1) {
      notes[noteIndex].status = notes[noteIndex].status === 'pending' ? 'completed' : 'pending';
      notes[noteIndex].updatedAt = new Date().toISOString();
      await this.saveNotesToStorage(notes);
    }
  }

  async toggleNoteStar(noteId: string): Promise<void> {
    const notes = await this.loadNotesFromStorage();
    const noteIndex = notes.findIndex(n => n.id === noteId);
    
    if (noteIndex !== -1) {
      notes[noteIndex].isStarred = !notes[noteIndex].isStarred;
      notes[noteIndex].updatedAt = new Date().toISOString();
      await this.saveNotesToStorage(notes);
    }
  }

}

export const legalService = new LegalService();