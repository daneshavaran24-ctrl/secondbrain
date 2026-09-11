import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar, 
  User, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  XCircle,
  Map
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Milestone {
  id: string;
  title: string;
  description?: string;
  target_date: string;
  status: string;
  owner?: string;
  deliverables?: string[];
}

interface RoadmapItem {
  id: string;
  title: string;
  content: {
    title: string;
    description: string;
    start_date: string;
    end_date: string;
  };
  organization_roadmap_milestones?: Milestone[];
  created_at: string;
}

interface RoadmapListProps {
  items: RoadmapItem[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

export function RoadmapList({ items, onEdit, onDelete, onView }: RoadmapListProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Map className="w-12 h-12 text-primary" />}
        title="هنوز نقشه راهی ندارید"
        description="اولین نقشه راه خود را ایجاد کنید و مسیر آینده را مشخص کنید"
      />
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle;
      case 'in-progress':
        return Clock;
      case 'blocked':
        return XCircle;
      default:
        return AlertCircle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 border-green-500';
      case 'in-progress':
        return 'bg-blue-500 border-blue-500 animate-pulse';
      case 'blocked':
        return 'bg-red-500 border-red-500';
      default:
        return 'bg-muted border-muted-foreground';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in-progress':
        return 'secondary';
      case 'blocked':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'تکمیل شده';
      case 'in-progress':
        return 'در حال انجام';
      case 'blocked':
        return 'مسدود شده';
      default:
        return 'برنامه‌ریزی شده';
    }
  };

  return (
    <div className="space-y-6">
      {items.map((item, index) => {
        const milestones = item.organization_roadmap_milestones || [];
        const completedMilestones = milestones.filter(m => m.status === 'completed').length;
        const totalMilestones = milestones.length;
        const progressPercentage = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
          >
            <Card className="overflow-hidden hover:shadow-luxury-soft transition-all duration-300">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
              
              <CardHeader>
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{item.content.title}</CardTitle>
                    <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(item.content.start_date), 'yyyy/MM/dd')} تا{' '}
                        {format(new Date(item.content.end_date), 'yyyy/MM/dd')}
                      </span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(item.id)}>
                        <Eye className="h-4 w-4 ml-2" />
                        مشاهده جزئیات
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(item.id)}>
                        <Edit className="h-4 w-4 ml-2" />
                        ویرایش
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete(item.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 ml-2" />
                        حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent>
                {item.content.description && (
                  <p className="text-sm text-muted-foreground mb-6">
                    {item.content.description}
                  </p>
                )}
                
                {/* Overall Progress */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">پیشرفت کلی</span>
                    <span className="text-muted-foreground">
                      {completedMilestones}/{totalMilestones} نقطه عطف
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
                
                {/* Timeline */}
                {milestones.length > 0 && (
                  <div className="relative">
                    <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/20 via-primary to-primary/20" />
                    
                    <div className="space-y-4">
                      {milestones.slice(0, 4).map((milestone, idx) => {
                        const StatusIcon = getStatusIcon(milestone.status);
                        
                        return (
                          <motion.div
                            key={milestone.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + idx * 0.1 }}
                            className="relative flex gap-4"
                          >
                            {/* Timeline dot */}
                            <div className={cn(
                              "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 flex-shrink-0",
                              getStatusColor(milestone.status)
                            )}>
                              <StatusIcon className="h-4 w-4 text-white" />
                            </div>
                            
                            {/* Milestone Card */}
                            <div className="flex-1 pb-4">
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="font-semibold text-sm">{milestone.title}</h4>
                                <Badge variant={getStatusVariant(milestone.status)} className="text-xs">
                                  {getStatusLabel(milestone.status)}
                                </Badge>
                              </div>
                              {milestone.description && (
                                <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                                  {milestone.description}
                                </p>
                              )}
                              <div className="flex gap-3 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{format(new Date(milestone.target_date), 'yyyy/MM/dd')}</span>
                                </div>
                                {milestone.owner && (
                                  <div className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    <span>{milestone.owner}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                      
                      {milestones.length > 4 && (
                        <div className="text-sm text-muted-foreground text-center pt-2">
                          +{milestones.length - 4} نقطه عطف دیگر
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
