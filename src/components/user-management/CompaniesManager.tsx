import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Plus, Search, Pencil, Trash2, Target, Eye } from "lucide-react";
import { companiesService, BusinessCompany } from "@/services/companiesService";
import { toast } from "sonner";

export function CompaniesManager() {
  const [companies, setCompanies] = useState<BusinessCompany[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<BusinessCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<BusinessCompany | null>(null);
  const [mainCompany, setMainCompany] = useState<BusinessCompany | null>(null);

  // Load main company on mount
  useEffect(() => {
    const main = companiesService.getMainCompany();
    if (main) {
      setMainCompany(main);
    }
  }, []);

  const [formData, setFormData] = useState({
    company_name: "",
    industry: "",
    description: "",
    tags: [] as string[]
  });

  useEffect(() => {
    const initializeAndLoad = async () => {
      await companiesService.initializeDefaultCompany();
      loadCompanies();
    };
    initializeAndLoad();
  }, []);

  useEffect(() => {
    filterCompanies();
  }, [companies, searchQuery]);

  const loadCompanies = async () => {
    setIsLoading(true);
    const data = await companiesService.getUserCompanies();
    setCompanies(data);
    
    const main = companiesService.getMainCompany();
    if (main) {
      setMainCompany(main);
    } else if (data.length > 0) {
      companiesService.setMainCompany(data[0]);
      setMainCompany(data[0]);
    }
    
    setIsLoading(false);
  };

  const filterCompanies = () => {
    let filtered = [...companies];
    if (searchQuery) {
      filtered = filtered.filter(company =>
        company.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.industry?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredCompanies(filtered);
  };

  const resetForm = () => {
    setFormData({ company_name: "", industry: "", description: "", tags: [] });
    setEditingCompany(null);
  };

  const handleAddCompany = async () => {
    if (!formData.company_name.trim()) {
      toast.error("نام شرکت الزامی است");
      return;
    }
    const result = await companiesService.addCompany(formData);
    if (result) {
      await loadCompanies();
      setIsAddDialogOpen(false);
      resetForm();
      // Notify sidebar to refresh companies list
      window.dispatchEvent(new Event('companies-updated'));
    }
  };

  const handleUpdateCompany = async () => {
    if (!editingCompany) return;
    const success = await companiesService.updateCompany(editingCompany.id, formData);
    if (success) {
      await loadCompanies();
      setIsAddDialogOpen(false);
      resetForm();
      // Notify sidebar to refresh companies list
      window.dispatchEvent(new Event('companies-updated'));
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (window.confirm("آیا از حذف این شرکت اطمینان دارید؟")) {
      const success = await companiesService.deleteCompany(companyId);
      if (success) {
        await loadCompanies();
        // Notify sidebar to refresh companies list
        window.dispatchEvent(new Event('companies-updated'));
      }
    }
  };

  const openEditDialog = (company: BusinessCompany) => {
    setEditingCompany(company);
    setFormData({
      company_name: company.company_name,
      industry: company.industry || "",
      description: company.description || "",
      tags: company.tags || []
    });
    setIsAddDialogOpen(true);
  };

  const handleSetAsMain = (company: BusinessCompany) => {
    companiesService.setMainCompany(company);
    setMainCompany(company);
    toast.success(`"${company.company_name}" به عنوان شرکت اصلی تنظیم شد`);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">در حال بارگذاری...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="جستجوی شرکت..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-9" />
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto"><Plus className="ml-2 h-4 w-4" />افزودن شرکت</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingCompany ? "ویرایش شرکت" : "افزودن شرکت جدید"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="company_name">نام شرکت *</Label>
                <Input id="company_name" value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="industry">صنعت</Label>
                <Input id="industry" value={formData.industry} onChange={(e) => setFormData({ ...formData, industry: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">توضیحات</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>انصراف</Button>
              <Button onClick={editingCompany ? handleUpdateCompany : handleAddCompany}>
                {editingCompany ? "بروزرسانی" : "افزودن"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCompanies.map((company) => (
          <Card key={company.id} className={mainCompany?.id === company.id ? "border-primary border-2" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between flex-wrap gap-2">
                <span>{company.company_name}</span>
                <div className="flex gap-2">
                  {companiesService.isDefaultCompany(company) && (
                    <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950">
                      پیش‌فرض
                    </Badge>
                  )}
                  {mainCompany?.id === company.id && (
                    <Badge className="bg-green-500">⭐ اصلی</Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {company.industry && <p className="text-sm text-muted-foreground">{company.industry}</p>}
                {company.description && <p className="text-sm">{company.description}</p>}
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button size="sm" variant="default" onClick={() => window.location.href = `/company/${company.id}`}>
                    <Eye className="h-4 w-4 ml-1" />
                    مشاهده جزئیات
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEditDialog(company)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteCompany(company.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  {mainCompany?.id !== company.id && (
                    <Button size="sm" variant="default" onClick={() => handleSetAsMain(company)}>
                      <Target className="h-4 w-4 ml-2" />
                      تنظیم به عنوان اصلی
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
