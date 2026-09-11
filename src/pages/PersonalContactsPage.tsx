import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Phone, Mail, Building2, User, Trash2, Edit, X } from 'lucide-react';

interface PersonalContact {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  organization: string | null;
  role: string | null;
  address: string | null;
  notes: string | null;
  category: string;
  created_at: string;
  updated_at: string;
}

const emptyForm = {
  full_name: '',
  phone: '',
  email: '',
  organization: '',
  role: '',
  address: '',
  notes: '',
  category: 'general',
};

const PersonalContactsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<PersonalContact[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchContacts = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('personal_contacts' as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setContacts(data as unknown as PersonalContact[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchContacts();

    const channel = supabase
      .channel('personal_contacts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'personal_contacts' }, () => {
        fetchContacts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleSave = async () => {
    if (!user || !form.full_name.trim()) return;

    const payload = {
      user_id: user.id,
      full_name: form.full_name.trim(),
      phone: form.phone || null,
      email: form.email || null,
      organization: form.organization || null,
      role: form.role || null,
      address: form.address || null,
      notes: form.notes || null,
      category: form.category || 'general',
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from('personal_contacts' as any).update(payload).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('personal_contacts' as any).insert(payload));
    }

    if (error) {
      toast({ title: 'خطا', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: editingId ? 'ویرایش شد' : 'اضافه شد', description: `مخاطب «${form.full_name}» ذخیره شد` });
      setForm(emptyForm);
      setEditingId(null);
      setDialogOpen(false);
      fetchContacts();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('personal_contacts' as any).delete().eq('id', id);
    if (!error) {
      toast({ title: 'حذف شد' });
      fetchContacts();
    }
  };

  const startEdit = (c: PersonalContact) => {
    setForm({
      full_name: c.full_name,
      phone: c.phone || '',
      email: c.email || '',
      organization: c.organization || '',
      role: c.role || '',
      address: c.address || '',
      notes: c.notes || '',
      category: c.category || 'general',
    });
    setEditingId(c.id);
    setDialogOpen(true);
  };

  const filtered = contacts.filter(c =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.organization || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">📇 مخاطبین شخصی</h1>
        <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) { setForm(emptyForm); setEditingId(null); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 ml-2" />افزودن مخاطب</Button>
          </DialogTrigger>
          <DialogContent dir="rtl" className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? 'ویرایش مخاطب' : 'مخاطب جدید'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>نام و نام خانوادگی *</Label>
                <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="مثال: علی احمدی" />
              </div>
              <div>
                <Label>شماره تلفن</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="۰۹۱۲..." dir="ltr" />
              </div>
              <div>
                <Label>ایمیل</Label>
                <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="example@email.com" dir="ltr" />
              </div>
              <div>
                <Label>سازمان / شرکت</Label>
                <Input value={form.organization} onChange={e => setForm(f => ({ ...f, organization: e.target.value }))} />
              </div>
              <div>
                <Label>سمت</Label>
                <Input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
              </div>
              <div>
                <Label>یادداشت</Label>
                <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <Button className="w-full" onClick={handleSave} disabled={!form.full_name.trim()}>
                {editingId ? 'ذخیره تغییرات' : 'افزودن'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pr-10"
          placeholder="جستجوی نام، تلفن، ایمیل..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted-foreground">در حال بارگذاری...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          {search ? 'نتیجه‌ای یافت نشد' : 'هنوز مخاطبی اضافه نشده'}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(c => (
            <Card key={c.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{c.full_name}</p>
                      {c.role && <p className="text-xs text-muted-foreground">{c.role}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(c)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(c.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {c.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span dir="ltr">{c.phone}</span>
                  </div>
                )}
                {c.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span dir="ltr" className="truncate">{c.email}</span>
                  </div>
                )}
                {c.organization && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{c.organization}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PersonalContactsPage;
