import { MeetingResolution } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, User, MessageSquare, AlertCircle } from "lucide-react";
import { format, isPast } from "date-fns-jalali";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";

interface ResolutionKanbanBoardProps {
  resolutions: MeetingResolution[];
  onStatusChange: (resolutionId: string, newStatus: MeetingResolution['status']) => void;
  onResolutionClick: (resolution: MeetingResolution) => void;
}

const statusColumns: { id: MeetingResolution['status']; title: string; color: string }[] = [
  { id: 'pending', title: 'در انتظار', color: 'bg-secondary' },
  { id: 'approved', title: 'تایید شده', color: 'bg-blue-500' },
  { id: 'in_progress', title: 'در حال اجرا', color: 'bg-primary' },
  { id: 'completed', title: 'تکمیل شده', color: 'bg-green-500' },
];

export const ResolutionKanbanBoard = ({ resolutions, onStatusChange, onResolutionClick }: ResolutionKanbanBoardProps) => {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const resolutionId = result.draggableId;
    const newStatus = result.destination.droppableId as MeetingResolution['status'];

    onStatusChange(resolutionId, newStatus);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusColumns.map((column) => {
          const columnResolutions = resolutions.filter(r => r.status === column.id);
          
          return (
            <div key={column.id} className="flex flex-col">
              <div className={`${column.color} text-white p-3 rounded-t-lg flex items-center justify-between`}>
                <h3 className="font-semibold">{column.title}</h3>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {columnResolutions.length}
                </Badge>
              </div>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 p-2 space-y-2 bg-muted/20 rounded-b-lg min-h-[500px] transition-colors ${
                      snapshot.isDraggingOver ? 'bg-muted/40' : ''
                    }`}
                  >
                    {columnResolutions.map((resolution, index) => {
                      const isOverdue = resolution.due_date && isPast(new Date(resolution.due_date));
                      
                      return (
                        <Draggable key={resolution.id} draggableId={resolution.id} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-4 cursor-pointer hover:shadow-lg transition-shadow ${
                                snapshot.isDragging ? 'shadow-xl rotate-2' : ''
                              } ${isOverdue ? 'border-destructive' : ''}`}
                              onClick={() => onResolutionClick(resolution)}
                            >
                              <div className="space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="font-medium text-sm line-clamp-2">{resolution.title}</h4>
                                  <Badge variant={getPriorityColor(resolution.priority)} className="shrink-0">
                                    {resolution.priority === 'high' ? 'بالا' : resolution.priority === 'medium' ? 'متوسط' : 'پایین'}
                                  </Badge>
                                </div>

                                {resolution.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2">{resolution.description}</p>
                                )}

                                {resolution.progress !== undefined && (
                                  <div className="space-y-1">
                                    <Progress value={resolution.progress} className="h-2" />
                                    <span className="text-xs text-muted-foreground">{resolution.progress}%</span>
                                  </div>
                                )}

                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                  {resolution.due_date && (
                                    <div className={`flex items-center gap-1 ${isOverdue ? 'text-destructive' : ''}`}>
                                      <Calendar className="h-3 w-3" />
                                      {format(new Date(resolution.due_date), 'yyyy/MM/dd')}
                                      {isOverdue && <AlertCircle className="h-3 w-3" />}
                                    </div>
                                  )}
                                  {resolution.responsible_parties?.length > 0 && (
                                    <div className="flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      {resolution.responsible_parties[0].user_name}
                                      {resolution.responsible_parties.length > 1 && ` +${resolution.responsible_parties.length - 1}`}
                                    </div>
                                  )}
                                  {resolution.comments?.length > 0 && (
                                    <div className="flex items-center gap-1">
                                      <MessageSquare className="h-3 w-3" />
                                      {resolution.comments.length}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Card>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};