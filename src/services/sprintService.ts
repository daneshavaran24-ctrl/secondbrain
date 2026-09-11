// Sprint Management Service for Jira-style Agile Development
import { PersonalTask, ProjectTask } from '@/types';

export interface Sprint {
  id: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  domain: 'personal' | 'project' | 'organizational';
  projectId?: string;
  status: 'planning' | 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface SprintTask {
  taskId: string;
  storyPoints?: number;
  estimatedHours?: number;
  sprintId: string;
}

export interface BurndownData {
  date: string;
  remaining: number;
  ideal: number;
}

class SprintService {
  private getStorageKey(scope: string, projectId?: string): string {
    return projectId ? `sprints_${scope}_${projectId}` : `sprints_${scope}`;
  }

  private getTaskAssignmentKey(scope: string, projectId?: string): string {
    return projectId ? `sprint_tasks_${scope}_${projectId}` : `sprint_tasks_${scope}`;
  }

  private getCurrentSprintKey(scope: string, projectId?: string): string {
    return projectId ? `current_sprint_${scope}_${projectId}` : `current_sprint_${scope}`;
  }

  // Sprint CRUD Operations
  getSprints(scope: string, projectId?: string): Sprint[] {
    const key = this.getStorageKey(scope, projectId);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  createSprint(scope: string, sprintData: Omit<Sprint, 'id' | 'createdAt' | 'updatedAt'>, projectId?: string): Sprint {
    const sprints = this.getSprints(scope, projectId);
    const newSprint: Sprint = {
      ...sprintData,
      id: `sprint_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    sprints.push(newSprint);
    const key = this.getStorageKey(scope, projectId);
    localStorage.setItem(key, JSON.stringify(sprints));

    return newSprint;
  }

  updateSprint(scope: string, sprintId: string, updates: Partial<Sprint>, projectId?: string): Sprint | null {
    const sprints = this.getSprints(scope, projectId);
    const index = sprints.findIndex(s => s.id === sprintId);
    
    if (index === -1) return null;

    sprints[index] = {
      ...sprints[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const key = this.getStorageKey(scope, projectId);
    localStorage.setItem(key, JSON.stringify(sprints));

    return sprints[index];
  }

  deleteSprint(scope: string, sprintId: string, projectId?: string): boolean {
    const sprints = this.getSprints(scope, projectId);
    const filtered = sprints.filter(s => s.id !== sprintId);
    
    if (filtered.length === sprints.length) return false;

    const key = this.getStorageKey(scope, projectId);
    localStorage.setItem(key, JSON.stringify(filtered));

    // Clear current sprint if it was deleted
    const currentSprintKey = this.getCurrentSprintKey(scope, projectId);
    const currentSprint = localStorage.getItem(currentSprintKey);
    if (currentSprint === sprintId) {
      localStorage.removeItem(currentSprintKey);
    }

    // Remove task assignments
    const taskAssignments = this.getSprintTasks(scope, projectId);
    const filteredAssignments = taskAssignments.filter(task => task.sprintId !== sprintId);
    const taskKey = this.getTaskAssignmentKey(scope, projectId);
    localStorage.setItem(taskKey, JSON.stringify(filteredAssignments));

    return true;
  }

  // Current Sprint Management
  getCurrentSprint(scope: string, projectId?: string): Sprint | null {
    const currentSprintKey = this.getCurrentSprintKey(scope, projectId);
    const sprintId = localStorage.getItem(currentSprintKey);
    if (!sprintId) return null;

    const sprints = this.getSprints(scope, projectId);
    return sprints.find(s => s.id === sprintId) || null;
  }

  setCurrentSprint(scope: string, sprintId: string | null, projectId?: string): void {
    const currentSprintKey = this.getCurrentSprintKey(scope, projectId);
    if (sprintId) {
      localStorage.setItem(currentSprintKey, sprintId);
    } else {
      localStorage.removeItem(currentSprintKey);
    }
  }

  // Task Assignment Management
  getSprintTasks(scope: string, projectId?: string): SprintTask[] {
    const key = this.getTaskAssignmentKey(scope, projectId);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  assignTasksToSprint(scope: string, taskIds: string[], sprintId: string, projectId?: string): void {
    const assignments = this.getSprintTasks(scope, projectId);
    
    // Remove existing assignments for these tasks
    const filtered = assignments.filter(assignment => !taskIds.includes(assignment.taskId));
    
    // Add new assignments
    const newAssignments = taskIds.map(taskId => ({
      taskId,
      sprintId,
      storyPoints: 0,
      estimatedHours: 0,
    }));

    const updated = [...filtered, ...newAssignments];
    const key = this.getTaskAssignmentKey(scope, projectId);
    localStorage.setItem(key, JSON.stringify(updated));
  }

  removeTasksFromSprint(scope: string, taskIds: string[], projectId?: string): void {
    const assignments = this.getSprintTasks(scope, projectId);
    const filtered = assignments.filter(assignment => !taskIds.includes(assignment.taskId));
    
    const key = this.getTaskAssignmentKey(scope, projectId);
    localStorage.setItem(key, JSON.stringify(filtered));
  }

  updateTaskStoryPoints(scope: string, taskId: string, storyPoints: number, projectId?: string): void {
    const assignments = this.getSprintTasks(scope, projectId);
    const index = assignments.findIndex(assignment => assignment.taskId === taskId);
    
    if (index !== -1) {
      assignments[index].storyPoints = storyPoints;
      const key = this.getTaskAssignmentKey(scope, projectId);
      localStorage.setItem(key, JSON.stringify(assignments));
    }
  }

  getTaskStoryPoints(scope: string, taskId: string, projectId?: string): number {
    const assignments = this.getSprintTasks(scope, projectId);
    const assignment = assignments.find(a => a.taskId === taskId);
    return assignment?.storyPoints || 0;
  }

  // Burndown Chart Data
  getBurndown(scope: string, sprintId: string, metric: 'storyPoints' | 'estimatedHours' | 'count' = 'storyPoints', projectId?: string): BurndownData[] {
    const sprint = this.getSprints(scope, projectId).find(s => s.id === sprintId);
    if (!sprint) return [];

    const startDate = new Date(sprint.startDate);
    const endDate = new Date(sprint.endDate);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const assignments = this.getSprintTasks(scope, projectId).filter(a => a.sprintId === sprintId);
    
    // Calculate total points/hours/count
    let totalValue = 0;
    if (metric === 'storyPoints') {
      totalValue = assignments.reduce((sum, a) => sum + (a.storyPoints || 0), 0);
    } else if (metric === 'estimatedHours') {
      totalValue = assignments.reduce((sum, a) => sum + (a.estimatedHours || 0), 0);
    } else {
      totalValue = assignments.length;
    }

    // Generate ideal burndown line
    const data: BurndownData[] = [];
    for (let i = 0; i <= totalDays; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const ideal = totalValue - (totalValue * i / totalDays);
      
      data.push({
        date: currentDate.toISOString().split('T')[0],
        remaining: totalValue, // In real implementation, calculate actual remaining
        ideal: Math.round(ideal),
      });
    }

    return data;
  }

  // Get tasks for a specific sprint
  getTasksInSprint(scope: string, sprintId: string, allTasks: (PersonalTask | ProjectTask)[], projectId?: string): (PersonalTask | ProjectTask)[] {
    const assignments = this.getSprintTasks(scope, projectId);
    const taskIdsInSprint = assignments
      .filter(a => a.sprintId === sprintId)
      .map(a => a.taskId);
    
    return allTasks.filter(task => taskIdsInSprint.includes(task.id));
  }

  // Get backlog tasks (not assigned to any sprint)
  getBacklogTasks(scope: string, allTasks: (PersonalTask | ProjectTask)[], projectId?: string): (PersonalTask | ProjectTask)[] {
    const assignments = this.getSprintTasks(scope, projectId);
    const assignedTaskIds = assignments.map(a => a.taskId);
    
    return allTasks.filter(task => !assignedTaskIds.includes(task.id));
  }
}

export const sprintService = new SprintService();