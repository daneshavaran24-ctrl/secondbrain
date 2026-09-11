import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, Eye, Check, GitBranch } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';

interface Option {
  id: string;
  title: string;
  pros?: string[];
  cons?: string[];
  cost?: number;
  time_estimate?: string;
  score?: number;
}

interface DecisionLogItem {
  id: string;
  title: string;
  content: {
    title: string;
    context: string;
    rationale: string;
    chosen_option: string;
    decision_makers: string[];
    impact: string;
    date: string;
  };
  organization_decision_options?: Option[];
  created_at: string;
}

interface DecisionLogListProps {
  items: DecisionLogItem[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

export function DecisionLogList({ items, onEdit, onDelete, onView }: DecisionLogListProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<GitBranch className="w-12 h-12 text-primary" />}
        title="هنوز تصمیمی ندارید"
        description="اولین تصمیم خود را ثبت کنید و فرآیند تصمیم‌گیری را مستند کنید"
      />
    );
  }

  const getImpactVariant = (impact: string) => {
    switch (impact) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getImpactLabel = (impact: string) => {
    switch (impact) {
      case 'critical':
        return 'بحرانی';
      case 'high':
        return 'بالا';
      case 'medium':
        return 'متوسط';
      case 'low':
        return 'پایین';
      default:
        return impact;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical':
        return 'from-red-500 to-rose-500';
      case 'high':
        return 'from-orange-500 to-amber-500';
      case 'medium':
        return 'from-yellow-500 to-amber-500';
      case 'low':
        return 'from-green-500 to-emerald-500';
      default:
        return 'from-gray-500 to-slate-500';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item, index) => {
        const options = item.organization_decision_options || [];
        const decisionMakers = item.content.decision_makers || [];
        const impactColor = getImpactColor(item.content.impact);

        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
          >
            <Card className="relative overflow-hidden hover:shadow-luxury-soft transition-all duration-300 cursor-pointer h-full"
                  onClick={() => onView(item.id)}>
              {/* Gradient accent bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${impactColor}`} />
              
              <CardHeader>
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg mb-2 line-clamp-2">
                      {item.content.title}
                    </CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <Badge 
                        variant={getImpactVariant(item.content.impact)}
                      >
                        تأثیر: {getImpactLabel(item.content.impact)}
                      </Badge>
                      <Badge variant="outline" className="bg-muted/50">
                        {format(new Date(item.content.date || item.created_at), 'yyyy/MM/dd')}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
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
                  {item.content.context && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {item.content.context}
                    </p>
                  )}
                  
                  <Separator />
                  
                  {/* Options */}
                  {options.length > 0 && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-2">
                        گزینه‌های بررسی شده ({options.length}):
                      </span>
                      <div className="flex gap-2 flex-wrap">
                        {options.map((opt) => {
                          const isChosen = opt.title === item.content.chosen_option;
                          return (
                            <Badge 
                              key={opt.id}
                              variant={isChosen ? 'default' : 'outline'}
                              className={isChosen ? 'bg-green-500 hover:bg-green-600' : ''}
                            >
                              {opt.title}
                              {isChosen && <Check className="mr-1 h-3 w-3" />}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Chosen Option Highlight */}
                  {item.content.chosen_option && (
                    <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="text-xs font-medium text-green-700 dark:text-green-300">
                          گزینه انتخاب شده
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                        {item.content.chosen_option}
                      </p>
                    </div>
                  )}
                  
                  {/* Decision Makers */}
                  {decisionMakers.length > 0 && (
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <span className="text-xs text-muted-foreground">تصمیم‌گیرندگان:</span>
                      <div className="flex -space-x-2">
                        {decisionMakers.slice(0, 3).map((maker, idx) => (
                          <Avatar key={idx} className="h-6 w-6 border-2 border-background">
                            <AvatarFallback className="text-xs">
                              {maker[0]}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {decisionMakers.length > 3 && (
                          <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                            <span className="text-xs">+{decisionMakers.length - 3}</span>
                          </div>
                        )}
                      </div>
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
