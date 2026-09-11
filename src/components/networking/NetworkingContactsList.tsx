import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter } from "lucide-react";
import { networkingService, NetworkingContact } from "@/services/networkingService";
import { NetworkingContactCard } from "./NetworkingContactCard";
import { NetworkingContactForm } from "./NetworkingContactForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface NetworkingContactsListProps {
  companyId?: string;
  organizationId?: string;
}

export function NetworkingContactsList({ companyId, organizationId }: NetworkingContactsListProps) {
  const [contacts, setContacts] = useState<NetworkingContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<NetworkingContact | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadContacts();
  }, [companyId, organizationId]);

  const loadContacts = async () => {
    try {
      const data = await networkingService.getContacts(companyId, organizationId);
      setContacts(data);
    } catch (error) {
      console.error("Error loading contacts:", error);
      toast({ title: "خطا در بارگذاری مخاطبین", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await networkingService.deleteContact(id);
      setContacts(prev => prev.filter(c => c.id !== id));
      toast({ title: "مخاطب حذف شد" });
    } catch (error) {
      toast({ title: "خطا در حذف مخاطب", variant: "destructive" });
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingContact(null);
  };

  const handleFormSuccess = () => {
    handleFormClose();
    loadContacts();
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.organization_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || contact.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || contact.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="جستجوی مخاطب..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="دسته‌بندی" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه</SelectItem>
            <SelectItem value="mentor">منتور</SelectItem>
            <SelectItem value="advisor">مشاور</SelectItem>
            <SelectItem value="investor">سرمایه‌گذار</SelectItem>
            <SelectItem value="partner">شریک</SelectItem>
            <SelectItem value="client">مشتری</SelectItem>
            <SelectItem value="peer">همکار</SelectItem>
            <SelectItem value="influencer">اینفلوئنسر</SelectItem>
            <SelectItem value="contact">مخاطب</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="وضعیت" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه</SelectItem>
            <SelectItem value="hot">داغ</SelectItem>
            <SelectItem value="warm">گرم</SelectItem>
            <SelectItem value="cold">سرد</SelectItem>
            <SelectItem value="active">فعال</SelectItem>
            <SelectItem value="dormant">خاموش</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 ml-2" />
          مخاطب جدید
        </Button>
      </div>

      {filteredContacts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">هنوز مخاطبی اضافه نشده است</p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 ml-2" />
            افزودن اولین مخاطب
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredContacts.map(contact => (
            <NetworkingContactCard
              key={contact.id}
              contact={contact}
              onEdit={() => {
                setEditingContact(contact);
                setShowForm(true);
              }}
              onDelete={() => handleDelete(contact.id)}
              onRefresh={loadContacts}
            />
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingContact ? "ویرایش مخاطب" : "افزودن مخاطب جدید"}</DialogTitle>
          </DialogHeader>
          <NetworkingContactForm
            companyId={companyId}
            organizationId={organizationId}
            contact={editingContact}
            onSuccess={handleFormSuccess}
            onCancel={handleFormClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
