import React, { useState } from 'react';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database, Loader2, CheckCircle } from 'lucide-react';

export function SampleDataInitializer() {
  const [isLoading, setIsLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const initializeSampleData = async () => {
    setIsLoading(true);
    setCompletedSteps([]);
    
    try {
      // Get current user - if no user, create dummy UUID for demo
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

      // 1. Create sample projects
      const projects = [
        {
          user_id: userId,
          name: 'توسعه سیستم مدیریت محتوا',
          description: 'طراحی و توسعه سیستم جامع مدیریت محتوای سازمانی',
          status: 'planning' as const,
          start_date: '2024-01-15',
          end_date: '2024-06-30'
        },
        {
          user_id: userId,
          name: 'بهینه‌سازی فرآیندهای اداری',
          description: 'تحلیل و بهینه‌سازی فرآیندهای اداری موجود',
          status: 'active' as const,
          start_date: '2024-02-01',
          end_date: '2024-08-30'
        }
      ];

      const { error: projectsError } = await supabase
        .from('projects')
        .insert(projects);

      if (projectsError) throw projectsError;
      setCompletedSteps(prev => [...prev, 'projects']);

      // 2. Create sample organizational missions
      const missions = [
        {
          title: 'ارتقای کیفیت خدمات مشتریان',
          description: 'بهبود فرآیندهای خدمات‌رسانی و افزایش رضایت مشتریان',
          status: 'فعال',
          priority: 'بالا',
          progress: 35,
          deadline: '2024-12-31',
          owner: 'واحد خدمات مشتریان',
          user_id: userId
        },
        {
          title: 'دیجیتالی‌سازی فرآیندها',
          description: 'پیاده‌سازی سیستم‌های دیجیتال برای خودکارسازی فرآیندها',
          status: 'فعال',
          priority: 'متوسط',
          progress: 60,
          deadline: '2024-10-15',
          owner: 'واحد فناوری اطلاعات',
          user_id: userId
        },
        {
          title: 'توسعه منابع انسانی',
          description: 'برنامه جامع آموزش و ارتقای مهارت‌های کارکنان',
          status: 'فعال',
          priority: 'بالا',
          progress: 25,
          deadline: '2024-11-30',
          owner: 'واحد منابع انسانی',
          user_id: userId
        }
      ];

      const { error: missionsError } = await supabase
        .from('organization_missions')
        .insert(missions.map(m => ({
          user_id: m.user_id,
          title: m.title,
          description: m.description,
          status: m.status,
          progress: m.progress,
          start_date: '2024-01-01',
          end_date: m.deadline
        })));

      if (missionsError) throw missionsError;
      setCompletedSteps(prev => [...prev, 'missions']);

      // 3. Create sample policies
      const policies = [
        {
          title: 'سیاست امنیت اطلاعات',
          description: 'چارچوب جامع حفظ امنیت اطلاعات سازمان',
          type: 'امنیتی',
          status: 'تصویب شده',
          period: 'سالیانه',
          approval_date: '2024-01-10',
          next_review: '2025-01-10',
          user_id: userId
        },
        {
          title: 'سیاست مدیریت منابع انسانی',
          description: 'رویه‌های استخدام، ارزیابی و توسعه نیروی انسانی',
          type: 'اجرایی',
          status: 'تصویب شده',
          period: 'دوسالانه',
          approval_date: '2024-02-15',
          next_review: '2026-02-15',
          user_id: userId
        }
      ];

      const { error: policiesError } = await supabase
        .from('organization_policies')
        .insert(policies.map(p => ({
          user_id: p.user_id,
          title: p.title,
          description: p.description,
          policy_type: p.type,
          status: 'active',
          effective_date: p.approval_date,
          review_date: p.next_review
        })));

      if (policiesError) throw policiesError;
      setCompletedSteps(prev => [...prev, 'policies']);

      // 4. Create sample ideas
      const ideas = [
        {
          title: 'سیستم هوشمند نظارت بر عملکرد',
          description: 'پیاده‌سازی سیستم AI-based برای تحلیل عملکرد واحدها',
          category: 'فناوری',
          status: 'draft',
          stage: 'concept',
          priority: 'high',
          feasibility_score: 7,
          potential_impact: 8,
          estimated_cost: 200000000,
          estimated_timeline: '6 ماه',
          user_id: userId
        },
        {
          title: 'پلتفرم یادگیری آنلاین کارکنان',
          description: 'توسعه پلتفرم آموزش مجازی برای ارتقای مهارت‌های کارکنان',
          category: 'آموزش',
          status: 'draft',
          stage: 'research',
          priority: 'medium',
          feasibility_score: 8,
          potential_impact: 7,
          estimated_cost: 120000000,
          estimated_timeline: '4 ماه',
          user_id: userId
        }
      ];

      const { error: ideasError } = await supabase
        .from('ideas')
        .insert(ideas.map(idea => ({
          user_id: idea.user_id,
          title: idea.title,
          description: idea.description,
          category: idea.category,
          status: idea.status,
          stage: idea.stage,
          priority: idea.priority as 'low' | 'medium' | 'high' | 'urgent',
          feasibility_score: idea.feasibility_score,
          potential_impact: idea.potential_impact.toString(),
          domain: 'organizational'
        })));

      if (ideasError) throw ideasError;
      setCompletedSteps(prev => [...prev, 'ideas']);

      // 5. Create sample knowledge base items
      const knowledgeItems = [
        {
          title: 'راهنمای مدیریت پروژه‌های فناوری اطلاعات',
          content: 'این راهنما شامل بهترین روش‌های مدیریت پروژه‌های IT است...',
          category: 'مدیریت پروژه',
          tags: ['IT', 'مدیریت', 'پروژه'],
          status: 'published',
          is_public: true,
          author_id: userId
        },
        {
          title: 'استانداردهای کیفیت خدمات',
          content: 'معیارها و استانداردهای کیفی ارائه خدمات به مشتریان...',
          category: 'کیفیت',
          tags: ['کیفیت', 'خدمات', 'استاندارد'],
          status: 'published',
          is_public: true,
          author_id: userId
        }
      ];

      const { error: knowledgeError } = await supabase
        .from('knowledge_items')
        .insert(knowledgeItems.map(item => ({
          user_id: item.author_id,
          title: item.title,
          content: item.content,
          category: item.category,
          tags: item.tags
        })));

      if (knowledgeError) throw knowledgeError;
      setCompletedSteps(prev => [...prev, 'knowledge']);

      toast.success('داده‌های نمونه با موفقیت ایجاد شد!');
      
    } catch (error) {
      console.error('خطا در ایجاد داده‌های نمونه:', error);
      toast.error('خطا در ایجاد داده‌های نمونه');
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { key: 'projects', label: 'پروژه‌ها' },
    { key: 'missions', label: 'ماموریت‌ها' },
    { key: 'policies', label: 'سیاست‌ها' },
    { key: 'ideas', label: 'ایده‌ها' },
    { key: 'knowledge', label: 'دانش‌بنیان' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          ایجاد داده‌های نمونه
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          برای تست و نمایش بهتر سیستم، داده‌های نمونه ایجاد کنید.
        </p>
        
        {isLoading && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              در حال ایجاد داده‌های نمونه...
            </div>
            <div className="flex flex-wrap gap-2">
              {steps.map(step => (
                <Badge 
                  key={step.key}
                  variant={completedSteps.includes(step.key) ? "default" : "outline"}
                  className="text-xs"
                >
                  {completedSteps.includes(step.key) && (
                    <CheckCircle className="w-3 h-3 mr-1" />
                  )}
                  {step.label}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        <Button 
          onClick={initializeSampleData}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              در حال ایجاد...
            </>
          ) : (
            <>
              <Database className="w-4 h-4 mr-2" />
              ایجاد داده‌های نمونه
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}