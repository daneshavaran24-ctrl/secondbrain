import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Search, Phone, Mail, MapPin, Building, Users, Star, Calendar, Edit, Trash2, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { PersianDatePicker } from '@/components/ui/persian-date-picker';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { formatPersianNumber, toPersianNumbers } from '@/utils/persian-numbers';

// Types and interfaces
interface Partner {
  id: string;
  name: string;
  type: 'individual' | 'organization';
  category: string;
  organization?: string;
  contactPerson?: string;
  phone: string;
  email: string;
  address: string;
  expertise: string[];
  collaborationLevel: 'high' | 'medium' | 'low';
  lastContact: string;
  notes: string;
  projects: string[];
  status: 'active' | 'pending' | 'inactive';
  contacts?: ContactRecord[];
}

interface ContactRecord {
  id: string;
  date: string;
  type: string;
  description: string;
  result: string;
  createdAt: Date;
}

// Form schemas
const partnerSchema = z.object({
  name: z.string().min(1, 'نام الزامی است'),
  type: z.enum(['individual', 'organization']),
  category: z.string().min(1, 'دسته‌بندی الزامی است'),
  organization: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().min(1, 'شماره تلفن الزامی است'),
  email: z.string().email('ایمیل معتبر وارد کنید'),
  address: z.string().min(1, 'آدرس الزامی است'),
  expertise: z.string().min(1, 'حوزه تخصص الزامی است'),
  collaborationLevel: z.enum(['high', 'medium', 'low']),
  notes: z.string().optional(),
});

const contactSchema = z.object({
  date: z.string().min(1, 'تاریخ الزامی است'),
  type: z.string().min(1, 'نوع تماس الزامی است'),
  description: z.string().min(1, 'توضیحات الزامی است'),
  result: z.string().min(1, 'نتیجه الزامی است'),
});

type PartnerFormData = z.infer<typeof partnerSchema>;
type ContactFormData = z.infer<typeof contactSchema>;

