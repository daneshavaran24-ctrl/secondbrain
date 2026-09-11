import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, Building2, LayoutGrid
} from 'lucide-react';
import { StrategyOverview } from '@/components/organization/dashboard/StrategyOverview';
import { OperationsOverview } from '@/components/organization/dashboard/OperationsOverview';
import { HROverview } from '@/components/organization/dashboard/HROverview';
import { FinanceOverview } from '@/components/organization/dashboard/FinanceOverview';
import { ProjectsOverview } from '@/components/organization/dashboard/ProjectsOverview';
import { SalesOverview } from '@/components/organization/dashboard/SalesOverview';
import { TechOverview } from '@/components/organization/dashboard/TechOverview';
import { LegalOverview } from '@/components/organization/dashboard/LegalOverview';
import { ProcurementOverview } from '@/components/organization/dashboard/ProcurementOverview';
import { SupportOverview } from '@/components/organization/dashboard/SupportOverview';

interface Organization {
  id: string;
  name: string;
  type: string;
  description?: string;
  created_at: string;
}

export default function OrganizationDashboardPage() {
  const { organizationId } = useParams<{ organizationId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrganization();
  }, [organizationId]);

  const loadOrganization = async () => {
    if (!organizationId) return;

    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();

      if (error) throw error;

      setOrganization(data);
    } catch (error) {
      console.error('Error loading organization:', error);
      toast({
        title: 'خطا در بارگذاری',
        description: 'سازمان یافت نشد',
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
          <div className="flex items-center justify-between">
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
            <Button
              variant="secondary"
              onClick={() => navigate(`/organization/${organizationId}`)}
              className="gap-2"
            >
              <LayoutGrid className="w-4 h-4" />
              نمای تب‌ها
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              داشبورد جامع سازمان
            </h2>
            <p className="text-muted-foreground mt-2">
              نمای کلی از تمام بخش‌ها و فعالیت‌های سازمان
            </p>
          </div>

          {/* Overview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StrategyOverview organizationId={organizationId!} />
            <OperationsOverview organizationId={organizationId!} />
            <HROverview organizationId={organizationId!} />
            <FinanceOverview organizationId={organizationId!} />
            <ProjectsOverview organizationId={organizationId!} />
            <SalesOverview organizationId={organizationId!} />
            <TechOverview organizationId={organizationId!} />
            <LegalOverview organizationId={organizationId!} />
            <ProcurementOverview organizationId={organizationId!} />
            <SupportOverview organizationId={organizationId!} />
          </div>
        </div>
      </div>
    </div>
  );
}
