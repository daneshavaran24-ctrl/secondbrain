import { Building2, Users, FolderKanban, TrendingUp, Settings, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface OrganizationDashboardHeaderProps {
  organization: {
    id: string;
    name: string;
    logo_url?: string | null;
    is_active?: boolean;
  };
  stats?: {
    totalMembers: number;
    activeProjects: number;
    completionRate: number;
  };
}

export function OrganizationDashboardHeader({ 
  organization, 
  stats 
}: OrganizationDashboardHeaderProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 p-8 mb-8"
    >
      {/* Animated Background Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-accent/30 to-transparent rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Organization Info */}
          <div className="flex items-start gap-4">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20"
            >
              {organization.logo_url ? (
                <img
                  src={organization.logo_url}
                  alt={organization.name}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <Building2 className="w-10 h-10 text-primary-foreground" />
              )}
            </motion.div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold bg-gradient-to-l from-primary to-primary/70 bg-clip-text text-transparent">
                  {organization.name}
                </h1>
                <Badge variant={organization.is_active ? "default" : "destructive"} className="animate-pulse">
                  {organization.is_active ? 'فعال' : 'غیرفعال'}
                </Badge>
              </div>
              {stats && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {stats.totalMembers} عضو
                  </span>
                  <span className="flex items-center gap-1">
                    <FolderKanban className="w-4 h-4" />
                    {stats.activeProjects} پروژه فعال
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    {stats.completionRate}% تکمیل
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/organizations/${organization.id}/settings`)}
                className="gap-2 bg-background/50 backdrop-blur-sm"
              >
                <Settings className="w-4 h-4" />
                تنظیمات
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-background/50 backdrop-blur-sm"
              >
                <FileText className="w-4 h-4" />
                گزارش
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="sm"
                className="gap-2 bg-gradient-to-l from-primary to-primary/80 shadow-lg shadow-primary/20"
              >
                <Users className="w-4 h-4" />
                دعوت عضو جدید
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
