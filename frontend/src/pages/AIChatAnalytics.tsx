import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { MessageCircle, Target, Brain, Scale, TrendingUp, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface AnalyticsData {
  totalConversations: number;
  totalMessages: number;
  messagesByType: { name: string; value: number }[];
  messagesByDate: { date: string; count: number }[];
  averageLength: number;
  mostActiveType: string;
}

const AIChatAnalytics: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalConversations: 0,
    totalMessages: 0,
    messagesByType: [],
    messagesByDate: [],
    averageLength: 0,
    mostActiveType: '',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async () => {
    if (!user) return;

    try {
      // Load sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('ai_chat_sessions')
        .select('*')
        .eq('user_id', user.id);

      if (sessionsError) throw sessionsError;

      // Load messages
      const { data: messages, error: messagesError } = await supabase
        .from('ai_chat_messages')
        .select('*, ai_chat_sessions(session_type)')
        .eq('user_id', user.id);

      if (messagesError) throw messagesError;

      // Calculate analytics
      const totalConversations = sessions?.length || 0;
      const totalMessages = messages?.length || 0;

      // Messages by type
      const typeCount: { [key: string]: number } = {
        mentor: 0,
        coach: 0,
        'decision-maker': 0,
      };

      messages?.forEach((msg: any) => {
        const type = msg.ai_chat_sessions?.session_type;
        if (type && typeCount[type] !== undefined) {
          typeCount[type]++;
        }
      });

      const messagesByType = [
        { name: 'منتور', value: typeCount.mentor },
        { name: 'کوچ', value: typeCount.coach },
        { name: 'مشاور', value: typeCount['decision-maker'] },
      ];

      // Messages by date (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const messagesByDate = last7Days.map(date => {
        const count = messages?.filter(msg => 
          msg.created_at.startsWith(date)
        ).length || 0;
        return { date: new Date(date).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' }), count };
      });

      // Average conversation length
      const avgLength = totalConversations > 0 
        ? Math.round(totalMessages / totalConversations) 
        : 0;

      // Most active type
      const mostActive = Object.entries(typeCount).reduce((a, b) => 
        b[1] > a[1] ? b : a
      )[0];

      setAnalytics({
        totalConversations,
        totalMessages,
        messagesByType,
        messagesByDate,
        averageLength: avgLength,
        mostActiveType: mostActive === 'mentor' ? 'منتور' : mostActive === 'coach' ? 'کوچ' : 'مشاور',
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">آمار و تحلیل AI Chat</h1>
            <p className="text-muted-foreground mt-1">مشاهده آمار و روند استفاده از دستیارهای هوشمند</p>
          </div>
          <Button onClick={() => navigate('/ai-chat')}>
            بازگشت به چت
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">کل مکالمات</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalConversations}</div>
              <p className="text-xs text-muted-foreground mt-1">جلسات چت</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">کل پیام‌ها</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalMessages}</div>
              <p className="text-xs text-muted-foreground mt-1">پیام ارسالی</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">میانگین طول مکالمه</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.averageLength}</div>
              <p className="text-xs text-muted-foreground mt-1">پیام در هر مکالمه</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">پرکاربردترین</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.mostActiveType}</div>
              <p className="text-xs text-muted-foreground mt-1">دستیار محبوب</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>توزیع پیام‌ها بر اساس نوع دستیار</CardTitle>
              <CardDescription>تعداد پیام‌های ارسالی به هر دستیار</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.messagesByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.messagesByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>فعالیت ۷ روز اخیر</CardTitle>
              <CardDescription>تعداد پیام‌های ارسالی در هفته گذشته</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.messagesByDate}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle>بینش‌های شخصی</CardTitle>
            <CardDescription>تحلیل الگوهای استفاده شما</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <Target className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium mb-1">الگوی استفاده</h4>
                  <p className="text-sm text-muted-foreground">
                    شما بیشتر از دستیار {analytics.mostActiveType} استفاده می‌کنید. 
                    این نشان می‌دهد که تمرکز اصلی شما روی {
                      analytics.mostActiveType === 'منتور' ? 'دستیابی به اهداف و توسعه فردی' :
                      analytics.mostActiveType === 'کوچ' ? 'بهبود مهارت‌ها و عملکرد' :
                      'تصمیم‌گیری‌های استراتژیک'
                    } است.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <Brain className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium mb-1">پیشنهاد بهبود</h4>
                  <p className="text-sm text-muted-foreground">
                    میانگین طول مکالمات شما {analytics.averageLength} پیام است. 
                    برای نتایج بهتر، سعی کنید مکالمات عمیق‌تر و جزئی‌تر داشته باشید.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium mb-1">پیشرفت</h4>
                  <p className="text-sm text-muted-foreground">
                    شما در حال حاضر {analytics.totalConversations} جلسه مشاوره کامل داشته‌اید. 
                    استفاده منظم از دستیارهای AI می‌تواند به بهبود تصمیم‌گیری‌ها و دستیابی سریع‌تر به اهداف کمک کند.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIChatAnalytics;
