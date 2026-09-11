import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { salesService, Lead, Campaign } from '@/services/salesService';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RevenueAnalyticsProps {
  organizationId: string;
}

export function RevenueAnalytics({ organizationId }: RevenueAnalyticsProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const loadData = async () => {
    try {
      const [leadsData, campaignsData] = await Promise.all([
        salesService.getLeads(organizationId),
        salesService.getCampaigns(organizationId),
      ]);

      setLeads(leadsData);
      setCampaigns(campaignsData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Revenue over time
  const revenueData = leads
    .filter(l => l.created_at)
    .reduce((acc, lead) => {
      const month = new Date(lead.created_at).toLocaleDateString('fa-IR', { year: 'numeric', month: 'short' });
      const existing = acc.find(d => d.month === month);
      if (existing) {
        existing.revenue += lead.value || 0;
      } else {
        acc.push({ month, revenue: lead.value || 0 });
      }
      return acc;
    }, [] as { month: string; revenue: number }[]);

  // Campaign comparison
  const campaignData = campaigns.map(c => ({
    name: c.campaign_name.length > 15 ? c.campaign_name.substring(0, 15) + '...' : c.campaign_name,
    budget: c.budget || 0,
    spent: c.spent || 0,
    revenue: c.metrics?.revenue || 0,
  }));

  // Lead sources
  const sourceData = leads.reduce((acc, lead) => {
    const source = lead.source || 'نامشخص';
    const existing = acc.find(d => d.name === source);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: source, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  // Pipeline growth
  const pipelineData = leads
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .reduce((acc, lead, index) => {
      const date = new Date(lead.created_at).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' });
      const totalValue = leads.slice(0, index + 1).reduce((sum, l) => sum + (l.value || 0), 0);
      acc.push({ date, value: totalValue });
      return acc;
    }, [] as { date: string; value: number }[])
    .filter((_, i, arr) => i === arr.length - 1 || i % Math.ceil(arr.length / 10) === 0);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-64 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">تحلیل‌های درآمد و فروش</h3>

      <Tabs defaultValue="revenue" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">درآمد</TabsTrigger>
          <TabsTrigger value="campaigns">کمپین‌ها</TabsTrigger>
          <TabsTrigger value="sources">منابع</TabsTrigger>
          <TabsTrigger value="pipeline">رشد پایپلاین</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>روند درآمد در طول زمان</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} name="درآمد" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>مقایسه کمپین‌ها</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={campaignData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend />
                  <Bar dataKey="budget" fill="#8884d8" name="بودجه" />
                  <Bar dataKey="spent" fill="#82ca9d" name="هزینه شده" />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" name="درآمد" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>توزیع منابع سرنخ</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>رشد پایپلاین</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={pipelineData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" name="ارزش کل" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
