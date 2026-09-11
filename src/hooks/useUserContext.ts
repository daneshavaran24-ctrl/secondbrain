import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserContext {
  recentGoals: any[];
  recentTasks: any[];
  recentIdeas: any[];
  isLoading: boolean;
}

export const useUserContext = (): UserContext => {
  const { user } = useAuth();
  const [context, setContext] = useState<UserContext>({
    recentGoals: [],
    recentTasks: [],
    recentIdeas: [],
    isLoading: true,
  });

  useEffect(() => {
    if (!user) {
      setContext({
        recentGoals: [],
        recentTasks: [],
        recentIdeas: [],
        isLoading: false,
      });
      return;
    }

    const loadUserContext = async () => {
      try {
        // Load recent personal planning items
        const { data: goals } = await supabase
          .from('personal_planning')
          .select('id, title, status, priority')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        // Load recent tasks
        const { data: tasks } = await supabase
          .from('project_tasks')
          .select('id, title, status, priority')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        // Load recent ideas
        const { data: ideas } = await supabase
          .from('ideas')
          .select('id, title, status, stage')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        setContext({
          recentGoals: goals || [],
          recentTasks: tasks || [],
          recentIdeas: ideas || [],
          isLoading: false,
        });
      } catch (error) {
        console.error('Error loading user context:', error);
        setContext(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadUserContext();
  }, [user]);

  return context;
};
