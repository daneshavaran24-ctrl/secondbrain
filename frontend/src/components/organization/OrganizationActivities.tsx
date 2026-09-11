import { motion } from 'framer-motion';
import { Clock, FolderKanban, ListChecks, UserPlus, FileText, Settings as SettingsIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import type { ActivityLog } from '@/services/organizationStatsService';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';

interface OrganizationActivitiesProps {
  activities: ActivityLog[];
}

export function OrganizationActivities({ activities }: OrganizationActivitiesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'project':
        return FolderKanban;
      case 'task':
        return ListChecks;
      case 'member':
        return UserPlus;
      case 'document':
        return FileText;
      case 'settings':
        return SettingsIcon;
      default:
        return Clock;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'project':
        return {
          text: 'text-purple-600 dark:text-purple-400',
          bg: 'bg-purple-50 dark:bg-purple-950/30',
          border: 'border-purple-200 dark:border-purple-800'
        };
      case 'task':
        return {
          text: 'text-orange-600 dark:text-orange-400',
          bg: 'bg-orange-50 dark:bg-orange-950/30',
          border: 'border-orange-200 dark:border-orange-800'
        };
      case 'member':
        return {
          text: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-50 dark:bg-blue-950/30',
          border: 'border-blue-200 dark:border-blue-800'
        };
      case 'document':
        return {
          text: 'text-emerald-600 dark:text-emerald-400',
          bg: 'bg-emerald-50 dark:bg-emerald-950/30',
          border: 'border-emerald-200 dark:border-emerald-800'
        };
      case 'settings':
        return {
          text: 'text-slate-600 dark:text-slate-400',
          bg: 'bg-slate-50 dark:bg-slate-950/30',
          border: 'border-slate-200 dark:border-slate-800'
        };
      default:
        return {
          text: 'text-gray-600 dark:text-gray-400',
          bg: 'bg-gray-50 dark:bg-gray-950/30',
          border: 'border-gray-200 dark:border-gray-800'
        };
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.user?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || activity.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent pb-4">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            آخرین فعالیت‌ها
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 blur-xl rounded-full animate-pulse" />
              <div className="relative w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            </div>
            <span className="text-xs text-muted-foreground">به‌روزرسانی خودکار</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input
            placeholder="جستجو در فعالیت‌ها..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-background/50"
          />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="bg-background/50">
              <SelectValue placeholder="نوع فعالیت" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه</SelectItem>
              <SelectItem value="project">پروژه</SelectItem>
              <SelectItem value="task">وظیفه</SelectItem>
              <SelectItem value="member">عضو</SelectItem>
              <SelectItem value="document">سند</SelectItem>
              <SelectItem value="settings">تنظیمات</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {filteredActivities && filteredActivities.length > 0 ? (
          <ScrollArea className="h-[500px]">
            <div className="p-6 space-y-4">
              {/* Timeline line */}
              <div className="absolute right-[49px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/20 via-primary/50 to-primary/20" />
              
              {filteredActivities.map((activity, index) => {
                const Icon = getActivityIcon(activity.type);
                const colors = getActivityColor(activity.type);
                
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative flex items-start gap-4 group"
                  >
                    {/* Timeline node */}
                    <div className={`${colors.bg} ${colors.border} w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border-2 shadow-sm group-hover:scale-110 group-hover:shadow-lg transition-all duration-300 relative z-10`}>
                      <Icon className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0 bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border hover:border-primary/50 hover:shadow-md transition-all duration-300">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-medium text-foreground leading-relaxed">
                          {activity.description}
                        </p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(activity.timestamp), {
                            addSuffix: true,
                            locale: faIR
                          })}
                        </span>
                      </div>
                      
                      {activity.user && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Avatar className="w-5 h-5">
                            <AvatarFallback className="text-[10px] bg-primary/10">
                              {activity.user.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span>توسط {activity.user}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="h-[500px] flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4">
              <Clock className="w-12 h-12 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-2">
              {searchTerm || filterType !== 'all' ? 'فعالیتی یافت نشد' : 'فعالیتی ثبت نشده است'}
            </p>
            <p className="text-sm text-muted-foreground">
              {searchTerm || filterType !== 'all' ? 'فیلترها را تغییر دهید' : 'فعالیت‌های جدید اینجا نمایش داده می‌شوند'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
