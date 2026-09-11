export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      ai_chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
          sentiment: string | null
          session_id: string | null
          summary: string | null
          tags: string[] | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
          sentiment?: string | null
          session_id?: string | null
          summary?: string | null
          tags?: string[] | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          sentiment?: string | null
          session_id?: string | null
          summary?: string | null
          tags?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chat_sessions: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          session_type: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          session_type: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          session_type?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      assistant_action_logs: {
        Row: {
          action_type: string
          created_at: string
          domain: string | null
          error_message: string | null
          id: string
          payload: Json
          session_id: string | null
          status: string
          summary: string
          target_id: string | null
          target_table: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          domain?: string | null
          error_message?: string | null
          id?: string
          payload?: Json
          session_id?: string | null
          status?: string
          summary: string
          target_id?: string | null
          target_table?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          domain?: string | null
          error_message?: string | null
          id?: string
          payload?: Json
          session_id?: string | null
          status?: string
          summary?: string
          target_id?: string | null
          target_table?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_action_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_audit: {
        Row: {
          action: string
          actor_id: string | null
          actor_type: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_type: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      business_companies: {
        Row: {
          address: string | null
          company_name: string
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          industry: string | null
          is_active: boolean | null
          logo_url: string | null
          phone: string | null
          settings: Json | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          company_name: string
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          phone?: string | null
          settings?: Json | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          company_name?: string
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          phone?: string | null
          settings?: Json | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          all_day: boolean | null
          attendance_type: string | null
          capacity: number | null
          color: string | null
          contact_info: string | null
          cost: number | null
          created_at: string | null
          currency: string | null
          description: string | null
          domain: string | null
          end_date: string
          event_type: string | null
          id: string
          notes: string | null
          organizer: string | null
          preparation_checklist: Json | null
          registration_url: string | null
          related_meeting_id: string | null
          related_task_id: string | null
          reminders: Json | null
          start_date: string
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
          venue_address: string | null
          website_url: string | null
        }
        Insert: {
          all_day?: boolean | null
          attendance_type?: string | null
          capacity?: number | null
          color?: string | null
          contact_info?: string | null
          cost?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          domain?: string | null
          end_date: string
          event_type?: string | null
          id?: string
          notes?: string | null
          organizer?: string | null
          preparation_checklist?: Json | null
          registration_url?: string | null
          related_meeting_id?: string | null
          related_task_id?: string | null
          reminders?: Json | null
          start_date: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
          venue_address?: string | null
          website_url?: string | null
        }
        Update: {
          all_day?: boolean | null
          attendance_type?: string | null
          capacity?: number | null
          color?: string | null
          contact_info?: string | null
          cost?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          domain?: string | null
          end_date?: string
          event_type?: string | null
          id?: string
          notes?: string | null
          organizer?: string | null
          preparation_checklist?: Json | null
          registration_url?: string | null
          related_meeting_id?: string | null
          related_task_id?: string | null
          reminders?: Json | null
          start_date?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
          venue_address?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_related_meeting_id_fkey"
            columns: ["related_meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      company_calls: {
        Row: {
          call_date: string
          call_type: string | null
          category: string | null
          company_id: string | null
          contact_id: string | null
          contact_name: string | null
          contact_organization: string | null
          contact_phone: string | null
          created_at: string | null
          direction: string | null
          duration: number | null
          follow_up_actions: Json | null
          follow_up_date: string | null
          has_recording: boolean | null
          id: string
          notes: string | null
          outcome: string | null
          priority: string | null
          recording_url: string | null
          scheduled_date: string | null
          status: string | null
          summary: string | null
          tags: string[] | null
          title: string
          transcript: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          call_date?: string
          call_type?: string | null
          category?: string | null
          company_id?: string | null
          contact_id?: string | null
          contact_name?: string | null
          contact_organization?: string | null
          contact_phone?: string | null
          created_at?: string | null
          direction?: string | null
          duration?: number | null
          follow_up_actions?: Json | null
          follow_up_date?: string | null
          has_recording?: boolean | null
          id?: string
          notes?: string | null
          outcome?: string | null
          priority?: string | null
          recording_url?: string | null
          scheduled_date?: string | null
          status?: string | null
          summary?: string | null
          tags?: string[] | null
          title: string
          transcript?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          call_date?: string
          call_type?: string | null
          category?: string | null
          company_id?: string | null
          contact_id?: string | null
          contact_name?: string | null
          contact_organization?: string | null
          contact_phone?: string | null
          created_at?: string | null
          direction?: string | null
          duration?: number | null
          follow_up_actions?: Json | null
          follow_up_date?: string | null
          has_recording?: boolean | null
          id?: string
          notes?: string | null
          outcome?: string | null
          priority?: string | null
          recording_url?: string | null
          scheduled_date?: string | null
          status?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string
          transcript?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_calls_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "business_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_calls_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "company_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      company_contacts: {
        Row: {
          address: string | null
          company_id: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          organization: string | null
          phone: string | null
          role: string | null
          tags: string[] | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          organization?: string | null
          phone?: string | null
          role?: string | null
          tags?: string[] | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization?: string | null
          phone?: string | null
          role?: string | null
          tags?: string[] | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "business_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_notes: {
        Row: {
          attachments: Json | null
          category: string | null
          company_id: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_important: boolean | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          category?: string | null
          company_id?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_important?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          category?: string | null
          company_id?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_important?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "business_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_profiles: {
        Row: {
          annual_revenue: number | null
          company_id: string | null
          competitors: Json | null
          created_at: string | null
          employee_count: number | null
          established_date: string | null
          id: string
          long_term_goals: string[] | null
          major_clients: string[] | null
          mission: string | null
          products_services: Json | null
          short_term_goals: string[] | null
          target_customers: string | null
          updated_at: string | null
          values: string[] | null
          vision: string | null
        }
        Insert: {
          annual_revenue?: number | null
          company_id?: string | null
          competitors?: Json | null
          created_at?: string | null
          employee_count?: number | null
          established_date?: string | null
          id?: string
          long_term_goals?: string[] | null
          major_clients?: string[] | null
          mission?: string | null
          products_services?: Json | null
          short_term_goals?: string[] | null
          target_customers?: string | null
          updated_at?: string | null
          values?: string[] | null
          vision?: string | null
        }
        Update: {
          annual_revenue?: number | null
          company_id?: string | null
          competitors?: Json | null
          created_at?: string | null
          employee_count?: number | null
          established_date?: string | null
          id?: string
          long_term_goals?: string[] | null
          major_clients?: string[] | null
          mission?: string | null
          products_services?: Json | null
          short_term_goals?: string[] | null
          target_customers?: string | null
          updated_at?: string | null
          values?: string[] | null
          vision?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "business_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_tasks: {
        Row: {
          assigned_to: string | null
          attachments: Json | null
          category: string | null
          company_id: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          attachments?: Json | null
          category?: string | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          attachments?: Json | null
          category?: string | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "business_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      correspondence: {
        Row: {
          content: string | null
          correspondence_type: string | null
          created_at: string | null
          date: string | null
          id: string
          organization_id: string | null
          reference_number: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          correspondence_type?: string | null
          created_at?: string | null
          date?: string | null
          id?: string
          organization_id?: string | null
          reference_number?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          correspondence_type?: string | null
          created_at?: string | null
          date?: string | null
          id?: string
          organization_id?: string | null
          reference_number?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "correspondence_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      csr_impact_assessments: {
        Row: {
          assessment_date: string
          assessment_method: string | null
          assessor_name: string | null
          beneficiaries_count: number | null
          created_at: string | null
          feedback: string | null
          id: string
          impact_metrics: Json | null
          project_id: string
          satisfaction_score: number | null
          sdg_goals: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assessment_date: string
          assessment_method?: string | null
          assessor_name?: string | null
          beneficiaries_count?: number | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          impact_metrics?: Json | null
          project_id: string
          satisfaction_score?: number | null
          sdg_goals?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assessment_date?: string
          assessment_method?: string | null
          assessor_name?: string | null
          beneficiaries_count?: number | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          impact_metrics?: Json | null
          project_id?: string
          satisfaction_score?: number | null
          sdg_goals?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "csr_impact_assessments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "csr_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      csr_project_documents: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "csr_project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "csr_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      csr_project_milestones: {
        Row: {
          completed_date: string | null
          created_at: string | null
          description: string | null
          id: string
          progress_percentage: number | null
          project_id: string
          status: string | null
          target_date: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          completed_date?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          progress_percentage?: number | null
          project_id: string
          status?: string | null
          target_date?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          completed_date?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          progress_percentage?: number | null
          project_id?: string
          status?: string | null
          target_date?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "csr_project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "csr_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      csr_project_team: {
        Row: {
          created_at: string | null
          id: string
          joined_at: string | null
          member_email: string | null
          member_name: string
          project_id: string
          responsibilities: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          joined_at?: string | null
          member_email?: string | null
          member_name: string
          project_id: string
          responsibilities?: string | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          joined_at?: string | null
          member_email?: string | null
          member_name?: string
          project_id?: string
          responsibilities?: string | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "csr_project_team_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "csr_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      csr_projects: {
        Row: {
          beneficiaries: string[] | null
          budget: number | null
          created_at: string | null
          currency: string | null
          description: string | null
          end_date: string | null
          id: string
          impact_metrics: Json | null
          organization_id: string | null
          partners: string[] | null
          priority: string
          start_date: string | null
          status: string
          tags: string[] | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          beneficiaries?: string[] | null
          budget?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          impact_metrics?: Json | null
          organization_id?: string | null
          partners?: string[] | null
          priority?: string
          start_date?: string | null
          status?: string
          tags?: string[] | null
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          beneficiaries?: string[] | null
          budget?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          impact_metrics?: Json | null
          organization_id?: string | null
          partners?: string[] | null
          priority?: string
          start_date?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "csr_projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cultural_content: {
        Row: {
          content: string
          content_type: string
          created_at: string | null
          id: string
          language: string | null
          reference: string | null
          tags: string[] | null
          title: string
        }
        Insert: {
          content: string
          content_type: string
          created_at?: string | null
          id?: string
          language?: string | null
          reference?: string | null
          tags?: string[] | null
          title: string
        }
        Update: {
          content?: string
          content_type?: string
          created_at?: string | null
          id?: string
          language?: string | null
          reference?: string | null
          tags?: string[] | null
          title?: string
        }
        Relationships: []
      }
      delegation_attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          task_id: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          task_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delegation_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "delegation_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      delegation_notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          task_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          task_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          task_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delegation_notifications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "delegation_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      delegation_subtasks: {
        Row: {
          completed: boolean | null
          created_at: string | null
          delegation_task_id: string
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          delegation_task_id: string
          id?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          delegation_task_id?: string
          id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delegation_subtasks_delegation_task_id_fkey"
            columns: ["delegation_task_id"]
            isOneToOne: false
            referencedRelation: "delegation_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      delegation_task_events: {
        Row: {
          created_at: string | null
          description: string | null
          event_type: string
          id: string
          metadata: Json | null
          task_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          task_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          task_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delegation_task_events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "delegation_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      delegation_tasks: {
        Row: {
          completed_at: string | null
          created_at: string | null
          delegatee_id: string | null
          delegator_id: string
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          delegatee_id?: string | null
          delegator_id: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          delegatee_id?: string | null
          delegator_id?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      entries: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      gratitude_entries: {
        Row: {
          content: string
          created_at: string | null
          date: string
          id: string
          links: string[] | null
          media_urls: string[] | null
          mood: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          date?: string
          id?: string
          links?: string[] | null
          media_urls?: string[] | null
          mood?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          date?: string
          id?: string
          links?: string[] | null
          media_urls?: string[] | null
          mood?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      habit_completions: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          completion_date: string
          habit_id: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          completion_date: string
          habit_id: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          completion_date?: string
          habit_id?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_completions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_settings: {
        Row: {
          created_at: string | null
          id: string
          notification_enabled: boolean | null
          notification_time: string | null
          start_of_week: number | null
          theme: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notification_enabled?: boolean | null
          notification_time?: string | null
          start_of_week?: number | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notification_enabled?: boolean | null
          notification_time?: string | null
          start_of_week?: number | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      habit_streaks: {
        Row: {
          current_streak: number | null
          habit_id: string
          id: string
          last_completion_date: string | null
          longest_streak: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          current_streak?: number | null
          habit_id: string
          id?: string
          last_completion_date?: string | null
          longest_streak?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          current_streak?: number | null
          habit_id?: string
          id?: string
          last_completion_date?: string | null
          longest_streak?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_streaks_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          archived_at: string | null
          category: string | null
          color: string | null
          created_at: string | null
          description: string | null
          emoji: string
          id: string
          is_active: boolean | null
          sort_order: number | null
          target_days: number | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          category?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          emoji?: string
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          target_days?: number | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          archived_at?: string | null
          category?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          emoji?: string
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          target_days?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      health_metrics: {
        Row: {
          blood_pressure: string | null
          created_at: string | null
          data_source: string | null
          date: string
          exercise_minutes: number | null
          heart_rate: number | null
          id: string
          notes: string | null
          raw_data: Json | null
          sleep_hours: number | null
          source_id: string | null
          updated_at: string | null
          user_id: string
          water_intake: number | null
          weight: number | null
        }
        Insert: {
          blood_pressure?: string | null
          created_at?: string | null
          data_source?: string | null
          date: string
          exercise_minutes?: number | null
          heart_rate?: number | null
          id?: string
          notes?: string | null
          raw_data?: Json | null
          sleep_hours?: number | null
          source_id?: string | null
          updated_at?: string | null
          user_id: string
          water_intake?: number | null
          weight?: number | null
        }
        Update: {
          blood_pressure?: string | null
          created_at?: string | null
          data_source?: string | null
          date?: string
          exercise_minutes?: number | null
          heart_rate?: number | null
          id?: string
          notes?: string | null
          raw_data?: Json | null
          sleep_hours?: number | null
          source_id?: string | null
          updated_at?: string | null
          user_id?: string
          water_intake?: number | null
          weight?: number | null
        }
        Relationships: []
      }
      hi_dock_connections: {
        Row: {
          auto_import: boolean | null
          auto_process: boolean | null
          connection_type: string | null
          created_at: string | null
          device_name: string | null
          device_serial: string
          device_version: string | null
          error_message: string | null
          id: string
          import_audio: boolean | null
          import_interval: number | null
          import_summary: boolean | null
          import_transcript: boolean | null
          last_import_at: string | null
          paired: boolean | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_import?: boolean | null
          auto_process?: boolean | null
          connection_type?: string | null
          created_at?: string | null
          device_name?: string | null
          device_serial: string
          device_version?: string | null
          error_message?: string | null
          id?: string
          import_audio?: boolean | null
          import_interval?: number | null
          import_summary?: boolean | null
          import_transcript?: boolean | null
          last_import_at?: string | null
          paired?: boolean | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_import?: boolean | null
          auto_process?: boolean | null
          connection_type?: string | null
          created_at?: string | null
          device_name?: string | null
          device_serial?: string
          device_version?: string | null
          error_message?: string | null
          id?: string
          import_audio?: boolean | null
          import_interval?: number | null
          import_summary?: boolean | null
          import_transcript?: boolean | null
          last_import_at?: string | null
          paired?: boolean | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      hi_dock_import_logs: {
        Row: {
          completed_at: string | null
          connection_id: string | null
          created_at: string | null
          error_message: string | null
          files_failed: number | null
          files_imported: number | null
          id: string
          import_type: string
          started_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          connection_id?: string | null
          created_at?: string | null
          error_message?: string | null
          files_failed?: number | null
          files_imported?: number | null
          id?: string
          import_type: string
          started_at?: string | null
          status: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          connection_id?: string | null
          created_at?: string | null
          error_message?: string | null
          files_failed?: number | null
          files_imported?: number | null
          id?: string
          import_type?: string
          started_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hi_dock_import_logs_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "hi_dock_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      hi_dock_recordings: {
        Row: {
          audio_format: string | null
          audio_size: number | null
          audio_url: string | null
          category: string | null
          connection_id: string | null
          created_at: string | null
          description: string | null
          dock_recording_id: string
          duration: number | null
          error_message: string | null
          extracted_keywords: Json | null
          id: string
          linked_calendar_event_id: string | null
          linked_meeting_id: string | null
          linked_task_id: string | null
          notes_text: string | null
          participants: Json | null
          processing_status: string | null
          recorded_at: string
          storage_bucket: string | null
          storage_path: string | null
          summary: string | null
          tags: string[] | null
          title: string
          transcript: string | null
          transcript_language: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          audio_format?: string | null
          audio_size?: number | null
          audio_url?: string | null
          category?: string | null
          connection_id?: string | null
          created_at?: string | null
          description?: string | null
          dock_recording_id: string
          duration?: number | null
          error_message?: string | null
          extracted_keywords?: Json | null
          id?: string
          linked_calendar_event_id?: string | null
          linked_meeting_id?: string | null
          linked_task_id?: string | null
          notes_text?: string | null
          participants?: Json | null
          processing_status?: string | null
          recorded_at: string
          storage_bucket?: string | null
          storage_path?: string | null
          summary?: string | null
          tags?: string[] | null
          title: string
          transcript?: string | null
          transcript_language?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          audio_format?: string | null
          audio_size?: number | null
          audio_url?: string | null
          category?: string | null
          connection_id?: string | null
          created_at?: string | null
          description?: string | null
          dock_recording_id?: string
          duration?: number | null
          error_message?: string | null
          extracted_keywords?: Json | null
          id?: string
          linked_calendar_event_id?: string | null
          linked_meeting_id?: string | null
          linked_task_id?: string | null
          notes_text?: string | null
          participants?: Json | null
          processing_status?: string | null
          recorded_at?: string
          storage_bucket?: string | null
          storage_path?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string
          transcript?: string | null
          transcript_language?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hi_dock_recordings_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "hi_dock_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_analysis_queue: {
        Row: {
          analysis_result: Json | null
          created_at: string | null
          error_message: string | null
          id: string
          idea_id: string | null
          status: Database["public"]["Enums"]["analysis_status"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          analysis_result?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          idea_id?: string | null
          status?: Database["public"]["Enums"]["analysis_status"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          analysis_result?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          idea_id?: string | null
          status?: Database["public"]["Enums"]["analysis_status"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_analysis_queue_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_business_model_canvas: {
        Row: {
          channels: Json | null
          cost_structure: Json | null
          created_at: string | null
          customer_relationships: Json | null
          customer_segments: Json | null
          id: string
          idea_id: string | null
          key_activities: Json | null
          key_partnerships: Json | null
          key_resources: Json | null
          revenue_streams: Json | null
          updated_at: string | null
          value_propositions: Json | null
        }
        Insert: {
          channels?: Json | null
          cost_structure?: Json | null
          created_at?: string | null
          customer_relationships?: Json | null
          customer_segments?: Json | null
          id?: string
          idea_id?: string | null
          key_activities?: Json | null
          key_partnerships?: Json | null
          key_resources?: Json | null
          revenue_streams?: Json | null
          updated_at?: string | null
          value_propositions?: Json | null
        }
        Update: {
          channels?: Json | null
          cost_structure?: Json | null
          created_at?: string | null
          customer_relationships?: Json | null
          customer_segments?: Json | null
          id?: string
          idea_id?: string | null
          key_activities?: Json | null
          key_partnerships?: Json | null
          key_resources?: Json | null
          revenue_streams?: Json | null
          updated_at?: string | null
          value_propositions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "idea_business_model_canvas_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: true
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_financial_analysis: {
        Row: {
          assumptions: string | null
          break_even_analysis: string | null
          break_even_month: number | null
          cash_flow_analysis: string | null
          created_at: string | null
          financial_notes: string | null
          id: string
          idea_id: string | null
          initial_capital_currency: string | null
          initial_capital_max: number | null
          initial_capital_min: number | null
          monthly_operational_costs: Json | null
          profit_margin_percentage: number | null
          revenue_forecast: Json | null
          roi_percentage: number | null
          roi_timeline: string | null
          updated_at: string | null
        }
        Insert: {
          assumptions?: string | null
          break_even_analysis?: string | null
          break_even_month?: number | null
          cash_flow_analysis?: string | null
          created_at?: string | null
          financial_notes?: string | null
          id?: string
          idea_id?: string | null
          initial_capital_currency?: string | null
          initial_capital_max?: number | null
          initial_capital_min?: number | null
          monthly_operational_costs?: Json | null
          profit_margin_percentage?: number | null
          revenue_forecast?: Json | null
          roi_percentage?: number | null
          roi_timeline?: string | null
          updated_at?: string | null
        }
        Update: {
          assumptions?: string | null
          break_even_analysis?: string | null
          break_even_month?: number | null
          cash_flow_analysis?: string | null
          created_at?: string | null
          financial_notes?: string | null
          id?: string
          idea_id?: string | null
          initial_capital_currency?: string | null
          initial_capital_max?: number | null
          initial_capital_min?: number | null
          monthly_operational_costs?: Json | null
          profit_margin_percentage?: number | null
          revenue_forecast?: Json | null
          roi_percentage?: number | null
          roi_timeline?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "idea_financial_analysis_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: true
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_inspirations: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          idea_id: string
          source_type: string
          source_url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          idea_id: string
          source_type: string
          source_url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          idea_id?: string
          source_type?: string
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "idea_inspirations_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_milestones: {
        Row: {
          completed: boolean | null
          created_at: string | null
          description: string | null
          id: string
          idea_id: string
          target_date: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          idea_id: string
          target_date?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          idea_id?: string
          target_date?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "idea_milestones_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_revenue_opportunities: {
        Row: {
          confidence_level: string | null
          created_at: string | null
          id: string
          idea_id: string | null
          market_size: string | null
          pricing_strategy: string | null
          revenue_estimate: string | null
          revenue_model: string
          target_segment: string | null
          timeline: string | null
          updated_at: string | null
        }
        Insert: {
          confidence_level?: string | null
          created_at?: string | null
          id?: string
          idea_id?: string | null
          market_size?: string | null
          pricing_strategy?: string | null
          revenue_estimate?: string | null
          revenue_model: string
          target_segment?: string | null
          timeline?: string | null
          updated_at?: string | null
        }
        Update: {
          confidence_level?: string | null
          created_at?: string | null
          id?: string
          idea_id?: string | null
          market_size?: string | null
          pricing_strategy?: string | null
          revenue_estimate?: string | null
          revenue_model?: string
          target_segment?: string | null
          timeline?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "idea_revenue_opportunities_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_risks: {
        Row: {
          created_at: string | null
          description: string
          id: string
          idea_id: string
          mitigation_strategy: string | null
          risk_type: string | null
          severity: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          idea_id: string
          mitigation_strategy?: string | null
          risk_type?: string | null
          severity?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          idea_id?: string
          mitigation_strategy?: string | null
          risk_type?: string | null
          severity?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "idea_risks_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_strategy: {
        Row: {
          competitive_advantage: string[] | null
          competitive_strategy: string | null
          created_at: string | null
          differentiation_points: string[] | null
          expansion_markets: string[] | null
          growth_strategy: string | null
          id: string
          idea_id: string | null
          innovation_approach: string | null
          key_processes: string[] | null
          marketing_strategy: Json | null
          operational_strategy: string | null
          positioning_statement: string | null
          product_roadmap: Json | null
          scaling_plan: Json | null
          target_audience: string | null
          technology_stack: string[] | null
          updated_at: string | null
        }
        Insert: {
          competitive_advantage?: string[] | null
          competitive_strategy?: string | null
          created_at?: string | null
          differentiation_points?: string[] | null
          expansion_markets?: string[] | null
          growth_strategy?: string | null
          id?: string
          idea_id?: string | null
          innovation_approach?: string | null
          key_processes?: string[] | null
          marketing_strategy?: Json | null
          operational_strategy?: string | null
          positioning_statement?: string | null
          product_roadmap?: Json | null
          scaling_plan?: Json | null
          target_audience?: string | null
          technology_stack?: string[] | null
          updated_at?: string | null
        }
        Update: {
          competitive_advantage?: string[] | null
          competitive_strategy?: string | null
          created_at?: string | null
          differentiation_points?: string[] | null
          expansion_markets?: string[] | null
          growth_strategy?: string | null
          id?: string
          idea_id?: string | null
          innovation_approach?: string | null
          key_processes?: string[] | null
          marketing_strategy?: Json | null
          operational_strategy?: string | null
          positioning_statement?: string | null
          product_roadmap?: Json | null
          scaling_plan?: Json | null
          target_audience?: string | null
          technology_stack?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "idea_strategy_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: true
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_suggested_actions: {
        Row: {
          action: string
          created_at: string | null
          dependencies: string | null
          estimated_effort: string | null
          id: string
          idea_id: string | null
          order_index: number | null
          priority: string | null
          status: string | null
          timeline: string | null
          updated_at: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          dependencies?: string | null
          estimated_effort?: string | null
          id?: string
          idea_id?: string | null
          order_index?: number | null
          priority?: string | null
          status?: string | null
          timeline?: string | null
          updated_at?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          dependencies?: string | null
          estimated_effort?: string | null
          id?: string
          idea_id?: string | null
          order_index?: number | null
          priority?: string | null
          status?: string | null
          timeline?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "idea_suggested_actions_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_swot_analysis: {
        Row: {
          created_at: string | null
          id: string
          idea_id: string
          opportunities: Json | null
          overall_assessment: string | null
          priority_actions: Json | null
          so_strategies: Json | null
          st_strategies: Json | null
          strengths: Json | null
          threats: Json | null
          updated_at: string | null
          weaknesses: Json | null
          wo_strategies: Json | null
          wt_strategies: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          idea_id: string
          opportunities?: Json | null
          overall_assessment?: string | null
          priority_actions?: Json | null
          so_strategies?: Json | null
          st_strategies?: Json | null
          strengths?: Json | null
          threats?: Json | null
          updated_at?: string | null
          weaknesses?: Json | null
          wo_strategies?: Json | null
          wt_strategies?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          idea_id?: string
          opportunities?: Json | null
          overall_assessment?: string | null
          priority_actions?: Json | null
          so_strategies?: Json | null
          st_strategies?: Json | null
          strengths?: Json | null
          threats?: Json | null
          updated_at?: string | null
          weaknesses?: Json | null
          wo_strategies?: Json | null
          wt_strategies?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "idea_swot_analysis_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      ideas: {
        Row: {
          ai_analysis: Json | null
          category: string | null
          created_at: string | null
          description: string | null
          domain: string | null
          feasibility_score: number | null
          id: string
          impact_score: number | null
          organization_id: string | null
          potential_impact: string | null
          priority: Database["public"]["Enums"]["task_priority"] | null
          stage: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_analysis?: Json | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          domain?: string | null
          feasibility_score?: number | null
          id?: string
          impact_score?: number | null
          organization_id?: string | null
          potential_impact?: string | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          stage?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_analysis?: Json | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          domain?: string | null
          feasibility_score?: number | null
          id?: string
          impact_score?: number | null
          organization_id?: string | null
          potential_impact?: string | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          stage?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ideas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base: {
        Row: {
          author_id: string
          category: string
          content: string | null
          created_at: string
          folder_id: string | null
          id: string
          search_vector: unknown
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          category: string
          content?: string | null
          created_at?: string
          folder_id?: string | null
          id?: string
          search_vector?: unknown
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          category?: string
          content?: string | null
          created_at?: string
          folder_id?: string | null
          id?: string
          search_vector?: unknown
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "knowledge_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_folders: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          items_count: number | null
          name: string
          order: number
          parent_id: string | null
          sub_folders_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          items_count?: number | null
          name: string
          order?: number
          parent_id?: string | null
          sub_folders_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          items_count?: number | null
          name?: string
          order?: number
          parent_id?: string | null
          sub_folders_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "knowledge_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_items: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          id: string
          para_category: string | null
          source_url: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          para_category?: string | null
          source_url?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          para_category?: string | null
          source_url?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      legal_cases: {
        Row: {
          case_number: string
          case_type: string | null
          court: string | null
          created_at: string | null
          description: string | null
          domain: string | null
          filing_date: string | null
          id: string
          judge: string | null
          next_hearing_date: string | null
          opposing_party: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          case_number: string
          case_type?: string | null
          court?: string | null
          created_at?: string | null
          description?: string | null
          domain?: string | null
          filing_date?: string | null
          id?: string
          judge?: string | null
          next_hearing_date?: string | null
          opposing_party?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          case_number?: string
          case_type?: string | null
          court?: string | null
          created_at?: string | null
          description?: string | null
          domain?: string | null
          filing_date?: string | null
          id?: string
          judge?: string | null
          next_hearing_date?: string | null
          opposing_party?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      marketing_campaigns: {
        Row: {
          budget: number | null
          campaign_name: string
          campaign_type: string
          created_at: string | null
          currency: string | null
          end_date: string | null
          goals: Json | null
          id: string
          metrics: Json | null
          organization_id: string
          spent: number | null
          start_date: string | null
          status: string | null
          target_audience: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          budget?: number | null
          campaign_name: string
          campaign_type: string
          created_at?: string | null
          currency?: string | null
          end_date?: string | null
          goals?: Json | null
          id?: string
          metrics?: Json | null
          organization_id: string
          spent?: number | null
          start_date?: string | null
          status?: string | null
          target_audience?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          budget?: number | null
          campaign_name?: string
          campaign_type?: string
          created_at?: string | null
          currency?: string | null
          end_date?: string | null
          goals?: Json | null
          id?: string
          metrics?: Json | null
          organization_id?: string
          spent?: number | null
          start_date?: string | null
          status?: string | null
          target_audience?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_participants: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          meeting_id: string
          name: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          meeting_id: string
          name?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          meeting_id?: string
          name?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_participants_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          agenda: string | null
          company_id: string | null
          created_at: string | null
          description: string | null
          domain: string | null
          duration: number | null
          id: string
          location: string | null
          meeting_date: string
          notes: string | null
          organization_id: string | null
          status: Database["public"]["Enums"]["meeting_status"] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agenda?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          domain?: string | null
          duration?: number | null
          id?: string
          location?: string | null
          meeting_date: string
          notes?: string | null
          organization_id?: string | null
          status?: Database["public"]["Enums"]["meeting_status"] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agenda?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          domain?: string | null
          duration?: number | null
          id?: string
          location?: string | null
          meeting_date?: string
          notes?: string | null
          organization_id?: string | null
          status?: Database["public"]["Enums"]["meeting_status"] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "business_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      networking_contacts: {
        Row: {
          category: string | null
          company_id: string | null
          created_at: string | null
          email: string | null
          how_met: string | null
          id: string
          last_interaction_date: string | null
          linkedin_url: string | null
          met_at_event: string | null
          met_date: string | null
          name: string
          networking_goal: string | null
          next_followup_date: string | null
          notes: string | null
          organization_id: string | null
          organization_name: string | null
          phone: string | null
          photo_url: string | null
          relationship_strength: number | null
          status: string | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          how_met?: string | null
          id?: string
          last_interaction_date?: string | null
          linkedin_url?: string | null
          met_at_event?: string | null
          met_date?: string | null
          name: string
          networking_goal?: string | null
          next_followup_date?: string | null
          notes?: string | null
          organization_id?: string | null
          organization_name?: string | null
          phone?: string | null
          photo_url?: string | null
          relationship_strength?: number | null
          status?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          how_met?: string | null
          id?: string
          last_interaction_date?: string | null
          linkedin_url?: string | null
          met_at_event?: string | null
          met_date?: string | null
          name?: string
          networking_goal?: string | null
          next_followup_date?: string | null
          notes?: string | null
          organization_id?: string | null
          organization_name?: string | null
          phone?: string | null
          photo_url?: string | null
          relationship_strength?: number | null
          status?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "networking_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "business_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "networking_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      networking_events: {
        Row: {
          company_id: string | null
          contacts_made: number | null
          created_at: string | null
          event_date: string | null
          event_type: string | null
          follow_ups_scheduled: number | null
          id: string
          location: string | null
          notes: string | null
          organization_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          contacts_made?: number | null
          created_at?: string | null
          event_date?: string | null
          event_type?: string | null
          follow_ups_scheduled?: number | null
          id?: string
          location?: string | null
          notes?: string | null
          organization_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          contacts_made?: number | null
          created_at?: string | null
          event_date?: string | null
          event_type?: string | null
          follow_ups_scheduled?: number | null
          id?: string
          location?: string | null
          notes?: string | null
          organization_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "networking_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "business_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "networking_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      networking_goals: {
        Row: {
          category: string | null
          company_id: string | null
          created_at: string | null
          current_count: number | null
          deadline: string | null
          description: string | null
          id: string
          organization_id: string | null
          status: string | null
          target_count: number | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          current_count?: number | null
          deadline?: string | null
          description?: string | null
          id?: string
          organization_id?: string | null
          status?: string | null
          target_count?: number | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          current_count?: number | null
          deadline?: string | null
          description?: string | null
          id?: string
          organization_id?: string | null
          status?: string | null
          target_count?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "networking_goals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "business_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "networking_goals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      networking_interactions: {
        Row: {
          contact_id: string | null
          created_at: string | null
          description: string | null
          duration: number | null
          follow_up_action: string | null
          follow_up_date: string | null
          id: string
          interaction_date: string
          interaction_type: string
          outcome: string | null
          title: string
          user_id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          follow_up_action?: string | null
          follow_up_date?: string | null
          id?: string
          interaction_date?: string
          interaction_type: string
          outcome?: string | null
          title: string
          user_id: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          follow_up_action?: string | null
          follow_up_date?: string | null
          id?: string
          interaction_date?: string
          interaction_type?: string
          outcome?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "networking_interactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "networking_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_budgets: {
        Row: {
          allocated_amount: number
          category: string
          created_at: string | null
          currency: string | null
          finance_id: string
          id: string
          remaining_amount: number | null
          spent_amount: number | null
          updated_at: string | null
          user_id: string
          year: number
        }
        Insert: {
          allocated_amount: number
          category: string
          created_at?: string | null
          currency?: string | null
          finance_id: string
          id?: string
          remaining_amount?: number | null
          spent_amount?: number | null
          updated_at?: string | null
          user_id: string
          year: number
        }
        Update: {
          allocated_amount?: number
          category?: string
          created_at?: string | null
          currency?: string | null
          finance_id?: string
          id?: string
          remaining_amount?: number | null
          spent_amount?: number | null
          updated_at?: string | null
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "organization_budgets_finance_id_fkey"
            columns: ["finance_id"]
            isOneToOne: false
            referencedRelation: "organization_finance"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_chart_nodes: {
        Row: {
          avatar: string | null
          created_at: string | null
          department: string
          email: string
          employment_type: string | null
          hr_id: string
          id: string
          level: number
          location: string | null
          manager_id: string | null
          name: string
          phone: string | null
          position: string
          skills: Json | null
          start_date: string
          updated_at: string | null
        }
        Insert: {
          avatar?: string | null
          created_at?: string | null
          department: string
          email: string
          employment_type?: string | null
          hr_id: string
          id?: string
          level: number
          location?: string | null
          manager_id?: string | null
          name: string
          phone?: string | null
          position: string
          skills?: Json | null
          start_date: string
          updated_at?: string | null
        }
        Update: {
          avatar?: string | null
          created_at?: string | null
          department?: string
          email?: string
          employment_type?: string | null
          hr_id?: string
          id?: string
          level?: number
          location?: string | null
          manager_id?: string | null
          name?: string
          phone?: string | null
          position?: string
          skills?: Json | null
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_chart_nodes_hr_id_fkey"
            columns: ["hr_id"]
            isOneToOne: false
            referencedRelation: "organization_hr"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_chart_nodes_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "organization_chart_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_checklist_items: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          has_attachment: boolean | null
          has_notes: boolean | null
          id: string
          notes: string | null
          operations_id: string
          order_index: number
          parent_item_id: string | null
          required: boolean | null
          text: string
          updated_at: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          has_attachment?: boolean | null
          has_notes?: boolean | null
          id?: string
          notes?: string | null
          operations_id: string
          order_index: number
          parent_item_id?: string | null
          required?: boolean | null
          text: string
          updated_at?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          has_attachment?: boolean | null
          has_notes?: boolean | null
          id?: string
          notes?: string | null
          operations_id?: string
          order_index?: number
          parent_item_id?: string | null
          required?: boolean | null
          text?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_checklist_items_operations_id_fkey"
            columns: ["operations_id"]
            isOneToOne: false
            referencedRelation: "organization_operations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_checklist_items_parent_item_id_fkey"
            columns: ["parent_item_id"]
            isOneToOne: false
            referencedRelation: "organization_checklist_items"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_decision_options: {
        Row: {
          cons: Json | null
          cost: string | null
          created_at: string | null
          id: string
          pros: Json | null
          score: number | null
          strategy_id: string
          time_estimate: string | null
          title: string
        }
        Insert: {
          cons?: Json | null
          cost?: string | null
          created_at?: string | null
          id?: string
          pros?: Json | null
          score?: number | null
          strategy_id: string
          time_estimate?: string | null
          title: string
        }
        Update: {
          cons?: Json | null
          cost?: string | null
          created_at?: string | null
          id?: string
          pros?: Json | null
          score?: number | null
          strategy_id?: string
          time_estimate?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_decision_options_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "organization_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_departments: {
        Row: {
          budget: number | null
          code: string | null
          created_at: string | null
          description: string | null
          head_id: string | null
          id: string
          name: string
          organization_id: string
          parent_department_id: string | null
          updated_at: string | null
        }
        Insert: {
          budget?: number | null
          code?: string | null
          created_at?: string | null
          description?: string | null
          head_id?: string | null
          id?: string
          name: string
          organization_id: string
          parent_department_id?: string | null
          updated_at?: string | null
        }
        Update: {
          budget?: number | null
          code?: string | null
          created_at?: string | null
          description?: string | null
          head_id?: string | null
          id?: string
          name?: string
          organization_id?: string
          parent_department_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_department_head"
            columns: ["head_id"]
            isOneToOne: false
            referencedRelation: "organization_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_departments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_departments_parent_department_id_fkey"
            columns: ["parent_department_id"]
            isOneToOne: false
            referencedRelation: "organization_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_employees: {
        Row: {
          allowances: number | null
          avatar_url: string | null
          bank_account: string | null
          base_salary: number | null
          bonus: number | null
          created_at: string | null
          currency: string | null
          department_id: string | null
          email: string | null
          employee_code: string | null
          employment_type: string | null
          full_name: string
          hire_date: string | null
          id: string
          manager_id: string | null
          organization_id: string
          phone: string | null
          position: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          allowances?: number | null
          avatar_url?: string | null
          bank_account?: string | null
          base_salary?: number | null
          bonus?: number | null
          created_at?: string | null
          currency?: string | null
          department_id?: string | null
          email?: string | null
          employee_code?: string | null
          employment_type?: string | null
          full_name: string
          hire_date?: string | null
          id?: string
          manager_id?: string | null
          organization_id: string
          phone?: string | null
          position?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          allowances?: number | null
          avatar_url?: string | null
          bank_account?: string | null
          base_salary?: number | null
          bonus?: number | null
          created_at?: string | null
          currency?: string | null
          department_id?: string | null
          email?: string | null
          employee_code?: string | null
          employment_type?: string | null
          full_name?: string
          hire_date?: string | null
          id?: string
          manager_id?: string | null
          organization_id?: string
          phone?: string | null
          position?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "organization_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "organization_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_employees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_finance: {
        Row: {
          amount: number | null
          content: Json | null
          created_at: string | null
          currency: string | null
          description: string | null
          finance_type: string
          fiscal_year: number | null
          id: string
          organization_id: string
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          content?: Json | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          finance_type: string
          fiscal_year?: number | null
          id?: string
          organization_id: string
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          content?: Json | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          finance_type?: string
          fiscal_year?: number | null
          id?: string
          organization_id?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_finance_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_financial_reports: {
        Row: {
          created_at: string | null
          data: Json
          end_date: string
          finance_id: string
          id: string
          period: string
          report_type: string
          start_date: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data: Json
          end_date: string
          finance_id: string
          id?: string
          period: string
          report_type: string
          start_date: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          end_date?: string
          finance_id?: string
          id?: string
          period?: string
          report_type?: string
          start_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_financial_reports_finance_id_fkey"
            columns: ["finance_id"]
            isOneToOne: false
            referencedRelation: "organization_finance"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_financial_transactions: {
        Row: {
          amount: number
          attachments: Json | null
          category: string
          created_at: string | null
          date: string
          description: string | null
          finance_id: string
          id: string
          invoice_number: string | null
          status: string | null
          transaction_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          attachments?: Json | null
          category: string
          created_at?: string | null
          date: string
          description?: string | null
          finance_id: string
          id?: string
          invoice_number?: string | null
          status?: string | null
          transaction_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          attachments?: Json | null
          category?: string
          created_at?: string | null
          date?: string
          description?: string | null
          finance_id?: string
          id?: string
          invoice_number?: string | null
          status?: string | null
          transaction_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_financial_transactions_finance_id_fkey"
            columns: ["finance_id"]
            isOneToOne: false
            referencedRelation: "organization_finance"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_form_fields: {
        Row: {
          conditional_logic: Json | null
          created_at: string | null
          default_value: string | null
          field_type: string
          help_text: string | null
          id: string
          label: string
          operations_id: string
          options: Json | null
          order_index: number
          placeholder: string | null
          required: boolean | null
          updated_at: string | null
          validation_rules: Json | null
        }
        Insert: {
          conditional_logic?: Json | null
          created_at?: string | null
          default_value?: string | null
          field_type: string
          help_text?: string | null
          id?: string
          label: string
          operations_id: string
          options?: Json | null
          order_index: number
          placeholder?: string | null
          required?: boolean | null
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Update: {
          conditional_logic?: Json | null
          created_at?: string | null
          default_value?: string | null
          field_type?: string
          help_text?: string | null
          id?: string
          label?: string
          operations_id?: string
          options?: Json | null
          order_index?: number
          placeholder?: string | null
          required?: boolean | null
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_form_fields_operations_id_fkey"
            columns: ["operations_id"]
            isOneToOne: false
            referencedRelation: "organization_operations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_form_submissions: {
        Row: {
          comments: string | null
          data: Json
          id: string
          operations_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          submitted_at: string | null
          user_id: string
        }
        Insert: {
          comments?: string | null
          data: Json
          id?: string
          operations_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submitted_at?: string | null
          user_id: string
        }
        Update: {
          comments?: string | null
          data?: Json
          id?: string
          operations_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submitted_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_form_submissions_operations_id_fkey"
            columns: ["operations_id"]
            isOneToOne: false
            referencedRelation: "organization_operations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_form_workflow: {
        Row: {
          action: string
          assignee: string
          created_at: string | null
          id: string
          operations_id: string
          order_index: number
          step_name: string
        }
        Insert: {
          action: string
          assignee: string
          created_at?: string | null
          id?: string
          operations_id: string
          order_index: number
          step_name: string
        }
        Update: {
          action?: string
          assignee?: string
          created_at?: string | null
          id?: string
          operations_id?: string
          order_index?: number
          step_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_form_workflow_operations_id_fkey"
            columns: ["operations_id"]
            isOneToOne: false
            referencedRelation: "organization_operations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_hr: {
        Row: {
          content: Json | null
          created_at: string | null
          description: string | null
          hr_type: string
          id: string
          organization_id: string
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          description?: string | null
          hr_type: string
          id?: string
          organization_id: string
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          description?: string | null
          hr_type?: string
          id?: string
          organization_id?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_hr_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          role: Database["public"]["Enums"]["organization_role"] | null
          status: string | null
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string | null
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          organization_id: string
          role?: Database["public"]["Enums"]["organization_role"] | null
          status?: string | null
          token?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["organization_role"] | null
          status?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_legal: {
        Row: {
          content: Json | null
          contract_party: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          legal_type: string
          organization_id: string
          start_date: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: Json | null
          contract_party?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          legal_type: string
          organization_id: string
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: Json | null
          contract_party?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          legal_type?: string
          organization_id?: string
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_legal_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_missions: {
        Row: {
          created_at: string | null
          current_value: number | null
          description: string | null
          end_date: string | null
          id: string
          organization_id: string | null
          policy_id: string | null
          progress: number | null
          start_date: string | null
          status: string | null
          target_value: number | null
          title: string
          unit: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          organization_id?: string | null
          policy_id?: string | null
          progress?: number | null
          start_date?: string | null
          status?: string | null
          target_value?: number | null
          title: string
          unit?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          organization_id?: string | null
          policy_id?: string | null
          progress?: number | null
          start_date?: string | null
          status?: string | null
          target_value?: number | null
          title?: string
          unit?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_missions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_missions_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "organization_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          message: string
          organization_id: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message: string
          organization_id: string
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string
          organization_id?: string
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_okr_key_results: {
        Row: {
          created_at: string | null
          current_value: number | null
          id: string
          strategy_id: string
          target: number
          title: string
          unit: string
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          current_value?: number | null
          id?: string
          strategy_id: string
          target: number
          title: string
          unit: string
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          current_value?: number | null
          id?: string
          strategy_id?: string
          target?: number
          title?: string
          unit?: string
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_okr_key_results_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "organization_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_operations: {
        Row: {
          content: Json | null
          created_at: string | null
          description: string | null
          id: string
          operation_type: string
          organization_id: string
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
          version: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          operation_type: string
          organization_id: string
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
          version?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          operation_type?: string
          organization_id?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_operations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_performance_evaluations: {
        Row: {
          areas_for_improvement: string[] | null
          created_at: string | null
          employee_comments: string | null
          employee_id: string
          evaluation_date: string
          evaluation_period: string
          evaluator_id: string | null
          evaluator_name: string
          feedback: string | null
          goals_achieved: number | null
          goals_for_next_period: string[] | null
          id: string
          organization_id: string
          performance_score: number | null
          status: string | null
          strengths: string[] | null
          updated_at: string | null
        }
        Insert: {
          areas_for_improvement?: string[] | null
          created_at?: string | null
          employee_comments?: string | null
          employee_id: string
          evaluation_date: string
          evaluation_period: string
          evaluator_id?: string | null
          evaluator_name: string
          feedback?: string | null
          goals_achieved?: number | null
          goals_for_next_period?: string[] | null
          id?: string
          organization_id: string
          performance_score?: number | null
          status?: string | null
          strengths?: string[] | null
          updated_at?: string | null
        }
        Update: {
          areas_for_improvement?: string[] | null
          created_at?: string | null
          employee_comments?: string | null
          employee_id?: string
          evaluation_date?: string
          evaluation_period?: string
          evaluator_id?: string | null
          evaluator_name?: string
          feedback?: string | null
          goals_achieved?: number | null
          goals_for_next_period?: string[] | null
          id?: string
          organization_id?: string
          performance_score?: number | null
          status?: string | null
          strengths?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_performance_evaluations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "organization_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_performance_evaluations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_policies: {
        Row: {
          created_at: string | null
          description: string | null
          effective_date: string | null
          id: string
          organization_id: string | null
          policy_type: string | null
          review_date: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          effective_date?: string | null
          id?: string
          organization_id?: string | null
          policy_type?: string | null
          review_date?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          effective_date?: string | null
          id?: string
          organization_id?: string | null
          policy_type?: string | null
          review_date?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_policies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_procurement: {
        Row: {
          content: Json | null
          created_at: string | null
          description: string | null
          id: string
          organization_id: string
          procurement_type: string
          rating: number | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
          vendor_name: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          organization_id: string
          procurement_type: string
          rating?: number | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
          vendor_name?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          organization_id?: string
          procurement_type?: string
          rating?: number | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_procurement_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_risks: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          impact: number | null
          likelihood: number | null
          mitigation_strategy: string | null
          organization_id: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          impact?: number | null
          likelihood?: number | null
          mitigation_strategy?: string | null
          organization_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          impact?: number | null
          likelihood?: number | null
          mitigation_strategy?: string | null
          organization_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_risks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_roadmap_milestones: {
        Row: {
          created_at: string | null
          deliverables: Json | null
          description: string | null
          id: string
          owner: string | null
          status: string | null
          strategy_id: string
          target_date: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deliverables?: Json | null
          description?: string | null
          id?: string
          owner?: string | null
          status?: string | null
          strategy_id: string
          target_date: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deliverables?: Json | null
          description?: string | null
          id?: string
          owner?: string | null
          status?: string | null
          strategy_id?: string
          target_date?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_roadmap_milestones_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "organization_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_sales: {
        Row: {
          content: Json | null
          created_at: string | null
          description: string | null
          id: string
          organization_id: string
          sales_type: string
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          organization_id: string
          sales_type: string
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          organization_id?: string
          sales_type?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_sales_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_sop_approvers: {
        Row: {
          approved: boolean | null
          approved_at: string | null
          comments: string | null
          created_at: string | null
          id: string
          name: string
          operations_id: string
          role: string
        }
        Insert: {
          approved?: boolean | null
          approved_at?: string | null
          comments?: string | null
          created_at?: string | null
          id?: string
          name: string
          operations_id: string
          role: string
        }
        Update: {
          approved?: boolean | null
          approved_at?: string | null
          comments?: string | null
          created_at?: string | null
          id?: string
          name?: string
          operations_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_sop_approvers_operations_id_fkey"
            columns: ["operations_id"]
            isOneToOne: false
            referencedRelation: "organization_operations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_sop_steps: {
        Row: {
          created_at: string | null
          description: string
          duration: string | null
          id: string
          images: Json | null
          operations_id: string
          parent_step_id: string | null
          responsible: string | null
          step_number: string
          title: string
          updated_at: string | null
          warning: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          duration?: string | null
          id?: string
          images?: Json | null
          operations_id: string
          parent_step_id?: string | null
          responsible?: string | null
          step_number: string
          title: string
          updated_at?: string | null
          warning?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          duration?: string | null
          id?: string
          images?: Json | null
          operations_id?: string
          parent_step_id?: string | null
          responsible?: string | null
          step_number?: string
          title?: string
          updated_at?: string | null
          warning?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_sop_steps_operations_id_fkey"
            columns: ["operations_id"]
            isOneToOne: false
            referencedRelation: "organization_operations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_sop_steps_parent_step_id_fkey"
            columns: ["parent_step_id"]
            isOneToOne: false
            referencedRelation: "organization_sop_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_strategies: {
        Row: {
          content: Json | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          organization_id: string
          priority: string | null
          start_date: string | null
          status: string | null
          strategy_type: string
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          organization_id: string
          priority?: string | null
          start_date?: string | null
          status?: string | null
          strategy_type: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          organization_id?: string
          priority?: string | null
          start_date?: string | null
          status?: string | null
          strategy_type?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_strategies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_succession_plans: {
        Row: {
          created_at: string | null
          criticality: string | null
          current_holder: string | null
          current_holder_id: string | null
          department: string | null
          id: string
          notes: string | null
          organization_id: string
          position_title: string
          required_qualifications: string | null
          required_skills: string[] | null
          status: string | null
          updated_at: string | null
          vacancy_risk: number | null
        }
        Insert: {
          created_at?: string | null
          criticality?: string | null
          current_holder?: string | null
          current_holder_id?: string | null
          department?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          position_title: string
          required_qualifications?: string | null
          required_skills?: string[] | null
          status?: string | null
          updated_at?: string | null
          vacancy_risk?: number | null
        }
        Update: {
          created_at?: string | null
          criticality?: string | null
          current_holder?: string | null
          current_holder_id?: string | null
          department?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          position_title?: string
          required_qualifications?: string | null
          required_skills?: string[] | null
          status?: string | null
          updated_at?: string | null
          vacancy_risk?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_succession_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_succession_successors: {
        Row: {
          career_aspirations: string | null
          created_at: string | null
          current_position: string | null
          development_gaps: string[] | null
          development_plan: Json | null
          employee_id: string | null
          employee_name: string
          id: string
          notes: string | null
          performance_rating: number | null
          plan_id: string
          potential_rating: number | null
          rank: number | null
          readiness: string | null
          readiness_score: number | null
          strengths: string[] | null
          updated_at: string | null
        }
        Insert: {
          career_aspirations?: string | null
          created_at?: string | null
          current_position?: string | null
          development_gaps?: string[] | null
          development_plan?: Json | null
          employee_id?: string | null
          employee_name: string
          id?: string
          notes?: string | null
          performance_rating?: number | null
          plan_id: string
          potential_rating?: number | null
          rank?: number | null
          readiness?: string | null
          readiness_score?: number | null
          strengths?: string[] | null
          updated_at?: string | null
        }
        Update: {
          career_aspirations?: string | null
          created_at?: string | null
          current_position?: string | null
          development_gaps?: string[] | null
          development_plan?: Json | null
          employee_id?: string | null
          employee_name?: string
          id?: string
          notes?: string | null
          performance_rating?: number | null
          plan_id?: string
          potential_rating?: number | null
          rank?: number | null
          readiness?: string | null
          readiness_score?: number | null
          strengths?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_succession_successors_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "organization_succession_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_support: {
        Row: {
          category: string | null
          content: Json | null
          created_at: string | null
          description: string | null
          id: string
          organization_id: string
          status: string | null
          support_type: string
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          content?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          organization_id: string
          status?: string | null
          support_type: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          content?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          organization_id?: string
          status?: string | null
          support_type?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_support_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_tech: {
        Row: {
          content: Json | null
          created_at: string | null
          description: string | null
          id: string
          organization_id: string
          status: string | null
          tags: string[] | null
          tech_type: string
          title: string
          updated_at: string | null
          user_id: string
          version: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          organization_id: string
          status?: string | null
          tags?: string[] | null
          tech_type: string
          title: string
          updated_at?: string | null
          user_id: string
          version?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          organization_id?: string
          status?: string | null
          tags?: string[] | null
          tech_type?: string
          title?: string
          updated_at?: string | null
          user_id?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_tech_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizational_claims: {
        Row: {
          amount: number | null
          claim_number: string | null
          claim_type: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          filed_date: string | null
          id: string
          organization_id: string | null
          resolution_date: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          claim_number?: string | null
          claim_type?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          filed_date?: string | null
          id?: string
          organization_id?: string | null
          resolution_date?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          claim_number?: string | null
          claim_type?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          filed_date?: string | null
          id?: string
          organization_id?: string | null
          resolution_date?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizational_claims_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizational_policy_attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          policy_id: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          policy_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          policy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizational_policy_attachments_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "organization_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          phone: string | null
          settings: Json | null
          tags: string[] | null
          type: Database["public"]["Enums"]["organization_type"] | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          phone?: string | null
          settings?: Json | null
          tags?: string[] | null
          type?: Database["public"]["Enums"]["organization_type"] | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          phone?: string | null
          settings?: Json | null
          tags?: string[] | null
          type?: Database["public"]["Enums"]["organization_type"] | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      oura_connections: {
        Row: {
          access_token: string
          auto_sync: boolean | null
          created_at: string | null
          email: string | null
          error_message: string | null
          expires_at: string | null
          id: string
          last_sync_at: string | null
          oura_user_id: string | null
          refresh_token: string | null
          status: string | null
          sync_activity: boolean | null
          sync_heart_rate: boolean | null
          sync_interval: number | null
          sync_readiness: boolean | null
          sync_sleep: boolean | null
          token_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          auto_sync?: boolean | null
          created_at?: string | null
          email?: string | null
          error_message?: string | null
          expires_at?: string | null
          id?: string
          last_sync_at?: string | null
          oura_user_id?: string | null
          refresh_token?: string | null
          status?: string | null
          sync_activity?: boolean | null
          sync_heart_rate?: boolean | null
          sync_interval?: number | null
          sync_readiness?: boolean | null
          sync_sleep?: boolean | null
          token_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          auto_sync?: boolean | null
          created_at?: string | null
          email?: string | null
          error_message?: string | null
          expires_at?: string | null
          id?: string
          last_sync_at?: string | null
          oura_user_id?: string | null
          refresh_token?: string | null
          status?: string | null
          sync_activity?: boolean | null
          sync_heart_rate?: boolean | null
          sync_interval?: number | null
          sync_readiness?: boolean | null
          sync_sleep?: boolean | null
          token_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      oura_sync_logs: {
        Row: {
          completed_at: string | null
          connection_id: string | null
          created_at: string | null
          error_message: string | null
          id: string
          records_synced: number | null
          started_at: string | null
          status: string
          sync_type: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          connection_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          records_synced?: number | null
          started_at?: string | null
          status: string
          sync_type: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          connection_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          records_synced?: number | null
          started_at?: string | null
          status?: string
          sync_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oura_sync_logs_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "oura_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_contacts: {
        Row: {
          address: string | null
          category: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          notes: string | null
          organization: string | null
          phone: string | null
          role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          category?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          organization?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          category?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          organization?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      personal_planning: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          domain: string | null
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["task_priority"] | null
          status: Database["public"]["Enums"]["task_status"] | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          domain?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"] | null
          status?: Database["public"]["Enums"]["task_status"] | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          domain?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"] | null
          status?: Database["public"]["Enums"]["task_status"] | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      plaud_connections: {
        Row: {
          access_token: string
          auto_sync: boolean | null
          created_at: string | null
          email: string | null
          error_message: string | null
          expires_at: string | null
          id: string
          last_sync_at: string | null
          plaud_user_id: string | null
          refresh_token: string | null
          status: string | null
          sync_audio: boolean | null
          sync_interval: number | null
          sync_minutes: boolean | null
          sync_summary: boolean | null
          sync_transcript: boolean | null
          token_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          auto_sync?: boolean | null
          created_at?: string | null
          email?: string | null
          error_message?: string | null
          expires_at?: string | null
          id?: string
          last_sync_at?: string | null
          plaud_user_id?: string | null
          refresh_token?: string | null
          status?: string | null
          sync_audio?: boolean | null
          sync_interval?: number | null
          sync_minutes?: boolean | null
          sync_summary?: boolean | null
          sync_transcript?: boolean | null
          token_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          auto_sync?: boolean | null
          created_at?: string | null
          email?: string | null
          error_message?: string | null
          expires_at?: string | null
          id?: string
          last_sync_at?: string | null
          plaud_user_id?: string | null
          refresh_token?: string | null
          status?: string | null
          sync_audio?: boolean | null
          sync_interval?: number | null
          sync_minutes?: boolean | null
          sync_summary?: boolean | null
          sync_transcript?: boolean | null
          token_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      plaud_recordings: {
        Row: {
          audio_format: string | null
          audio_size: number | null
          audio_url: string | null
          category: string | null
          connection_id: string | null
          created_at: string | null
          description: string | null
          duration: number | null
          error_message: string | null
          id: string
          linked_calendar_event_id: string | null
          linked_meeting_id: string | null
          minutes_json: Json | null
          minutes_text: string | null
          participants: Json | null
          plaud_recording_id: string
          processing_status: string | null
          recorded_at: string
          storage_bucket: string | null
          storage_path: string | null
          summary: string | null
          tags: string[] | null
          title: string
          transcript: string | null
          transcript_language: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          audio_format?: string | null
          audio_size?: number | null
          audio_url?: string | null
          category?: string | null
          connection_id?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          error_message?: string | null
          id?: string
          linked_calendar_event_id?: string | null
          linked_meeting_id?: string | null
          minutes_json?: Json | null
          minutes_text?: string | null
          participants?: Json | null
          plaud_recording_id: string
          processing_status?: string | null
          recorded_at: string
          storage_bucket?: string | null
          storage_path?: string | null
          summary?: string | null
          tags?: string[] | null
          title: string
          transcript?: string | null
          transcript_language?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          audio_format?: string | null
          audio_size?: number | null
          audio_url?: string | null
          category?: string | null
          connection_id?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          error_message?: string | null
          id?: string
          linked_calendar_event_id?: string | null
          linked_meeting_id?: string | null
          minutes_json?: Json | null
          minutes_text?: string | null
          participants?: Json | null
          plaud_recording_id?: string
          processing_status?: string | null
          recorded_at?: string
          storage_bucket?: string | null
          storage_path?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string
          transcript?: string | null
          transcript_language?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plaud_recordings_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "plaud_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      plaud_sync_logs: {
        Row: {
          completed_at: string | null
          connection_id: string | null
          created_at: string | null
          error_message: string | null
          id: string
          recordings_failed: number | null
          recordings_synced: number | null
          started_at: string | null
          status: string
          sync_type: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          connection_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          recordings_failed?: number | null
          recordings_synced?: number | null
          started_at?: string | null
          status: string
          sync_type: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          connection_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          recordings_failed?: number | null
          recordings_synced?: number | null
          started_at?: string | null
          status?: string
          sync_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plaud_sync_logs_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "plaud_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      project_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["task_priority"] | null
          project_id: string
          status: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"] | null
          project_id: string
          status?: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"] | null
          project_id?: string
          status?: Database["public"]["Enums"]["task_status"] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          company_id: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          organization_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          organization_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "business_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_affiliations: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          media_urls: Json | null
          organization_name: string
          position: string
          responsibilities: string[] | null
          start_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          media_urls?: Json | null
          organization_name: string
          position: string
          responsibilities?: string[] | null
          start_date: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          media_urls?: Json | null
          organization_name?: string
          position?: string
          responsibilities?: string[] | null
          start_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      resume_awards: {
        Row: {
          award_date: string
          category: string | null
          certificate_image_url: string | null
          created_at: string | null
          description: string | null
          id: string
          issuing_organization: string
          media_links: Json | null
          title: string
          updated_at: string | null
          user_id: string
          video_url: string | null
        }
        Insert: {
          award_date: string
          category?: string | null
          certificate_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          issuing_organization: string
          media_links?: Json | null
          title: string
          updated_at?: string | null
          user_id: string
          video_url?: string | null
        }
        Update: {
          award_date?: string
          category?: string | null
          certificate_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          issuing_organization?: string
          media_links?: Json | null
          title?: string
          updated_at?: string | null
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      resume_certificates: {
        Row: {
          certificate_url: string | null
          created_at: string | null
          description: string | null
          expiry_date: string | null
          id: string
          issue_date: string
          issuing_organization: string
          skills: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          certificate_url?: string | null
          created_at?: string | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          issue_date: string
          issuing_organization: string
          skills?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          certificate_url?: string | null
          created_at?: string | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string
          issuing_organization?: string
          skills?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      resume_education: {
        Row: {
          certificate_url: string | null
          created_at: string | null
          degree: string
          description: string | null
          end_year: number | null
          field_of_study: string | null
          id: string
          start_year: number | null
          university: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          certificate_url?: string | null
          created_at?: string | null
          degree: string
          description?: string | null
          end_year?: number | null
          field_of_study?: string | null
          id?: string
          start_year?: number | null
          university: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          certificate_url?: string | null
          created_at?: string | null
          degree?: string
          description?: string | null
          end_year?: number | null
          field_of_study?: string | null
          id?: string
          start_year?: number | null
          university?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      resume_exports: {
        Row: {
          download_count: number | null
          export_format: string
          exported_at: string | null
          file_size: number | null
          file_url: string | null
          id: string
          last_downloaded_at: string | null
          template_id: string | null
          user_id: string
        }
        Insert: {
          download_count?: number | null
          export_format: string
          exported_at?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          last_downloaded_at?: string | null
          template_id?: string | null
          user_id: string
        }
        Update: {
          download_count?: number | null
          export_format?: string
          exported_at?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          last_downloaded_at?: string | null
          template_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_exports_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "resume_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_interests: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          interest_name: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          interest_name: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          interest_name?: string
          user_id?: string
        }
        Relationships: []
      }
      resume_media_interviews: {
        Row: {
          content_type: Database["public"]["Enums"]["media_content_type"] | null
          content_url: string | null
          created_at: string | null
          description: string | null
          id: string
          interview_date: string
          media_source: string
          title: string
          topics: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content_type?:
            | Database["public"]["Enums"]["media_content_type"]
            | null
          content_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          interview_date: string
          media_source: string
          title: string
          topics?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content_type?:
            | Database["public"]["Enums"]["media_content_type"]
            | null
          content_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          interview_date?: string
          media_source?: string
          title?: string
          topics?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      resume_personal_info: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          created_at: string | null
          full_name: string
          id: string
          social_links: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string | null
          full_name: string
          id?: string
          social_links?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          social_links?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      resume_publications: {
        Row: {
          co_authors: string[] | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          external_link: string | null
          id: string
          isbn: string | null
          pdf_url: string | null
          publication_date: string
          publication_type: string | null
          publisher: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          co_authors?: string[] | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          external_link?: string | null
          id?: string
          isbn?: string | null
          pdf_url?: string | null
          publication_date: string
          publication_type?: string | null
          publisher?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          co_authors?: string[] | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          external_link?: string | null
          id?: string
          isbn?: string | null
          pdf_url?: string | null
          publication_date?: string
          publication_type?: string | null
          publisher?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      resume_skills: {
        Row: {
          category: string | null
          certificate_url: string | null
          created_at: string | null
          id: string
          proficiency_level:
            | Database["public"]["Enums"]["proficiency_level"]
            | null
          skill_name: string
          updated_at: string | null
          user_id: string
          years_of_experience: number | null
        }
        Insert: {
          category?: string | null
          certificate_url?: string | null
          created_at?: string | null
          id?: string
          proficiency_level?:
            | Database["public"]["Enums"]["proficiency_level"]
            | null
          skill_name: string
          updated_at?: string | null
          user_id: string
          years_of_experience?: number | null
        }
        Update: {
          category?: string | null
          certificate_url?: string | null
          created_at?: string | null
          id?: string
          proficiency_level?:
            | Database["public"]["Enums"]["proficiency_level"]
            | null
          skill_name?: string
          updated_at?: string | null
          user_id?: string
          years_of_experience?: number | null
        }
        Relationships: []
      }
      resume_template_customizations: {
        Row: {
          created_at: string | null
          custom_description: string | null
          custom_highlights: string[] | null
          display_order: number | null
          id: string
          is_visible: boolean | null
          item_id: string
          section_type: string
          template_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custom_description?: string | null
          custom_highlights?: string[] | null
          display_order?: number | null
          id?: string
          is_visible?: boolean | null
          item_id: string
          section_type: string
          template_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custom_description?: string | null
          custom_highlights?: string[] | null
          display_order?: number | null
          id?: string
          is_visible?: boolean | null
          item_id?: string
          section_type?: string
          template_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resume_template_customizations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "resume_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_templates: {
        Row: {
          ai_optimized: boolean | null
          ai_suggestions: Json | null
          color_scheme: string | null
          company_name: string | null
          created_at: string | null
          highlighted_awards: string[] | null
          highlighted_certificates: string[] | null
          highlighted_education: string[] | null
          highlighted_experiences: string[] | null
          highlighted_skills: string[] | null
          id: string
          is_default: boolean | null
          job_description: string | null
          job_title: string | null
          layout_style: string | null
          sections_config: Json | null
          template_name: string
          template_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_optimized?: boolean | null
          ai_suggestions?: Json | null
          color_scheme?: string | null
          company_name?: string | null
          created_at?: string | null
          highlighted_awards?: string[] | null
          highlighted_certificates?: string[] | null
          highlighted_education?: string[] | null
          highlighted_experiences?: string[] | null
          highlighted_skills?: string[] | null
          id?: string
          is_default?: boolean | null
          job_description?: string | null
          job_title?: string | null
          layout_style?: string | null
          sections_config?: Json | null
          template_name: string
          template_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_optimized?: boolean | null
          ai_suggestions?: Json | null
          color_scheme?: string | null
          company_name?: string | null
          created_at?: string | null
          highlighted_awards?: string[] | null
          highlighted_certificates?: string[] | null
          highlighted_education?: string[] | null
          highlighted_experiences?: string[] | null
          highlighted_skills?: string[] | null
          id?: string
          is_default?: boolean | null
          job_description?: string | null
          job_title?: string | null
          layout_style?: string | null
          sections_config?: Json | null
          template_name?: string
          template_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      resume_work_experience: {
        Row: {
          achievements: string[] | null
          company_name: string
          company_website: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          job_title: string
          responsibilities: string[] | null
          start_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          achievements?: string[] | null
          company_name: string
          company_website?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          job_title: string
          responsibilities?: string[] | null
          start_date: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          achievements?: string[] | null
          company_name?: string
          company_website?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          job_title?: string
          responsibilities?: string[] | null
          start_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sales_funnel_stages: {
        Row: {
          conversion_rate: number | null
          created_at: string | null
          id: string
          organization_id: string
          stage_name: string
          stage_order: number
        }
        Insert: {
          conversion_rate?: number | null
          created_at?: string | null
          id?: string
          organization_id: string
          stage_name: string
          stage_order: number
        }
        Update: {
          conversion_rate?: number | null
          created_at?: string | null
          id?: string
          organization_id?: string
          stage_name?: string
          stage_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_funnel_stages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_icp_profiles: {
        Row: {
          annual_revenue_range: string | null
          buying_triggers: Json | null
          company_size: string | null
          created_at: string | null
          decision_makers: Json | null
          id: string
          industry: string | null
          notes: string | null
          organization_id: string
          pain_points: Json | null
          preferred_channels: Json | null
          profile_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          annual_revenue_range?: string | null
          buying_triggers?: Json | null
          company_size?: string | null
          created_at?: string | null
          decision_makers?: Json | null
          id?: string
          industry?: string | null
          notes?: string | null
          organization_id: string
          pain_points?: Json | null
          preferred_channels?: Json | null
          profile_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          annual_revenue_range?: string | null
          buying_triggers?: Json | null
          company_size?: string | null
          created_at?: string | null
          decision_makers?: Json | null
          id?: string
          industry?: string | null
          notes?: string | null
          organization_id?: string
          pain_points?: Json | null
          preferred_channels?: Json | null
          profile_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_icp_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_leads: {
        Row: {
          company: string | null
          created_at: string | null
          currency: string | null
          email: string | null
          expected_close_date: string | null
          id: string
          lead_name: string
          notes: string | null
          organization_id: string
          phone: string | null
          probability: number | null
          source: string | null
          stage_id: string | null
          updated_at: string | null
          user_id: string
          value: number | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          currency?: string | null
          email?: string | null
          expected_close_date?: string | null
          id?: string
          lead_name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          probability?: number | null
          source?: string | null
          stage_id?: string | null
          updated_at?: string | null
          user_id: string
          value?: number | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          currency?: string | null
          email?: string | null
          expected_close_date?: string | null
          id?: string
          lead_name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          probability?: number | null
          source?: string | null
          stage_id?: string | null
          updated_at?: string | null
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_leads_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "sales_funnel_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_user_permissions: {
        Row: {
          created_at: string | null
          domain: string
          id: string
          permissions: string[]
          sub_user_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          domain: string
          id?: string
          permissions?: string[]
          sub_user_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string
          id?: string
          permissions?: string[]
          sub_user_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sub_user_permissions_sub_user_id_fkey"
            columns: ["sub_user_id"]
            isOneToOne: false
            referencedRelation: "sub_users"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_users: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          name: string
          owner_id: string
          password_hash: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          owner_id: string
          password_hash: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          owner_id?: string
          password_hash?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sub_users_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      succession_positions: {
        Row: {
          created_at: string | null
          criticality: string | null
          current_holder: string | null
          department: string | null
          id: string
          level: string | null
          organization_id: string | null
          requirements: string[] | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          criticality?: string | null
          current_holder?: string | null
          department?: string | null
          id?: string
          level?: string | null
          organization_id?: string | null
          requirements?: string[] | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          criticality?: string | null
          current_holder?: string | null
          department?: string | null
          id?: string
          level?: string | null
          organization_id?: string | null
          requirements?: string[] | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "succession_positions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_conversations: {
        Row: {
          conversation_state: Json | null
          created_at: string | null
          current_step: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          step_index: number | null
          target_module: string
          telegram_user_id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          conversation_state?: Json | null
          created_at?: string | null
          current_step?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          step_index?: number | null
          target_module: string
          telegram_user_id: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          conversation_state?: Json | null
          created_at?: string | null
          current_step?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          step_index?: number | null
          target_module?: string
          telegram_user_id?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      telegram_processed_entries: {
        Row: {
          created_at: string | null
          id: string
          processing_result: Json | null
          raw_message_id: string | null
          target_module: string
          target_record_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          processing_result?: Json | null
          raw_message_id?: string | null
          target_module: string
          target_record_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          processing_result?: Json | null
          raw_message_id?: string | null
          target_module?: string
          target_record_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "telegram_processed_entries_raw_message_id_fkey"
            columns: ["raw_message_id"]
            isOneToOne: false
            referencedRelation: "telegram_raw_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_raw_messages: {
        Row: {
          chat_id: number
          created_at: string | null
          error_message: string | null
          id: string
          media_url: string | null
          message_type: string
          processing_status: string | null
          raw_content: string | null
          telegram_message_id: number
          telegram_user_id: number
          user_id: string
        }
        Insert: {
          chat_id: number
          created_at?: string | null
          error_message?: string | null
          id?: string
          media_url?: string | null
          message_type: string
          processing_status?: string | null
          raw_content?: string | null
          telegram_message_id: number
          telegram_user_id: number
          user_id: string
        }
        Update: {
          chat_id?: number
          created_at?: string | null
          error_message?: string | null
          id?: string
          media_url?: string | null
          message_type?: string
          processing_status?: string | null
          raw_content?: string | null
          telegram_message_id?: number
          telegram_user_id?: number
          user_id?: string
        }
        Relationships: []
      }
      telegram_users: {
        Row: {
          created_at: string | null
          first_name: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          telegram_id: number
          updated_at: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          telegram_id: number
          updated_at?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          created_at?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          telegram_id?: number
          updated_at?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      user_organization_roles_cache: {
        Row: {
          organization_id: string
          role: Database["public"]["Enums"]["organization_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          organization_id: string
          role: Database["public"]["Enums"]["organization_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          organization_id?: string
          role?: Database["public"]["Enums"]["organization_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_organizations: {
        Row: {
          created_at: string | null
          id: string
          invited_by: string | null
          joined_at: string | null
          organization_id: string
          permissions: Json | null
          position_title: string | null
          role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          organization_id: string
          permissions?: Json | null
          position_title?: string | null
          role?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          organization_id?: string
          permissions?: Json | null
          position_title?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          department: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          position: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          position?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          position?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          system_role: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          system_role?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          system_role?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_sub_user_domain_access: {
        Args: { _domain: string; _permission?: string; _user_id: string }
        Returns: boolean
      }
      close_expired_telegram_conversations: { Args: never; Returns: undefined }
      create_default_habits: { Args: { p_user_id: string }; Returns: undefined }
      expire_old_invitations: { Args: never; Returns: undefined }
      get_or_create_telegram_user: {
        Args: {
          p_first_name?: string
          p_last_name?: string
          p_telegram_id: number
          p_user_id: string
          p_username?: string
        }
        Returns: string
      }
      get_owner_id: { Args: { user_id_param: string }; Returns: string }
      get_user_type: { Args: { user_id_param: string }; Returns: string }
      has_domain_access: {
        Args: {
          domain_param: string
          permission_param?: string
          user_id_param: string
        }
        Returns: boolean
      }
      has_organization_role: {
        Args: {
          _organization_id: string
          _required_role: Database["public"]["Enums"]["organization_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_habit_streak: {
        Args: { p_date: string; p_habit_id: string; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      analysis_status: "pending" | "processing" | "completed" | "failed"
      app_role: "admin" | "moderator" | "user"
      media_content_type: "text" | "video" | "podcast"
      meeting_status: "scheduled" | "in_progress" | "completed" | "cancelled"
      organization_role: "owner" | "admin" | "manager" | "member" | "viewer"
      organization_type:
        | "varid"
        | "farangaran"
        | "khadim_e_khalgh"
        | "chamber_commerce"
        | "association"
        | "other"
      proficiency_level: "beginner" | "intermediate" | "advanced" | "expert"
      project_status:
        | "planning"
        | "active"
        | "on_hold"
        | "completed"
        | "cancelled"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "todo" | "in_progress" | "done" | "archived"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      analysis_status: ["pending", "processing", "completed", "failed"],
      app_role: ["admin", "moderator", "user"],
      media_content_type: ["text", "video", "podcast"],
      meeting_status: ["scheduled", "in_progress", "completed", "cancelled"],
      organization_role: ["owner", "admin", "manager", "member", "viewer"],
      organization_type: [
        "varid",
        "farangaran",
        "khadim_e_khalgh",
        "chamber_commerce",
        "association",
        "other",
      ],
      proficiency_level: ["beginner", "intermediate", "advanced", "expert"],
      project_status: [
        "planning",
        "active",
        "on_hold",
        "completed",
        "cancelled",
      ],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["todo", "in_progress", "done", "archived"],
    },
  },
} as const
