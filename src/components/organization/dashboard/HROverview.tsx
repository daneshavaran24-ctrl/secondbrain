import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HROverviewProps {
  organizationId: string;
}

export function HROverview({ organizationId }: HROverviewProps) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ employees: 0, departments: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [organizationId]);

  const loadStats = async () => {
    try {
      // Get HR record
      const { data: hrData, error: hrError } = await supabase
        .from('organization_hr')
        .select('id')
        .eq('organization_id', organizationId)
        .single();

      if (hrError) throw hrError;

      if (hrData) {
        // Get employees count
        const { data: empData, error: empError } = await supabase
          .from('organization_chart_nodes')
          .select('id, department')
          .eq('hr_id', hrData.id);

        if (empError) throw empError;

        const uniqueDepts = new Set(empData?.map(e => e.department) || []);

        setStats({
          employees: empData?.length || 0,
          departments: uniqueDepts.size
        });
      }
    } catch (error) {
      console.error('Error loading HR stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-border/50 bg-gradient-to-br from-card to-card/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-green-500" />
          </div>
          <CardTitle className="text-lg">منابع انسانی</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/organization/${organizationId}?tab=hr`)}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-8 bg-muted rounded w-20" />
            <div className="h-4 bg-muted rounded w-32" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="text-3xl font-bold text-green-500">{stats.employees}</div>
              <div className="text-sm text-muted-foreground">کارکنان</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-2 text-center">
              <div className="font-semibold text-foreground">{stats.departments}</div>
              <div className="text-xs text-muted-foreground">دپارتمان</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
