import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { salesService, FunnelStage, Lead } from '@/services/salesService';
import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

interface SalesFunnelVisualizationProps {
  organizationId: string;
}

export function SalesFunnelVisualization({ organizationId }: SalesFunnelVisualizationProps) {
  const [stages, setStages] = useState<FunnelStage[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const loadData = async () => {
    try {
      const [stagesData, leadsData] = await Promise.all([
        salesService.getFunnelStages(organizationId),
        salesService.getLeads(organizationId),
      ]);

      if (stagesData.length === 0) {
        const defaultStages = await salesService.initializeDefaultStages(organizationId);
        setStages(defaultStages);
      } else {
        setStages(stagesData);
      }

      setLeads(leadsData);
    } catch (error) {
      console.error('Error loading funnel data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLeadsInStage = (stageId: string) => {
    return leads.filter(lead => lead.stage_id === stageId);
  };

  const getStageValue = (stageId: string) => {
    return leads
      .filter(lead => lead.stage_id === stageId)
      .reduce((sum, lead) => sum + (lead.value || 0), 0);
  };

  const calculateConversion = (currentIndex: number) => {
    if (currentIndex === 0) return 100;
    const prevStage = stages[currentIndex - 1];
    const currentStage = stages[currentIndex];
    const prevCount = getLeadsInStage(prevStage.id).length;
    const currentCount = getLeadsInStage(currentStage.id).length;
    return prevCount > 0 ? (currentCount / prevCount) * 100 : 0;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>قیف فروش</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>قیف فروش</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stages.map((stage, index) => {
            const leadsCount = getLeadsInStage(stage.id).length;
            const stageValue = getStageValue(stage.id);
            const conversion = calculateConversion(index);
            const maxWidth = 100 - (index * 10);

            return (
              <div key={stage.id} className="space-y-2">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                  style={{ maxWidth: `${maxWidth}%`, margin: '0 auto' }}
                >
                  <div className="bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg p-4 border border-border/50 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{stage.stage_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {leadsCount} سرنخ • {(stageValue / 1000000).toFixed(1)}M تومان
                        </p>
                      </div>
                      {index > 0 && (
                        <div className="text-left">
                          <p className="text-sm font-medium text-primary">
                            {conversion.toFixed(1)}%
                          </p>
                          <p className="text-xs text-muted-foreground">نرخ تبدیل</p>
                        </div>
                      )}
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{ width: `${(leadsCount / Math.max(...stages.map(s => getLeadsInStage(s.id).length))) * 100}%` }}
                      />
                    </div>
                  </div>
                </motion.div>

                {index < stages.length - 1 && (
                  <div className="flex justify-center">
                    <ArrowDown className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {leads.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            هنوز سرنخی در قیف فروش وجود ندارد
          </div>
        )}
      </CardContent>
    </Card>
  );
}
