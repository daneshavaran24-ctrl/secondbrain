import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Mail, Phone, Building2, Calendar, DollarSign } from 'lucide-react';
import { salesService, Lead, FunnelStage } from '@/services/salesService';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface LeadsKanbanProps {
  organizationId: string;
}

export function LeadsKanban({ organizationId }: LeadsKanbanProps) {
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
      console.error('Error loading leads:', error);
      toast.error('خطا در بارگذاری سرنخ‌ها');
    } finally {
      setLoading(false);
    }
  };

  const getLeadsInStage = (stageId: string) => {
    return leads.filter(lead => lead.stage_id === stageId);
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 75) return 'text-green-500';
    if (probability >= 50) return 'text-yellow-500';
    if (probability >= 25) return 'text-orange-500';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-16 bg-muted" />
            <CardContent className="space-y-2">
              <div className="h-24 bg-muted rounded" />
              <div className="h-24 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">تابلو کانبان سرنخ‌ها</h3>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          افزودن سرنخ
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto">
        {stages.map((stage) => {
          const stageLeads = getLeadsInStage(stage.id);
          const totalValue = stageLeads.reduce((sum, lead) => sum + (lead.value || 0), 0);

          return (
            <Card key={stage.id} className="min-w-[280px] bg-gradient-to-br from-card to-card/50 border-border/50">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{stage.stage_name}</span>
                  <Badge variant="secondary">{stageLeads.length}</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {(totalValue / 1000000).toFixed(1)}M تومان
                </p>
              </CardHeader>
              <CardContent className="p-3 space-y-2 max-h-[600px] overflow-y-auto">
                {stageLeads.map((lead, index) => (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-border/50">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-semibold text-sm">{lead.lead_name}</h4>
                          {lead.probability !== undefined && (
                            <span className={`text-xs font-bold ${getProbabilityColor(lead.probability)}`}>
                              {lead.probability}%
                            </span>
                          )}
                        </div>

                        {lead.company && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Building2 className="w-3 h-3" />
                            <span>{lead.company}</span>
                          </div>
                        )}

                        {lead.value !== undefined && lead.value > 0 && (
                          <div className="flex items-center gap-1 text-xs font-medium text-primary">
                            <DollarSign className="w-3 h-3" />
                            <span>{(lead.value / 1000000).toFixed(1)}M</span>
                          </div>
                        )}

                        {lead.expected_close_date && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(lead.expected_close_date).toLocaleDateString('fa-IR')}</span>
                          </div>
                        )}

                        <div className="flex gap-1 pt-2 border-t">
                          {lead.email && (
                            <Button variant="ghost" size="sm" className="h-6 px-2">
                              <Mail className="w-3 h-3" />
                            </Button>
                          )}
                          {lead.phone && (
                            <Button variant="ghost" size="sm" className="h-6 px-2">
                              <Phone className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}

                {stageLeads.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    سرنخی در این مرحله نیست
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
