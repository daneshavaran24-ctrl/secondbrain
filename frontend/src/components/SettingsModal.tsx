import { useState, useRef, useEffect } from "react";
import {
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Database,
  Eye,
  Lock,
  Smartphone,
  Save,
  RefreshCw,
  Upload,
  X,
  MapPin,
  Loader2,
  BookOpen,
  Quote,
  Clock,
  Plus,
  Trash2,
  Building,
  Edit2,
  Target
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabsListScrollable } from "@/components/ui/tabs-list-scrollable";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { organizationService, ORGANIZATION_UPDATE_EVENT } from '@/services/organizationService';
import { useCurrentUser, useUserManagement } from "@/hooks/useUserManagement";
import { getCachedSignedUrl } from "@/utils/signedUrlHelper";
import { UserOrganizationsManager } from "@/components/user-management/UserOrganizationsManager";
import { companiesService } from "@/services/companiesService";
import { CompanyQuickManager } from "@/components/user-management/CompanyQuickManager";
import { MainCompanyOrgSettings } from "@/components/SettingsModal-MainSettings";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentUser, isLoading: isLoadingUser } = useCurrentUser();
  const { updateUser } = useUserManagement();
  const isMobile = useIsMobile();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [organizations, setOrganizations] = useState<Array<{ id: string, name: string, type: string }>>([]);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgType, setNewOrgType] = useState("");
  const [showAddOrgForm, setShowAddOrgForm] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  // Initialize settings from user data or defaults
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      meetings: true,
      tasks: false,
      social: true
    },
    privacy: {
      analyticsTracking: true,
      behaviorLearning: true,
      dataSharing: false,
      profileVisibility: "private"
    },
    appearance: {
      theme: "system",
      language: "fa",
      fontSize: "medium"
    },
    profile: {
      name: "",
      email: "",
      position: "",
      organization: ""
    },
    location: {
      city: "",
      address: "",
      postalCode: "",
      defaultMeetingLocation: "",
      coordinates: {
        lat: 0,
        lng: 0
      }
    },
    dailyContent: {
      showVerse: true,
      showQuote: true,
      autoRotate: false,
      rotationInterval: 6
    }
  });

  // Type guard to check if currentUser is valid
  const isValidUser = (user: any): user is { user_id: string; first_name?: string; last_name?: string; display_name?: string; email?: string; position?: string; organization_id?: string; avatar_url?: string } => {
    return user && typeof user === 'object' && 'user_id' in user && !('error' in user);
  };

  // Update settings when user data is available
  useEffect(() => {
    if (isValidUser(currentUser)) {
      setSettings(prev => ({
        ...prev,
        profile: {
          name: `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.display_name || '',
          email: currentUser.email || '',
          position: currentUser.position || '',
          organization: currentUser.organization_id ? 'Loading...' : ''
        }
      }));
      
      // Load profile image if available
      if (currentUser.avatar_url) {
        loadProfileImage(currentUser.avatar_url);
      }
    }
  }, [currentUser]);

  // Load organizations when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadOrganizations();
    }
  }, [isOpen]);

  // Load profile image from Supabase Storage
  const loadProfileImage = async (avatarUrl: string) => {
    try {
      if (avatarUrl.startsWith('avatars/')) {
        const signedUrl = await getCachedSignedUrl('avatars', avatarUrl.replace('avatars/', ''));
        if (signedUrl) {
          setProfileImage(signedUrl);
        }
      } else if (avatarUrl.startsWith('http')) {
        setProfileImage(avatarUrl);
      }
    } catch (error) {
      console.error('Error loading profile image:', error);
    }
  };

  // Load organizations from database
  const loadOrganizations = async () => {
    setIsLoadingOrgs(true);
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, type')
        .order('name');

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error('Error loading organizations:', error);
      toast({
        title: "خطا در بارگذاری سازمان‌ها",
        description: "مشکلی در دریافت لیست سازمان‌ها پیش آمد.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingOrgs(false);
    }
  };

  // Add new organization
  const addOrganization = async () => {
    if (!newOrgName.trim()) return;

    const result = await organizationService.addOrganization(newOrgName.trim(), newOrgType);
    if (result) {
      setOrganizations(prev => [...prev, result]);
      setNewOrgName('');
      setNewOrgType('other');
      setShowAddOrgForm(false);
    }
  };

  // Delete organization
  const deleteOrganization = async (id: string, name: string) => {
    const success = await organizationService.deleteOrganization(id, name);
    if (success) {
      setOrganizations(prev => prev.filter(org => org.id !== id));

      // If the deleted organization was selected, reset selection
      if (settings.profile.organization === name) {
        updateSettings('profile', 'organization', '');
      }
    }
  };

  const handleSave = async () => {
    if (!isValidUser(currentUser)) {
      toast({
        title: "خطا",
        description: "ابتدا وارد حساب کاربری خود شوید",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    try {
      // Split full name into first and last name
      const nameParts = settings.profile.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Update user profile in database (excluding email and avatar_url for now)
      await updateUser.mutateAsync({
        userId: currentUser.user_id,
        userData: {
          display_name: settings.profile.name,
          first_name: firstName,
          last_name: lastName,
          position: settings.profile.position,
        }
      });

      // Save other settings to localStorage for now
      const otherSettings = {
        notifications: settings.notifications,
        privacy: settings.privacy,
        appearance: settings.appearance,
        location: settings.location,
        dailyContent: settings.dailyContent
      };
      localStorage.setItem('userSettings', JSON.stringify(otherSettings));

      // Trigger storage event for other components to update
      window.dispatchEvent(new Event('storage'));

      toast({
        title: "تنظیمات ذخیره شد",
        description: "تغییرات شما با موفقیت اعمال شد.",
      });
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "خطا در ذخیره",
        description: "مشکلی در ذخیره تنظیمات پیش آمد. لطفاً مجدداً تلاش کنید.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSettings = (category: string, key: string, value: string | boolean | number | object) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }));
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser || !('user_id' in currentUser)) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "فرمت فایل نامعتبر",
        description: "لطفاً فایل JPG، PNG یا GIF انتخاب کنید.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "فایل بیش از حد بزرگ است",
        description: "حداکثر اندازه مجاز ۲ مگابایت است.",
        variant: "destructive"
      });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.user_id}/${Date.now()}.${fileExt}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setProfileImage(publicUrl);
      
      toast({
        title: "تصویر آپلود شد",
        description: "تصویر پروفایل شما با موفقیت تغییر کرد.",
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "خطا در آپلود تصویر",
        description: "مشکلی در آپلود تصویر پیش آمد. لطفاً مجدداً تلاش کنید.",
        variant: "destructive"
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const removeProfileImage = () => {
    setProfileImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({
      title: "تصویر حذف شد",
      description: "تصویر پروفایل به حالت پیش‌فرض بازگردانده شد.",
    });
  };

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[95vh] overflow-y-auto p-4" dir="rtl">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2 text-lg text-right">
              <User className="h-5 w-5" />
              تنظیمات سیستم
            </SheetTitle>
            <SheetDescription className="text-right">
              مدیریت تنظیمات حساب کاربری
            </SheetDescription>
          </SheetHeader>

          <Tabs defaultValue="profile" className="space-y-4" dir="rtl">
            <TabsListScrollable className="mb-4">
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4" />
                پروفایل
              </TabsTrigger>
              <TabsTrigger value="main" className="gap-2">
                <Target className="h-4 w-4" />
                اصلی
              </TabsTrigger>
              <TabsTrigger value="companies" className="gap-2">
                <Building className="h-4 w-4" />
                شرکت‌ها
              </TabsTrigger>
              <TabsTrigger value="organizations" className="gap-2">
                <Building className="h-4 w-4" />
                سازمان‌ها
              </TabsTrigger>
              <TabsTrigger value="location" className="gap-2">
                <MapPin className="h-4 w-4" />
                مکان
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="h-4 w-4" />
                اعلان‌ها
              </TabsTrigger>
              <TabsTrigger value="privacy" className="gap-2">
                <Shield className="h-4 w-4" />
                حریم
              </TabsTrigger>
              <TabsTrigger value="appearance" className="gap-2">
                <Palette className="h-4 w-4" />
                ظاهر
              </TabsTrigger>
            </TabsListScrollable>

            {/* Content stays the same - tabs already exist */}
            <div className="space-y-4">
              {/* Keep existing TabsContent components */}
            </div>
          </Tabs>

          <div className="sticky bottom-0 left-0 right-0 bg-background border-t pt-4 mt-6">
            <div className="flex flex-col-reverse gap-2">
              <Button variant="outline" onClick={onClose} className="w-full">
                لغو
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="w-full">
                {isSaving ? (
                  <><RefreshCw className="h-4 w-4 animate-spin ml-2" />در حال ذخیره...</>
                ) : (
                  <><Save className="h-4 w-4 ml-2" />ذخیره تنظیمات</>
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden" dir="rtl">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl text-right pr-8">
            <User className="h-5 w-5" />
            تنظیمات سیستم
          </DialogTitle>
          <DialogDescription className="text-right pr-8">
            مدیریت تنظیمات حساب کاربری، حریم خصوصی و ظاهر سیستم
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="space-y-4" dir="rtl">
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              پروفایل
            </TabsTrigger>
            <TabsTrigger value="main" className="gap-2">
              <Target className="h-4 w-4" />
              اصلی
            </TabsTrigger>
            <TabsTrigger value="companies" className="gap-2">
              <Building className="h-4 w-4" />
              شرکت‌ها
            </TabsTrigger>
            <TabsTrigger value="organizations" className="gap-2">
              <Building className="h-4 w-4" />
              سازمان‌ها
            </TabsTrigger>
            <TabsTrigger value="location" className="gap-2">
              <MapPin className="h-4 w-4" />
              مکان
            </TabsTrigger>
            <TabsTrigger value="daily-content" className="gap-2">
              <BookOpen className="h-4 w-4" />
              محتوای روزانه
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              اعلان‌ها
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-2">
              <Shield className="h-4 w-4" />
              حریم خصوصی
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4" />
              ظاهر
            </TabsTrigger>
          </TabsList>

          <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            <TabsContent value="profile" className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent pr-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    اطلاعات شخصی
                  </CardTitle>
                  <CardDescription>
                    مدیریت اطلاعات پروفایل و تماس
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isLoadingUser ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      در حال بارگذاری اطلاعات کاربر...
                    </div>
                  ) : (
                    <div className="flex items-center gap-6">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={profileImage || undefined} />
                        <AvatarFallback className="bg-gradient-professional text-white text-lg font-bold">
                          {isValidUser(currentUser) ? 
                            (currentUser.first_name?.[0] || currentUser.display_name?.[0] || 'ک') : 'ک'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <div className="flex gap-2 rtl:flex-row-reverse">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleImageUpload}
                            disabled={isUploadingAvatar}
                          >
                            {isUploadingAvatar ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Upload className="h-4 w-4 mr-2" />
                            )}
                            تغییر تصویر
                          </Button>
                          {profileImage && (
                            <Button variant="outline" size="sm" onClick={removeProfileImage}>
                              <X className="h-4 w-4 mr-2" />
                              حذف
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          فرمت‌های JPG، PNG یا GIF. حداکثر ۲ مگابایت.
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 rtl:space-x-reverse">
                    <div className="space-y-2 rtl:order-1">
                      <Label htmlFor="name">نام و نام خانوادگی</Label>
                      <Input
                        id="name"
                        value={settings.profile.name}
                        onChange={(e) => updateSettings('profile', 'name', e.target.value)}
                        placeholder={isLoadingUser ? "در حال بارگذاری..." : "نام و نام خانوادگی خود را وارد کنید"}
                        disabled={isLoadingUser}
                      />
                    </div>
                    <div className="space-y-2 rtl:order-2">
                      <Label htmlFor="email">ایمیل</Label>
                      <Input
                        id="email"
                        type="email"
                        value={settings.profile.email}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="position">سمت</Label>
                    <Input
                      id="position"
                      value={settings.profile.position}
                      onChange={(e) => updateSettings('profile', 'position', e.target.value)}
                      placeholder="سمت سازمانی خود را وارد کنید"
                    />
                  </div>

                  {!isValidUser(currentUser) && !isLoadingUser && (
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">
                        برای استفاده از این قسمت، لطفاً وارد حساب کاربری خود شوید
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Companies Tab */}
            <TabsContent value="companies" className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent pr-2">
              <CompanyQuickManager />
            </TabsContent>

            {/* Organizations Tab */}
            <TabsContent value="organizations" className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent pr-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    مدیریت سازمان‌ها
                  </CardTitle>
                  <CardDescription>
                    افزودن و حذف سازمان‌ها
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Organization List */}
                  <div className="space-y-3">
                    {isLoadingOrgs ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        در حال بارگذاری سازمان‌ها...
                      </div>
                    ) : organizations.length > 0 ? (
                      organizations.map((org) => (
                        <div key={org.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{org.name}</p>
                            <p className="text-sm text-muted-foreground">
                              نوع: {org.type === 'health' ? 'بهداشت' : 
                                    org.type === 'education' ? 'آموزش' : 
                                    org.type === 'business' ? 'تجاری' :
                                    org.type === 'government' ? 'دولتی' :
                                    org.type === 'nonprofit' ? 'غیرانتفاعی' : 'سایر'}
                            </p>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent dir="rtl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>آیا از حذف این سازمان اطمینان دارید؟</AlertDialogTitle>
                                <AlertDialogDescription>
                                  این عمل قابل بازگشت نیست. سازمان "{org.name}" از لیست حذف خواهد شد.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>لغو</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteOrganization(org.id, org.name)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  حذف
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        هنوز سازمانی ثبت نشده است
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Add Organization Form */}
                  {!showAddOrgForm ? (
                    <Button
                      variant="outline"
                      onClick={() => setShowAddOrgForm(true)}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      افزودن سازمان جدید
                    </Button>
                  ) : (
                    <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
                      <div className="space-y-2">
                        <Label htmlFor="newOrgName">نام سازمان</Label>
                        <Input
                          id="newOrgName"
                          value={newOrgName}
                          onChange={(e) => setNewOrgName(e.target.value)}
                          placeholder="نام سازمان را وارد کنید"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newOrgType">نوع سازمان</Label>
                        <Select value={newOrgType} onValueChange={setNewOrgType}>
                          <SelectTrigger>
                            <SelectValue placeholder="نوع سازمان را انتخاب کنید" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="health">بهداشت</SelectItem>
                            <SelectItem value="education">آموزش</SelectItem>
                            <SelectItem value="business">تجاری</SelectItem>
                            <SelectItem value="government">دولتی</SelectItem>
                            <SelectItem value="nonprofit">غیرانتفاعی</SelectItem>
                            <SelectItem value="other">سایر</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={addOrganization}
                          disabled={!newOrgName.trim()}
                          className="flex-1"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          افزودن
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowAddOrgForm(false);
                            setNewOrgName('');
                            setNewOrgType('');
                          }}
                        >
                          لغو
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <UserOrganizationsManager />
            </TabsContent>

            <TabsContent value="location" className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent pr-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    تنظیمات مکان و جلسات
                  </CardTitle>
                  <CardDescription>
                    مدیریت اطلاعات مکان و محل پیش‌فرض جلسات
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 rtl:space-x-reverse">
                    <div className="space-y-2 rtl:order-1">
                      <Label htmlFor="city">شهر</Label>
                      <Input
                        id="city"
                        value={settings.location.city}
                        onChange={(e) => updateSettings('location', 'city', e.target.value)}
                        placeholder="نام شهر"
                      />
                    </div>
                    <div className="space-y-2 rtl:order-2">
                      <Label htmlFor="postalCode">کدپستی</Label>
                      <Input
                        id="postalCode"
                        value={settings.location.postalCode}
                        onChange={(e) => updateSettings('location', 'postalCode', e.target.value)}
                        placeholder="۱۲۳۴۵-۶۷۸۹۰"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">آدرس کامل</Label>
                    <Input
                      id="address"
                      value={settings.location.address}
                      onChange={(e) => updateSettings('location', 'address', e.target.value)}
                      placeholder="آدرس محل کار یا سکونت"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="defaultMeetingLocation">محل پیش‌فرض جلسات</Label>
                    <Select
                      value={settings.location.defaultMeetingLocation}
                      onValueChange={(value) => updateSettings('location', 'defaultMeetingLocation', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="دفتر مدیریت">دفتر مدیریت</SelectItem>
                        <SelectItem value="سالن کنفرانس">سالن کنفرانس</SelectItem>
                        <SelectItem value="اتاق جلسات کوچک">اتاق جلسات کوچک</SelectItem>
                        <SelectItem value="فضای باز">فضای باز</SelectItem>
                        <SelectItem value="آنلاین">آنلاین</SelectItem>
                        <SelectItem value="سایر">سایر مکان</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>موقعیت جغرافیایی</Label>
                    <div className="grid grid-cols-2 gap-4 rtl:space-x-reverse">
                      <div className="space-y-2 rtl:order-1">
                        <Label htmlFor="lat" className="text-sm">عرض جغرافیایی</Label>
                        <Input
                          id="lat"
                          type="number"
                          step="0.0001"
                          value={settings.location.coordinates.lat}
                          onChange={(e) => updateSettings('location', 'coordinates', {
                            ...settings.location.coordinates,
                            lat: parseFloat(e.target.value) || 0
                          })}
                          placeholder="36.2973"
                        />
                      </div>
                      <div className="space-y-2 rtl:order-2">
                        <Label htmlFor="lng" className="text-sm">طول جغرافیایی</Label>
                        <Input
                          id="lng"
                          type="number"
                          step="0.0001"
                          value={settings.location.coordinates.lng}
                          onChange={(e) => updateSettings('location', 'coordinates', {
                            ...settings.location.coordinates,
                            lng: parseFloat(e.target.value) || 0
                          })}
                          placeholder="59.6067"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      موقعیت جغرافیایی برای بهینه‌سازی پیشنهادات مکان استفاده می‌شود
                    </p>
                  </div>
                </CardContent>
              </Card>

            </TabsContent>

            <TabsContent value="daily-content" className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent pr-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    تنظیمات محتوای روزانه
                  </CardTitle>
                  <CardDescription>
                    مدیریت نمایش آیات قرآن و جملات انگیزشی
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          نمایش آیه روزانه
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          نمایش آیه قرآن کریم در هدر
                        </p>
                      </div>
                      <Switch
                        checked={settings.dailyContent?.showVerse ?? true}
                        onCheckedChange={(checked) => updateSettings('dailyContent', 'showVerse', checked)}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="flex items-center gap-2">
                          <Quote className="h-4 w-4" />
                          نمایش جمله انگیزشی
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          نمایش جمله انگیزشی روزانه در هدر
                        </p>
                      </div>
                      <Switch
                        checked={settings.dailyContent?.showQuote ?? true}
                        onCheckedChange={(checked) => updateSettings('dailyContent', 'showQuote', checked)}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          تغییر خودکار محتوا
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          تغییر محتوا بر اساس بازه زمانی تنظیم شده
                        </p>
                      </div>
                      <Switch
                        checked={settings.dailyContent?.autoRotate ?? false}
                        onCheckedChange={(checked) => updateSettings('dailyContent', 'autoRotate', checked)}
                      />
                    </div>

                    {settings.dailyContent?.autoRotate && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <Label>بازه زمانی تغییر (ساعت)</Label>
                          <Select
                            value={settings.dailyContent?.rotationInterval?.toString() ?? '6'}
                            onValueChange={(value) => updateSettings('dailyContent', 'rotationInterval', parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">هر ساعت</SelectItem>
                              <SelectItem value="3">هر ۳ ساعت</SelectItem>
                              <SelectItem value="6">هر ۶ ساعت</SelectItem>
                              <SelectItem value="12">هر ۱۲ ساعت</SelectItem>
                              <SelectItem value="24">روزانه</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent pr-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    تنظیمات اعلان‌ها
                  </CardTitle>
                  <CardDescription>
                    مدیریت نحوه دریافت اعلان‌ها
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>اعلان‌های ایمیل</Label>
                        <p className="text-sm text-muted-foreground">
                          دریافت خلاصه روزانه و به‌روزرسانی‌ها
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.email}
                        onCheckedChange={(checked) => updateSettings('notifications', 'email', checked)}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>اعلان‌های فوری</Label>
                        <p className="text-sm text-muted-foreground">
                          نوتیفیکیشن‌های مهم در برنامه
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.push}
                        onCheckedChange={(checked) => updateSettings('notifications', 'push', checked)}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>یادآوری جلسات</Label>
                        <p className="text-sm text-muted-foreground">
                          هشدار ۱۵ دقیقه قبل از جلسات
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.meetings}
                        onCheckedChange={(checked) => updateSettings('notifications', 'meetings', checked)}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>هشدار وظایف</Label>
                        <p className="text-sm text-muted-foreground">
                          یادآوری ضرب‌الاجل وظایف
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.tasks}
                        onCheckedChange={(checked) => updateSettings('notifications', 'tasks', checked)}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>اعلان‌های شبکه‌های اجتماعی</Label>
                        <p className="text-sm text-muted-foreground">
                          آپدیت‌های رسانه‌های اجتماعی
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.social}
                        onCheckedChange={(checked) => updateSettings('notifications', 'social', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent pr-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    حریم خصوصی و امنیت
                  </CardTitle>
                  <CardDescription>
                    کنترل نحوه استفاده از اطلاعات شما
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          ردیابی تحلیلی
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          جمع‌آوری داده‌ها برای بهبود سیستم
                        </p>
                      </div>
                      <Switch
                        checked={settings.privacy.analyticsTracking}
                        onCheckedChange={(checked) => updateSettings('privacy', 'analyticsTracking', checked)}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          یادگیری رفتاری
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          تحلیل الگوهای استفاده برای پیشنهادات بهتر
                        </p>
                      </div>
                      <Switch
                        checked={settings.privacy.behaviorLearning}
                        onCheckedChange={(checked) => updateSettings('privacy', 'behaviorLearning', checked)}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          اشتراک‌گذاری داده‌های گجت
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          اجازه ادغام داده‌های ساعت و عینک هوشمند
                        </p>
                      </div>
                      <Switch
                        checked={settings.privacy.dataSharing}
                        onCheckedChange={(checked) => updateSettings('privacy', 'dataSharing', checked)}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>قابلیت مشاهده پروفایل</Label>
                      <Select
                        value={settings.privacy.profileVisibility}
                        onValueChange={(value) => updateSettings('privacy', 'profileVisibility', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="private">خصوصی</SelectItem>
                          <SelectItem value="organization">سازمان</SelectItem>
                          <SelectItem value="public">عمومی</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent pr-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    ظاهر و زبان
                  </CardTitle>
                  <CardDescription>
                    تنظیم نمای سیستم و زبان رابط کاربری
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>تم رنگی</Label>
                      <Select
                        value={settings.appearance.theme}
                        onValueChange={(value) => updateSettings('appearance', 'theme', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">روشن</SelectItem>
                          <SelectItem value="dark">تیره</SelectItem>
                          <SelectItem value="system">خودکار</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        زبان سیستم
                      </Label>
                      <Select
                        value={settings.appearance.language}
                        onValueChange={(value) => updateSettings('appearance', 'language', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fa">فارسی</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="ar">العربية</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>اندازه فونت</Label>
                      <Select
                        value={settings.appearance.fontSize}
                        onValueChange={(value) => updateSettings('appearance', 'fontSize', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">کوچک</SelectItem>
                          <SelectItem value="medium">متوسط</SelectItem>
                          <SelectItem value="large">بزرگ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              لغو
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <Save className="h-4 w-4 mr-2" />
              ذخیره تغییرات
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
