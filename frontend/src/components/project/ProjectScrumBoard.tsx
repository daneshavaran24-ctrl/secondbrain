import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Project, ProjectTask, TaskStatus } from '@/types';
import { projectManagementService } from '@/services/projectManagementService';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProjectScrumBoardProps {
  project: Project;
  onTaskClick: (task: ProjectTask) => void;
  onAddTask: (status: TaskStatus) => void;
  onRefresh: () => void;
}

const columns = [
  { id: 'pending', title: 'Backlog' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'blocked', title: 'Review' },
  { id: 'completed', title: 'Done' },
] as const;

export const ProjectScrumBoard: React.FC<ProjectScrumBoardProps> = ({ project, onTaskClick, onAddTask, onRefresh }) => {
  const [tasks, setTasks] = useState<ProjectTask[]>([]);

  const load = () => setTasks(projectManagementService.getTasks(project.id));
  useEffect(() => { load(); }, [project.id]);

  const byStatus = (status: TaskStatus) => tasks.filter(t => t.status === status);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId as TaskStatus;
    const taskId = result.draggableId;
    projectManagementService.updateTaskStatus(taskId, newStatus);
    load();
    onRefresh();
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map(col => (
          <div key={col.id} className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{col.title}</h3>
              <Badge variant="secondary">{byStatus(col.id as TaskStatus).length}</Badge>
              <Button variant="ghost" size="sm" onClick={() => onAddTask(col.id as TaskStatus)} className="h-8 w-8 p-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Droppable droppableId={col.id}>
              {(provided) => (
                <Card ref={provided.innerRef} {...provided.droppableProps} className="p-3 min-h-[280px]">
                  <div className="space-y-2">
                    {byStatus(col.id as TaskStatus).map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="p-3 rounded-md border bg-card">
                            <div className="font-medium text-sm cursor-pointer" onClick={() => onTaskClick(task)}>{task.title}</div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
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
