import { useState, useEffect } from 'react';
import { Plus, Building2, Star, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { companiesService, BusinessCompany } from '@/services/companiesService';
import { Link } from 'react-router-dom';

export function CompanyQuickManager() {
  const [companies, setCompanies] = useState<BusinessCompany[]>([]);
  const [mainCompany, setMainCompany] = useState<BusinessCompany | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<BusinessCompany | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    company_name: '',
    industry: '',
    description: '',
    tags: [] as string[]
  });

  useEffect(() => {
    loadCompanies();
    setMainCompany(companiesService.getMainCompany());
  }, []);

  const loadCompanies = async () => {
    const data = await companiesService.getUserCompanies();
    setCompanies(data);
  };

  const handleOpenDialog = (company?: BusinessCompany) => {
    if (company) {
      setEditingCompany(company);
      setFormData({
        company_name: company.company_name,
        industry: company.industry || '',
        description: company.description || '',
        tags: company.tags || []
      });
    } else {
      setEditingCompany(null);
      setFormData({
        company_name: '',
        industry: '',
        description: '',
        tags: []
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCompany(null);
  };

  const handleSubmit = async () => {
    if (!formData.company_name.trim()) {
      toast.error('نام شرکت الزامی است');
      return;
    }

    setLoading(true);
    try {
      if (editingCompany) {
        const success = await companiesService.updateCompany(editingCompany.id, formData);
        if (success) {
          loadCompanies();
          handleCloseDialog();
        }
      } else {
        const newCompany = await companiesService.addCompany(formData);
        if (newCompany) {
          loadCompanies();
          handleCloseDialog();
        }
      }
    } catch (error) {
      console.error('Error saving company:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (companyId: string) => {
    if (window.confirm('آیا از حذف این شرکت اطمینان دارید؟')) {
      const success = await companiesService.deleteCompany(companyId);
      if (success) {
        loadCompanies();
        if (mainCompany?.id === companyId) {
          setMainCompany(null);
        }
      }
    }
  };

  const handleSetMain = (company: BusinessCompany) => {
    companiesService.setMainCompany(company);
    setMainCompany(company);
    toast.success('شرکت اصلی تنظیم شد');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">شرکت‌های من</h3>
          <p className="text-sm text-muted-foreground">
            مدیریت سریع شرکت‌ها و کسب‌وکارها
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} size="sm">
          <Plus className="h-4 w-4 ml-2" />
          افزودن شرکت
        </Button>
      </div>

      {mainCompany && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold">{mainCompany.company_name}</h4>
                  <Badge variant="default" className="text-xs">
                    <Star className="h-3 w-3 ml-1" />
                    شرکت اصلی
                  </Badge>
                </div>
                {mainCompany.industry && (
                  <p className="text-sm text-muted-foreground mb-1">
                    صنعت: {mainCompany.industry}
                  </p>
                )}
                {mainCompany.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {mainCompany.description}
                  </p>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenDialog(mainCompany)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {companies
          .filter(c => c.id !== mainCompany?.id)
          .slice(0, 5)
          .map((company) => (
            <Card key={company.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <h4 className="font-medium truncate">{company.company_name}</h4>
                    </div>
                    {company.industry && (
                      <p className="text-xs text-muted-foreground mb-1">
                        {company.industry}
                      </p>
                    )}
                    {company.tags && company.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-1">
                        {company.tags.slice(0, 3).map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetMain(company)}
                      title="تنظیم به عنوان شرکت اصلی"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(company)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(company.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {companies.length > 5 && (
        <div className="text-center pt-2">
          <Link to="/companies">
            <Button variant="outline" size="sm">
              مشاهده همه شرکت‌ها ({companies.length})
            </Button>
          </Link>
        </div>
      )}

      {companies.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">
              هنوز شرکتی اضافه نکرده‌اید
            </p>
            <Button onClick={() => handleOpenDialog()} variant="outline">
              <Plus className="h-4 w-4 ml-2" />
              افزودن اولین شرکت
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCompany ? 'ویرایش شرکت' : 'افزودن شرکت جدید'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">
                نام شرکت <span className="text-destructive">*</span>
              </Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="نام شرکت"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">صنعت</Label>
              <Input
                id="industry"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="مثال: فناوری اطلاعات"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">توضیحات</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="توضیحات کوتاه درباره شرکت"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">برچسب‌ها (با کاما جدا کنید)</Label>
              <Input
                id="tags"
                value={formData.tags.join(', ')}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) 
                })}
                placeholder="مثال: مشتری، مهم، فعال"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} disabled={loading}>
              انصراف
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'در حال ذخیره...' : editingCompany ? 'ذخیره تغییرات' : 'افزودن شرکت'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
