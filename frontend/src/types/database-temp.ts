// فایل موقت برای نوع‌های دیتابیس تا زمان اعمال migration
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          mobile_phone: string;
          first_name: string | null;
          last_name: string | null;
          display_name: string | null;
          national_id: string | null;
          office_phone: string | null;
          home_phone: string | null;
          address: string | null;
          employee_id: string | null;
          department: string | null;
          position: string | null;
          organization_id: string | null;
          is_active: boolean;
          email_verified: boolean;
          mobile_verified: boolean;
          hire_date: string | null;
          birth_date: string | null;
          created_at: string;
          updated_at: string;
          avatar_url: string | null;
          bio: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          mobile_phone: string;
          first_name?: string | null;
          last_name?: string | null;
          display_name?: string | null;
          national_id?: string | null;
          office_phone?: string | null;
          home_phone?: string | null;
          address?: string | null;
          employee_id?: string | null;
          department?: string | null;
          position?: string | null;
          organization_id?: string | null;
          is_active?: boolean;
          email_verified?: boolean;
          mobile_verified?: boolean;
          hire_date?: string | null;
          birth_date?: string | null;
          created_at?: string;
          updated_at?: string;
          avatar_url?: string | null;
          bio?: string | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string;
          mobile_phone?: string;
          first_name?: string | null;
          last_name?: string | null;
          display_name?: string | null;
          national_id?: string | null;
          office_phone?: string | null;
          home_phone?: string | null;
          address?: string | null;
          employee_id?: string | null;
          department?: string | null;
          position?: string | null;
          organization_id?: string | null;
          is_active?: boolean;
          email_verified?: boolean;
          mobile_verified?: boolean;
          hire_date?: string | null;
          birth_date?: string | null;
          created_at?: string;
          updated_at?: string;
          avatar_url?: string | null;
          bio?: string | null;
          notes?: string | null;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          system_role: 'admin' | 'general_manager' | 'department_manager' | 'user' | 'secretary';
          role_name: string | null;
          description: string | null;
          assigned_by: string | null;
          assigned_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          system_role?: 'admin' | 'general_manager' | 'department_manager' | 'user' | 'secretary';
          role_name?: string | null;
          description?: string | null;
          assigned_by?: string | null;
          assigned_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          system_role?: 'admin' | 'general_manager' | 'department_manager' | 'user' | 'secretary';
          role_name?: string | null;
          description?: string | null;
          assigned_by?: string | null;
          assigned_at?: string;
          is_active?: boolean;
        };
      };
      system_permissions: {
        Row: {
          id: string;
          permission_key: string;
          permission_name: string;
          description: string | null;
          category: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          permission_key: string;
          permission_name: string;
          description?: string | null;
          category: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          permission_key?: string;
          permission_name?: string;
          description?: string | null;
          category?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
      role_permissions: {
        Row: {
          id: string;
          role: 'admin' | 'general_manager' | 'department_manager' | 'user' | 'secretary';
          permission_id: string;
          granted_by: string | null;
          granted_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          role: 'admin' | 'general_manager' | 'department_manager' | 'user' | 'secretary';
          permission_id: string;
          granted_by?: string | null;
          granted_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          role?: 'admin' | 'general_manager' | 'department_manager' | 'user' | 'secretary';
          permission_id?: string;
          granted_by?: string | null;
          granted_at?: string;
          is_active?: boolean;
        };
      };
      user_permissions: {
        Row: {
          id: string;
          user_id: string;
          permission_id: string;
          permission_type: 'grant' | 'revoke';
          granted_by: string | null;
          granted_at: string;
          expires_at: string | null;
          is_active: boolean;
          notes: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          permission_id: string;
          permission_type: 'grant' | 'revoke';
          granted_by?: string | null;
          granted_at?: string;
          expires_at?: string | null;
          is_active?: boolean;
          notes?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          permission_id?: string;
          permission_type?: 'grant' | 'revoke';
          granted_by?: string | null;
          granted_at?: string;
          expires_at?: string | null;
          is_active?: boolean;
          notes?: string | null;
        };
      };
      user_audit_log: {
        Row: {
          id: string;
          user_id: string | null;
          target_user_id: string | null;
          action: string;
          resource_type: string | null;
          resource_id: string | null;
          details: any | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          target_user_id?: string | null;
          action: string;
          resource_type?: string | null;
          resource_id?: string | null;
          details?: any | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          target_user_id?: string | null;
          action?: string;
          resource_type?: string | null;
          resource_id?: string | null;
          details?: any | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      user_has_permission: {
        Args: {
          p_user_id: string;
          p_permission_key: string;
        };
        Returns: boolean;
      };
      get_user_role: {
        Args: {
          p_user_id: string;
        };
        Returns: 'admin' | 'general_manager' | 'department_manager' | 'user' | 'secretary';
      };
      log_user_activity: {
        Args: {
          p_user_id: string;
          p_action: string;
          p_resource_type?: string;
          p_resource_id?: string;
          p_target_user_id?: string;
          p_details?: any;
        };
        Returns: void;
      };
    };
    Enums: {
      app_role: 'admin' | 'general_manager' | 'department_manager' | 'user' | 'secretary';
    };
    CompositeTypes: Record<string, never>;
  };
}
