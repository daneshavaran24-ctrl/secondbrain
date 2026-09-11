import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, TrendingUp, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StrategyOverviewProps {
  organizationId: string;
}

export function StrategyOverview({ organizationId }: StrategyOverviewProps) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, okrs: 0, decisions: 0, roadmaps: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [organizationId]);

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('organization_strategies')
        .select('strategy_type')
        .eq('organization_id', organizationId);

      if (error) throw error;

      const okrs = data?.filter(s => s.strategy_type === 'okr').length || 0;
      const decisions = data?.filter(s => s.strategy_type === 'decision_log').length || 0;
      const roadmaps = data?.filter(s => s.strategy_type === 'roadmap').length || 0;

      setStats({
        total: data?.length || 0,
        okrs,
        decisions,
        roadmaps
      });
    } catch (error) {
      console.error('Error loading strategy stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-border/50 bg-gradient-to-br from-card to-card/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <CardTitle className="text-lg">استراتژی و تصمیم‌ها</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/organization/${organizationId}?tab=strategy`)}
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
              <div className="text-3xl font-bold text-primary">{stats.total}</div>
              <div className="text-sm text-muted-foreground">کل استراتژی‌ها</div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="bg-muted/50 rounded-lg p-2 text-center">
                <div className="font-semibold text-foreground">{stats.okrs}</div>
                <div className="text-xs text-muted-foreground">OKR</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-2 text-center">
                <div className="font-semibold text-foreground">{stats.decisions}</div>
                <div className="text-xs text-muted-foreground">تصمیمات</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-2 text-center">
                <div className="font-semibold text-foreground">{stats.roadmaps}</div>
                <div className="text-xs text-muted-foreground">نقشه راه</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
