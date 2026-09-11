import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Clock, Trash2, MessageCircle, Target, Brain, Scale, Download } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import ExportButton from './ExportButton';

interface Session {
  id: string;
  title: string;
  session_type: string;
  created_at: string;
  updated_at: string;
}

interface SessionSidebarProps {
  currentSessionId?: string;
  onSessionSelect: (sessionId: string, sessionType: string) => void;
}

const SessionSidebar: React.FC<SessionSidebarProps> = ({ currentSessionId, onSessionSelect }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  const loadSessions = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('ai_chat_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading sessions:', error);
      return;
    }

    setSessions(data || []);
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('آیا مطمئن هستید که می‌خواهید این جلسه را حذف کنید؟')) {
      return;
    }

    const { error } = await supabase
      .from('ai_chat_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      toast({
        title: "خطا",
        description: "حذف جلسه با مشکل مواجه شد",
        variant: "destructive",
      });
      return;
    }

    setSessions(sessions.filter(s => s.id !== sessionId));
    toast({
      title: "حذف شد",
      description: "جلسه با موفقیت حذف شد",
    });
  };

  const getSessionIcon = (type: string) => {
    switch (type) {
      case 'mentor':
        return <Target className="w-4 h-4" />;
      case 'coach':
        return <Brain className="w-4 h-4" />;
      case 'decision-maker':
        return <Scale className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || session.session_type === filterType;
    return matchesSearch && matchesType;
  });

  const groupSessionsByDate = (sessions: Session[]) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const groups = {
      today: [] as Session[],
      yesterday: [] as Session[],
      thisWeek: [] as Session[],
      older: [] as Session[],
    };

    sessions.forEach(session => {
      const sessionDate = new Date(session.created_at);
      if (sessionDate.toDateString() === today.toDateString()) {
        groups.today.push(session);
      } else if (sessionDate.toDateString() === yesterday.toDateString()) {
        groups.yesterday.push(session);
      } else if (sessionDate >= lastWeek) {
        groups.thisWeek.push(session);
      } else {
        groups.older.push(session);
      }
    });

    return groups;
  };

  const groupedSessions = groupSessionsByDate(filteredSessions);

  return (
    <Card className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold mb-3">تاریخچه مکالمات</h3>
        
        <div className="relative mb-3">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="جستجو در مکالمات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={filterType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('all')}
            className="flex-1"
          >
            همه
          </Button>
          <Button
            variant={filterType === 'mentor' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('mentor')}
            className="flex-1"
          >
            منتور
          </Button>
          <Button
            variant={filterType === 'coach' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('coach')}
            className="flex-1"
          >
            کوچ
          </Button>
          <Button
            variant={filterType === 'decision-maker' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('decision-maker')}
            className="flex-1"
          >
            مشاور
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-2">
        {Object.entries(groupedSessions).map(([key, sessions]) => {
          if (sessions.length === 0) return null;

          const labels = {
            today: 'امروز',
            yesterday: 'دیروز',
            thisWeek: 'این هفته',
            older: 'قدیمی‌تر',
          };

          return (
            <div key={key} className="mb-4">
              <div className="px-2 py-1 text-xs text-muted-foreground font-medium">
                {labels[key as keyof typeof labels]}
              </div>
              {sessions.map(session => (
                <Button
                  key={session.id}
                  variant={currentSessionId === session.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start mb-1 h-auto py-2 px-2"
                  onClick={() => onSessionSelect(session.id, session.session_type)}
                >
                  <div className="flex items-start gap-2 w-full">
                    <div className="mt-0.5">
                      {getSessionIcon(session.session_type)}
                    </div>
                    <div className="flex-1 text-right overflow-hidden">
                      <div className="text-sm font-medium truncate">
                        {session.title}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(session.updated_at), { 
                          addSuffix: true
                        })}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                      <div onClick={(e) => e.stopPropagation()}>
                        <ExportButton sessionId={session.id} sessionTitle={session.title} />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          );
        })}

        {filteredSessions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">مکالمه‌ای یافت نشد</p>
          </div>
        )}
      </ScrollArea>
    </Card>
  );
};

export default SessionSidebar;