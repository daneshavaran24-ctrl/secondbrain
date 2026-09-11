import React, { useState, useEffect } from 'react';
import { FileText, Target, BarChart3, CheckCircle, Plus, Search, Filter, Calendar, User, Eye, Loader2, X, Edit, Trash2, Upload, Download, Paperclip } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { organizationalPolicyService } from '@/services/organizationalPolicyService';
import { FileUploadDialog } from '@/components/organizational/FileUploadDialog';
import { ExportImportDialog } from '@/components/organizational/ExportImportDialog';
import type { Database } from '@/integrations/supabase/types';

type OrganizationalMission = Database['public']['Tables']['organization_missions']['Row'];
type OrganizationalPolicy = Database['public']['Tables']['organization_policies']['Row'];

interface PolicyMissionProps {
  organizationName: string;
}

const PolicyMission: React.FC<PolicyMissionProps> = ({ organizationName }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState('missions');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemPriority, setNewItemPriority] = useState('متوسط');
  const [newItemOwner, setNewItemOwner] = useState('');
  const [newItemType, setNewItemType] = useState('اجرایی');
  const [newItemPeriod, setNewItemPeriod] = useState('سالیانه');
  const [newItemDeadline, setNewItemDeadline] = useState('');

  // New state for enhanced features
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showExportImport, setShowExportImport] = useState(false);
  const [selectedItemForFiles, setSelectedItemForFiles] = useState<any>(null);

  // State for data
  const [missions, setMissions] = useState<OrganizationalMission[]>([]);
  const [policies, setPolicies] = useState<OrganizationalPolicy[]>([]);

  // Load data from database using new service
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [missionsData, policiesData] = await Promise.all([
        organizationalPolicyService.getMissions(),
        organizationalPolicyService.getPolicies(),
      ]);

      setMissions(missionsData);
      setPolicies(policiesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('خطا در بارگذاری اطلاعات');
    }
    setIsLoading(false);
    setDataReady(true);
  };

  // New helper functions
  const openFileUpload = (item: any, type: string) => {
    setSelectedItemForFiles({ ...item, type });
    setShowFileUpload(true);
  };

  // Initialize data from database
  useEffect(() => {
    loadData();
  }, []);

  // Utility functions
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      'فعال': { label: 'فعال', variant: 'default' },
      'درحال اجرا': { label: 'درحال اجرا', variant: 'secondary' },
      'تصویب‌شده': { label: 'تصویب‌شده', variant: 'default' },
      'درانتظار تصویب': { label: 'درانتظار تصویب', variant: 'outline' },
      'درحال پیگیری': { label: 'درحال پیگیری', variant: 'secondary' },
      'نیاز به بهبود': { label: 'نیاز به بهبود', variant: 'destructive' },
      'درانتظار': { label: 'درانتظار', variant: 'outline' }
    };
    const config = variants[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      'بالا': { label: 'بالا', variant: 'destructive' },
      'متوسط': { label: 'متوسط', variant: 'secondary' },
      'پایین': { label: 'پایین', variant: 'outline' }
    };
    const config = variants[priority] || { label: priority, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleAddItem = async () => {
    if (!newItemTitle.trim() || !newItemDescription.trim()) {
      toast.error('لطفاً تمام فیلدهای ضروری را پر کنید');
      return;
    }

    try {
      switch (activeTab) {
        case 'missions':
          const newMission = await organizationalPolicyService.createMission({
            title: newItemTitle,
            description: newItemDescription,
            status: 'active',
            progress: 0,
            start_date: newItemDeadline || new Date().toISOString().split('T')[0],
            end_date: newItemDeadline || null,
            target_value: 100,
            current_value: 0,
            unit: 'درصد',
            policy_id: null
          });
          setMissions(prev => [...prev, newMission]);
          toast.success('مأموریت جدید با موفقیت اضافه شد');
          break;

        case 'policies':
          const newPolicy = await organizationalPolicyService.createPolicy({
            title: newItemTitle,
            description: newItemDescription,
            policy_type: newItemType,
            status: 'draft',
            effective_date: newItemDeadline || null,
            review_date: newItemDeadline || null
          });
          setPolicies(prev => [...prev, newPolicy]);
          toast.success('سیاست جدید با موفقیت اضافه شد');
          break;

        case 'kpis':
        case 'approval':
          toast.error('این بخش هنوز در دسترس نیست');
          break;
      }
      
      // Reset form
      resetForm();
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('خطا در افزودن آیتم جدید');
    }
  };

  const resetForm = () => {
    setNewItemTitle('');
    setNewItemDescription('');
    setNewItemPriority('متوسط');
    setNewItemOwner('');
    setNewItemType('اجرایی');
    setNewItemPeriod('سالیانه');
    setNewItemDeadline('');
    setShowAddModal(false);
  };

  const handleViewDetails = (item: any) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setNewItemTitle(item.title || item.name || '');
    setNewItemDescription(item.description || '');
    setNewItemPriority(item.priority || 'متوسط');
    setNewItemOwner(item.owner || item.responsible || '');
    setNewItemType(item.type || 'اجرایی');
    setNewItemPeriod(item.period || 'سالیانه');
    setNewItemDeadline(item.deadline || item.next_review || '');
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!selectedItem || !newItemTitle.trim()) {
      toast.error('لطفاً تمام فیلدهای ضروری را پر کنید');
      return;
    }

    try {
      switch (activeTab) {
        case 'missions':
          const updatedMission = await organizationalPolicyService.updateMission(selectedItem.id, {
            title: newItemTitle,
            description: newItemDescription,
            end_date: newItemDeadline || null
          });
          setMissions(prev => prev.map(m => m.id === selectedItem.id ? updatedMission : m));
          break;

        case 'policies':
          const updatedPolicy = await organizationalPolicyService.updatePolicy(selectedItem.id, {
            title: newItemTitle,
            description: newItemDescription,
            policy_type: newItemType,
            review_date: newItemDeadline || null
          });
          setPolicies(prev => prev.map(p => p.id === selectedItem.id ? updatedPolicy : p));
          break;

        default:
          toast.error('این بخش هنوز در دسترس نیست');
          break;
      }

      resetForm();
      setShowEditModal(false);
      toast.success('آیتم با موفقیت به‌روزرسانی شد');
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('خطا در به‌روزرسانی آیتم');
    }
  };

  const handleDelete = async (item: any) => {
    if (!confirm('آیا از حذف این آیتم اطمینان دارید؟')) return;

    try {
      switch (activeTab) {
        case 'missions':
          await organizationalPolicyService.deleteMission(item.id);
          setMissions(prev => prev.filter(m => m.id !== item.id));
          break;

        case 'policies':
          await organizationalPolicyService.deletePolicy(item.id);
          setPolicies(prev => prev.filter(p => p.id !== item.id));
          break;

        default:
          toast.error('این بخش هنوز در دسترس نیست');
          break;
      }

      toast.success('آیتم با موفقیت حذف شد');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('خطا در حذف آیتم');
    }
  };

  // Prepare data for rendering
  const tabsData = [
    { key: 'missions', title: 'مأموریت‌ها', icon: Target, data: missions },
    { key: 'policies', title: 'سیاست‌ها', icon: FileText, data: policies }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <FileText className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">سیاست‌گذاری و مأموریت‌ها</h1>
            <p className="text-muted-foreground">{organizationName}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button 
            variant="outline" 
            onClick={() => setShowExportImport(true)}
            disabled={isLoading}
          >
            <Download className="w-4 h-4 ml-2" />
            صادرات/وارد کردن
          </Button>
          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogTrigger asChild>
              <Button disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 ml-2" />
                )}
                {isLoading ? 'بارگذاری...' : 'افزودن جدید'}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-right pr-8">افزودن آیتم جدید</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title" className="text-right">عنوان *</Label>
                  <Input
                    id="title"
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    placeholder="عنوان مأموریت یا سیاست را وارد کنید..."
                    className="text-right"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description" className="text-right">توضیحات *</Label>
                  <Textarea
                    id="description"
                    value={newItemDescription}
                    onChange={(e) => setNewItemDescription(e.target.value)}
                    placeholder="توضیحات تفصیلی را وارد کنید..."
                    className="text-right min-h-[100px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="priority" className="text-right">
                      {activeTab === 'missions' ? 'اولویت' : activeTab === 'policies' ? 'نوع' : 'دوره'}
                    </Label>
                    {activeTab === 'missions' ? (
                      <Select value={newItemPriority} onValueChange={setNewItemPriority}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="بالا">بالا</SelectItem>
                          <SelectItem value="متوسط">متوسط</SelectItem>
                          <SelectItem value="پایین">پایین</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : activeTab === 'policies' ? (
                      <Select value={newItemType} onValueChange={setNewItemType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="استراتژیک">استراتژیک</SelectItem>
                          <SelectItem value="اجرایی">اجرایی</SelectItem>
                          <SelectItem value="تاکتیکی">تاکتیکی</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Select value={newItemPeriod} onValueChange={setNewItemPeriod}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="سالیانه">سالیانه</SelectItem>
                          <SelectItem value="فصلی">فصلی</SelectItem>
                          <SelectItem value="ماهیانه">ماهیانه</SelectItem>
                          <SelectItem value="هفتگی">هفتگی</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="owner" className="text-right">مسئول</Label>
                    <Input
                      id="owner"
                      value={newItemOwner}
                      onChange={(e) => setNewItemOwner(e.target.value)}
                      placeholder="نام مسئول..."
                      className="text-right"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="deadline" className="text-right">مهلت (اختیاری)</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={newItemDeadline}
                    onChange={(e) => setNewItemDeadline(e.target.value)}
                    className="text-right"
                  />
                </div>
                <div className="flex justify-end space-x-2 space-x-reverse">
                  <Button variant="outline" onClick={() => setShowAddModal(false)}>
                    انصراف
                  </Button>
                  <Button onClick={handleAddItem}>
                    افزودن
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {dataReady ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir="rtl">
            <TabsList className="grid w-full grid-cols-4">
              {tabsData.map((tab) => (
                <TabsTrigger key={tab.key} value={tab.key} className="flex items-center space-x-2 space-x-reverse">
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.title}</span>
                  <Badge variant="secondary" className="ml-2">{tab.data.length}</Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {tabsData.map((tab) => (
              <TabsContent key={tab.key} value={tab.key} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <Input
                      placeholder="جستجو..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="فیلتر وضعیت" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">همه</SelectItem>
                        <SelectItem value="فعال">فعال</SelectItem>
                        <SelectItem value="تصویب‌شده">تصویب‌شده</SelectItem>
                        <SelectItem value="درانتظار">درانتظار</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  {tab.data.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center text-muted-foreground">
                        <tab.icon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>هیچ آیتمی یافت نشد</p>
                        <p className="text-sm">با کلیک روی دکمه "افزودن جدید" اولین آیتم خود را ایجاد کنید</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {tab.data
                        .filter((item: any) => {
                          const title = item.title || '';
                          const description = item.description || '';
                          
                          const searchMatch = searchTerm === '' || 
                            title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            description.toLowerCase().includes(searchTerm.toLowerCase());
                          
                          const statusMatch = filterStatus === 'all' || item.status === filterStatus;
                          
                          return searchMatch && statusMatch;
                        })
                        .map((item: any) => (
                          <Card key={item.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <CardTitle className="text-lg mb-2 text-right line-clamp-2">
                                    {item.title || 'بدون عنوان'}
                                  </CardTitle>
                                  <div className="flex items-center space-x-2 space-x-reverse">
                                    {getStatusBadge(item.status || 'active')}
                                  </div>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="space-y-3">
                                {item.description && (
                                  <CardDescription className="text-right line-clamp-2">
                                    {item.description}
                                  </CardDescription>
                                )}
                                
                                {item.progress !== undefined && (
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                      <span>{item.progress}%</span>
                                      <span>پیشرفت</span>
                                    </div>
                                    <Progress value={item.progress} className="h-2" />
                                  </div>
                                )}
                                
                                {item.current_value !== undefined && item.target_value && (
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                      <span>{item.current_value}/{item.target_value} {item.unit || ''}</span>
                                      <span>عملکرد</span>
                                    </div>
                                    <Progress value={(Number(item.current_value) / Number(item.target_value)) * 100} className="h-2" />
                                  </div>
                                )}
                                
                                {(item.end_date || item.review_date) && (
                                  <div className="flex items-center space-x-2 space-x-reverse text-sm text-muted-foreground">
                                    <Calendar className="w-4 h-4" />
                                    <span>{new Date(item.end_date || item.review_date).toLocaleDateString('fa-IR')}</span>
                                  </div>
                                )}
                                
                                <div className="flex items-center space-x-2 space-x-reverse pt-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openFileUpload(item, activeTab)}
                                  >
                                    <Paperclip className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewDetails(item)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(item)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDelete(item)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
      </div>

      {/* File Upload Dialog */}
      {selectedItemForFiles && (
        <FileUploadDialog
          open={showFileUpload}
          onOpenChange={setShowFileUpload}
          itemType={selectedItemForFiles.type}
          itemId={selectedItemForFiles.id}
          itemTitle={selectedItemForFiles.title || selectedItemForFiles.name || ''}
        />
      )}

      {/* Export/Import Dialog */}
      <ExportImportDialog
        open={showExportImport}
        onOpenChange={setShowExportImport}
        organizationName={organizationName}
        onDataImported={loadData}
      />

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-right">جزئیات</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4 text-right">
              <div>
                <Label>عنوان:</Label>
                <p className="mt-1">{selectedItem.title || selectedItem.name}</p>
              </div>
              <div>
                <Label>توضیحات:</Label>
                <p className="mt-1">{selectedItem.description || 'بدون توضیحات'}</p>
              </div>
              <div>
                <Label>وضعیت:</Label>
                <div className="mt-1">{getStatusBadge(selectedItem.status)}</div>
              </div>
              {selectedItem.priority && (
                <div>
                  <Label>اولویت:</Label>
                  <div className="mt-1">{getPriorityBadge(selectedItem.priority)}</div>
                </div>
              )}
              {selectedItem.progress !== undefined && (
                <div>
                  <Label>پیشرفت:</Label>
                  <Progress value={selectedItem.progress} className="mt-2" />
                  <p className="text-sm text-muted-foreground mt-1">{selectedItem.progress}%</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-right pr-8">ویرایش آیتم</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title" className="text-right">عنوان *</Label>
              <Input
                id="edit-title"
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                placeholder="عنوان را وارد کنید..."
                className="text-right"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description" className="text-right">توضیحات</Label>
              <Textarea
                id="edit-description"
                value={newItemDescription}
                onChange={(e) => setNewItemDescription(e.target.value)}
                placeholder="توضیحات را وارد کنید..."
                className="text-right min-h-[100px]"
              />
            </div>
            <div className="flex justify-end space-x-2 space-x-reverse">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                انصراف
              </Button>
              <Button onClick={handleUpdate}>
                ذخیره تغییرات
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PolicyMission;