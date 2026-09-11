import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Heart, BookOpen, Calendar, Settings, Users, Building2, Briefcase, TrendingUp, Brain, UserCheck, Scale, Zap, Globe, User, Phone, MessageSquare, FileText, Target, BarChart3, Activity, Home, ChevronRight, ChevronLeft, Lightbulb, UserPlus, ClipboardList, Bot, Shield, Leaf, GraduationCap, CheckSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import SettingsModal from "@/components/SettingsModal";
import HelpModal from "@/components/HelpModal";
import { PersianNumber } from "@/components/ui/persian-number";
import type { DomainType } from "@/types";
import { useUserOrganizations } from '@/services/organizationService';
import { useIsMobile } from "@/hooks/use-mobile";
import { getSidebarStats, getCurrentUser, type SidebarStats } from '@/services/sidebarStatsService';
import { companiesService, type BusinessCompany } from '@/services/companiesService';
import { cn } from "@/lib/utils";
interface DomainSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface CategorySection {
  id: string;
  title: string;
  items: MenuItem[];
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  path: string;
  count?: number;
  organization?: string;
}

interface DomainSection {
  id: DomainType;
  title: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  color: string;
  bgColor: string;
  categories: CategorySection[];
}
const DomainSidebar: React.FC<DomainSidebarProps> = ({
  isOpen,
  onToggle
}) => {
  const isMobile = useIsMobile();
  const [selectedDomain, setSelectedDomain] = useState<DomainType>('personal');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [openCategories, setOpenCategories] = useState<string[]>([]);
  const [stats, setStats] = useState<SidebarStats | null>(null);
  const [currentUser, setCurrentUser] = useState<{displayName: string; role: string; avatarUrl: string | null} | null>(null);
  const [userCompanies, setUserCompanies] = useState<BusinessCompany[]>([]);
  const location = useLocation();
  const { userOrganizations } = useUserOrganizations();

  // Generate dynamic organization menu items from user's organizations
  const organizationMenuItems: MenuItem[] = userOrganizations.map((org, index) => {
    const icons = [Activity, Building2, UserCheck, Globe, Heart];

    return {
      id: `org-${org.organization_id}`,
      label: org.position_title 
        ? `${org.organization_name} (${org.position_title})`
        : org.organization_name,
      icon: icons[index % icons.length],
      path: `/organization/${org.organization_id}`,
      organization: org.organization_name
    };
  });

  // Generate dynamic company menu items from user's companies
  const mainCompany = companiesService.getMainCompany();
  const sortedCompanies = [...userCompanies].sort((a, b) => {
    if (a.id === mainCompany?.id) return -1;
    if (b.id === mainCompany?.id) return 1;
    return a.company_name.localeCompare(b.company_name, 'fa');
  });

  const companyMenuItems: MenuItem[] = sortedCompanies.map((company) => ({
    id: `company-${company.id}`,
    label: company.id === mainCompany?.id 
      ? `⭐ ${company.company_name}`
      : company.company_name,
    icon: Building2,
    path: `/company/${company.id}`,
    count: undefined
  }));

  const domains: DomainSection[] = [{
    id: 'personal',
    title: 'حوزه فردی',
    icon: User,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    categories: [{
      id: 'personal-planning',
      title: 'برنامه‌ریزی',
      items: [{
        id: 'ideas-personal',
        label: 'ایده‌های شخصی',
        icon: Lightbulb,
        path: '/ideas?domain=personal',
        count: stats?.personalIdeas
      }, {
        id: 'calendar',
        label: 'تقویم شخصی',
        icon: Calendar,
        path: '/calendar'
      }, {
        id: 'personal-planning',
        label: 'برنامه‌ریزی فردی',
        icon: ClipboardList,
        path: '/personal-planning',
        count: stats?.personalPlanning
      }, {
        id: 'habit-tracker',
        label: 'عادت‌سازی',
        icon: CheckSquare,
        path: '/habits'
      }, {
        id: 'delegation-personal',
        label: 'واگذاری وظایف',
        icon: UserPlus,
        path: '/delegation?domain=personal'
      }]
    }, {
      id: 'personal-learning',
      title: 'یادگیری',
      items: [{
        id: 'cultural-content',
        label: 'مدیریت محتوای فرهنگی',
        icon: BookOpen,
        path: '/cultural-content'
      }]
    }, {
      id: 'personal-health',
      title: 'سلامت',
      items: [{
        id: 'health',
        label: 'سلامت',
        icon: Activity,
        path: '/health',
        count: stats?.personalHealth
      }]
    }, {
      id: 'personal-spiritual',
      title: 'معنوی',
      items: [{
        id: 'gratitude-journal',
        label: 'دفتر شکرگذاری',
        icon: Heart,
        path: '/gratitude-journal'
      }, {
        id: 'journal',
        label: 'دل‌نوشته‌ها',
        icon: BookOpen,
        path: '/personal-journal',
        count: stats?.personalJournal
      }]
    }, {
      id: 'personal-tools',
      title: 'ابزارها',
      items: [{
        id: 'gadgets',
        label: 'ابزارهای کاربردی',
        icon: Zap,
        path: '/gadgets'
      }, {
        id: 'ai-chat',
        label: 'چت با AI',
        icon: Bot,
        path: '/ai-chat'
      }]
    }]
  }, {
    id: 'professional',
    title: 'حوزه حرفه‌ای',
    icon: Briefcase,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    categories: [{
      id: 'professional-profile',
      title: 'پروفایل',
      items: [{
        id: 'resume',
        label: 'رزومه حرفه‌ای',
        icon: FileText,
        path: 'resume'
      }]
    }, {
      id: 'professional-planning',
      title: 'برنامه‌ریزی',
      items: [{
        id: 'professional-planning',
        label: 'برنامه‌ریزی حرفه‌ای',
        icon: Briefcase,
        path: '/professional-planning',
        count: stats?.professionalPlanning
      }, {
        id: 'calendar-professional',
        label: 'تقویم حرفه‌ای',
        icon: Calendar,
        path: '/calendar?domain=professional'
      }, {
        id: 'delegation-professional',
        label: 'واگذاری وظایف',
        icon: UserPlus,
        path: '/delegation?domain=professional'
      }]
    }, {
      id: 'professional-meetings',
      title: 'جلسات',
      items: [{
        id: 'meetings',
        label: 'جلسات',
        icon: Users,
        path: '/meetings',
        count: stats?.professionalMeetings
      }, {
        id: 'meeting-preparation',
        label: 'آمادگی قبل از جلسه',
        icon: Lightbulb,
        path: '/meetings/preparation'
      }, {
        id: 'projects',
        label: 'پروژه‌ها',
        icon: BarChart3,
        path: '/projects',
        count: stats?.professionalProjects
      }]
    }, {
    id: 'professional-companies',
      title: 'شرکت‌ها و کسب‌وکارها',
      items: [
        {
          id: 'companies-management',
          label: '➕ مدیریت شرکت‌ها',
          icon: Building2,
          path: '/companies',
          count: stats?.companies
        },
        ...(userCompanies.length > 0 
          ? companyMenuItems 
          : [{
              id: 'no-companies',
              label: 'شرکتی ثبت نشده',
              icon: Building2,
              path: '/companies',
              count: undefined
            }]
        )
      ]
    }, {
      id: 'professional-knowledge',
      title: 'دانش',
      items: [{
        id: 'ideas-professional',
        label: 'ایده‌های حرفه‌ای',
        icon: Lightbulb,
        path: '/ideas?domain=professional',
        count: stats?.professionalIdeas
      }, {
        id: 'knowledge',
        label: 'دانش',
        icon: Brain,
        path: '/knowledge',
        count: stats?.knowledge
      }]
    }, {
      id: 'professional-legal',
      title: 'حقوقی',
      items: [{
        id: 'legal',
        label: 'امور حقوقی',
        icon: Scale,
        path: '/legal',
        count: stats?.legal
      }]
    }]
  }, {
    id: 'organizational',
    title: 'حوزه سازمانی',
    icon: Building2,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    categories: [{
      id: 'organizational-ideas-planning',
      title: 'ایده‌ها و برنامه‌ریزی',
      items: [{
        id: 'ideas-organizational',
        label: 'ایده‌های سازمانی',
        icon: Lightbulb,
        path: '/ideas?domain=organizational',
        count: stats?.organizationalIdeas
      }, {
        id: 'organizational-planning',
        label: 'برنامه‌ریزی سازمانی',
        icon: Target,
        path: '/organizational-planning',
        count: stats?.organizationalPlanning
      }, {
        id: 'calendar-organizational',
        label: 'تقویم سازمانی',
        icon: Calendar,
        path: '/calendar?domain=organizational'
      }, {
        id: 'delegation-organizational',
        label: 'واگذاری وظایف',
        icon: UserPlus,
        path: '/delegation?domain=organizational'
      }]
    }, {
      id: 'organizational-organizations',
      title: 'سمت‌ها (سازمان‌ها/انجمن‌ها)',
      items: [
        ...((() => {
          try {
            const stored = localStorage.getItem('main_organization');
            if (stored) {
              const mainOrg = JSON.parse(stored);
              return [{
                id: 'main-organization',
                label: `📍 ${mainOrg.name}`,
                icon: Building2,
                path: '/my-organizations',
                count: undefined
              }];
            }
          } catch (e) {
            console.error('Error loading main organization:', e);
          }
          return [];
        })()),
        ...organizationMenuItems,
        {
          id: 'all-organizations',
          label: 'همه سازمان‌ها',
          icon: Building2,
          path: '/my-organizations',
          count: userOrganizations.length
        }
      ]
    }, {
      id: 'organizational-communication',
      title: 'ارتباطات',
      items: [{
        id: 'social',
        label: 'رسانه‌های اجتماعی',
        icon: MessageSquare,
        path: '/social-media'
      }]
    }]
  }, {
    id: 'social',
    title: 'حوزه اجتماعی',
    icon: Users,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    categories: [{
      id: 'social-khadim',
      title: 'خدمات اجتماعی',
      items: [{
        id: 'khadim-e-khalgh',
        label: 'خادم خلق',
        icon: Heart,
        path: '/organizational/khadim-e-khalgh'
      }]
    }, {
      id: 'social-responsibility',
      title: 'مسئولیت‌های اجتماعی',
      items: [{
        id: 'csr-projects',
        label: 'پروژه‌های CSR',
        icon: Shield,
        path: '/social-responsibility',
        count: stats?.csrProjects
      }, {
        id: 'charity-activities',
        label: 'فعالیت‌های خیریه',
        icon: Heart,
        path: '/social-responsibility?tab=charity'
      }, {
        id: 'environment',
        label: 'محیط زیست',
        icon: Leaf,
        path: '/social-responsibility?tab=environment'
      }, {
        id: 'community-education',
        label: 'آموزش جامعه',
        icon: GraduationCap,
        path: '/social-responsibility?tab=education'
      }, {
        id: 'csr-reporting',
        label: 'گزارش‌دهی CSR',
        icon: FileText,
        path: '/social-responsibility?tab=reports'
      }]
    }]
  }];
  const isActivePath = (path: string) => location.pathname === path;
  const getCurrentDomain = (): DomainType => {
    const currentPath = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    const domainParam = searchParams.get('domain');

    // If we're on ideas page and have domain param, use it
    if (currentPath === '/ideas' && domainParam) {
      return domainParam as DomainType;
    }
    for (const domain of domains) {
      const allItems = domain.categories.flatMap(cat => cat.items);
      if (allItems.some(item => {
        const itemPath = item.path.split('?')[0]; // Remove query params for comparison
        return itemPath === currentPath;
      })) {
        return domain.id;
      }
    }
    return 'personal';
  };

  const getActiveCategoryForDomain = (domainId: DomainType): string | null => {
    const domain = domains.find(d => d.id === domainId);
    if (!domain) return null;

    const currentPath = location.pathname;
    for (const category of domain.categories) {
      if (category.items.some(item => {
        const itemPath = item.path.split('?')[0];
        return itemPath === currentPath;
      })) {
        return category.id;
      }
    }
    return null;
  };

  const currentDomain = getCurrentDomain();

  // Load stats and user data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, userData] = await Promise.all([
          getSidebarStats(),
          getCurrentUser()
        ]);
        setStats(statsData);
        setCurrentUser(userData);
      } catch (error) {
        console.error('Error loading sidebar data:', error);
      }
    };

    loadData();
  }, []);

  // Load user companies
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const companies = await companiesService.getUserCompanies();
        setUserCompanies(companies);
      } catch (error) {
        console.error('Error loading companies:', error);
      }
    };

    if (currentUser) {
      loadCompanies();
    }
  }, [currentUser]);

  // Listen for companies updates
  useEffect(() => {
    const handleCompaniesUpdate = async () => {
      try {
        const companies = await companiesService.getUserCompanies();
        setUserCompanies(companies);
      } catch (error) {
        console.error('Error refreshing companies:', error);
      }
    };

    window.addEventListener('companies-updated', handleCompaniesUpdate);
    
    return () => {
      window.removeEventListener('companies-updated', handleCompaniesUpdate);
    };
  }, []);

  // Load saved open categories from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-open-categories');
    
    if (saved) {
      try {
        setOpenCategories(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved categories:', e);
      }
    }
  }, []);

  // Auto-open category containing active route
  useEffect(() => {
    const activeCategory = getActiveCategoryForDomain(selectedDomain);
    if (activeCategory && !openCategories.includes(activeCategory)) {
      const newOpenCategories = [...openCategories, activeCategory];
      setOpenCategories(newOpenCategories);
      localStorage.setItem('sidebar-open-categories', JSON.stringify(newOpenCategories));
    }
  }, [selectedDomain, location.pathname, openCategories]);

  const handleCategoryToggle = (categoryId: string) => {
    const newOpenCategories = openCategories.includes(categoryId)
      ? openCategories.filter(id => id !== categoryId)
      : [...openCategories, categoryId];

    setOpenCategories(newOpenCategories);
    localStorage.setItem('sidebar-open-categories', JSON.stringify(newOpenCategories));
  };
  return (
    <div className={cn(
      "fixed top-0 right-0 h-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      "border-l border-border shadow-lg transition-all duration-300 ease-in-out flex flex-col",
      "touch-manipulation",
      isMobile ? 
        (isOpen ? 'w-full z-50 translate-x-0' : 'w-0 z-50 translate-x-full') : 
        (isOpen ? 'w-64 lg:w-72 z-40' : 'w-16 z-40')
    )} dir="rtl">
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between border-b border-border",
        isMobile ? "p-4" : "p-6"
      )}>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onToggle} 
          className={cn("p-0 touch-target", isMobile ? "h-10 w-10" : "h-8 w-8")}
        >
          {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
        {isOpen && <div className="flex items-center gap-2">
          <div className="text-sm text-right">
            <p className="font-medium">{currentUser?.displayName || 'کاربر'}</p>
            <p className="text-muted-foreground text-xs">{currentUser?.role || 'کاربر'}</p>
          </div>
          <Avatar className="h-8 w-8">
            <AvatarImage src={currentUser?.avatarUrl} alt={currentUser?.displayName || 'کاربر'} />
            <AvatarFallback>{currentUser?.displayName?.[0] || 'U'}</AvatarFallback>
          </Avatar>
        </div>}
      </div>

      {/* Domain Tabs */}
      {isOpen && <div className="p-2 border-b border-border">
        <div className="flex gap-0.5">
          {domains.map(domain => (
            <Button
              key={domain.id}
              variant={selectedDomain === domain.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedDomain(domain.id)}
              className={`flex-1 text-[10px] px-1.5 py-1 h-7 ${selectedDomain === domain.id ? `${domain.bgColor} text-gray-900 font-bold` : ''}`}
            >
              <domain.icon className={`h-2.5 w-2.5 mr-0.5 ${domain.color}`} />
              {domain.title.split(' ')[1]}
            </Button>
          ))}
        </div>
      </div>}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-2 min-h-0">
        {/* Home Button */}
        <NavLink to="/" className={({
          isActive
        }) => `flex items-center gap-3 rounded-lg px-3 py-2 mb-2 transition-colors duration-200 ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground"}`}>
          <Home className="h-4 w-4" />
          {isOpen && <span className="text-sm font-medium">داشبورد</span>}
        </NavLink>

        <Separator className="my-2" />

        {/* Selected Domain Section */}
        {isOpen && (() => {
          const currentDomainData = domains.find(domain => domain.id === selectedDomain);
          if (!currentDomainData) return null;
          return <div className="mb-4">
            <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-foreground">
              <currentDomainData.icon className="h-3 w-3 text-primary" />
              {currentDomainData.title}
            </div>

            <Accordion
              type="multiple"
              value={openCategories.filter(cat => currentDomainData.categories.some(c => c.id === cat))}
              className="mt-2"
            >
              {currentDomainData.categories.map(category => {
                console.log('🔍 Debug - Rendering category:', { id: category.id, title: category.title, itemCount: category.items.length });
                return (
                <AccordionItem key={category.id} value={category.id} className="border-none">
                  <AccordionTrigger
                    className="px-3 py-2 text-sm font-medium hover:no-underline hover:bg-accent/50 rounded-lg"
                    onClick={() => handleCategoryToggle(category.id)}
                  >
                    {category.title}
                  </AccordionTrigger>
                  <AccordionContent className="pb-2">
                    <div className="space-y-1">
                      {/* Add sub-heading for organizations */}
                      {category.id === 'organizational-organizations' && category.items.length > 0 && (
                        <div className="px-6 py-1.5 text-xs font-semibold text-muted-foreground">
                          سازمان ۱
                        </div>
                      )}
                      {category.items.map(item => (
                        <NavLink
                          key={item.id}
                          to={item.path}
                          className={({ isActive }) =>
                            `flex items-center gap-3 rounded-lg px-6 py-2 transition-colors duration-200 ${isActive
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-accent hover:text-accent-foreground"
                            }`
                          }
                        >
                          <item.icon className="h-4 w-4" />
                          <span className="text-sm font-medium flex-1 text-right">{item.label}</span>
                          {item.count !== undefined && item.count > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <PersianNumber>{item.count}</PersianNumber>
                            </Badge>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                );
              })}
            </Accordion>
          </div>;
        })()}

        {/* Compact Navigation for Collapsed State */}
        {!isOpen && <div className="space-y-2">
          {domains.flatMap(domain => domain.categories.flatMap(cat => cat.items)).map(item => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-center rounded-lg p-2 transition-colors duration-200 ${isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
                }`
              }
              title={item.label}
            >
              <item.icon className="h-4 w-4" />
            </NavLink>
          ))}
        </div>}
      </div>

      {/* Footer */}
      <div className="border-t border-border p-2">
        <NavLink
          to="/assistant-reports"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-200 ${isActive
              ? "bg-primary text-primary-foreground"
              : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
            } ${!isOpen ? "justify-center" : ""}`
          }
          title="گزارش‌های دستیار"
        >
          <BarChart3 className="h-4 w-4 flex-shrink-0" />
          {isOpen && <span className="text-sm font-medium flex-1 text-right">گزارش‌های دستیار</span>}
        </NavLink>
      </div>

      {/* Modals */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};
export default DomainSidebar;