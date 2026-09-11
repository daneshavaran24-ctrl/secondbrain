import React from 'react';
import { ProjectTask, Priority } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarClock, MessageSquare, Paperclip, AlertCircle } from 'lucide-react';
import { format, isAfter } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: ProjectTask;
  onClick: () => void;
  isLoading?: boolean;
}

const priorityConfig = {
  low: { color: 'bg-gray-500/10 text-gray-700 border-gray-500/20', icon: '🟢' },
  medium: { color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20', icon: '🟡' },
  high: { color: 'bg-orange-500/10 text-orange-700 border-orange-500/20', icon: '🟠' },
  urgent: { color: 'bg-red-500/10 text-red-700 border-red-500/20', icon: '🔴' }
};

export function TaskCard({ task, onClick, isLoading = false }: TaskCardProps) {
  const isOverdue = task.status !== 'completed' && isAfter(new Date(), new Date(task.deadline));
  const priorityStyle = priorityConfig[task.priority];

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-1",
        "glass-card border border-border/50 hover:border-primary/30",
        isLoading && "opacity-50 pointer-events-none",
        isOverdue && "border-red-500/50 bg-red-500/5"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Header with priority and overdue indicator */}
        <div className="flex items-start justify-between mb-3">
          <Badge 
            variant="outline" 
            className={cn("text-xs font-medium", priorityStyle.color)}
          >
            <span className="mr-1">{priorityStyle.icon}</span>
            {task.priority}
          </Badge>
          
          {isOverdue && (
            <div className="flex items-center text-red-500 text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              <span>تاخیر</span>
            </div>
          )}
        </div>

        {/* Task title */}
        <h4 className="font-semibold text-foreground mb-2 line-clamp-2 leading-tight">
          {task.title}
        </h4>

        {/* Task description */}
        {task.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {task.tags.slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {task.tags.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{task.tags.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Deadline */}
        <div className="flex items-center text-xs text-muted-foreground mb-3">
          <CalendarClock className="h-3 w-3 mr-1" />
          <span className={cn(isOverdue && "text-red-500")}>
            {format(new Date(task.deadline), 'dd MMM yyyy')}
          </span>
        </div>

        {/* Footer with assignee and stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {task.assigneeId.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground ml-2 truncate max-w-20">
              {task.assigneeId}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {task.comments.length > 0 && (
              <div className="flex items-center">
                <MessageSquare className="h-3 w-3 mr-1" />
                <span>{task.comments.length}</span>
              </div>
            )}
            
            {task.attachments.length > 0 && (
              <div className="flex items-center">
                <Paperclip className="h-3 w-3 mr-1" />
                <span>{task.attachments.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress indicator for estimated vs actual hours */}
        {task.estimatedHours && (
          <div className="mt-3 pt-2 border-t border-border/50">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">پیشرفت</span>
              <span className="text-muted-foreground">
                {task.actualHours || 0}h / {task.estimatedHours}h
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 mt-1">
              <div 
                className="bg-primary h-1.5 rounded-full transition-all" 
                style={{ 
                  width: `${Math.min(((task.actualHours || 0) / task.estimatedHours) * 100, 100)}%` 
                }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}