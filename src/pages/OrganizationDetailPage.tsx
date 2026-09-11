import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, Building2, Target, Cog, Package, TrendingUp, 
  Users, DollarSign, Cpu, Scale, ShoppingCart, Headphones, Network 
} from 'lucide-react';
import { StrategySection } from '@/components/organization/StrategySection';
import { OperationsSection } from '@/components/organization/OperationsSection';
import { ProjectsSection } from '@/components/organization/ProjectsSection';
import { SalesSection } from '@/components/organization/SalesSection';
import { HRSection } from '@/components/organization/HRSection';
import { FinanceSection } from '@/components/organization/FinanceSection';
import { TechSection } from '@/components/organization/TechSection';
import { LegalSection } from '@/components/organization/LegalSection';
import { ProcurementSection } from '@/components/organization/ProcurementSection';
import { SupportSection } from '@/components/organization/SupportSection';
import { NetworkingSection } from '@/components/networking';

interface Organization {
  id: string;
  name: string;
  type: string;
  description?: string;
  created_at: string;
}

const SECTIONS = [
  { id: 'strategy', label: 'استراتژی', icon: Target },
  { id: 'networking', label: 'نتورکینگ', icon: Network },
  { id: 'operations', label: 'عملیات', icon: Cog },
  { id: 'projects', label: 'پروژه‌ها', icon: Package },
  { id: 'sales', label: 'فروش', icon: TrendingUp },
  { id: 'hr', label: 'منابع انسانی', icon: Users },
  { id: 'finance', label: 'مالی', icon: DollarSign },
  { id: 'tech', label: 'فناوری', icon: Cpu },
  { id: 'legal', label: 'حقوقی', icon: Scale },
  { id: 'procurement', label: 'تدارکات', icon: ShoppingCart },
  { id: 'support', label: 'پشتیبانی', icon: Headphones }
];

export default function OrganizationDetailPage() {
  const { organizationId } = useParams<{ organizationId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('strategy');

  useEffect(() => {
    loadOrganization();
  }, [organizationId]);

  const loadOrganization = async () => {
    if (!organizationId) {
      toast({
        title: 'خطا',
        description: 'شناسه سازمان معتبر نیست',
        variant: 'destructive'
      });
      navigate('/profile');
      return;
    }

    try {
      setIsLoading(true);
      
      // دریافت کاربر فعلی
      const { data: { user } } = await supabase.auth.getUser();
      
      // دریافت اطلاعات سازمان
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .maybeSingle();

      if (orgError) {
        console.error('Error loading organization:', orgError);
        throw orgError;
      }

      if (!org) {
        toast({
          title: 'سازمان یافت نشد',
          description: 'سازمان مورد نظر وجود ندارد یا حذف شده است',
          variant: 'destructive'
        });
        navigate('/profile');
        return;
      }

      // بررسی دسترسی کاربر: ابتدا چک می‌کنیم آیا owner است، سپس عضویت
      const isOwner = org.user_id === user?.id;
      
      if (!isOwner) {
        // اگر owner نیست، بررسی عضویت
        const { data: membership, error: membershipError } = await supabase
          .from('user_organizations')
          .select('role')
          .eq('organization_id', organizationId)
          .eq('user_id', user?.id)
          .maybeSingle();

        if (membershipError) {
          console.error('Error checking membership:', membershipError);
        }

        if (!membership) {
          console.log('❌ Access denied: User is not owner or member');
          toast({
            title: 'عدم دسترسی',
            description: 'شما عضو این سازمان نیستید',
            variant: 'destructive'
          });
          navigate('/profile');
          return;
        }
        
        console.log('✅ Access granted: User is member with role:', membership.role);
      } else {
        console.log('✅ Access granted: User is owner');
      }

      setOrganization(org);
    } catch (error) {
      console.error('Error loading organization:', error);
      toast({
        title: 'خطا در بارگذاری',
        description: 'مشکلی در بارگذاری اطلاعات سازمان به وجود آمد',
        variant: 'destructive'
      });
      navigate('/profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/5">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                className="text-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => navigate('/profile')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-foreground/10 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{organization.name}</h1>
                  {organization.description && (
                    <p className="text-primary-foreground/80 text-sm">{organization.description}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* <OrganizationNotificationBadge organizationId={organizationId} /> */}
              <Button
                variant="secondary"
                onClick={() => navigate(`/organizations/${organizationId}/dashboard`)}
                className="gap-2"
              >
                <Target className="w-4 h-4" />
                داشبورد جامع
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate(`/organizations/${organizationId}/members`)}
                className="gap-2"
              >
                <Users className="w-4 h-4" />
                اعضا
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/organizations/${organizationId}/settings`)}
                className="gap-2 bg-background/50"
              >
                <Cog className="w-4 h-4" />
                تنظیمات
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeSection} onValueChange={setActiveSection} className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-2 h-auto bg-background/50 p-2">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <TabsTrigger 
                  key={section.id} 
                  value={section.id}
                  className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{section.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="strategy" className="space-y-6">
            <StrategySection organizationId={organizationId!} />
          </TabsContent>

          <TabsContent value="networking" className="space-y-6">
            <NetworkingSection organizationId={organizationId!} />
          </TabsContent>

          <TabsContent value="operations" className="space-y-6">
            <OperationsSection organizationId={organizationId!} />
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <ProjectsSection organizationId={organizationId!} />
          </TabsContent>

          <TabsContent value="sales" className="space-y-6">
            <SalesSection organizationId={organizationId!} />
          </TabsContent>

          <TabsContent value="hr" className="space-y-6">
            <HRSection organizationId={organizationId!} />
          </TabsContent>

          <TabsContent value="finance" className="space-y-6">
            <FinanceSection organizationId={organizationId!} />
          </TabsContent>

          <TabsContent value="tech" className="space-y-6">
            <TechSection organizationId={organizationId!} />
          </TabsContent>

          <TabsContent value="legal" className="space-y-6">
            <LegalSection organizationId={organizationId!} />
          </TabsContent>

          <TabsContent value="procurement" className="space-y-6">
            <ProcurementSection organizationId={organizationId!} />
          </TabsContent>

          <TabsContent value="support" className="space-y-6">
            <SupportSection organizationId={organizationId!} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
