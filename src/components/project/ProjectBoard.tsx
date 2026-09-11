import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Project, ProjectTask, TaskStatus } from '@/types';
import { projectManagementService } from '@/services/projectManagementService';
import { TaskCard } from './TaskCard';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProjectBoardProps {
  project: Project;
  onTaskClick: (task: ProjectTask) => void;
  onAddTask: (status: TaskStatus) => void;
  onRefresh: () => void;
}

const statusColumns = [
  { id: 'pending', title: 'در انتظار', color: 'bg-yellow-500/20 border-yellow-500/30' },
  { id: 'in_progress', title: 'در حال انجام', color: 'bg-blue-500/20 border-blue-500/30' },
  { id: 'completed', title: 'تکمیل شده', color: 'bg-green-500/20 border-green-500/30' },
  { id: 'blocked', title: 'مسدود شده', color: 'bg-red-500/20 border-red-500/30' }
] as const;

export function ProjectBoard({ project, onTaskClick, onAddTask, onRefresh }: ProjectBoardProps) {
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadTasks();
  }, [project.id]);

  const loadTasks = () => {
    const projectTasks = projectManagementService.getTasks(project.id);
    // Normalize legacy statuses
    const normalized = projectTasks.map(t => {
      if ((t as any).status === 'in-progress') {
        projectManagementService.updateTaskStatus(t.id, 'in_progress');
        return { ...t, status: 'in_progress' as TaskStatus };
      }
      return t;
    });
    setTasks(normalized);
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    // If dropped in the same position, do nothing
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Update task status
      const newStatus = destination.droppableId as TaskStatus;
      const updatedTask = projectManagementService.updateTaskStatus(draggableId, newStatus);
      
      if (updatedTask) {
        loadTasks();
        onRefresh();
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };

  const getStatusCount = (status: TaskStatus) => {
    return getTasksByStatus(status).length;
  };

  return (
    <div className="h-full">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full">
          {statusColumns.map((column) => (
            <div key={column.id} className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{column.title}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {getStatusCount(column.id as TaskStatus)}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAddTask(column.id as TaskStatus)}
                  className="h-8 w-8 p-0 hover:bg-primary/10"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <Card
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 p-4 transition-colors ${column.color} ${
                      snapshot.isDraggingOver ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="space-y-3">
                      {getTasksByStatus(column.id as TaskStatus).map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`transition-transform ${
                                snapshot.isDragging ? 'rotate-2 scale-105' : ''
                              }`}
                            >
                              <TaskCard
                                task={task}
                                onClick={() => onTaskClick(task)}
                                isLoading={isLoading}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      
                      {getTasksByStatus(column.id as TaskStatus).length === 0 && (
                        <div className="flex items-center justify-center h-32 text-muted-foreground text-sm border-2 border-dashed border-muted-foreground/20 rounded-lg">
                          هیچ وظیفه‌ای در این مرحله نیست
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
    </div>
  );
}