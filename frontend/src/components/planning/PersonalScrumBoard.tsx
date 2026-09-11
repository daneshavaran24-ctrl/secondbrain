import React from 'react';
import { PersonalKanbanBoard } from './PersonalKanbanBoard';
import { PersonalTask } from '@/types';

interface PersonalScrumBoardProps {
  tasks: PersonalTask[];
  onStatusChange: (id: string, status: PersonalTask['status']) => void;
}

// For minimal implementation, reuse Kanban statuses with Scrum labels
export const PersonalScrumBoard: React.FC<PersonalScrumBoardProps> = ({ tasks, onStatusChange }) => {
  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">حالت Scrum (ستون‌ها: Backlog, In Progress, Done)</div>
      <PersonalKanbanBoard tasks={tasks} onStatusChange={onStatusChange} />
    </div>
  );
};
