import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Edit, Trash2, Target, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { salesService, Campaign } from '@/services/salesService';
import { toast } from 'sonner';

interface CampaignManagerProps {
  organizationId: string;
}

export function CampaignManager({ organizationId }: CampaignManagerProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCampaigns();
  }, [organizationId]);

  const loadCampaigns = async () => {
    try {
      const data = await salesService.getCampaigns(organizationId);
      setCampaigns(data);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast.error('خطا در بارگذاری کمپین‌ها');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این کمپین مطمئن هستید؟')) return;

    try {
      await salesService.deleteCampaign(id);
      toast.success('کمپین حذف شد');
      loadCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('خطا در حذف کمپین');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'draft': return 'bg-gray-500';
      case 'completed': return 'bg-blue-500';
      case 'paused': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'فعال';
      case 'draft': return 'پیش‌نویس';
      case 'completed': return 'تکمیل شده';
      case 'paused': return 'متوقف';
      default: return status;
    }
  };

  const getCampaignTypeLabel = (type: string) => {
    switch (type) {
      case 'email': return 'ایمیل';
      case 'social': return 'شبکه‌های اجتماعی';
      case 'ads': return 'تبلیغات';
      case 'content': return 'محتوا';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-32 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">کمپین‌های بازاریابی</h3>
          <p className="text-sm text-muted-foreground">مدیریت و ردیابی کمپین‌ها</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          کمپین جدید
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">هنوز کمپینی ندارید</h3>
            <p className="text-muted-foreground mb-4">
              کمپین بازاریابی اول خود را ایجاد کنید
            </p>
            <Button>
              <Plus className="w-4 h-4 ml-2" />
              ایجاد کمپین
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((campaign, index) => {
            const budgetProgress = campaign.budget && campaign.budget > 0
              ? (campaign.spent || 0) / campaign.budget * 100
              : 0;
            const roi = campaign.spent && campaign.spent > 0
              ? ((campaign.metrics?.revenue || 0) - campaign.spent) / campaign.spent * 100
              : 0;

            return (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow border-border/50 bg-gradient-to-br from-card to-card/50">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={getStatusColor(campaign.status || 'draft')}>
                        {getStatusLabel(campaign.status || 'draft')}
                      </Badge>
                      <Badge variant="outline">
                        {getCampaignTypeLabel(campaign.campaign_type)}
                      </Badge>
                    </div>
                    <CardTitle className="text-base">{campaign.campaign_name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {campaign.start_date && campaign.end_date && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(campaign.start_date).toLocaleDateString('fa-IR')} - {new Date(campaign.end_date).toLocaleDateString('fa-IR')}
                        </span>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">بودجه</span>
                        <span className="font-medium">
                          {(campaign.spent || 0).toLocaleString()} / {(campaign.budget || 0).toLocaleString()}
                        </span>
                      </div>
                      <Progress value={budgetProgress} className="h-2" />
                    </div>

                    {roi !== 0 && (
                      <div className="flex items-center justify-between p-2 bg-secondary rounded">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">ROI</span>
                        </div>
                        <span className={`text-sm font-bold ${roi > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {roi > 0 ? '+' : ''}{roi.toFixed(1)}%
                        </span>
                      </div>
                    )}

                    {campaign.metrics && Object.keys(campaign.metrics).length > 0 && (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {campaign.metrics.impressions && (
                          <div>
                            <p className="text-muted-foreground">بازدید</p>
                            <p className="font-medium">{campaign.metrics.impressions.toLocaleString()}</p>
                          </div>
                        )}
                        {campaign.metrics.clicks && (
                          <div>
                            <p className="text-muted-foreground">کلیک</p>
                            <p className="font-medium">{campaign.metrics.clicks.toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Edit className="w-3 h-3 ml-1" />
                        ویرایش
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(campaign.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
