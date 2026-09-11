import React, { useState } from 'react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import { DelegationDashboard } from '@/components/delegation/DelegationDashboard';
import { TaskDelegationPanel } from '@/components/delegation/TaskDelegationPanel';
import { DelegationSettings } from '@/components/delegation/DelegationSettings';
import { SectionHeader } from '@/components/ui/section-header';
import { LuxuryTabs } from '@/components/ui/luxury-tabs';
import { ModernCard } from '@/components/ui/modern-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AgileModeToggle } from '@/components/agile/AgileModeToggle';
import { OrgKanbanBoard } from '@/components/organizational/OrgKanbanBoard';
import { OrgScrumBoard } from '@/components/organizational/OrgScrumBoard';
import { UserPlus, Send, MessageSquare, Mail, Phone, BarChart3, Settings, User, Briefcase, Building2 } from 'lucide-react';

interface OutletContext {
  sidebarOpen: boolean;
}

export default function DelegationPage() {
  const { sidebarOpen } = useOutletContext<OutletContext>();
  const [searchParams] = useSearchParams();
  const domain = searchParams.get('domain') || 'personal';
  const [activeTab, setActiveTab] = useState('dashboard');
  const [agileMode, setAgileMode] = useState<'kanban' | 'scrum'>(() => (localStorage.getItem(`agile_mode_delegation_${domain}`) as 'kanban' | 'scrum') || 'kanban');

  const getDomainInfo = (domain: string) => {
    switch (domain) {
      case 'personal':
        return {
          title: 'واگذاری وظایف فردی',
          description: 'مدیریت و واگذاری وظایف شخصی',
          icon: User,
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50'
        };
      case 'professional':
        return {
          title: 'واگذاری وظایف حرفه‌ای',
          description: 'مدیریت و واگذاری پروژه‌ها و کارهای حرفه‌ای',
          icon: Briefcase,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50'
        };
      case 'organizational':
        return {
          title: 'واگذاری وظایف سازمانی',
          description: 'مدیریت و واگذاری وظایف در سطح سازمان',
          icon: Building2,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50'
        };
      default:
        return {
          title: 'مدیریت واگذاری وظایف',
          description: 'واگذاری و پیگیری وظایف با ارسال اطلاع‌رسانی هوشمند',
          icon: UserPlus,
          color: 'text-primary',
          bgColor: 'bg-primary/10'
        };
    }
  };

  const tabItems = [
    {
      value: "dashboard",
      label: "داشبورد",
      icon: <BarChart3 className="h-4 w-4" />
    },
    {
      value: "planning", 
      label: "برنامه‌ریزی",
      icon: <Settings className="h-4 w-4" />
    },
    {
      value: "settings",
      label: "تنظیمات", 
      icon: <Settings className="h-4 w-4" />
    }
  ];

  const domainInfo = getDomainInfo(domain);
  return (
    <div className={`min-h-screen bg-gradient-subtle p-6 transition-all duration-300`}>
      <div className={`mx-auto space-y-6 ${sidebarOpen ? 'max-w-5xl' : 'max-w-7xl'}`}>
        <SectionHeader
          title={domainInfo.title}
          subtitle={domainInfo.description}
          icon={<domainInfo.icon className="h-6 w-6" />}
          action={
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={`${domainInfo.color} border-current`}>
                حوزه {domain === 'personal' ? 'فردی' : domain === 'professional' ? 'حرفه‌ای' : 'سازمانی'}
              </Badge>
              <TaskDelegationPanel domain={domain} />
            </div>
          }
          gradient
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ModernCard
            title="ارسال ایمیل"
            icon={<Mail className="h-5 w-5" />}
            hover
            glow
          >
            <p className="text-body">
              ارسال اطلاع‌رسانی وظایف از طریق ایمیل با قالب حرفه‌ای و جذاب
            </p>
          </ModernCard>

          <ModernCard
            title="ارسال پیامک"
            icon={<Phone className="h-5 w-5" />}
            hover
            glow
          >
            <p className="text-body">
              اطلاع‌رسانی فوری وظایف از طریق پیامک برای دسترسی سریع‌تر
            </p>
          </ModernCard>

          <ModernCard
            title="کارتابل منشی"
            icon={<MessageSquare className="h-5 w-5" />}
            hover
            glow
          >
            <p className="text-body">
              ارسال وظایف به کارتابل منشی برای پیگیری و مدیریت دقیق‌تر
            </p>
          </ModernCard>
        </div>

        <LuxuryTabs
          items={tabItems}
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <DelegationDashboard domain={domain} />
            </div>
          )}

          {activeTab === 'planning' && (
            <div className="space-y-6">
              {domain === 'organizational' ? (
                <>
                  <AgileModeToggle 
                    value={agileMode}
                    onChange={(mode) => {
                      setAgileMode(mode);
                      localStorage.setItem(`agile_mode_delegation_${domain}`, mode);
                    }}
                    storageKey={`agile_mode_delegation_${domain}`}
                  />
                  {agileMode === 'kanban' 
                    ? <OrgKanbanBoard domain={domain} />
                    : <OrgScrumBoard domain={domain} />
                  }
                </>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>برنامه‌ریزی واگذاری</CardTitle>
                    <CardDescription>
                      ابزارهای برنامه‌ریزی برای مدیریت بهتر وظایف
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      این بخش برای حوزه سازمانی فعال است
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <DelegationSettings domain={domain} />
            </div>
          )}
        </LuxuryTabs>
      </div>
    </div>
  );
}