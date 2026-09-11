import { Project, ProjectTask, ProjectMember, TaskStatus, ProjectStats, ProjectNotification } from '@/types';

class ProjectManagementService {
  private storageKey = 'brainforge_projects';
  private tasksKey = 'brainforge_project_tasks';
  private membersKey = 'brainforge_project_members';
  private notificationsKey = 'brainforge_project_notifications';

  // Projects CRUD
  getProjects(): Project[] {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : [];
  }

  getProject(id: string): Project | null {
    const projects = this.getProjects();
    return projects.find(p => p.id === id) || null;
  }

  createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'progress'>): Project {
    const projects = this.getProjects();
    const newProject: Project = {
      ...projectData,
      id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      progress: 0
    };
    
    projects.push(newProject);
    localStorage.setItem(this.storageKey, JSON.stringify(projects));
    return newProject;
  }

  updateProject(id: string, updates: Partial<Project>): Project | null {
    const projects = this.getProjects();
    const index = projects.findIndex(p => p.id === id);
    
    if (index === -1) return null;
    
    projects[index] = {
      ...projects[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem(this.storageKey, JSON.stringify(projects));
    return projects[index];
  }

  deleteProject(id: string): boolean {
    const projects = this.getProjects();
    const filtered = projects.filter(p => p.id !== id);
    
    if (filtered.length === projects.length) return false;
    
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    
    // Also delete related tasks
    const tasks = this.getTasks();
    const filteredTasks = tasks.filter(t => t.projectId !== id);
    localStorage.setItem(this.tasksKey, JSON.stringify(filteredTasks));
    
    return true;
  }

  // Tasks CRUD
  getTasks(projectId?: string): ProjectTask[] {
    const stored = localStorage.getItem(this.tasksKey);
    const tasks = stored ? JSON.parse(stored) : [];
    return projectId ? tasks.filter((t: ProjectTask) => t.projectId === projectId) : tasks;
  }

  getTask(id: string): ProjectTask | null {
    const tasks = this.getTasks();
    return tasks.find(t => t.id === id) || null;
  }

  createTask(taskData: Omit<ProjectTask, 'id' | 'createdAt' | 'updatedAt' | 'comments' | 'attachments'>): ProjectTask {
    const tasks = this.getTasks();
    const newTask: ProjectTask = {
      ...taskData,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: [],
      attachments: []
    };
    
    tasks.push(newTask);
    localStorage.setItem(this.tasksKey, JSON.stringify(tasks));
    
    // Update project progress
    this.updateProjectProgress(taskData.projectId);
    
    // Send notification
    this.sendTaskNotification(newTask, 'task_assigned');
    
    return newTask;
  }

  updateTask(id: string, updates: Partial<ProjectTask>): ProjectTask | null {
    const tasks = this.getTasks();
    const index = tasks.findIndex(t => t.id === id);
    
    if (index === -1) return null;
    
    const oldTask = tasks[index];
    tasks[index] = {
      ...oldTask,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem(this.tasksKey, JSON.stringify(tasks));
    
    // Update project progress
    this.updateProjectProgress(tasks[index].projectId);
    
    // Send notification if status changed to completed
    if (oldTask.status !== 'completed' && updates.status === 'completed') {
      this.sendTaskNotification(tasks[index], 'task_completed');
    }
    
    return tasks[index];
  }

  updateTaskStatus(id: string, status: TaskStatus): ProjectTask | null {
    return this.updateTask(id, { status });
  }

  deleteTask(id: string): boolean {
    const tasks = this.getTasks();
    const task = tasks.find(t => t.id === id);
    const filtered = tasks.filter(t => t.id !== id);
    
    if (filtered.length === tasks.length) return false;
    
    localStorage.setItem(this.tasksKey, JSON.stringify(filtered));
    
    // Update project progress
    if (task) {
      this.updateProjectProgress(task.projectId);
    }
    
    return true;
  }

  // Members management
  getMembers(): ProjectMember[] {
    const stored = localStorage.getItem(this.membersKey);
    return stored ? JSON.parse(stored) : [];
  }

  // Check if user has any data
  hasData(): boolean {
    const projects = this.getProjects();
    const tasks = this.getTasks();
    const members = this.getMembers();
    return projects.length > 0 || tasks.length > 0 || members.length > 0;
  }

  // Statistics and reporting
  getProjectStats(projectId: string): ProjectStats {
    const tasks = this.getTasks(projectId);
    const now = new Date();
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const blockedTasks = tasks.filter(t => t.status === 'blocked').length;
    const overdueTasks = tasks.filter(t => 
      t.status !== 'completed' && new Date(t.deadline) < now
    ).length;
    
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    // Calculate average task duration for completed tasks
    const completedTasksWithDuration = tasks.filter(t => 
      t.status === 'completed' && t.actualHours
    );
    const averageTaskDuration = completedTasksWithDuration.length > 0
      ? completedTasksWithDuration.reduce((sum, t) => sum + (t.actualHours || 0), 0) / completedTasksWithDuration.length
      : 0;

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      blockedTasks,
      overdueTasks,
      completionRate,
      averageTaskDuration,
      teamProductivity: completedTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
    };
  }

  // Progress calculation
  private updateProjectProgress(projectId: string): void {
    const tasks = this.getTasks(projectId);
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
    
    this.updateProject(projectId, { progress });
  }

  // Notifications
  private sendTaskNotification(task: ProjectTask, type: ProjectNotification['type']): void {
    const notifications = this.getNotifications();
    let message = '';
    
    switch (type) {
      case 'task_assigned':
        message = `وظیفه جدید "${task.title}" به شما تخصیص داده شد`;
        break;
      case 'task_completed':
        message = `وظیفه "${task.title}" تکمیل شد`;
        break;
      case 'deadline_reminder':
        message = `ددلاین وظیفه "${task.title}" نزدیک است`;
        break;
    }
    
    const notification: ProjectNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId: task.projectId,
      taskId: task.id,
      type,
      title: `وظیفه ${task.title}`,
      message,
      recipientId: task.assigneeId,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    
    notifications.push(notification);
    localStorage.setItem(this.notificationsKey, JSON.stringify(notifications));
    
    // Simulate sending notification based on method
    this.simulateNotificationSend(notification);
  }

  private simulateNotificationSend(notification: ProjectNotification): void {
    // This would integrate with real notification services
    // console.log removed for production: Sending notification
  }

  getNotifications(userId?: string): ProjectNotification[] {
    const stored = localStorage.getItem(this.notificationsKey);
    const notifications = stored ? JSON.parse(stored) : [];
    return userId ? notifications.filter((n: ProjectNotification) => n.recipientId === userId) : notifications;
  }

  markNotificationAsRead(id: string): void {
    const notifications = this.getNotifications();
    const notification = notifications.find(n => n.id === id);
    if (notification) {
      notification.isRead = true;
      localStorage.setItem(this.notificationsKey, JSON.stringify(notifications));
    }
  }

  // Deadline checker (would be called by a cron job in real implementation)
  checkDeadlines(): void {
    const tasks = this.getTasks();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    tasks.forEach(task => {
      if (task.status !== 'completed' && new Date(task.deadline) <= tomorrow) {
        this.sendTaskNotification(task, 'deadline_reminder');
      }
    });
  }

  // Search and filtering
  searchTasks(query: string, projectId?: string): ProjectTask[] {
    const tasks = this.getTasks(projectId);
    const lowercaseQuery = query.toLowerCase();
    
    return tasks.filter(task =>
      task.title.toLowerCase().includes(lowercaseQuery) ||
      task.description.toLowerCase().includes(lowercaseQuery) ||
      task.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  getTasksByStatus(status: TaskStatus, projectId?: string): ProjectTask[] {
    const tasks = this.getTasks(projectId);
    return tasks.filter(task => task.status === status);
  }

  getOverdueTasks(projectId?: string): ProjectTask[] {
    const tasks = this.getTasks(projectId);
    const now = new Date();
    
    return tasks.filter(task =>
      task.status !== 'completed' && new Date(task.deadline) < now
    );
  }

  // پاکسازی کامل داده‌های مدیریت پروژه
  cleanupAllData(): void {
    console.log('📋 پاکسازی داده‌های مدیریت پروژه...');
    
    // پاک کردن تمام localStorage keys مرتبط
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.tasksKey);
    localStorage.removeItem(this.notificationsKey);
    localStorage.removeItem('projectNotifications');
    localStorage.removeItem('project_notifications');
    localStorage.removeItem('project_tasks');
    localStorage.removeItem('project_members');
    localStorage.removeItem('project_stats');
    
    console.log('✅ پاکسازی مدیریت پروژه کامل شد');
  }
}

export const projectManagementService = new ProjectManagementService();