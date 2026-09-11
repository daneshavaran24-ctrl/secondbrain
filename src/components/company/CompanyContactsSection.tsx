import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { companyService, CompanyContact } from '@/services/companyService';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Mail, Phone, MapPin, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ContactsSectionProps {
  companyId: string;
}

const CONTACT_TYPES = [
  { value: 'client', label: 'مشتری', color: 'bg-blue-500' },
  { value: 'supplier', label: 'تامین‌کننده', color: 'bg-green-500' },
  { value: 'partner', label: 'شریک', color: 'bg-purple-500' },
  { value: 'employee', label: 'کارمند', color: 'bg-orange-500' },
  { value: 'other', label: 'سایر', color: 'bg-gray-500' },
];

export function CompanyContactsSection({ companyId }: ContactsSectionProps) {
  const [contacts, setContacts] = useState<CompanyContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<CompanyContact | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [formData, setFormData] = useState<Partial<CompanyContact>>({
    name: '',
    role: '',
    organization: '',
    type: 'client',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });

  useEffect(() => {
    loadContacts();
  }, [companyId, filterType]);

  const loadContacts = async () => {
    setIsLoading(true);
    const data = await companyService.getContacts(
      companyId,
      filterType === 'all' ? undefined : filterType
    );
    setContacts(data);
    setIsLoading(false);
  };

  const handleOpenDialog = (contact?: CompanyContact) => {
    if (contact) {
      setEditingContact(contact);
      setFormData(contact);
    } else {
      setEditingContact(null);
      setFormData({
        name: '',
        role: '',
        organization: '',
        type: 'client',
        email: '',
        phone: '',
        address: '',
        notes: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('نام مخاطب الزامی است');
      return;
    }

    if (editingContact) {
      const success = await companyService.updateContact(editingContact.id, formData);
      if (success) {
        toast.success('مخاطب با موفقیت بروزرسانی شد');
        setIsDialogOpen(false);
        loadContacts();
      } else {
        toast.error('خطا در بروزرسانی مخاطب');
      }
    } else {
      const contact = await companyService.createContact(companyId, formData);
      if (contact) {
        toast.success('مخاطب با موفقیت ایجاد شد');
        setIsDialogOpen(false);
        loadContacts();
      } else {
        toast.error('خطا در ایجاد مخاطب');
      }
    }
  };

  const handleDelete = async (contactId: string) => {
    if (confirm('آیا از حذف این مخاطب اطمینان دارید؟')) {
      const success = await companyService.deleteContact(contactId);
      if (success) {
        toast.success('مخاطب با موفقیت حذف شد');
        loadContacts();
      } else {
        toast.error('خطا در حذف مخاطب');
      }
    }
  };

  const getTypeColor = (type: string) => {
    return CONTACT_TYPES.find((t) => t.value === type)?.color || 'bg-gray-500';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>مخاطبین</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="w-4 h-4" />
                مخاطب جدید
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingContact ? 'ویرایش مخاطب' : 'مخاطب جدید'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>نام *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="نام مخاطب"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>نوع</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTACT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>سمت</Label>
                    <Input
                      value={formData.role || ''}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      placeholder="مدیر، کارشناس، ..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>سازمان</Label>
                    <Input
                      value={formData.organization || ''}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      placeholder="نام سازمان"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>ایمیل</Label>
                    <Input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>تلفن</Label>
                    <Input
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="09xxxxxxxxx"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>آدرس</Label>
                  <Input
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="آدرس کامل"
                  />
                </div>

                <div className="space-y-2">
                  <Label>یادداشت</Label>
                  <Textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="یادداشت‌های اضافی"
                    rows={4}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    انصراف
                  </Button>
                  <Button onClick={handleSave}>ذخیره</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {/* Filter */}
          <div className="mb-6">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="همه انواع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه انواع</SelectItem>
                {CONTACT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Contacts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts.length === 0 ? (
              <div className="col-span-full text-center text-muted-foreground py-8">
                هیچ مخاطبی یافت نشد
              </div>
            ) : (
              contacts.map((contact) => (
                <Card key={contact.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{contact.name}</CardTitle>
                        {contact.role && (
                          <p className="text-sm text-muted-foreground">{contact.role}</p>
                        )}
                      </div>
                      <Badge className={`${getTypeColor(contact.type || '')} text-white`}>
                        {CONTACT_TYPES.find((t) => t.value === contact.type)?.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {contact.organization && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span>{contact.organization}</span>
                      </div>
                    )}
                    {contact.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="truncate">{contact.email}</span>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{contact.phone}</span>
                      </div>
                    )}
                    {contact.address && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <span className="line-clamp-2">{contact.address}</span>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleOpenDialog(contact)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDelete(contact.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
