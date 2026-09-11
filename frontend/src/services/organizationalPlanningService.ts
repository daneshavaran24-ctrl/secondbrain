import { PersonalTask, TaskFilter, TaskStats } from '@/types';

// Organizational planning task type - extends PersonalTask with organizational-specific fields
interface OrganizationalTask extends PersonalTask {
  domain: 'organizational';
  organizationId?: string;
  departmentId?: string;
  budgetAllocated?: number;
  stakeholders?: string[];
  complianceRequired?: boolean;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

class OrganizationalPlanningService {
  private storageKey = 'organizational_planning_tasks';

  // Get all tasks
  getTasks(): OrganizationalTask[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      const tasks: OrganizationalTask[] = stored ? JSON.parse(stored) : [];


      return tasks.map(task => ({
        ...task,
        domain: 'organizational'
      }));
    } catch (error) {
      console.error('Error loading organizational tasks:', error);
      return [];
    }
  }

  // Get task by ID
  getTask(id: string): OrganizationalTask | null {
    const tasks = this.getTasks();
    return tasks.find(task => task.id === id) || null;
  }

  // Create new task
  createTask(taskData: Omit<OrganizationalTask, 'id' | 'created_at' | 'updated_at' | 'progress' | 'domain'>): OrganizationalTask {
    const tasks = this.getTasks();
    const newTask: OrganizationalTask = {
      ...taskData,
      id: crypto.randomUUID(),
      domain: 'organizational',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      progress: taskData.status === 'completed' ? 100 : 0,
    };

    tasks.push(newTask);
    this.saveTasks(tasks);
    return newTask;
  }

  // Update task
  updateTask(id: string, updates: Partial<OrganizationalTask>): OrganizationalTask | null {
    const tasks = this.getTasks();
    const taskIndex = tasks.findIndex(task => task.id === id);

    if (taskIndex === -1) return null;

    const updatedTask = {
      ...tasks[taskIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // Auto-update progress based on status
    if (updates.status === 'completed' && updates.progress === undefined) {
      updatedTask.progress = 100;
      updatedTask.completed_at = new Date().toISOString();
    } else if (updates.status === 'todo' && updates.progress === undefined) {
      updatedTask.progress = 0;
      updatedTask.completed_at = undefined;
    } else if (updates.status === 'in_progress' && updates.progress === undefined) {
      updatedTask.progress = Math.max(1, updatedTask.progress);
    }

    tasks[taskIndex] = updatedTask;
    this.saveTasks(tasks);
    return updatedTask;
  }

  // Delete task
  deleteTask(id: string): boolean {
    const tasks = this.getTasks();
    const filteredTasks = tasks.filter(task => task.id !== id);

    if (filteredTasks.length !== tasks.length) {
      this.saveTasks(filteredTasks);
      return true;
    }
    return false;
  }

  // Filter and sort tasks
  getFilteredTasks(filter: TaskFilter): OrganizationalTask[] {
    let tasks = this.getTasks();

    // Apply filters
    if (filter.status && filter.status !== 'all') {
      tasks = tasks.filter(task => task.status === filter.status);
    }

    if (filter.priority && filter.priority !== 'all') {
      tasks = tasks.filter(task => task.priority === filter.priority);
    }

    if (filter.category && filter.category !== 'all') {
      tasks = tasks.filter(task => {
        // For organizational tasks, check custom category first, then fallback to subCategory/category
        const taskCategory = task.customCategory || task.subCategory || task.category;
        return taskCategory && taskCategory.toLowerCase().includes(filter.category!.toLowerCase());
      });
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      tasks = tasks.filter(task =>
        task.title.toLowerCase().includes(searchLower) ||
        (task.description && task.description.toLowerCase().includes(searchLower)) ||
        task.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    if (filter.sortBy) {
      tasks.sort((a, b) => {
        let aValue: any, bValue: any;

        switch (filter.sortBy) {
          case 'priority':
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            aValue = priorityOrder[a.priority];
            bValue = priorityOrder[b.priority];
            break;
          case 'due_date':
            aValue = a.due_date ? new Date(a.due_date).getTime() : Infinity;
            bValue = b.due_date ? new Date(b.due_date).getTime() : Infinity;
            break;
          case 'created_at':
            aValue = new Date(a.created_at).getTime();
            bValue = new Date(b.created_at).getTime();
            break;
          case 'title':
            aValue = a.title.toLowerCase();
            bValue = b.title.toLowerCase();
            break;
          case 'progress':
            aValue = a.progress;
            bValue = b.progress;
            break;
          default:
            return 0;
        }

        const sortOrder = filter.sortOrder === 'desc' ? -1 : 1;

        if (aValue < bValue) return -1 * sortOrder;
        if (aValue > bValue) return 1 * sortOrder;
        return 0;
      });
    }

    return tasks;
  }

  // Get overdue tasks
  getOverdueTasks(): OrganizationalTask[] {
    const tasks = this.getTasks();
    const now = new Date();

    return tasks.filter(task =>
      task.status !== 'completed' &&
      task.due_date &&
      new Date(task.due_date) < now
    );
  }

  // Get upcoming tasks (next 7 days)
  getUpcomingTasks(): OrganizationalTask[] {
    const tasks = this.getTasks();
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return tasks.filter(task =>
      task.status !== 'completed' &&
      task.due_date &&
      new Date(task.due_date) >= now &&
      new Date(task.due_date) <= nextWeek
    );
  }

  // Get task statistics
  getTaskStats(): TaskStats {
    const tasks = this.getTasks();
    const now = new Date();

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const in_progress = tasks.filter(t => t.status === 'in_progress').length;
    const todo = tasks.filter(t => t.status === 'todo').length;

    const overdue = tasks.filter(t =>
      t.status !== 'completed' &&
      t.due_date &&
      new Date(t.due_date) < now
    ).length;

    const completion_rate = total > 0 ? (completed / total) * 100 : 0;

    // Calculate average completion time
    const completedTasks = tasks.filter(t => t.completed_at && t.created_at);
    const average_completion_time = completedTasks.length > 0
      ? completedTasks.reduce((sum, task) => {
        const created = new Date(task.created_at).getTime();
        const completed = new Date(task.completed_at!).getTime();
        return sum + (completed - created);
      }, 0) / completedTasks.length / (1000 * 60 * 60 * 24)
      : 0;

    // Calculate productivity score
    const timelyCompletions = completedTasks.filter(task => {
      if (!task.due_date) return true;
      return new Date(task.completed_at!) <= new Date(task.due_date);
    }).length;

    const productivity_score = completedTasks.length > 0
      ? ((timelyCompletions / completedTasks.length) * completion_rate) / 100 * 100
      : 0;

    // Weekly progress
    const weekly_progress = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];

      const createdCount = tasks.filter(t =>
        t.created_at.startsWith(dateStr)
      ).length;

      const completedCount = tasks.filter(t =>
        t.completed_at && t.completed_at.startsWith(dateStr)
      ).length;

      weekly_progress.push({
        date: dateStr,
        created: createdCount,
        completed: completedCount
      });
    }

    // Category breakdown
    const category_breakdown: Record<string, number> = {};
    tasks.forEach(task => {
      const taskCategory = task.customCategory || task.subCategory || task.category!;
      category_breakdown[taskCategory] = (category_breakdown[taskCategory] || 0) + 1;
    });

    // Priority breakdown
    const priority_breakdown: Record<string, number> = {};
    tasks.forEach(task => {
      priority_breakdown[task.priority] = (priority_breakdown[task.priority] || 0) + 1;
    });

    return {
      total,
      completed,
      in_progress,
      todo,
      overdue,
      completion_rate,
      average_completion_time,
      productivity_score,
      weekly_progress,
      category_breakdown,
      priority_breakdown
    };
  }

  // Get tasks for calendar view
  getTasksForCalendar(month: number, year: number): OrganizationalTask[] {
    const tasks = this.getTasks();
    return tasks.filter(task => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date);
      return taskDate.getMonth() === month && taskDate.getFullYear() === year;
    });
  }

