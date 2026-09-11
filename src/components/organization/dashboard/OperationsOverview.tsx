import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cog, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OperationsOverviewProps {
  organizationId: string;
}

export function OperationsOverview({ organizationId }: OperationsOverviewProps) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, sops: 0, checklists: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [organizationId]);

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('organization_operations')
        .select('operation_type')
        .eq('organization_id', organizationId);

      if (error) throw error;

      const sops = data?.filter(s => s.operation_type === 'sop').length || 0;
      const checklists = data?.filter(s => s.operation_type === 'checklist').length || 0;

      setStats({
        total: data?.length || 0,
        sops,
        checklists
      });
    } catch (error) {
      console.error('Error loading operations stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-border/50 bg-gradient-to-br from-card to-card/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
            <Cog className="w-5 h-5 text-blue-500" />
          </div>
          <CardTitle className="text-lg">عملیات و فرایندها</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/organization/${organizationId}?tab=operations`)}
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
              <div className="text-3xl font-bold text-blue-500">{stats.total}</div>
              <div className="text-sm text-muted-foreground">کل فرایندها</div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-muted/50 rounded-lg p-2 text-center">
                <div className="font-semibold text-foreground">{stats.sops}</div>
                <div className="text-xs text-muted-foreground">SOPها</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-2 text-center">
                <div className="font-semibold text-foreground">{stats.checklists}</div>
                <div className="text-xs text-muted-foreground">چک‌لیست‌ها</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