const Partners = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const { toast } = useToast();

  // Load data from localStorage on mount
  useEffect(() => {
    const savedPartners = localStorage.getItem('partners');
    if (savedPartners) {
      setPartners(JSON.parse(savedPartners));
    }
    // No initial sample data - start with empty state
  }, []);

  // Save partners to localStorage
  const savePartners = (updatedPartners: Partner[]) => {
    setPartners(updatedPartners);
    localStorage.setItem('partners', JSON.stringify(updatedPartners));
  };

  // Add partner form
  const addForm = useForm<PartnerFormData>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      type: 'individual',
      collaborationLevel: 'medium',
    },
  });

  // Edit partner form
  const editForm = useForm<PartnerFormData>({
    resolver: zodResolver(partnerSchema),
  });

  // Contact form
  const contactForm = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  // Add new partner
  const onAddPartner = (data: PartnerFormData) => {
    const newPartner: Partner = {
      id: crypto.randomUUID(),
      name: data.name,
      type: data.type,
      category: data.category,
      organization: data.organization || '',
      contactPerson: data.contactPerson || '',
      phone: data.phone,
      email: data.email,
      address: data.address,
      expertise: data.expertise.split(',').map(s => s.trim()),
      collaborationLevel: data.collaborationLevel,
      notes: data.notes || '',
      projects: [],
      status: 'active',
      contacts: [],
      lastContact: '',
    };

    const updatedPartners = [...partners, newPartner];
    savePartners(updatedPartners);
    
    setIsAddDialogOpen(false);
    addForm.reset();
    
    toast({
      title: "همکار جدید اضافه شد",
      description: `${data.name} با موفقیت به لیست همکاران اضافه شد.`,
    });
  };

  // Edit partner
  const onEditPartner = (data: PartnerFormData) => {
    if (!selectedPartner) return;

    const updatedPartners = partners.map(partner =>
      partner.id === selectedPartner.id
        ? {
            ...partner,
            name: data.name,
            type: data.type,
            category: data.category,
            organization: data.organization || '',
            contactPerson: data.contactPerson || '',
            phone: data.phone,
            email: data.email,
            address: data.address,
            expertise: data.expertise.split(',').map(s => s.trim()),
            collaborationLevel: data.collaborationLevel,
            notes: data.notes || '',
          }
        : partner
    );

    savePartners(updatedPartners);
    
    setIsEditDialogOpen(false);
    editForm.reset();
    setSelectedPartner(null);
    
    toast({
      title: "اطلاعات همکار بروزرسانی شد",
      description: `اطلاعات ${data.name} با موفقیت بروزرسانی شد.`,
    });
  };

  // Add new contact
  const onAddContact = (data: ContactFormData) => {
    if (!selectedPartner) return;

    const newContact: ContactRecord = {
      id: crypto.randomUUID(),
      date: data.date,
      type: data.type,
      description: data.description,
      result: data.result,
      createdAt: new Date(),
    };

    const updatedPartners = partners.map(partner =>
      partner.id === selectedPartner.id
        ? {
            ...partner,
            contacts: [...(partner.contacts || []), newContact],
            lastContact: data.date,
          }
        : partner
    );

    savePartners(updatedPartners);
    
    setIsContactDialogOpen(false);
    contactForm.reset();
    setSelectedPartner(null);
    
    toast({
      title: "تماس جدید ثبت شد",
      description: "تماس جدید با موفقیت ثبت شد و آخرین تماس بروزرسانی شد.",
    });
  };

  // Delete partner
  const deletePartner = (partnerId: string) => {
    const updatedPartners = partners.filter(p => p.id !== partnerId);
    savePartners(updatedPartners);
    
    toast({
      title: "همکار حذف شد",
      description: "همکار با موفقیت از لیست حذف شد.",
    });
  };

  // Open edit dialog
  const openEditDialog = (partner: Partner) => {
    setSelectedPartner(partner);
    editForm.reset({
      ...partner,
      expertise: partner.expertise.join(', '),
    });
    setIsEditDialogOpen(true);
  };

  // Open contact dialog
  const openContactDialog = (partner: Partner) => {
    setSelectedPartner(partner);
    contactForm.reset();
    setIsContactDialogOpen(true);
  };

  // Open details dialog
  const openDetailsDialog = (partner: Partner) => {
    setSelectedPartner(partner);
    setIsDetailsDialogOpen(true);
  };

  const getCollaborationBadge = (level: string) => {
    switch (level) {
      case 'high':
        return <Badge className="bg-green-100 text-green-800">همکاری بالا</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">همکاری متوسط</Badge>;
      case 'low':
        return <Badge className="bg-gray-100 text-gray-800">همکاری پایین</Badge>;
      default:
        return <Badge variant="secondary">نامشخص</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">فعال</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">در انتظار</Badge>;
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800">غیرفعال</Badge>;
      default:
        return <Badge variant="secondary">نامشخص</Badge>;
    }
  };

  const getInitials = (name: string) => {
    const words = name.split(' ');
    return words.slice(0, 2).map(word => word[0]).join('');
  };

  const filteredPartners = partners.filter(partner =>
    partner.name.includes(searchTerm) || 
    partner.category.includes(searchTerm) ||
    partner.expertise.some(exp => exp.includes(searchTerm))
  );

  const individualPartners = filteredPartners.filter(p => p.type === 'individual');
  const organizationPartners = filteredPartners.filter(p => p.type === 'organization');

  const PartnerCard = ({ partner }: { partner: Partner }) => (
    <Card className="glass-card hover-lift transition-elegant">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 cursor-pointer" onClick={() => openDetailsDialog(partner)}>
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(partner.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg cursor-pointer hover:text-primary" onClick={() => openDetailsDialog(partner)}>
                {partner.name}
              </CardTitle>
              <CardDescription>{partner.category}</CardDescription>
              {partner.organization && partner.type === 'individual' && (
                <p className="text-sm text-muted-foreground">{partner.organization}</p>
              )}
              {partner.contactPerson && (
                <p className="text-sm text-muted-foreground">مسئول: {partner.contactPerson}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {getStatusBadge(partner.status)}
            {getCollaborationBadge(partner.collaborationLevel)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{partner.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{partner.email}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground md:col-span-2">
              <MapPin className="h-4 w-4" />
              <span>{partner.address}</span>
            </div>
          </div>

          {/* Expertise */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">حوزه تخصص:</h4>
            <div className="flex flex-wrap gap-1">
              {partner.expertise.map((exp, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {exp}
                </Badge>
              ))}
            </div>
          </div>

          {/* Projects */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">پروژه‌های مشترک:</h4>
            <div className="space-y-1">
              {partner.projects.map((project, idx) => (
                <div key={idx} className="text-sm text-muted-foreground">
                  • {project}
                </div>
              ))}
            </div>
          </div>

          {/* Last Contact */}
          {partner.lastContact && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>آخرین تماس: {partner.lastContact}</span>
            </div>
          )}

          {/* Notes */}
          {partner.notes && (
            <div className="p-3 bg-secondary/50 rounded text-sm">
              <p className="text-muted-foreground">{partner.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => openEditDialog(partner)}
            >
              <Edit className="h-4 w-4 ml-2" />
              ویرایش اطلاعات
            </Button>
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => openContactDialog(partner)}
            >
              <MessageSquare className="h-4 w-4 ml-2" />
              ثبت تماس جدید
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <div className="min-h-screen bg-gradient-subtle p-8">
        <div className="max-w-7xl mx-auto spacing-relaxed">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">نقشه تعاملات و همکاران</h1>
                <p className="text-muted-foreground">مدیریت روابط و شبکه همکاری‌ها</p>
              </div>
            </div>
            <Button 
              className="flex items-center gap-2" 
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              افزودن همکار
            </Button>
          </div>

          {/* Search */}
          <Card className="glass-card mb-8">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="جستجو در همکاران (نام، دسته‌بندی، تخصص)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-9"
                />
              </div>
            </CardContent>
          </Card>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="glass-card text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-blue-600 mb-2">{partners.length}</div>
                <p className="text-sm text-muted-foreground">کل همکاران</p>
              </CardContent>
            </Card>
            <Card className="glass-card text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {partners.filter(p => p.status === 'active').length}
                </div>
                <p className="text-sm text-muted-foreground">همکاران فعال</p>
              </CardContent>
            </Card>
            <Card className="glass-card text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-purple-600 mb-2">{individualPartners.length}</div>
                <p className="text-sm text-muted-foreground">افراد</p>
              </CardContent>
            </Card>
            <Card className="glass-card text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-orange-600 mb-2">{organizationPartners.length}</div>
                <p className="text-sm text-muted-foreground">سازمان‌ها</p>
              </CardContent>
            </Card>
          </div>

          {/* Partners Tabs */}
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">همه همکاران</TabsTrigger>
              <TabsTrigger value="individuals">افراد</TabsTrigger>
              <TabsTrigger value="organizations">سازمان‌ها</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              <div className="grid gap-6">
                {filteredPartners.map(partner => (
                  <PartnerCard key={partner.id} partner={partner} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="individuals" className="space-y-6">
              <div className="grid gap-6">
                {individualPartners.map(partner => (
                  <PartnerCard key={partner.id} partner={partner} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="organizations" className="space-y-6">
              <div className="grid gap-6">
                {organizationPartners.map(partner => (
                  <PartnerCard key={partner.id} partner={partner} />
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {filteredPartners.length === 0 && (
            <Card className="glass-card">
              <CardContent className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">همکاری یافت نشد</h3>
                <p className="text-muted-foreground">با تغییر عبارت جستجو دوباره تلاش کنید</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Partner Dialog */}
      <ResponsiveDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        title="افزودن همکار جدید"
        description="اطلاعات همکار یا سازمان جدید را وارد کنید"
      >
        <Form {...addForm}>
          <form onSubmit={addForm.handleSubmit(onAddPartner)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={addForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام</FormLabel>
                    <FormControl>
                      <Input placeholder="نام کامل یا نام سازمان" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="انتخاب نوع" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background border">
                        <SelectItem value="individual">فرد</SelectItem>
                        <SelectItem value="organization">سازمان</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={addForm.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>دسته‌بندی</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: خیر، داوطلب، موسسه خیریه" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={addForm.control}
              name="organization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>سازمان (اختیاری)</FormLabel>
                  <FormControl>
                    <Input placeholder="نام سازمان یا شرکت" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={addForm.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>فرد تماس (اختیاری)</FormLabel>
                  <FormControl>
                    <Input placeholder="نام مسئول یا نماینده" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={addForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تلفن</FormLabel>
                    <FormControl>
                      <Input placeholder="شماره تماس" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ایمیل</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="آدرس ایمیل" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={addForm.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>آدرس</FormLabel>
                  <FormControl>
                    <Input placeholder="آدرس کامل" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={addForm.control}
              name="expertise"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>حوزه تخصص</FormLabel>
                  <FormControl>
                    <Input placeholder="حوزه‌های تخصصی (با کاما جدا کنید)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={addForm.control}
              name="collaborationLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>سطح همکاری</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="انتخاب سطح همکاری" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-background border">
                      <SelectItem value="high">بالا</SelectItem>
                      <SelectItem value="medium">متوسط</SelectItem>
                      <SelectItem value="low">پایین</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={addForm.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>یادداشت</FormLabel>
                  <FormControl>
                    <Textarea placeholder="یادداشت‌ها و توضیحات" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1">
                ثبت همکار
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => setIsAddDialogOpen(false)}
              >
                انصراف
              </Button>
            </div>
          </form>
        </Form>
      </ResponsiveDialog>

      {/* Edit Partner Dialog */}
      <ResponsiveDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        title="ویرایش اطلاعات همکار"
        description="اطلاعات همکار را ویرایش کنید"
      >
        <Form {...editForm}>
          <form onSubmit={editForm.handleSubmit(onEditPartner)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام</FormLabel>
                    <FormControl>
                      <Input placeholder="نام کامل یا نام سازمان" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="انتخاب نوع" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background border">
                        <SelectItem value="individual">فرد</SelectItem>
                        <SelectItem value="organization">سازمان</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ... similar fields as add form ... */}
            <FormField
              control={editForm.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>دسته‌بندی</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: خیر، داوطلب، موسسه خیریه" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={editForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تلفن</FormLabel>
                    <FormControl>
                      <Input placeholder="شماره تماس" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ایمیل</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="آدرس ایمیل" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={editForm.control}
              name="expertise"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>حوزه تخصص</FormLabel>
                  <FormControl>
                    <Input placeholder="حوزه‌های تخصصی (با کاما جدا کنید)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1">
                ذخیره تغییرات
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                انصراف
              </Button>
              <Button 
                type="button" 
                variant="destructive"
                onClick={() => {
                  if (selectedPartner && confirm('آیا مطمئن هستید که می‌خواهید این همکار را حذف کنید؟')) {
                    deletePartner(selectedPartner.id);
                    setIsEditDialogOpen(false);
                  }
                }}
              >
                <Trash2 className="h-4 w-4 ml-2" />
                حذف
              </Button>
            </div>
          </form>
        </Form>
      </ResponsiveDialog>

      {/* Contact Dialog */}
      <ResponsiveDialog
        open={isContactDialogOpen}
        onOpenChange={setIsContactDialogOpen}
        title="ثبت تماس جدید"
        description={`ثبت تماس جدید با ${selectedPartner?.name}`}
      >
        <Form {...contactForm}>
          <form onSubmit={contactForm.handleSubmit(onAddContact)} className="space-y-4">
            <FormField
              control={contactForm.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>تاریخ تماس</FormLabel>
                  <FormControl>
                    <PersianDatePicker
                      value={field.value ? new Date(field.value) : null}
                      onChange={(date) => field.onChange(date ? toPersianNumbers(date.toLocaleDateString('fa-IR')) : '')}
                      placeholder="انتخاب تاریخ"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={contactForm.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نوع تماس</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="انتخاب نوع تماس" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-background border">
                      <SelectItem value="phone">تماس تلفنی</SelectItem>
                      <SelectItem value="email">ایمیل</SelectItem>
                      <SelectItem value="meeting">ملاقات حضوری</SelectItem>
                      <SelectItem value="video">ویدیوکال</SelectItem>
                      <SelectItem value="other">سایر</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={contactForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>توضیحات تماس</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="موضوع و جزئیات تماس را شرح دهید" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={contactForm.control}
              name="result"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نتیجه تماس</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="نتیجه و اقدامات بعدی را بنویسید" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1">
                ثبت تماس
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => setIsContactDialogOpen(false)}
              >
                انصراف
              </Button>
            </div>
          </form>
        </Form>
      </ResponsiveDialog>

      {/* Partner Details Dialog */}
      <ResponsiveDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        title="جزئیات همکار"
        description={selectedPartner?.name}
      >
        {selectedPartner && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {getInitials(selectedPartner.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold">{selectedPartner.name}</h3>
                <p className="text-muted-foreground">{selectedPartner.category}</p>
                <div className="flex gap-2 mt-2">
                  {getStatusBadge(selectedPartner.status)}
                  {getCollaborationBadge(selectedPartner.collaborationLevel)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">اطلاعات تماس</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{selectedPartner.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{selectedPartner.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedPartner.address}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">حوزه تخصص</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedPartner.expertise.map((exp, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {exp}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {selectedPartner.notes && (
              <div>
                <h4 className="font-medium mb-2">یادداشت‌ها</h4>
                <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded">
                  {selectedPartner.notes}
                </p>
              </div>
            )}

            {selectedPartner.contacts && selectedPartner.contacts.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">تاریخچه تماس‌ها</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedPartner.contacts.map((contact) => (
                    <div key={contact.id} className="text-sm p-2 bg-secondary/30 rounded">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{contact.type}</span>
                        <span className="text-xs text-muted-foreground">{contact.date}</span>
                      </div>
                      <p className="text-muted-foreground">{contact.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setIsDetailsDialogOpen(false);
                  setTimeout(() => openEditDialog(selectedPartner), 100);
                }}
              >
                <Edit className="h-4 w-4 ml-2" />
                ویرایش
              </Button>
              <Button 
                className="flex-1"
                onClick={() => {
                  setIsDetailsDialogOpen(false);
                  setTimeout(() => openContactDialog(selectedPartner), 100);
                }}
              >
                <MessageSquare className="h-4 w-4 ml-2" />
                ثبت تماس
              </Button>
            </div>
          </div>
        )}
      </ResponsiveDialog>
    </>
  );
};

export default Partners;