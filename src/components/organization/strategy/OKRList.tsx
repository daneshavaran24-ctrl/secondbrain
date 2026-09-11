import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, Eye, Target, TrendingUp } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

interface KeyResult {
  id: string;
  title: string;
  current_value: number;
  target: number;
  weight: number;
}

interface OKRItem {
  id: string;
  title: string;
  content: {
    objective: string;
    description: string;
    quarter: string;
    year: string;
    owner: string;
    status?: string;
    progress?: number;
  };
  organization_okr_key_results?: KeyResult[];
  created_at: string;
}

interface OKRListProps {
  items: OKRItem[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

export function OKRList({ items, onEdit, onDelete, onView }: OKRListProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Target className="w-12 h-12 text-primary" />}
        title="هنوز OKR ای ندارید"
        description="اولین OKR خود را ایجاد کنید و اهداف سازمان را دنبال کنید"
      />
    );
  }

  const getStatusVariant = (status?: string) => {
    switch (status) {
      case 'achieved':
        return 'default';
      case 'active':
        return 'secondary';
      case 'draft':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'achieved':
        return 'محقق شده';
      case 'active':
        return 'فعال';
      case 'draft':
        return 'پیش‌نویس';
      default:
        return 'فعال';
    }
  };

  const calculateProgress = (keyResults: KeyResult[]) => {
    if (!keyResults || keyResults.length === 0) return 0;
    const totalWeight = keyResults.reduce((sum, kr) => sum + (kr.weight || 0), 0);
    if (totalWeight === 0) return 0;
    const weightedProgress = keyResults.reduce((sum, kr) => {
      const progress = (kr.current_value / kr.target) * 100;
      return sum + (progress * (kr.weight || 0));
    }, 0);
    return Math.round(weightedProgress / totalWeight);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item, index) => {
        const progress = item.content.progress ?? calculateProgress(item.organization_okr_key_results || []);
        const keyResults = item.organization_okr_key_results || [];

        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
          >
            <Card className="relative overflow-hidden group hover:shadow-luxury-soft transition-all duration-300 cursor-pointer"
                  onClick={() => onView(item.id)}>
              {/* Gradient accent bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />
              
              <CardHeader>
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg mb-2 line-clamp-2">
                      {item.content.objective}
                    </CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="bg-primary/5">
                        {item.content.quarter} {item.content.year}
                      </Badge>
                      <Badge variant={getStatusVariant(item.content.status)}>
                        {getStatusLabel(item.content.status)}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(item.id); }}>
                        <Eye className="h-4 w-4 ml-2" />
                        مشاهده جزئیات
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(item.id); }}>
                        <Edit className="h-4 w-4 ml-2" />
                        ویرایش
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
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
                <div className="space-y-4">
                  {item.content.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.content.description}
                    </p>
                  )}
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {keyResults.length} نتیجه کلیدی
                      </span>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="font-bold">{progress}%</span>
                      </div>
                    </div>
                    <Progress value={progress} className="h-2" />
                    
                    {/* Key Results preview (mini bars) */}
                    {keyResults.length > 0 && (
                      <div className="space-y-1.5 pt-2">
                        {keyResults.slice(0, 3).map((kr) => {
                          const krProgress = Math.min(100, (kr.current_value / kr.target) * 100);
                          return (
                            <div key={kr.id} className="flex gap-2 items-center text-xs">
                              <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                                <motion.div 
                                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${krProgress}%` }}
                                  transition={{ delay: 0.5 + index * 0.1, duration: 0.6 }}
                                />
                              </div>
                              <span className="text-muted-foreground min-w-[40px] text-left">
                                {Math.round(krProgress)}%
                              </span>
                            </div>
                          );
                        })}
                        {keyResults.length > 3 && (
                          <p className="text-xs text-muted-foreground pt-1">
                            +{keyResults.length - 3} نتیجه دیگر
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {item.content.owner && (
                    <div className="flex items-center gap-2 pt-3 border-t">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {item.content.owner[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">
                        {item.content.owner}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
