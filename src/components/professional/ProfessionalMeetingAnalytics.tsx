import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { professionalMeetingService } from '@/services/professionalMeetingService';
import { Calendar, Clock, Users, Target, TrendingUp, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Meeting } from '@/types';

interface MeetingAnalytics {
  totalMeetings: number;
  totalDuration: number;
  averageDuration: number;
  totalParticipants: number;
  totalResolutions: number;
  completedResolutions: number;
  monthlyMeetings: Array<{ month: string; count: number; duration: number }>;
  resolutionStatus: Array<{ name: string; value: number; color: string }>;
  meetingEfficiency: Array<{ title: string; efficiency: number; resolutions: number }>;
}

export const ProfessionalMeetingAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<MeetingAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const meetings = await professionalMeetingService.getMeetings();
      const analyticsData = calculateAnalytics(meetings);
      setAnalytics(analyticsData);
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری تحلیل‌ها',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAnalytics = (meetings: Meeting[]): MeetingAnalytics => {
    const totalMeetings = meetings.length;
    const totalDuration = meetings.reduce((sum, m) => sum + (m.duration || 0), 0);
    const averageDuration = totalMeetings > 0 ? Math.round(totalDuration / totalMeetings) : 0;
    const totalParticipants = meetings.reduce((sum, m) => sum + (m.participants?.length || 0), 0);
    
    // Count resolutions
    let totalResolutions = 0;
    let completedResolutions = 0;
    let pendingResolutions = 0;
    let inProgressResolutions = 0;
    let cancelledResolutions = 0;

    meetings.forEach(meeting => {
      if (meeting.resolutions) {
        totalResolutions += meeting.resolutions.length;
        meeting.resolutions.forEach(resolution => {
          if (resolution.status === 'completed') completedResolutions++;
          else if (resolution.status === 'pending') pendingResolutions++;
          else if (resolution.status === 'in_progress') inProgressResolutions++;
          else if (resolution.status === 'cancelled') cancelledResolutions++;
        });
      }
    });

    // Monthly data for last 6 months
    const monthlyData: { [key: string]: { count: number; duration: number } } = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long' });
      monthlyData[monthKey] = { count: 0, duration: 0 };
    }

    meetings.forEach(meeting => {
      const meetingDate = new Date(meeting.date);
      const monthKey = meetingDate.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long' });
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].count++;
        monthlyData[monthKey].duration += meeting.duration || 0;
      }
    });

    const monthlyMeetings = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      count: data.count,
      duration: data.duration
    }));

    // Resolution status distribution
    const resolutionStatus = [
      { name: 'تکمیل شده', value: completedResolutions, color: '#22c55e' },
      { name: 'در حال اجرا', value: inProgressResolutions, color: '#3b82f6' },
      { name: 'در انتظار', value: pendingResolutions, color: '#f59e0b' },
      { name: 'لغو شده', value: cancelledResolutions, color: '#ef4444' }
    ].filter(item => item.value > 0);

    // Meeting efficiency (resolutions per meeting)
    const meetingEfficiency = meetings.map(meeting => ({
      title: meeting.title.substring(0, 20) + (meeting.title.length > 20 ? '...' : ''),
      efficiency: meeting.duration > 0 ? Math.round(((meeting.resolutions?.length || 0) / meeting.duration) * 60) : 0,
      resolutions: meeting.resolutions?.length || 0
    })).sort((a, b) => b.efficiency - a.efficiency).slice(0, 10);

    return {
      totalMeetings,
      totalDuration,
      averageDuration,
      totalParticipants,
      totalResolutions,
      completedResolutions,
      monthlyMeetings,
      resolutionStatus,
      meetingEfficiency
    };
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">در حال بارگذاری...</div>;
  }

  if (!analytics) {
    return <div className="flex justify-center p-8">خطا در بارگذاری تحلیل‌ها</div>;
  }

  const completionRate = analytics.totalResolutions > 0 
    ? Math.round((analytics.completedResolutions / analytics.totalResolutions) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{analytics.totalMeetings}</div>
            <div className="text-sm text-muted-foreground">کل جلسات</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">{analytics.totalDuration}</div>
            <div className="text-sm text-muted-foreground">کل مدت (دقیقه)</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold">{analytics.averageDuration}</div>
            <div className="text-sm text-muted-foreground">میانگین مدت</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-orange-600" />
            <div className="text-2xl font-bold">{analytics.totalParticipants}</div>
            <div className="text-sm text-muted-foreground">کل شرکت‌کنندگان</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 mx-auto mb-2 text-red-600" />
            <div className="text-2xl font-bold">{analytics.totalResolutions}</div>
            <div className="text-sm text-muted-foreground">کل مصوبات</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Award className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
            <div className="text-2xl font-bold">{completionRate}%</div>
            <div className="text-sm text-muted-foreground">نرخ تکمیل</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Meetings Trend */}
        <Card>
          <CardHeader>
            <CardTitle>روند ماهانه جلسات</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.monthlyMeetings}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" name="تعداد جلسات" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Resolution Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>توزیع وضعیت مصوبات</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.resolutionStatus}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {analytics.resolutionStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Duration Trend */}
        <Card>
          <CardHeader>
            <CardTitle>روند مدت زمان ماهانه (دقیقه)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.monthlyMeetings}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="duration" stroke="#10b981" strokeWidth={2} name="مدت زمان" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Meeting Efficiency */}
        <Card>
          <CardHeader>
            <CardTitle>بازدهی جلسات (مصوبه در ساعت)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.meetingEfficiency} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="title" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="efficiency" fill="#8b5cf6" name="بازدهی" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>آمار تفصیلی</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-lg font-semibold">
                {analytics.totalMeetings > 0 ? Math.round(analytics.totalParticipants / analytics.totalMeetings) : 0}
              </div>
              <div className="text-sm text-muted-foreground">میانگین شرکت‌کنندگان</div>
            </div>
            
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-lg font-semibold">
                {analytics.totalMeetings > 0 ? Math.round(analytics.totalResolutions / analytics.totalMeetings) : 0}
              </div>
              <div className="text-sm text-muted-foreground">میانگین مصوبات در جلسه</div>
            </div>
            
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-lg font-semibold">
                {analytics.totalDuration > 0 ? Math.round((analytics.totalResolutions / analytics.totalDuration) * 60) : 0}
              </div>
              <div className="text-sm text-muted-foreground">مصوبه در ساعت</div>
            </div>
            
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-lg font-semibold">
                {analytics.totalMeetings > 0 ? Math.round((analytics.totalDuration / analytics.totalMeetings) / 60 * 10) / 10 : 0}
              </div>
              <div className="text-sm text-muted-foreground">میانگین مدت (ساعت)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};