import React, { useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { PersonalTask } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PersonalKanbanBoardProps {
  tasks: PersonalTask[];
  onStatusChange: (id: string, status: PersonalTask['status']) => void;
}

const columns = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'completed', title: 'Done' },
] as const;

export const PersonalKanbanBoard: React.FC<PersonalKanbanBoardProps> = ({ tasks, onStatusChange }) => {
  const byStatus = useMemo(() => ({
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    completed: tasks.filter(t => t.status === 'completed'),
  }), [tasks]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId as PersonalTask['status'];
    const taskId = result.draggableId;
    onStatusChange(taskId, newStatus);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map(col => (
          <div key={col.id} className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-foreground">{col.title}</h3>
              <Badge variant="secondary">{byStatus[col.id].length}</Badge>
            </div>
            <Droppable droppableId={col.id}>
              {(provided) => (
                <Card ref={provided.innerRef} {...provided.droppableProps} className="p-3 min-h-[280px]">
                  <div className="space-y-2">
                    {byStatus[col.id].map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="p-3 rounded-md border bg-card">
                            <div className="font-medium text-sm">{task.title}</div>
                            {task.description && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</div>}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {byStatus[col.id].length === 0 && (
                      <div className="text-xs text-muted-foreground text-center py-6 border-2 border-dashed rounded-md">
                        آیتمی نیست
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
};
