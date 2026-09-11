import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Building2, ArrowLeft, Settings, Target, ListChecks, FileText, Users, BarChart, Phone, Network } from 'lucide-react';
import { toast } from 'sonner';
import { CompanyProfileSection } from '@/components/company/CompanyProfileSection';
import { CompanyTasksSection } from '@/components/company/CompanyTasksSection';
import { CompanyNotesSection } from '@/components/company/CompanyNotesSection';
import { CompanyContactsSection } from '@/components/company/CompanyContactsSection';
import { CompanyDashboardSection } from '@/components/company/CompanyDashboardSection';
import { CompanyCallsSection } from '@/components/company/CompanyCallsSection';
import { NetworkingSection } from '@/components/networking';

interface Company {
  id: string;
  company_name: string;
  industry?: string;
  description?: string;
  logo_url?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
}

const SECTIONS = [
  { id: 'dashboard', label: 'داشبورد', icon: BarChart },
  { id: 'profile', label: 'معرفی', icon: Building2 },
  { id: 'calls', label: 'تماس‌ها', icon: Phone },
  { id: 'networking', label: 'نتورکینگ', icon: Network },
  { id: 'tasks', label: 'وظایف', icon: ListChecks },
  { id: 'notes', label: 'یادداشت‌ها', icon: FileText },
  { id: 'contacts', label: 'مخاطبین', icon: Users },
];

export default function CompanyDetailPage() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCompany();
  }, [companyId]);

  const loadCompany = async () => {
    if (!companyId) {
      toast.error('شناسه شرکت نامعتبر است');
      navigate('/companies');
      return;
    }

    setIsLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error('لطفاً وارد شوید');
      navigate('/auth');
      return;
    }

    const { data, error } = await supabase
      .from('business_companies')
      .select('*')
      .eq('id', companyId)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      toast.error('شرکت یافت نشد');
      navigate('/companies');
      return;
    }

    setCompany(data);
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!company) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={company.company_name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-primary" />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold mb-2">{company.company_name}</h1>
                {company.industry && <p className="text-muted-foreground">{company.industry}</p>}
                {company.description && (
                  <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{company.description}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/companies')} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                بازگشت
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/company/${companyId}/settings`)}
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                تنظیمات
              </Button>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <TabsTrigger key={section.id} value={section.id} className="gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{section.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="dashboard">
            <CompanyDashboardSection companyId={companyId!} />
          </TabsContent>

          <TabsContent value="profile">
            <CompanyProfileSection companyId={companyId!} />
          </TabsContent>

          <TabsContent value="calls">
            <CompanyCallsSection companyId={companyId!} />
          </TabsContent>

          <TabsContent value="networking">
            <NetworkingSection companyId={companyId!} />
          </TabsContent>

          <TabsContent value="tasks">
            <CompanyTasksSection companyId={companyId!} />
          </TabsContent>

          <TabsContent value="notes">
            <CompanyNotesSection companyId={companyId!} />
          </TabsContent>

          <TabsContent value="contacts">
            <CompanyContactsSection companyId={companyId!} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
