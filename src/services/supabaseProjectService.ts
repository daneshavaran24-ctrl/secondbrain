import { supabase } from '@/integrations/supabase/client';
import { Project, ProjectTask, TaskStatus } from '@/types';
import { toast } from '@/hooks/use-toast';

class SupabaseProjectService {
  
  // Get current user ID (for now, using a default admin user)
  private getCurrentUserId(): string {
    // In a real implementation, this would come from auth context
    return 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // Admin user ID
  }

  private getCurrentOrganizationId(): string {
    // For now, return a default organization ID
    // This should come from the user's profile in real implementation
    return '550e8400-e29b-41d4-a716-446655440000';
  }

  // Projects CRUD
  async getProjects(): Promise<Project[]> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('organization_id', this.getCurrentOrganizationId())
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(this.mapSupabaseToProject);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "خطا در بارگیری پروژه‌ها",
        description: "لطفاً دوباره تلاش کنید",
        variant: "destructive"
      });
      return [];
    }
  }

  async createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'progress'>): Promise<Project | null> {
    try {
      const supabaseData = {
        user_id: this.getCurrentUserId(),
        name: projectData.name,
        description: projectData.description,
        status: projectData.status,
        start_date: projectData.startDate,
        end_date: projectData.endDate,
        organization_id: this.getCurrentOrganizationId()
      };

      const { data, error } = await supabase
        .from('projects')
        .insert([supabaseData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "پروژه جدید ایجاد شد",
        description: `پروژه "${projectData.name}" با موفقیت ایجاد شد`,
      });

      return this.mapSupabaseToProject(data);
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "خطا در ایجاد پروژه",
        description: "لطفاً دوباره تلاش کنید",
        variant: "destructive"
      });
      return null;
    }
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    try {
      const supabaseUpdates: any = {};
      
      if (updates.name) supabaseUpdates.name = updates.name;
      if (updates.description) supabaseUpdates.description = updates.description;
      if (updates.status) supabaseUpdates.status = updates.status;
      if (updates.startDate) supabaseUpdates.start_date = updates.startDate;
      if (updates.endDate) supabaseUpdates.end_date = updates.endDate;
      if (updates.budget) supabaseUpdates.budget = updates.budget;

      const { data, error } = await supabase
        .from('projects')
        .update(supabaseUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return this.mapSupabaseToProject(data);
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: "خطا در به‌روزرسانی پروژه",
        description: "لطفاً دوباره تلاش کنید",
        variant: "destructive"
      });
      return null;
    }
  }

  async deleteProject(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "پروژه حذف شد",
        description: "پروژه با موفقیت حذف شد",
      });

      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "خطا در حذف پروژه",
        description: "لطفاً دوباره تلاش کنید",
        variant: "destructive"
      });
      return false;
    }
  }

  // Initialize sample data
  async initializeSampleData(): Promise<boolean> {
    try {
      const sampleProjects = [
        {
          user_id: this.getCurrentUserId(),
          name: 'پروژه توسعه نرم‌افزار',
          description: 'ایجاد سیستم مدیریت پروژه',
          status: 'active' as const,
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          organization_id: this.getCurrentOrganizationId()
        },
        {
          user_id: this.getCurrentUserId(),
          name: 'پروژه پژوهشی',
          description: 'تحقیق در زمینه کاربرد هوش مصنوعی در پزشکی',
          status: 'completed' as const,
          start_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          organization_id: this.getCurrentOrganizationId()
        }
      ];

      const { data, error } = await supabase
        .from('projects')
        .insert(sampleProjects)
        .select();

      if (error) throw error;

      toast({
        title: "داده‌های نمونه ایجاد شد",
        description: `${data.length} پروژه نمونه با موفقیت ایجاد شد`,
      });

      return true;
    } catch (error) {
      console.error('Error initializing sample data:', error);
      toast({
        title: "خطا در ایجاد داده‌های نمونه",
        description: "لطفاً دوباره تلاش کنید",
        variant: "destructive"
      });
      return false;
    }
  }

  // Helper method to map Supabase data to Project interface
  private mapSupabaseToProject(data: any): Project {
    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      goal: data.description || '', // Using description as goal for now
      status: data.status,
      startDate: data.start_date,
      endDate: data.end_date,
      budget: data.budget,
      managerId: data.manager_id,
      progress: 0, // Calculate this based on tasks
      teamMembers: [], // Will be populated separately
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      tags: [],
      color: '#3B82F6' // Default color
    };
  }

  // Get project statistics
  async getProjectStats() {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('status')
        .eq('organization_id', this.getCurrentOrganizationId());

      if (error) throw error;

      const total = data.length;
      const active = data.filter(p => p.status === 'active').length;  
      const completed = data.filter(p => p.status === 'completed').length;
      const onHold = data.filter(p => p.status === 'on_hold').length;

      return { total, active, completed, onHold };
    } catch (error) {
      console.error('Error fetching project stats:', error);
      return { total: 0, active: 0, completed: 0, onHold: 0 };
    }
  }

  // Check if sample data exists
  async hasSampleData(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id')
        .eq('organization_id', this.getCurrentOrganizationId())
        .limit(1);

      if (error) throw error;
      return data.length > 0;
    } catch (error) {
      console.error('Error checking sample data:', error);
      return false;
    }
  }
}

export const supabaseProjectService = new SupabaseProjectService();