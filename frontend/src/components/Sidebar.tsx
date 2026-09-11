import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import SettingsModal from "./SettingsModal";
import HelpModal from "./HelpModal";
import { useOrganizations } from "@/services/organizationService";
import { 
  Home, 
  Brain, 
  Calendar, 
  Users, 
  Heart, 
  TrendingUp,
  Building2,
  Briefcase,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  Activity,
  Zap,
  Settings,
  HelpCircle,
  BookOpen,
  CalendarDays,
  Scale,
  UserPlus,
  MessageCircle,
  Shield,
  FileText,
  CheckSquare,
  User,
  Lightbulb,
  Share2,
  Smartphone,
  Folder,
  Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { getAccessibleModules, hasModuleAccess } from "@/utils/roleAccess";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

// آیکون‌های ماژول‌ها
const moduleIcons: { [key: string]: any } = {
  dashboard: Home,
  knowledge: Brain,
  meetings: Calendar,
  calendar: CalendarDays,
  tasks: CheckSquare,
  'personal-planning': User,
  'professional-planning': Briefcase,
  'organizational-planning': Building2,
  'project-management': Folder,
  delegation: UserPlus,
  ideas: Lightbulb,
  'ai-chat': MessageCircle,
  'secretary-portal': Shield,
  trends: TrendingUp,
  'social-media': Share2,
  gadgets: Smartphone,
  health: Heart,
  'personal-journal': BookOpen,
  'gratitude-journal': Heart,
  legal: Scale,
  'cultural-content': Activity,
  documentation: FileText,
  'user-management': Users,
  'business-email': Mail
};

const Sidebar = ({ isOpen, onToggle }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  // دریافت ماژول‌های قابل دسترس برای کاربر
  const accessibleModules = getAccessibleModules(role);
  
  // دریافت سازمان‌های واقعی از دیتابیس (فقط اگر کاربر لاگین باشد)
  const { organizations, isLoading: orgsLoading } = useOrganizations();
  
  // جستجو در سازمان‌ها
  const [orgSearch, setOrgSearch] = useState("");
  
  // فاز 4: فیلترهای پیشرفته
  const [orgFilters, setOrgFilters] = useState({
    type: 'all', // all, company, ngo, educational
    status: 'all' // all, active, inactive
  });
  
  const filteredOrganizations = useMemo(() => {
    let filtered = organizations;
    
    // فیلتر جستجو
    if (orgSearch.trim()) {
      const searchLower = orgSearch.toLowerCase();
      filtered = filtered.filter(org => 
        org.label.toLowerCase().includes(searchLower) ||
        org.icon.toLowerCase().includes(searchLower)
      );
    }
    
    // فیلتر نوع سازمان
    if (orgFilters.type !== 'all') {
      filtered = filtered.filter(org => org.icon === orgFilters.type);
    }
    
    // فیلتر وضعیت (فعال/غیرفعال)
    if (orgFilters.status !== 'all') {
      const isActive = orgFilters.status === 'active';
      filtered = filtered.filter(org => (org as any).is_active === isActive);
    }
    
    return filtered;
  }, [organizations, orgSearch, orgFilters]);

  const getActiveItem = () => {
    const currentPath = location.pathname;
    const module = accessibleModules.find(module => module.path === currentPath);
    return module?.id || "dashboard";
  };
  
  const activeItem = getActiveItem();

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'active': return <div className="w-2 h-2 bg-medical-green rounded-full animate-pulse"></div>;
      case 'meeting': return <div className="w-2 h-2 bg-medical-amber rounded-full animate-pulse"></div>;
      case 'planning': return <div className="w-2 h-2 bg-medical-purple rounded-full"></div>;
      default: return null;
    }
  };

  return (
    <aside className={cn(
      "glass-sidebar border-r border-border/50 transition-all duration-500 ease-in-out shadow-glass relative z-10",
      isOpen ? "w-72" : "w-18"
    )}>
      <div className="p-5 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          {isOpen && (
            <div className="animate-fade-in space-y-1">
              <h2 className="text-sm font-bold text-foreground">منوی اصلی</h2>
              <p className="text-xs text-muted-foreground">سیستم مدیریت دانش</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="hover:bg-primary/10 hover-scale transition-elegant rounded-xl"
          >
            {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        {/* Main Navigation */}
        <nav className="space-y-2 flex-1">
          <div className="space-y-1">
            {accessibleModules.map((module, index) => {
              const IconComponent = moduleIcons[module.id] || FileText;
              const isActive = activeItem === module.id;
              const colorClass = `text-${module.category === 'admin' ? 'red' : 'blue'}-600`;
              const bgColorClass = `bg-${module.category === 'admin' ? 'red' : 'blue'}-600/10`;
              
              return (
                <div key={module.id} className="relative group">
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-4 h-12 transition-elegant relative overflow-hidden",
                      !isOpen && "justify-center",
                      isActive && "bg-gradient-glow border-l-3 border-primary shadow-card",
                      "hover:bg-gradient-glow hover-lift"
                    )}
                    onClick={() => navigate(module.path)}
                  >
                    <div className={cn(
                      "p-2 rounded-lg transition-elegant",
                      isActive ? bgColorClass : `group-hover:${bgColorClass}`
                    )}>
                      <IconComponent className={cn("h-4 w-4", colorClass)} />
                    </div>
                    {isOpen && (
                      <div className="flex items-center justify-between flex-1 animate-fade-in">
                        <span className="font-medium text-right">{module.displayName}</span>
                        <div className="flex items-center gap-2">
                          {module.category === 'admin' && (
                            <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                              ادمین
                            </Badge>
                          )}
                          {module.isActive && (
                            <div className="w-2 h-2 bg-medical-green rounded-full animate-pulse"></div>
                          )}
                        </div>
                      </div>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Organizations Section - فقط برای کاربران لاگین */}
          {user && (
            <div className="pt-6 mt-6 border-t border-border/50">
              {isOpen && (
                <div className="mb-4 animate-fade-in space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                      <Building2 className="h-3 w-3" />
                      سازمان‌ها ({organizations.length})
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => navigate('/organizations/new')}
                    >
                      + جدید
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground/80">مدیریت فعالیت‌های حرفه‌ای</p>
                  {organizations.length > 0 && (
                    <div className="space-y-2">
                      <Input
                        type="text"
                        placeholder="جستجو..."
                        value={orgSearch}
                        onChange={(e) => setOrgSearch(e.target.value)}
                        className="h-8 text-xs"
                      />
                      <div className="flex gap-2">
                        <select
                          value={orgFilters.type}
                          onChange={(e) => setOrgFilters({...orgFilters, type: e.target.value})}
                          className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="all">همه انواع</option>
                          <option value="company">شرکت</option>
                          <option value="ngo">NGO</option>
                          <option value="educational">آموزشی</option>
                        </select>
                        <select
                          value={orgFilters.status}
                          onChange={(e) => setOrgFilters({...orgFilters, status: e.target.value})}
                          className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="all">همه وضعیت‌ها</option>
                          <option value="active">فعال</option>
                          <option value="inactive">غیرفعال</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-1">
                {orgsLoading ? (
                  <div className="text-xs text-muted-foreground text-center py-4">
                    در حال بارگذاری...
                  </div>
                ) : organizations.length === 0 ? (
                  isOpen && (
                    <div className="text-xs text-muted-foreground text-center py-4">
                      هیچ سازمانی یافت نشد
                    </div>
                  )
                ) : filteredOrganizations.length === 0 ? (
                  isOpen && (
                    <div className="text-xs text-muted-foreground text-center py-4">
                      نتیجه‌ای یافت نشد
                    </div>
                  )
                ) : (
                  filteredOrganizations.map((org) => (
                    <div key={org.value} className="relative group">
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start gap-3 h-11 transition-elegant relative overflow-hidden text-sm",
                          !isOpen && "justify-center",
                          "hover:bg-gradient-glow hover-lift"
                        )}
                        onClick={() => navigate(`/organizations/${org.value}`)}
                      >
                        <div className="p-1.5 rounded-lg transition-elegant group-hover:bg-primary/10">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        {isOpen && (
                          <div className="flex items-center justify-between flex-1 animate-fade-in">
                            <div className="text-right">
                              <span className="font-medium block">{org.label}</span>
                              <span className="text-xs text-muted-foreground block">
                                {org.icon || 'سازمان'}
                              </span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              فعال
                            </Badge>
                          </div>
                        )}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </nav>

        {/* Bottom Section */}
        <div className="pt-6 border-t border-border/50 space-y-3">
          {/* Quick Actions */}
          {isOpen && (
            <div className="flex gap-2 animate-fade-in">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9 hover-scale transition-elegant"
                onClick={() => setIsSettingsOpen(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9 hover-scale transition-elegant"
                onClick={() => setIsHelpOpen(true)}
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {/* User Profile */}
          <div className="flex items-center gap-3">
            {isOpen ? (
              <div className="flex items-center gap-3 w-full animate-fade-in">
                <Avatar className="h-10 w-10 shadow-card hover-scale transition-elegant cursor-pointer">
                  <AvatarImage 
                    src={user?.avatar_url || "/placeholder-avatar.jpg"} 
                    alt={user?.display_name || 'کاربر'} 
                  />
                  <AvatarFallback className="bg-gradient-professional text-white font-bold text-sm">
                    {user?.display_name?.slice(0, 2) || 'کا'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-right">
                  <p className="text-sm font-semibold text-foreground">
                    {user?.display_name || 'کاربر سیستم'}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-medical-green">آنلاین</span>
                    <div className="w-1.5 h-1.5 bg-medical-green rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mx-auto relative">
                <Avatar className="h-10 w-10 shadow-card hover-scale transition-elegant cursor-pointer">
                  <AvatarImage src="/placeholder-avatar.jpg" alt="دکتر کرباسی" />
                  <AvatarFallback className="bg-gradient-professional text-white font-bold text-sm">
                    دک
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-medical-green rounded-full border-2 border-background animate-pulse"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </aside>
  );
};

export default Sidebar;