  // Bulk operations
  bulkUpdateStatus(taskIds: string[], status: OrganizationalTask['status']): number {
    const tasks = this.getTasks();
    let updatedCount = 0;

    tasks.forEach(task => {
      if (taskIds.includes(task.id)) {
        task.status = status;
        task.updated_at = new Date().toISOString();

        if (status === 'completed') {
          task.progress = 100;
          task.completed_at = new Date().toISOString();
        } else if (status === 'todo') {
          task.progress = 0;
          task.completed_at = undefined;
        }

        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      this.saveTasks(tasks);
    }

    return updatedCount;
  }

  // Private helper methods
  private saveTasks(tasks: OrganizationalTask[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving organizational tasks:', error);
    }
  }

  // Export/Import functionality
  exportTasks(): string {
    const tasks = this.getTasks();
    return JSON.stringify(tasks, null, 2);
  }

  importTasks(jsonData: string): { success: boolean; count: number; error?: string } {
    try {
      const importedTasks = JSON.parse(jsonData) as OrganizationalTask[];

      if (!Array.isArray(importedTasks)) {
        return { success: false, count: 0, error: 'Invalid data format' };
      }

      // Validate task structure
      const validTasks = importedTasks.filter(task =>
        task.id && task.title && task.priority && task.status
      );

      if (validTasks.length === 0) {
        return { success: false, count: 0, error: 'No valid tasks found' };
      }

      const existingTasks = this.getTasks();
      const mergedTasks = [...existingTasks];

      // Add tasks that don't already exist
      validTasks.forEach(task => {
        if (!existingTasks.find(existing => existing.id === task.id)) {
          mergedTasks.push({ ...task, domain: 'organizational' });
        }
      });

      this.saveTasks(mergedTasks);

      return {
        success: true,
        count: validTasks.length,
      };
    } catch (error) {
      return {
        success: false,
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // پاکسازی کامل داده‌های برنامه‌ریزی سازمانی
  cleanupAllData(): void {
    console.log('🏢 پاکسازی داده‌های برنامه‌ریزی سازمانی...');
    
    // پاک کردن تمام localStorage keys مرتبط
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem('organizational_tasks');
    localStorage.removeItem('org_tasks');
    localStorage.removeItem('organizational_planning');
    localStorage.removeItem('organizational_planning_v1');
    localStorage.removeItem('organizational_task_filters');
    localStorage.removeItem('organizational_task_stats');
    localStorage.removeItem('organizational_kanban_data');
    localStorage.removeItem('organizational_scrum_data');
    
    console.log('✅ پاکسازی برنامه‌ریزی سازمانی کامل شد');
  }
}

export const organizationalPlanningService = new OrganizationalPlanningService();