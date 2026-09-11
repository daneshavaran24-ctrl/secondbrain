// Core Types for Mora PKM System

export interface KnowledgeFolder {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  color?: string;
  icon?: string;
  order: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  items_count?: number;
  sub_folders_count?: number;
}

export interface FolderTreeNode {
  folder: KnowledgeFolder;
  children: FolderTreeNode[];
  items: KnowledgeItem[];
  expanded?: boolean;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'link' | 'image' | 'audio' | 'pdf' | 'video' | 'document';
  category: 'Projects' | 'Areas' | 'Resources' | 'Archives'; // PARA method
  tags: string[];
  folder_id?: string;
  created_at: string;
  updated_at: string;
  organization?: 'Varid' | 'Frangaran' | 'Association' | 'Chamber';
  embedding?: number[];
  related_items?: string[];
  metadata?: Record<string, any>;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  duration: number;
  participants: Participant[];
  transcript?: string;
  summary?: string;
  action_items: ActionItem[];
  organization: 'Varid' | 'Frangaran' | 'Association' | 'Chamber' | 'Professional';
  audio_url?: string;
  video_url?: string;
  body_language_analysis?: BodyLanguageAnalysis;
  attention_metrics?: AttentionMetrics;
  minutes_text?: string;
  minutes_status: 'draft' | 'completed' | 'approved';
  attachments: MeetingAttachment[];
  resolutions: MeetingResolution[];
  location?: MeetingLocation;
}

export interface MeetingLocation {
  type: 'manual' | 'map';
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  place_name?: string;
  map_url?: string;
}

export interface MeetingAttachment {
  id: string;
  meeting_id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  file_size: number;
  uploaded_at: string;
  uploaded_by: string;
  storage_bucket?: string;
  storage_path?: string;
}

export interface ResolutionActivity {
  id: string;
  resolution_id: string;
  user_id: string;
  user_name: string;
  action: 'created' | 'updated' | 'status_changed' | 'progress_updated' | 'comment_added' | 'responsible_changed' | 'due_date_changed';
  details: {
    field?: string;
    old_value?: any;
    new_value?: any;
    comment?: string;
  };
  timestamp: string;
}

export interface ResolutionComment {
  id: string;
  resolution_id: string;
  user_id: string;
  user_name: string;
  comment: string;
  created_at: string;
}

export interface ResolutionReminder {
  id: string;
  resolution_id: string;
  reminder_type: 'before_due' | 'overdue' | 'progress_check';
  days_before?: number;
  is_sent: boolean;
  scheduled_at: string;
}

export interface ResponsibleParty {
  user_id: string;
  user_name: string;
  role: 'primary' | 'secondary' | 'reviewer';
  assigned_at: string;
}

