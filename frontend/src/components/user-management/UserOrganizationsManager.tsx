import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Building2, Trash2, Edit2, Calendar, Search, Building, GraduationCap, Briefcase, Users, Landmark, Globe, Target, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserOrganizations, useOrganizations, organizationService } from '@/services/organizationService';
import { toast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/ui/empty-state';

const ORGANIZATION_TYPES = [
  { value: "company", label: "شرکت", icon: Building },
  { value: "government", label: "سازمان دولتی", icon: Landmark },
  { value: "educational", label: "موسسه آموزشی", icon: GraduationCap },
  { value: "ngo", label: "سازمان غیردولتی (NGO)", icon: Users },
  { value: "chamber", label: "اتاق بازرگانی", icon: Briefcase },
  { value: "other", label: "سایر", icon: Globe },
];

const getOrgTypeLabel = (type: string) => {
  return ORGANIZATION_TYPES.find(t => t.value === type)?.label || type;
};

const getOrgTypeIcon = (type: string) => {
  const TypeIcon = ORGANIZATION_TYPES.find(t => t.value === type)?.icon || Building2;
  return TypeIcon;
};

export function UserOrganizationsManager() {
  const navigate = useNavigate();
  const { userOrganizations, isLoading, refresh } = useUserOrganizations();
  const { organizations, refresh: refreshOrgs } = useOrganizations();
  const [mainOrganization, setMainOrganization] = useState<any>(null);

  // Handler to refresh data
  const handleRefresh = useCallback(() => {
    refresh();
    const main = organizationService.getMainOrganization();
    if (main) {
      setMainOrganization(main);
    }
  }, [refresh]);

  // Initialize default organization and load main org on mount
  useEffect(() => {
    console.log('🔄 UserOrganizationsManager mounted');
    const initializeDefault = async () => {
      console.log('📝 Initializing default organization...');
      const result = await organizationService.initializeDefaultOrganization();
      
      if (result) {
        console.log('✅ New default organization created:', result);
        // فقط اگر سازمان جدید ایجاد شد، refresh کن
        refresh();
      } else {
        console.log('ℹ️ No new organization needed');
      }
      
      // بارگذاری main organization از localStorage
      const main = organizationService.getMainOrganization();
      if (main) {
        setMainOrganization(main);
      }
    };
    
    initializeDefault();
  }, []); // فقط یک بار اجرا می‌شود
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [addMode, setAddMode] = useState<"existing" | "new">("existing");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form states
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [positionTitle, setPositionTitle] = useState('');
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgType, setNewOrgType] = useState<string>("company");
  const [newOrgDescription, setNewOrgDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredUserOrgs = userOrganizations.filter(org =>
    org.organization_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (org.position_title?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddOrganization = async () => {
    if (addMode === "new") {
      if (!newOrgName.trim()) {
        toast({
          title: 'خطا',
          description: 'لطفاً نام سازمان را وارد کنید',
          variant: 'destructive'
        });
        return;
      }
      if (!newOrgType) {
        toast({
          title: 'خطا',
          description: 'لطفاً نوع سازمان را انتخاب کنید',
          variant: 'destructive'
        });
        return;
      }
    } else {
      if (!selectedOrgId) {
        toast({
          title: 'خطا',
          description: 'لطفاً یک سازمان انتخاب کنید',
          variant: 'destructive'
        });
        return;
      }
    }

    if (userOrganizations.length >= 8) {
      toast({
        title: 'خطا',
        description: 'حداکثر ۸ سازمان مجاز است',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let organizationId = selectedOrgId;

      if (addMode === "new") {
        const newOrg = await organizationService.addOrganization(
          newOrgName,
          newOrgType,
          newOrgDescription
        );
        if (!newOrg) {
          setIsSubmitting(false);
          return;
        }
        organizationId = newOrg.id;
        await refreshOrgs();
      }

      const success = await organizationService.addUserToOrganization(organizationId, 'member', positionTitle || undefined);
      
      if (success) {
        setIsAddDialogOpen(false);
        setSelectedOrgId('');
        setPositionTitle('');
        setNewOrgName('');
        setNewOrgType('company');
        setNewOrgDescription('');
        setAddMode('existing');
        refresh();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePosition = async () => {
    if (!selectedOrg || !positionTitle.trim()) {
      toast({
        title: 'خطا',
        description: 'لطفاً سمت خود را وارد کنید',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    const success = await organizationService.updateUserPosition(selectedOrg.id, positionTitle);
    setIsSubmitting(false);

    if (success) {
      setIsEditDialogOpen(false);
      setSelectedOrg(null);
      setPositionTitle('');
      refresh();
    }
  };

  const handleRemoveOrganization = async (userOrgId: string, orgName: string) => {
    if (!confirm(`آیا از حذف سازمان "${orgName}" مطمئن هستید؟`)) return;

    const success = await organizationService.removeUserFromOrganization(userOrgId);
    if (success) {
      refresh();
    }
  };

  const openEditDialog = (org: any) => {
    setSelectedOrg(org);
    setPositionTitle(org.position_title || '');
    setIsEditDialogOpen(true);
  };

  const handleSetAsMain = async (userOrg: any) => {
    // Find the full organization data
    const orgs = await organizationService.getOrganizations();
    const fullOrg = orgs.find(o => o.id === userOrg.organization_id);
    
    if (fullOrg) {
      organizationService.setMainOrganization(fullOrg);
      setMainOrganization(fullOrg);
      toast({
        title: 'سازمان اصلی تغییر کرد',
        description: `"${userOrg.organization_name}" به عنوان سازمان اصلی تنظیم شد`
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>سازمان‌ها و سمت‌های شما</CardTitle>
              <CardDescription>در حال بارگذاری اطلاعات...</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-muted w-12 h-12"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-muted rounded w-1/3"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>سازمان‌ها و سمت‌های شما</CardTitle>
            <CardDescription>
              مدیریت سازمان‌ها و سمت‌های خود (حداکثر ۸ سازمان)
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={userOrganizations.length >= 8}>
                <Plus className="h-4 w-4 ml-2" />
                افزودن سازمان
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>افزودن سازمان</DialogTitle>
                <DialogDescription>
                  یک سازمان از لیست موجود انتخاب کنید یا سازمان جدید ایجاد کنید
                </DialogDescription>
              </DialogHeader>
              
              <Tabs value={addMode} onValueChange={(v) => setAddMode(v as "existing" | "new")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="existing">انتخاب از لیست</TabsTrigger>
                  <TabsTrigger value="new">ایجاد سازمان جدید</TabsTrigger>
                </TabsList>
                
                <TabsContent value="existing" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="org-select">انتخاب سازمان</Label>
                    <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                      <SelectTrigger id="org-select">
                        <SelectValue placeholder="سازمان را انتخاب کنید" />
                      </SelectTrigger>
                      <SelectContent>
                        {organizations
                          .filter(org => !userOrganizations.some(uo => uo.organization_id === org.value))
                          .map(org => (
                            <SelectItem key={org.value} value={org.value}>
                              {org.icon} {org.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">سمت/نقش شما (اختیاری)</Label>
                    <Input
                      id="position"
                      value={positionTitle}
                      onChange={(e) => setPositionTitle(e.target.value)}
                      placeholder="مثال: مدیر فنی، کارشناس، مشاور"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="new" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-org-name">نام سازمان *</Label>
                    <Input
                      id="new-org-name"
                      value={newOrgName}
                      onChange={(e) => setNewOrgName(e.target.value)}
                      placeholder="مثال: شرکت فناوری نوآوران"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-org-type">نوع سازمان *</Label>
                    <Select value={newOrgType} onValueChange={setNewOrgType}>
                      <SelectTrigger id="new-org-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORGANIZATION_TYPES.map((type) => {
                          const Icon = type.icon;
                          return (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {type.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-org-desc">توضیحات (اختیاری)</Label>
                    <Input
                      id="new-org-desc"
                      value={newOrgDescription}
                      onChange={(e) => setNewOrgDescription(e.target.value)}
                      placeholder="توضیحات کوتاه درباره سازمان"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-position">سمت شما (اختیاری)</Label>
                    <Input
                      id="new-position"
                      value={positionTitle}
                      onChange={(e) => setPositionTitle(e.target.value)}
                      placeholder="مثال: مدیرعامل، بنیانگذار"
                    />
                  </div>
                </TabsContent>
              </Tabs>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setAddMode("existing");
                    setSelectedOrgId("");
                    setPositionTitle("");
                    setNewOrgName("");
                    setNewOrgType("company");
                    setNewOrgDescription("");
                  }}
                >
                  انصراف
                </Button>
                <Button 
                  onClick={handleAddOrganization} 
                  disabled={isSubmitting || (addMode === "existing" && !selectedOrgId) || (addMode === "new" && !newOrgName.trim())}
                >
                  {isSubmitting ? "در حال افزودن..." : "افزودن"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {userOrganizations.length === 0 ? (
          <EmptyState
            icon={<Building2 className="h-12 w-12" />}
            title="شما هنوز به هیچ سازمانی متصل نیستید"
            description="برای شروع، یک سازمان موجود انتخاب کنید یا سازمان جدید ایجاد کنید"
            action={{
              label: "افزودن سازمان",
              onClick: () => setIsAddDialogOpen(true),
              icon: <Plus className="ml-2 h-4 w-4" />
            }}
          />
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="جستجو در سازمان‌ها یا سمت‌ها..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>

            {filteredUserOrgs.length > 0 ? (
              <div className="grid gap-4">
                {filteredUserOrgs.map((org) => {
                  const OrgIcon = getOrgTypeIcon(org.organization_type || 'company');
                  const isMainOrg = mainOrganization?.id === org.organization_id;
                  const isDefaultOrg = org.organization_name === 'سازمان شماره یک';
                  
                  return (
                    <Card key={org.id} className={`hover:shadow-md transition-shadow ${isMainOrg ? 'border-primary border-2' : ''}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="p-3 rounded-lg bg-primary/10">
                              <OrgIcon className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-lg">{org.organization_name}</h3>
                                <Badge variant="secondary">
                                  {getOrgTypeLabel(org.organization_type || 'company')}
                                </Badge>
                                {isDefaultOrg && (
                                  <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950">
                                    پیش‌فرض
                                  </Badge>
                                )}
                                {isMainOrg && (
                                  <Badge className="bg-green-500">⭐ اصلی</Badge>
                                )}
                              </div>
                              {org.position_title && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">سمت:</span>
                                  <span className="font-medium">{org.position_title}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>عضویت از: {new Date(org.joined_date).toLocaleDateString('fa-IR')}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => navigate(`/organization/${org.organization_id}`)}
                              className="whitespace-nowrap gap-2"
                            >
                              مشاهده جزئیات
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(org)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveOrganization(org.id, org.organization_name)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                            {!isMainOrg && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSetAsMain(org)}
                                className="whitespace-nowrap text-xs"
                              >
                                <Target className="h-3 w-3 ml-1" />
                                تنظیم به عنوان اصلی
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>نتیجه‌ای یافت نشد</p>
              </div>
            )}
          </div>
        )}

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ویرایش سمت</DialogTitle>
              <DialogDescription>
                سمت خود را در {selectedOrg?.organization_name} تغییر دهید
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-position">سمت</Label>
                <Input
                  id="edit-position"
                  value={positionTitle}
                  onChange={(e) => setPositionTitle(e.target.value)}
                  placeholder="مثال: مدیر، کارشناس، عضو هیئت مدیره"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                انصراف
              </Button>
              <Button onClick={handleUpdatePosition} disabled={isSubmitting}>
                {isSubmitting ? 'در حال ذخیره...' : 'ذخیره'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
