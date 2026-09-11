import React, { useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { PersonalTask } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IranianTaskCard } from './IranianTaskCard';

interface IranianKanbanBoardProps {
  tasks: PersonalTask[];
  onStatusChange: (id: string, status: PersonalTask['status']) => void;
}

const columns = [
  { 
    id: 'todo', 
    title: 'در حال برنامه‌ریزی 📋',
    color: 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200',
    headerColor: 'text-amber-700',
    count: 'bg-amber-100 text-amber-700'
  },
  { 
    id: 'this_week', 
    title: 'این هفته 📅',
    color: 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200',
    headerColor: 'text-blue-700',
    count: 'bg-blue-100 text-blue-700'
  },
  { 
    id: 'in_progress', 
    title: 'امروز ✅',
    color: 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200',
    headerColor: 'text-purple-700',
    count: 'bg-purple-100 text-purple-700'
  },
  { 
    id: 'completed', 
    title: 'انجام شد 🎯',
    color: 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200',
    headerColor: 'text-green-700',
    count: 'bg-green-100 text-green-700'
  },
] as const;

// Map the existing task statuses to our Iranian columns
const mapTaskToColumn = (task: PersonalTask) => {
  if (task.status === 'completed') return 'completed';
  if (task.status === 'in_progress') return 'in_progress';
  
  // For 'todo' tasks, we'll distribute them based on due date or priority
  if (task.due_date) {
    const dueDate = new Date(task.due_date);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) return 'in_progress'; // Today
    if (diffDays <= 7) return 'this_week'; // This week
  }
  
  return 'todo'; // Planning
};

export const IranianKanbanBoard: React.FC<IranianKanbanBoardProps> = ({ 
  tasks, 
  onStatusChange 
}) => {
  const byColumn = useMemo(() => {
    const grouped = {
      todo: [] as PersonalTask[],
      this_week: [] as PersonalTask[],
      in_progress: [] as PersonalTask[],
      completed: [] as PersonalTask[],
    };

    tasks.forEach(task => {
      const column = mapTaskToColumn(task);
      grouped[column].push(task);
    });

    return grouped;
  }, [tasks]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const newColumn = result.destination.droppableId;
    const taskId = result.draggableId;
    
    // Map column back to task status
    let newStatus: PersonalTask['status'];
    switch (newColumn) {
      case 'completed':
        newStatus = 'completed';
        break;
      case 'in_progress':
        newStatus = 'in_progress';
        break;
      default:
        newStatus = 'todo';
        break;
    }
    
    onStatusChange(taskId, newStatus);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          کانبان ایرانی - برنامه‌ریزی فردی
        </h2>
        <p className="text-muted-foreground">
          مدیریت کارها با روشی آشنا و کاربردی
        </p>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {columns.map(col => (
            <div key={col.id} className="flex flex-col">
              {/* Column Header */}
              <div className={`rounded-t-lg p-4 border-b-2 ${col.color}`}>
                <div className="flex items-center justify-between">
                  <h3 className={`font-bold text-lg ${col.headerColor}`}>
                    {col.title}
                  </h3>
                  <Badge className={`${col.count} border-0 font-bold`}>
                    {byColumn[col.id].length}
                  </Badge>
                </div>
              </div>

              {/* Column Content */}
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <Card 
                    ref={provided.innerRef} 
                    {...provided.droppableProps} 
                    className={`
                      flex-1 min-h-[500px] p-4 rounded-t-none border-t-0
                      ${col.color}
                      ${snapshot.isDraggingOver ? 'ring-2 ring-primary ring-opacity-50' : ''}
                      transition-all duration-200
                    `}
                  >
                    <div className="space-y-4">
                      {byColumn[col.id].map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`
                                ${snapshot.isDragging ? 'rotate-3 scale-105' : ''}
                                transition-all duration-200
                              `}
                            >
                              <IranianTaskCard task={task} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      
                      {/* Empty State */}
                      {byColumn[col.id].length === 0 && (
                        <div className="text-center py-12 space-y-3">
                          <div className="text-4xl opacity-30">
                            {col.id === 'todo' ? '📝' : 
                             col.id === 'this_week' ? '📅' :
                             col.id === 'in_progress' ? '⚡' : '🎉'}
                          </div>
                          <div className="text-sm text-muted-foreground font-medium">
                            {col.id === 'todo' ? 'هنوز کاری برای برنامه‌ریزی نیست' :
                             col.id === 'this_week' ? 'کاری برای این هفته نیست' :
                             col.id === 'in_progress' ? 'کار امروز تعریف نشده' :
                             'کاری تکمیل نشده'}
                          </div>
                          <div className="w-full h-16 border-2 border-dashed border-gray-200 rounded-lg opacity-50" />
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
};