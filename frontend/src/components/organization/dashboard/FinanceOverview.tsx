import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FinanceOverviewProps {
  organizationId: string;
}

export function FinanceOverview({ organizationId }: FinanceOverviewProps) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ budgets: 0, transactions: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [organizationId]);

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('organization_finance')
        .select('id')
        .eq('organization_id', organizationId);

      if (error) throw error;

      setStats({
        budgets: data?.length || 0,
        transactions: 0
      });
    } catch (error) {
      console.error('Error loading finance stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-border/50 bg-gradient-to-br from-card to-card/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-amber-500" />
          </div>
          <CardTitle className="text-lg">مالی</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/organization/${organizationId}?tab=finance`)}
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
              <div className="text-3xl font-bold text-amber-500">{stats.budgets}</div>
              <div className="text-sm text-muted-foreground">بودجه‌ها</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