export interface MeetingResolution {
  id: string;
  meeting_id: string;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  responsible_party: string; // deprecated - use responsible_parties
  responsible_parties: ResponsibleParty[];
  due_date?: string;
  progress?: number;
  implementation_notes?: string;
  activity_log: ResolutionActivity[];
  comments: ResolutionComment[];
  reminders: ResolutionReminder[];
  linked_task_id?: string;
  auto_create_task: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResolutionFilters {
  search?: string;
  status?: string[];
  priority?: string[];
  dueDateFrom?: string;
  dueDateTo?: string;
  progressMin?: number;
  progressMax?: number;
  responsible?: string[];
}

export interface ResolutionSortOption {
  field: 'created_at' | 'due_date' | 'priority' | 'progress' | 'title';
  order: 'asc' | 'desc';
}

export interface Participant {
  id: string;
  name: string;
  role: string;
  speaking_time: number;
  attention_score: number;
}

export interface ActionItem {
  id: string;
  description: string;
  assignee: string;
  due_date: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

export interface BodyLanguageAnalysis {
  overall_engagement: number;
  emotion_distribution: Record<string, number>;
  posture_changes: number;
  eye_contact_score: number;
}

export interface AttentionMetrics {
  average_attention: number;
  attention_timeline: Array<{ timestamp: number; score: number }>;
  peak_attention_moments: string[];
}

export interface TrendItem {
  id: string;
  title: string;
  source: string;
  url: string;
  content: string;
  relevance_score: number;
  keywords: string[];
  date: string;
  type: 'article' | 'social_post' | 'news' | 'academic';
}

export interface HealthMetrics {
  id: string;
  date: string;
  heart_rate: number;
  stress_level: number;
  energy_level: number;
  sleep_quality: number;
  predicted_fatigue: number;
}

export interface Organization {
  id: string;
  name: string;
  type: 'Varid' | 'Frangaran' | 'Association' | 'Chamber';
  description: string;
  members: string[];
  active_projects: string[];
  kpis: Record<string, number>;
}

export interface AIInsight {
  id: string;
  type: 'recommendation' | 'pattern' | 'prediction' | 'coaching';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  related_items: string[];
  created_at: string;
}

export interface Dashboard {
  id: string;
  user_id: string;
  widgets: DashboardWidget[];
  layout: WidgetLayout[];
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'list' | 'calendar' | 'graph';
  title: string;
  data_source: string;
  config: Record<string, any>;
}

export interface WidgetLayout {
  widget_id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SearchFilters {
  categories?: string[];
  organizations?: string[];
  date_range?: {
    start: string;
    end: string;
  };
  tags?: string[];
  type?: string[];
  folder_id?: string;
  include_subfolders?: boolean;
}

export interface SearchResult {
  items: KnowledgeItem[];
  total: number;
  suggestions: string[];
  related_searches: string[];
}

// Secretary Access Types
export interface SecretaryUser {
  id: string;
  name: string;
  email: string;
  permissions: SecretaryPermission[];
  assigned_doctor_id: string;
  created_at: string;
  last_active: string;
  is_active: boolean;
}

export interface SecretaryPermission {
  action: 'create_meeting' | 'update_meeting' | 'send_message' | 'send_reminder';
  scope: 'limited';
  constraints?: {
    max_requests_per_hour?: number;
    allowed_organizations?: Organization['type'][];
  };
}

export interface SecretaryRequest {
  id: string;
  secretary_id: string;
  type: 'meeting_create' | 'meeting_update' | 'message' | 'reminder';
  data: SecretaryRequestData;
  status: 'pending' | 'approved' | 'processed' | 'rejected';
  created_at: string;
  processed_at?: string;
  doctor_notified: boolean;
}

export interface SecretaryRequestData {
  meeting?: {
    title: string;
    date: string;
    time: string;
    location?: string;
    participants?: string[];
    organization: Organization['type'];
    notes?: string;
  };
  message?: {
    title: string;
    content: string;
    priority: 'low' | 'medium' | 'high';
    urgent?: boolean;
  };
  meeting_update?: {
    meeting_id: string;
    changes: {
      date?: string;
      time?: string;
      location?: string;
      participants?: string[];
      notes?: string;
    };
    reason: string;
  };
  reminder?: {
    title: string;
    content: string;
    due_date: string;
    type: 'appointment' | 'task' | 'event';
  };
}

export interface SecretaryNotification {
  id: string;
  secretary_request_id: string;
  doctor_id: string;
  title: string;
  message: string;
  type: 'new_request' | 'meeting_update' | 'urgent_message';
  read: boolean;
  created_at: string;
}

// Daily Content Types for Quranic verses and motivational quotes
export interface DailyContent {
  date: string;
  verse: QuranVerse;
  quote: MotivationalQuote;
}

export interface QuranVerse {
  id: string;
  arabic: string;
  persian: string;
  surah: string;
  verse: number;
  tafsir?: string;
}

export interface MotivationalQuote {
  id: string;
  text: string;
  author: string;
  category: 'success' | 'health' | 'knowledge' | 'leadership' | 'spirituality';
}

export interface DailyContentSettings {
  showVerse: boolean;
  showQuote: boolean;
  autoRotate: boolean;
  rotationInterval: number; // in hours
}

// Domain Types for Application Structure
export type DomainType = 'personal' | 'professional' | 'organizational' | 'social';

// Personal Planning Types
export interface PersonalTask {
  id: string;
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'completed';
  mainCategory: 'personal_life' | 'personal_development';
  subCategory: 'work' | 'personal' | 'health' | 'family' | 'learning' | 'finance' | 'spiritual_development' | 'educational_development' | 'moral_development' | 'social_development';
  // Deprecated: kept for backward compatibility
  category?: 'work' | 'personal' | 'health' | 'family' | 'learning' | 'finance' | 'spiritual_development' | 'educational_development' | 'moral_development' | 'social_development';
  // For professional and organizational domains
  customCategory?: string;
  tags: string[];
  due_date?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  estimated_hours?: number;
  actual_hours?: number;
  progress: number; // 0-100
  notes?: string;
  // Agile/Scrum fields
  story_points?: number;
  sprintId?: string;
}

export interface TaskFilter {
  status?: 'todo' | 'in_progress' | 'completed' | 'all';
  priority?: 'high' | 'medium' | 'low' | 'all';
  category?: string | 'all';
  search?: string;
  sortBy?: 'priority' | 'due_date' | 'created_at' | 'title' | 'progress';
  sortOrder?: 'asc' | 'desc';
}

export interface TaskStats {
  total: number;
  completed: number;
  in_progress: number;
  todo: number;
  overdue: number;
  completion_rate: number;
  average_completion_time: number;
  productivity_score: number;
  weekly_progress: Array<{ date: string; completed: number; created: number }>;
  category_breakdown: Record<string, number>;
  priority_breakdown: Record<string, number>;
}

export interface DomainConfig {
  id: DomainType;
  name: string;
  icon: React.ComponentType;
  color: string;
  bgColor: string;
  description: string;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType;
  path: string;
  domain: DomainType;
  organization?: Organization['type'];
  color: string;
  bgColor: string;
  isActive: boolean;
  count?: number;
}

// Project Management Types
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type NotificationMethod = 'email' | 'sms' | 'secretary' | 'none';

export interface Project {
  id: string;
  name: string;
  description: string;
  goal: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  managerId: string;
  teamMembers: string[];
  startDate: string;
  endDate?: string;
  budget?: number;
  color?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  progress: number;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assigneeId: string;
  status: TaskStatus;
  priority: Priority;
  deadline: string;
  estimatedHours?: number;
  actualHours?: number;
  tags: string[];
  notificationMethod: NotificationMethod;
  createdAt: string;
  updatedAt: string;
  comments: TaskComment[];
  attachments: TaskAttachment[];
  // Agile/Scrum fields
  story_points?: number;
  sprintId?: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface TaskAttachment {
  id: string;
  taskId: string;
  filename: string;
  url: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface ProjectMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  skills: string[];
  availability: number; // percentage
}

export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  overdueTasks: number;
  completionRate: number;
  averageTaskDuration: number;
  teamProductivity: number;
}

export interface ProjectNotification {
  id: string;
  projectId: string;
  taskId?: string;
  type: 'task_assigned' | 'task_completed' | 'deadline_reminder' | 'project_update';
  title: string;
  message: string;
  recipientId: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, any>;
}