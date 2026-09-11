import { motion } from 'framer-motion';
import { FolderKanban, Users, Calendar, TrendingUp, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Project {
  id: string;
  name: string;
  status: string;
  progress: number;
  memberCount: number;
  dueDate?: string;
}

interface OrganizationProjectsPreviewProps {
  projects: Project[];
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'active':
      return 'default';
    case 'completed':
      return 'secondary';
    case 'on_hold':
      return 'outline';
    default:
      return 'secondary';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active':
      return 'در حال اجرا';
    case 'completed':
      return 'تکمیل شده';
    case 'on_hold':
      return 'متوقف شده';
    default:
      return status;
  }
};

export function OrganizationProjectsPreview({ projects }: OrganizationProjectsPreviewProps) {
  const displayProjects = projects.slice(0, 4);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-accent/5 to-transparent pb-4">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-primary" />
            پروژه‌های اخیر
          </span>
          <Badge variant="secondary" className="text-sm">
            {projects.length} پروژه
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {displayProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-accent/30 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold mb-1 group-hover:text-primary transition-colors flex items-center gap-2">
                    {project.name}
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {project.memberCount}
                    </span>
                    {project.dueDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(project.dueDate).toLocaleDateString('fa-IR')}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant={getStatusVariant(project.status)} className="text-xs">
                  {getStatusLabel(project.status)}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <TrendingUp className="w-3 h-3" />
                    پیشرفت
                  </span>
                  <span className="font-medium">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-2" />
              </div>
            </motion.div>
          ))}
        </div>
        
        {projects.length > 4 && (
          <Button variant="outline" className="w-full mt-4">
            مشاهده همه پروژه‌ها
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
