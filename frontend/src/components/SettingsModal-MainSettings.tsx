import { useState, useEffect } from 'react';
import { Building2, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { companiesService } from '@/services/companiesService';
import { organizationService } from '@/services/organizationService';
import { useToast } from '@/hooks/use-toast';

export function MainCompanyOrgSettings() {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [mainCompany, setMainCompany] = useState<any>(null);
  const [mainOrg, setMainOrg] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [companiesList, orgsList] = await Promise.all([
        companiesService.getUserCompanies(),
        organizationService.getOrganizations()
      ]);
      
      setCompanies(companiesList);
      setOrganizations(orgsList);
      setMainCompany(companiesService.getMainCompany());
      setMainOrg(organizationService.getMainOrganization());
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetMainCompany = (company: any) => {
    companiesService.setMainCompany(company);
    setMainCompany(company);
    toast({
      title: 'شرکت اصلی تغییر کرد',
      description: `"${company.company_name}" به عنوان شرکت اصلی تنظیم شد`
    });
  };

  const handleResetMainCompany = () => {
    const defaultCompany = companies.find(c => companiesService.isDefaultCompany(c));
    if (defaultCompany) {
      handleSetMainCompany(defaultCompany);
    }
  };

  const handleSetMainOrg = (org: any) => {
    organizationService.setMainOrganization(org);
    setMainOrg(org);
    toast({
      title: 'سازمان اصلی تغییر کرد',
      description: `"${org.name}" به عنوان سازمان اصلی تنظیم شد`
    });
  };

  const handleResetMainOrg = () => {
    const defaultOrg = organizations.find(o => organizationService.isDefaultOrganization(o));
    if (defaultOrg) {
      handleSetMainOrg(defaultOrg);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">در حال بارگذاری...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Main Company */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            شرکت اصلی
          </CardTitle>
          <CardDescription>
            شرکتی که به عنوان شرکت اصلی شما در سیستم نمایش داده می‌شود
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mainCompany && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{mainCompany.company_name}</p>
                    <p className="text-sm text-muted-foreground">{mainCompany.industry || 'شرکت اصلی شما'}</p>
                  </div>
                </div>
                <Badge>اصلی</Badge>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <p className="text-sm font-medium">انتخاب شرکت اصلی:</p>
            <div className="grid gap-2">
              {companies.map(company => (
                <button
                  key={company.id}
                  onClick={() => handleSetMainCompany(company)}
                  className={`p-3 rounded-lg border text-right transition-all ${
                    mainCompany?.id === company.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{company.company_name}</p>
                      {company.industry && (
                        <p className="text-sm text-muted-foreground">{company.industry}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {companiesService.isDefaultCompany(company) && (
                        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950">پیش‌فرض</Badge>
                      )}
                      {mainCompany?.id === company.id && (
                        <Badge>اصلی</Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {companies.length > 0 && (
            <Button variant="outline" onClick={handleResetMainCompany} className="w-full">
              بازگشت به شرکت پیش‌فرض
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Main Organization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            سازمان اصلی
          </CardTitle>
          <CardDescription>
            سازمانی که به عنوان سازمان اصلی شما در سیستم نمایش داده می‌شود
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mainOrg && (
            <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium">{mainOrg.name}</p>
                    <p className="text-sm text-muted-foreground">سازمان اصلی شما</p>
                  </div>
                </div>
                <Badge className="bg-purple-500">اصلی</Badge>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <p className="text-sm font-medium">انتخاب سازمان اصلی:</p>
            <div className="grid gap-2">
              {organizations.map(org => (
                <button
                  key={org.id}
                  onClick={() => handleSetMainOrg(org)}
                  className={`p-3 rounded-lg border text-right transition-all ${
                    mainOrg?.id === org.id
                      ? 'border-purple-500 bg-purple-500/5'
                      : 'border-border hover:border-purple-500/50 hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{org.name}</p>
                      <p className="text-sm text-muted-foreground">{org.type}</p>
                    </div>
                    <div className="flex gap-2">
                      {organizationService.isDefaultOrganization(org) && (
                        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950">پیش‌فرض</Badge>
                      )}
                      {mainOrg?.id === org.id && (
                        <Badge className="bg-purple-500">اصلی</Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {organizations.length > 0 && (
            <Button variant="outline" onClick={handleResetMainOrg} className="w-full">
              بازگشت به سازمان پیش‌فرض
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
