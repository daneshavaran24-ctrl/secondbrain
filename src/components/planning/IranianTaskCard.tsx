import React from 'react';
import { PersonalTask } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, CheckCircle, Clock, User } from 'lucide-react';
import { formatJalaliDate, getDaysUntilDue } from '@/lib/date-utils';
import { PersianNumber } from '@/components/ui/persian-number';

interface IranianTaskCardProps {
  task: PersonalTask;
}

// Priority configurations with Persian labels and colors
const priorityConfig = {
  high: { 
    label: 'مهم', 
    emoji: '🟠', 
    bgColor: 'bg-orange-50 border-orange-200',
    badgeColor: 'bg-orange-100 text-orange-700 border-orange-200'
  },
  medium: { 
    label: 'عادی', 
    emoji: '🟡', 
    bgColor: 'bg-yellow-50 border-yellow-200',
    badgeColor: 'bg-yellow-100 text-yellow-700 border-yellow-200'
  },
  low: { 
    label: 'کم', 
    emoji: '🟢', 
    bgColor: 'bg-green-50 border-green-200',
    badgeColor: 'bg-green-100 text-green-700 border-green-200'
  }
};

// Category icons mapping
const categoryIcons = {
  work: '💼',
  personal: '🏠',
  health: '🏥',
  learning: '📚',
  social: '👥',
  finance: '💰',
  travel: '✈️',
  shopping: '🛒',
  exercise: '🏃',
  creative: '🎨',
  technology: '💻',
  family: '👨‍👩‍👧‍👦'
};

export const IranianTaskCard: React.FC<IranianTaskCardProps> = ({ task }) => {
  const priority = task.priority || 'medium';
  const config = priorityConfig[priority];
  const categoryIcon = categoryIcons[task.category as keyof typeof categoryIcons] || '📋';
  
  // Calculate days until due
  const daysUntil = task.due_date ? getDaysUntilDue(task.due_date) : null;
  const isOverdue = daysUntil !== null && daysUntil < 0;
  const isDueToday = daysUntil === 0;
  const isDueSoon = daysUntil !== null && daysUntil <= 3 && daysUntil > 0;

  // Create a simple checklist from description or generate one
  const checklist = task.description 
    ? task.description.split('\n').filter(line => line.trim()).slice(0, 3)
    : [];

  return (
    <Card className={`
      p-4 space-y-3 transition-all duration-300 cursor-grab active:cursor-grabbing
      hover:shadow-lg hover:scale-[1.02] transform-gpu
      ${config.bgColor}
      ${isOverdue ? 'ring-2 ring-red-300 shadow-red-100' : ''}
      ${isDueToday ? 'ring-2 ring-amber-300 shadow-amber-100' : ''}
      border-2
    `}>
      {/* Header with title and priority */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xl" title={`دسته: ${task.category || 'عمومی'}`}>
            {categoryIcon}
          </span>
          <h4 className="font-bold text-sm text-gray-800 line-clamp-2 flex-1">
            {task.title}
          </h4>
        </div>
        <Badge className={`${config.badgeColor} text-xs font-bold px-2 py-1 flex-shrink-0`}>
          {config.emoji} {config.label}
        </Badge>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Progress bar */}
      {task.progress > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">پیشرفت:</span>
            <PersianNumber className="text-xs font-bold text-gray-700">
              {task.progress}%
            </PersianNumber>
          </div>
          <Progress value={task.progress} className="h-2" />
        </div>
      )}

      {/* Checklist preview */}
      {checklist.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs text-gray-500 font-medium flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            فهرست کارها:
          </div>
          <div className="space-y-1">
            {checklist.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-gray-300" />
                <span className="text-gray-600 line-clamp-1">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer with date and status */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
        {/* Due date */}
        {task.due_date && (
          <div className={`
            flex items-center gap-1 text-xs px-2 py-1 rounded-full
            ${isOverdue ? 'bg-red-100 text-red-700' :
              isDueToday ? 'bg-amber-100 text-amber-700' :
              isDueSoon ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-600'}
          `}>
            <Calendar className="w-3 h-3" />
            <PersianNumber>
              {formatJalaliDate(task.due_date)}
            </PersianNumber>
            {isOverdue && <span className="font-bold">(معوقه)</span>}
            {isDueToday && <span className="font-bold">(امروز)</span>}
          </div>
        )}

        {/* Status indicator */}
        <div className="flex items-center gap-1">
          {task.status === 'completed' && (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-4 h-4 fill-current" />
              <span className="text-xs font-bold">تکمیل</span>
            </div>
          )}
          {task.status === 'in_progress' && (
            <div className="flex items-center gap-1 text-blue-600">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-bold">در حال انجام</span>
            </div>
          )}
          {task.status === 'todo' && (
            <div className="flex items-center gap-1 text-gray-500">
              <User className="w-4 h-4" />
              <span className="text-xs">برنامه‌ریزی</span>
            </div>
          )}
        </div>
      </div>

      {/* Decorative bottom border based on priority */}
      <div className={`
        h-1 -mx-4 -mb-4 rounded-b-lg
        ${priority === 'high' ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
          priority === 'medium' ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
          'bg-gradient-to-r from-green-400 to-green-600'}
      `} />
    </Card>
  );
};