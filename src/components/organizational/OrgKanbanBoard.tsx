import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export type OrgStatus = 'pending' | 'in_progress' | 'completed' | 'accepted' | 'declined';

interface OrgKanbanBoardProps {
  domain: 'personal' | 'professional' | 'organizational';
}

interface DelegationTask {
  id: string;
  title: string;
  description?: string;
  status: OrgStatus;
}

const columns = [
  { id: 'pending', title: 'Backlog' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'accepted', title: 'Accepted' },
  { id: 'completed', title: 'Done' },
  { id: 'declined', title: 'Declined' },
] as const;

export const OrgKanbanBoard: React.FC<OrgKanbanBoardProps> = ({ domain }) => {
  const [tasks, setTasks] = useState<DelegationTask[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('delegation_tasks')
        .select('id, title, description, status')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      setTasks((data || []) as DelegationTask[]);
    } catch (e) {
      toast({ title: 'خطا', description: 'بارگذاری وظایف سازمانی ناموفق بود', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [domain]);

  useEffect(() => { load(); }, [load]);

  const grouped = useMemo(() => {
    const g: Record<string, DelegationTask[]> = {} as any;
    columns.forEach(c => { g[c.id] = []; });
    tasks.forEach(t => { (g[t.status] ||= []).push(t); });
    return g as Record<typeof columns[number]['id'], DelegationTask[]>;
  }, [tasks]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId as OrgStatus;
    try {
      const { error } = await supabase.from('delegation_tasks').update({ status: newStatus }).eq('id', taskId);
      if (error) throw error;
      setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, status: newStatus } : t)));
      toast({ title: 'بروزرسانی شد', description: 'وضعیت وظیفه تغییر کرد' });
    } catch (e) {
      toast({ title: 'خطا', description: 'تغییر وضعیت ناموفق بود', variant: 'destructive' });
    }
  };

  if (loading) return <div className="text-center py-10 text-muted-foreground">در حال بارگذاری...</div>;

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {columns.map(col => (
          <div key={col.id} className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{col.title}</h3>
              <Badge variant="secondary">{grouped[col.id].length}</Badge>
            </div>
            <Droppable droppableId={col.id}>
              {(provided) => (
                <Card ref={provided.innerRef} {...provided.droppableProps} className="p-3 min-h-[240px]">
                  <div className="space-y-2">
                    {grouped[col.id].map((task, index) => (
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
