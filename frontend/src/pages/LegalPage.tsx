import React, { useState, useEffect, useCallback } from 'react';
import { Scale, FileText, Calendar, AlertTriangle, Users, DollarSign, Archive, Plus, Search, Filter, Eye, Download, HelpCircle, StickyNote } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { NewMeetingDialog } from '@/components/legal/NewMeetingDialog';
import { LegalDocumentUploadDialog } from '@/components/legal/LegalDocumentUploadDialog';
import { NewDeadlineDialog } from '@/components/legal/NewDeadlineDialog';
import { CaseDetailDrawer } from '@/components/legal/CaseDetailDrawer';
import { DocumentViewerDialog } from '@/components/legal/DocumentViewerDialog';
import { LegalHelpGuide } from '@/components/legal/LegalHelpGuide';
import { LegalTestDataButton } from '@/components/legal/LegalTestDataButton';
import { LawyerNotesSection } from '@/components/legal/LawyerNotesSection';
import { legalService, LegalCase, LawyerMeeting, LegalDocument, LawyerNote } from '@/services/legalService';
import { useToast } from '@/hooks/use-toast';

// Types are now imported from legalService

const LegalPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('cases');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isAddCaseOpen, setIsAddCaseOpen] = useState(false);
  
  // Form state for new case
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    priority: 'medium',
    lawyer: '',
    opponent: '',
    court: '',
    description: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNewMeetingOpen, setIsNewMeetingOpen] = useState(false);
  const [isUploadDocumentOpen, setIsUploadDocumentOpen] = useState(false);
  const [isNewDeadlineOpen, setIsNewDeadlineOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showHelpGuide, setShowHelpGuide] = useState(false);
  
  // Case detail drawer states
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<LegalCase | null>(null);
  const [caseMeetings, setCaseMeetings] = useState<LawyerMeeting[]>([]);
  const [caseDocuments, setCaseDocuments] = useState<LegalDocument[]>([]);
  
  // Document viewer states
  const [selectedDocument, setSelectedDocument] = useState<LegalDocument | null>(null);
  const [isDocViewerOpen, setIsDocViewerOpen] = useState(false);
  
  // State management
  const [legalCases, setLegalCases] = useState<LegalCase[]>([]);
  const [meetings, setMeetings] = useState<LawyerMeeting[]>([]);
  const [documents, setDocuments] = useState<LegalDocument[]>([]);

  // Load data function
  const loadData = async () => {
    setLoading(true);
    try {
      const [casesData, meetingsData, documentsData] = await Promise.all([
        legalService.getCases(),
        legalService.getMeetings(),
        legalService.getDocuments()
      ]);
      
      setLegalCases(casesData);
      setMeetings(meetingsData);
      setDocuments(documentsData);
    } catch (error) {
      console.error('Failed to load legal data:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری اطلاعات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [toast]);

  // Realtime subscription for legal cases
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('legal-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'legal_cases', filter: `user_id=eq.${user.id}` },
        () => {
          loadData(); // Re-fetch all legal data
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  };

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      errors.title = 'عنوان پرونده الزامی است';
    }
    if (!formData.type) {
      errors.type = 'نوع پرونده الزامی است';
    }
    if (!formData.lawyer.trim()) {
      errors.lawyer = 'نام وکیل الزامی است';
    }
    if (!formData.opponent.trim()) {
      errors.opponent = 'نام طرف مقابل الزامی است';
    }
    if (!formData.court.trim()) {
      errors.court = 'نام دادگاه الزامی است';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      type: '',
      priority: 'medium',
      lawyer: '',
      opponent: '',
      court: '',
      description: ''
    });
    setFormErrors({});
  };

  // Handle form submit
  const handleSubmitCase = async () => {
    if (!user) {
      toast({
        title: "خطا",
        description: "برای ایجاد پرونده وارد سیستم شوید",
        variant: "destructive",
      });
      return;
    }

    if (!validateForm()) {
      toast({
        title: "خطا",
        description: "لطفاً فیلدهای الزامی را تکمیل کنید",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const caseData: Omit<LegalCase, 'id' | 'createdAt'> = {
        title: formData.title.trim(),
        type: formData.type as LegalCase['type'],
        status: 'active',
        lawyer: formData.lawyer.trim(),
        opponent: formData.opponent.trim(),
        court: formData.court.trim(),
        description: formData.description.trim(),
        totalCost: 0,
        priority: formData.priority as LegalCase['priority'],
        userId: user.id,
        organizationId: user.organization_id || undefined
      };

      const newCase = await legalService.createCase(caseData);
      setLegalCases(prev => [...prev, newCase]);
      
      toast({
        title: "موفقیت",
        description: "پرونده با موفقیت ایجاد شد",
      });
      
      resetForm();
      setIsAddCaseOpen(false);
    } catch (error) {
      console.error('Error creating case:', error);
      toast({
        title: "خطا",
        description: "خطا در ایجاد پرونده",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Event handlers
  const handleCreateCase = async (caseData: Omit<LegalCase, 'id' | 'createdAt'>) => {
    try {
      const newCase = await legalService.createCase(caseData);
      setLegalCases(prev => [...prev, newCase]);
      toast({
        title: "موفقیت",
        description: "پرونده با موفقیت ایجاد شد",
      });
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در ایجاد پرونده",
        variant: "destructive",
      });
    }
  };

  const handleCreateMeeting = async (meeting: LawyerMeeting) => {
    try {
      const newMeeting = await legalService.createMeeting({
        ...meeting,
        userId: 'default' // This should come from auth context
      });
      setMeetings(prev => [...prev, newMeeting]);
    } catch (error) {
      toast({
        title: "خطا", 
        description: "خطا در ایجاد جلسه",
        variant: "destructive",
      });
    }
  };

  const handleDocumentUpload = async (document: LegalDocument) => {
    try {
      const newDocument = await legalService.createDocument(document);
      setDocuments(prev => [...prev, newDocument]);
      toast({
        title: "موفقیت",
        description: "سند با موفقیت آپلود شد",
      });
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در آپلود سند",
        variant: "destructive",
      });
    }
  };

  const handleDeadlineSet = async (caseId: string, deadline: string, notes?: string) => {
    try {
      await legalService.updateCaseDeadline(caseId, deadline, notes);
      
      // Update local state
      setLegalCases(prev => 
        prev.map(c => 
          c.id === caseId 
            ? { ...c, nextHearing: deadline }
            : c
        )
      );
      
      toast({
        title: "موفقیت",
        description: "مهلت با موفقیت تنظیم شد",
      });
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در تنظیم مهلت",
        variant: "destructive",
      });
    }
  };

  const filteredCases = legalCases.filter(case_ => {
    const matchesSearch = case_.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || case_.status === filterStatus;
    return matchesSearch && matchesFilter;
  });
  
  const availableCasesForMeeting = legalCases.map(c => ({ 
    id: c.id, 
    title: c.title, 
    lawyer: c.lawyer 
  }));

  // Handle case selection for detail view
  const handleCaseClick = async (caseItem: LegalCase) => {
    try {
      setSelectedCase(caseItem);
      setSelectedCaseId(caseItem.id);
      
      // Load case-specific data
      const [caseSpecificMeetings, caseSpecificDocuments] = await Promise.all([
        legalService.getMeetingsByCase(caseItem.id),
        legalService.getDocumentsByCase(caseItem.id)
      ]);
      
      setCaseMeetings(caseSpecificMeetings);
      setCaseDocuments(caseSpecificDocuments);
      setIsDetailOpen(true);
    } catch (error) {
      console.error('Failed to load case details:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری جزئیات پرونده",
        variant: "destructive",
      });
    }
  };

  // Quick action handlers for case drawer
  const handleNewMeetingFromCase = () => {
    setIsDetailOpen(false);
    setIsNewMeetingOpen(true);
  };

  const handleUploadDocumentFromCase = () => {
    setIsDetailOpen(false);
    setIsUploadDocumentOpen(true);
  };

  const handleNewDeadlineFromCase = () => {
    setIsDetailOpen(false);
    setIsNewDeadlineOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Scale className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">امور حقوقی</h1>
            <p className="text-muted-foreground">مدیریت پرونده‌ها، جلسات و اسناد حقوقی</p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          onClick={() => setShowHelpGuide(true)}
          className="flex items-center gap-2"
        >
          <HelpCircle className="h-4 w-4" />
          راهنما
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">پرونده‌های فعال</p>
                <p className="text-2xl font-bold text-foreground">{legalCases.filter(c => c.status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">جلسات این ماه</p>
                <p className="text-2xl font-bold text-foreground">{meetings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">هزینه کل</p>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(legalCases.reduce((sum, c) => sum + c.totalCost, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">مهلت‌های نزدیک</p>
                <p className="text-2xl font-bold text-foreground">
                  {legalCases.filter(c => c.nextHearing && new Date(c.nextHearing) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="cases" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            پرونده‌ها
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center gap-2">
            <StickyNote className="h-4 w-4" />
            یادداشت‌ها
          </TabsTrigger>
          <TabsTrigger value="meetings" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            جلسات
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            اسناد
          </TabsTrigger>
          <TabsTrigger value="deadlines" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            مهلت‌ها
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cases" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="جستجو در پرونده‌ها..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="فیلتر وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                <SelectItem value="active">فعال</SelectItem>
                <SelectItem value="pending">در انتظار</SelectItem>
                <SelectItem value="completed">تمام شده</SelectItem>
                <SelectItem value="suspended">متوقف</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={isAddCaseOpen} onOpenChange={setIsAddCaseOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  پرونده جدید
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>ایجاد پرونده حقوقی جدید</DialogTitle>
                  <DialogDescription>
                    اطلاعات پرونده حقوقی جدید را وارد کنید
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">عنوان پرونده *</Label>
                    <Input 
                      id="title" 
                      placeholder="عنوان پرونده را وارد کنید"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className={formErrors.title ? "border-red-500" : ""}
                    />
                    {formErrors.title && (
                      <p className="text-sm text-red-500 mt-1">{formErrors.title}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">نوع پرونده *</Label>
                      <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger className={formErrors.type ? "border-red-500" : ""}>
                          <SelectValue placeholder="نوع پرونده" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="civil">حقوقی</SelectItem>
                          <SelectItem value="commercial">تجاری</SelectItem>
                          <SelectItem value="family">خانواده</SelectItem>
                          <SelectItem value="criminal">کیفری</SelectItem>
                          <SelectItem value="administrative">اداری</SelectItem>
                        </SelectContent>
                      </Select>
                      {formErrors.type && (
                        <p className="text-sm text-red-500 mt-1">{formErrors.type}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="priority">اولویت</Label>
                      <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="اولویت" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">پایین</SelectItem>
                          <SelectItem value="medium">متوسط</SelectItem>
                          <SelectItem value="high">بالا</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="lawyer">وکیل *</Label>
                      <Input 
                        id="lawyer" 
                        placeholder="نام وکیل"
                        value={formData.lawyer}
                        onChange={(e) => setFormData(prev => ({ ...prev, lawyer: e.target.value }))}
                        className={formErrors.lawyer ? "border-red-500" : ""}
                      />
                      {formErrors.lawyer && (
                        <p className="text-sm text-red-500 mt-1">{formErrors.lawyer}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="opponent">طرف مقابل *</Label>
                      <Input 
                        id="opponent" 
                        placeholder="نام طرف مقابل"
                        value={formData.opponent}
                        onChange={(e) => setFormData(prev => ({ ...prev, opponent: e.target.value }))}
                        className={formErrors.opponent ? "border-red-500" : ""}
                      />
                      {formErrors.opponent && (
                        <p className="text-sm text-red-500 mt-1">{formErrors.opponent}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="court">دادگاه *</Label>
                    <Input 
                      id="court" 
                      placeholder="نام دادگاه"
                      value={formData.court}
                      onChange={(e) => setFormData(prev => ({ ...prev, court: e.target.value }))}
                      className={formErrors.court ? "border-red-500" : ""}
                    />
                    {formErrors.court && (
                      <p className="text-sm text-red-500 mt-1">{formErrors.court}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="description">توضیحات</Label>
                    <Textarea 
                      id="description" 
                      placeholder="توضیحات پرونده" 
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        resetForm();
                        setIsAddCaseOpen(false);
                      }}
                      disabled={isSubmitting}
                    >
                      انصراف
                    </Button>
                    <Button 
                      onClick={handleSubmitCase}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "در حال ایجاد..." : "ایجاد پرونده"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {filteredCases.map((case_) => (
              <Card 
                key={case_.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleCaseClick(case_)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg">{case_.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusBadge(case_.status)}>
                          {case_.status === 'active' ? 'فعال' :
                           case_.status === 'pending' ? 'در انتظار' :
                           case_.status === 'completed' ? 'تمام شده' : 'متوقف'}
                        </Badge>
                        <Badge className={getPriorityBadge(case_.priority)}>
                          {case_.priority === 'high' ? 'بالا' :
                           case_.priority === 'medium' ? 'متوسط' : 'پایین'}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-muted-foreground">هزینه کل</p>
                      <p className="font-semibold">{formatCurrency(case_.totalCost)}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">وکیل:</p>
                      <p className="font-medium">{case_.lawyer}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">طرف مقابل:</p>
                      <p className="font-medium">{case_.opponent}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">دادگاه:</p>
                      <p className="font-medium">{case_.court}</p>
                    </div>
                  </div>
                  {case_.nextHearing && (
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-yellow-600" />
                        <p className="text-sm font-medium text-yellow-800">
                          جلسه بعدی: {format(new Date(case_.nextHearing), 'yyyy/MM/dd')}
                        </p>
                      </div>
                    </div>
                  )}
                  <p className="mt-3 text-sm text-muted-foreground">{case_.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <LawyerNotesSection cases={legalCases} />
        </TabsContent>

        <TabsContent value="meetings" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">جلسات با وکیل</h3>
            <Button onClick={() => setIsNewMeetingOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              جلسه جدید
            </Button>
          </div>

          <div className="grid gap-4">
            {meetings.map((meeting) => (
              <Card key={meeting.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">جلسه با {meeting.lawyer}</CardTitle>
                    <Badge variant="outline">{format(new Date(meeting.date), 'yyyy/MM/dd')}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">خلاصه جلسه:</p>
                      <p className="text-sm mt-1">{meeting.summary}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">توصیه‌ها:</p>
                      <ul className="text-sm mt-1 space-y-1">
                        {meeting.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-muted-foreground">اقدامات بعدی:</p>
                      <ul className="text-sm mt-1 space-y-1">
                        {meeting.nextActions.map((action, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-yellow-500">▶</span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm text-muted-foreground">
                        مدت: {meeting.duration} دقیقه
                      </span>
                      <span className="text-sm font-medium">
                        هزینه: {formatCurrency(meeting.cost)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">اسناد حقوقی</h3>
            <Button onClick={() => setIsUploadDocumentOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              آپلود سند
            </Button>
          </div>

          <div className="grid gap-4">
            {documents.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(doc.uploadDate), 'yyyy/MM/dd')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.isShared && (
                        <Badge variant="outline" className="text-green-600 border-green-200">
                          اشتراک‌گذاری شده
                        </Badge>
                      )}
                      <Badge variant="secondary">
                        {doc.type === 'contract' ? 'قرارداد' :
                         doc.type === 'petition' ? 'دادخواست' :
                         doc.type === 'judgment' ? 'حکم' :
                         doc.type === 'evidence' ? 'مدرک' : 'مکاتبات'}
                       </Badge>
                       <div className="flex items-center gap-2 ml-2">
                         <Button 
                           size="sm" 
                           variant="ghost"
                           onClick={() => {
                             setSelectedDocument(doc);
                             setIsDocViewerOpen(true);
                           }}
                         >
                           <Eye className="h-4 w-4" />
                         </Button>
                         <Button 
                           size="sm" 
                           variant="ghost"
                           onClick={() => {
                             setSelectedDocument(doc);
                             setIsDocViewerOpen(true);
                           }}
                         >
                           <Download className="h-4 w-4" />
                         </Button>
                       </div>
                     </div>
                   </div>
                   <div className="mt-3 flex flex-wrap gap-1">
                     {doc.tags.map((tag, index) => (
                       <Badge key={index} variant="outline" className="text-xs">
                         {tag}
                       </Badge>
                     ))}
                   </div>
                 </CardContent>
               </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="deadlines" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">مهلت‌های مهم</h3>
            <Button onClick={() => setIsNewDeadlineOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              مهلت جدید
            </Button>
          </div>

          <div className="grid gap-4">
            {legalCases
              .filter(case_ => case_.nextHearing)
              .sort((a, b) => new Date(a.nextHearing!).getTime() - new Date(b.nextHearing!).getTime())
              .map((case_) => {
                const daysLeft = Math.ceil((new Date(case_.nextHearing!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                const isUrgent = daysLeft <= 7;
                
                return (
                  <Card key={case_.id} className={isUrgent ? "border-red-200 bg-red-50" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{case_.title}</p>
                          <p className="text-sm text-muted-foreground">جلسه دادگاه</p>
                        </div>
                        <div className="text-left">
                          <p className="font-semibold">
                            {format(new Date(case_.nextHearing!), 'yyyy/MM/dd')}
                          </p>
                          <p className={`text-sm ${isUrgent ? 'text-red-600' : 'text-muted-foreground'}`}>
                            {daysLeft > 0 ? `${daysLeft} روز مانده` : 'امروز'}
                          </p>
                        </div>
                      </div>
                      {isUrgent && (
                        <div className="mt-3 flex items-center gap-2 text-red-600">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm font-medium">مهلت اضطراری</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </TabsContent>
      </Tabs>

      {/* New Meeting Dialog */}
      <NewMeetingDialog
        open={isNewMeetingOpen}
        onOpenChange={setIsNewMeetingOpen}
        onMeetingCreated={handleCreateMeeting}
        availableCases={availableCasesForMeeting}
        preSelectedCaseId={selectedCaseId}
      />

      {/* Upload Document Dialog */}
      <LegalDocumentUploadDialog
        open={isUploadDocumentOpen}
        onOpenChange={setIsUploadDocumentOpen}
        onDocumentUploaded={handleDocumentUpload}
        availableCases={availableCasesForMeeting}
      />

      {/* Case Detail Drawer */}
      {selectedCase && (
        <CaseDetailDrawer
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
          legalCase={selectedCase}
          meetings={caseMeetings}
          documents={caseDocuments}
          onNewMeeting={handleNewMeetingFromCase}
          onUploadDocument={handleUploadDocumentFromCase}
          onNewDeadline={handleNewDeadlineFromCase}
        />
      )}

      {/* New Deadline Dialog */}
      <NewDeadlineDialog
        open={isNewDeadlineOpen}
        onOpenChange={setIsNewDeadlineOpen}
        onDeadlineSet={handleDeadlineSet}
        availableCases={availableCasesForMeeting}
        preSelectedCaseId={selectedCaseId}
      />

      {/* Document Viewer Dialog */}
      <DocumentViewerDialog
        open={isDocViewerOpen}
        onOpenChange={setIsDocViewerOpen}
        document={selectedDocument}
      />
      
      {/* Help Guide Dialog */}
      <Dialog open={showHelpGuide} onOpenChange={setShowHelpGuide}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <LegalHelpGuide />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LegalPage;