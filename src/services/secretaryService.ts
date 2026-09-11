// Secretary Service - Limited Access Management with RBAC
import { 
  SecretaryUser, 
  SecretaryRequest, 
  SecretaryRequestData, 
  SecretaryNotification, 
  Meeting 
} from '@/types';
import { meetingService } from './meetingService';

class SecretaryService {
  private secretaryUsers: SecretaryUser[] = [];
  private secretaryRequests: SecretaryRequest[] = [];
  private notifications: SecretaryNotification[] = [];
  private readonly RATE_LIMIT_PER_HOUR = 10;
  private readonly DOCTOR_ID = 'karbasi';

  constructor() {
    this.loadFromStorage();
    this.initializeDefaultSecretary();
  }

  private initializeDefaultSecretary(): void {
    if (this.secretaryUsers.length === 0) {
      const defaultSecretary: SecretaryUser = {
        id: 'secretary_001',
        name: 'منشی دکتر مرتضی کرباسی',
        email: 'secretary@karbasi.clinic',
        permissions: [
          {
            action: 'create_meeting',
            scope: 'limited',
            constraints: {
              max_requests_per_hour: this.RATE_LIMIT_PER_HOUR,
              allowed_organizations: ['Varid', 'Frangaran', 'Association', 'Chamber']
            }
          },
          {
            action: 'update_meeting',
            scope: 'limited',
            constraints: {
              max_requests_per_hour: this.RATE_LIMIT_PER_HOUR
            }
          },
          {
            action: 'send_message',
            scope: 'limited',
            constraints: {
              max_requests_per_hour: this.RATE_LIMIT_PER_HOUR
            }
          },
          {
            action: 'send_reminder',
            scope: 'limited',
            constraints: {
              max_requests_per_hour: this.RATE_LIMIT_PER_HOUR
            }
          }
        ],
        assigned_doctor_id: this.DOCTOR_ID,
        created_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
        is_active: true
      };
      
      this.secretaryUsers.push(defaultSecretary);
      this.saveToStorage();
    }
  }

  // Rate Limiting with PoLP (Principle of Least Privilege)
  private checkRateLimit(secretaryId: string): boolean {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentRequests = this.secretaryRequests.filter(
      req => req.secretary_id === secretaryId && 
             new Date(req.created_at) > oneHourAgo
    );
    
    return recentRequests.length < this.RATE_LIMIT_PER_HOUR;
  }

  // Validate Secretary Permissions (RBAC)
  private validatePermission(secretaryId: string, action: SecretaryRequest['type']): boolean {
    const secretary = this.secretaryUsers.find(s => s.id === secretaryId);
    if (!secretary || !secretary.is_active) return false;

    const permission = secretary.permissions.find(p => 
      action.includes(p.action.replace('_', '_'))
    );
    
    return !!permission;
  }

  // Create Secretary Request (Write-Only Operation)
  async createSecretaryRequest(
    secretaryId: string, 
    type: SecretaryRequest['type'], 
    data: SecretaryRequestData
  ): Promise<{ success: boolean; request_id?: string; error?: string }> {
    
    // Security Validation
    if (!this.validatePermission(secretaryId, type)) {
      return { success: false, error: 'دسترسی غیرمجاز - عدم مجوز برای این عملیات' };
    }

    if (!this.checkRateLimit(secretaryId)) {
      return { success: false, error: 'محدودیت درخواست - حداکثر 10 درخواست در ساعت' };
    }

    // Create Request
    const request: SecretaryRequest = {
      id: crypto.randomUUID(),
      secretary_id: secretaryId,
      type,
      data,
      status: 'pending',
      created_at: new Date().toISOString(),
      doctor_notified: false
    };

    this.secretaryRequests.push(request);
    
    // Auto-process based on type
    await this.processRequest(request);
    
    // Create notification for doctor
    await this.createDoctorNotification(request);
    
    await this.saveToStorage();
    
    return { success: true, request_id: request.id };
  }

  // Process Secretary Request (One-way flow to main app)
  private async processRequest(request: SecretaryRequest): Promise<void> {
    try {
      switch (request.type) {
        case 'meeting_create':
          if (request.data.meeting) {
            const meeting = await meetingService.createMeeting(
              request.data.meeting.title,
              request.data.meeting.organization
            );
            
            // Update meeting with secretary data
            const meetings = await meetingService.getMeetings();
            const targetMeeting = meetings.find(m => m.id === meeting.id);
            if (targetMeeting) {
              targetMeeting.date = new Date(request.data.meeting.date + 'T' + request.data.meeting.time).toISOString();
              // Add participants and other data
            }
          }
          break;

        case 'meeting_update':
          if (request.data.meeting_update) {
            // Update existing meeting through meetingService
            // This would require extending meetingService with update methods
          }
          break;

        case 'message':
        case 'reminder':
          // These are processed as notifications
          break;
      }

      request.status = 'processed';
      request.processed_at = new Date().toISOString();
      
    } catch (error) {
      console.error('Failed to process secretary request:', error);
      request.status = 'rejected';
    }
  }

  // Create Doctor Notification (Push to main app)
  private async createDoctorNotification(request: SecretaryRequest): Promise<void> {
    let title = '';
    let message = '';
    let type: SecretaryNotification['type'] = 'new_request';

    switch (request.type) {
      case 'meeting_create':
        title = 'جلسه جدید ایجاد شد';
        message = `منشی جلسه "${request.data.meeting?.title}" را برای ${new Date(request.data.meeting?.date || '').toLocaleDateString('fa-IR')} ایجاد کرد`;
        break;
      case 'meeting_update':
        title = 'تغییرات جلسه';
        message = `منشی تغییراتی در جلسه اعمال کرد: ${request.data.meeting_update?.reason}`;
        type = 'meeting_update';
        break;
      case 'message':
        title = request.data.message?.title || 'پیام جدید از منشی';
        message = request.data.message?.content || '';
        if (request.data.message?.urgent) {
          type = 'urgent_message';
        }
        break;
      case 'reminder':
        title = 'یادآوری جدید';
        message = `${request.data.reminder?.title}: ${request.data.reminder?.content}`;
        break;
    }

    const notification: SecretaryNotification = {
      id: crypto.randomUUID(),
      secretary_request_id: request.id,
      doctor_id: this.DOCTOR_ID,
      title,
      message,
      type,
      read: false,
      created_at: new Date().toISOString()
    };

    this.notifications.push(notification);
    request.doctor_notified = true;

    // In a real implementation, this would send FCM push notification
    this.triggerRealTimeNotification(notification);
  }

  // Trigger Real-time Notification (WebSocket/FCM simulation)
  private triggerRealTimeNotification(notification: SecretaryNotification): void {
    // Simulate real-time notification to doctor's dashboard
    window.dispatchEvent(new CustomEvent('secretary-notification', {
      detail: notification
    }));
  }

  // Get Pending Notifications for Doctor
  async getDoctorNotifications(doctorId: string = this.DOCTOR_ID): Promise<SecretaryNotification[]> {
    return this.notifications
      .filter(n => n.doctor_id === doctorId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // Mark Notification as Read
  async markNotificationRead(notificationId: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      await this.saveToStorage();
    }
  }

  // Get Secretary Requests (for doctor's review)
  async getSecretaryRequests(status?: SecretaryRequest['status']): Promise<SecretaryRequest[]> {
    let requests = this.secretaryRequests;
    
    if (status) {
      requests = requests.filter(r => r.status === status);
    }
    
    return requests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // Audit Log for Secretary Actions
  async getSecretaryAuditLog(secretaryId?: string): Promise<{
    total_requests: number;
    requests_by_type: Record<string, number>;
    recent_activity: SecretaryRequest[];
  }> {
    let requests = this.secretaryRequests;
    
    if (secretaryId) {
      requests = requests.filter(r => r.secretary_id === secretaryId);
    }

    const requestsByType = requests.reduce((acc, req) => {
      acc[req.type] = (acc[req.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total_requests: requests.length,
      requests_by_type: requestsByType,
      recent_activity: requests.slice(0, 10)
    };
  }

  // Secretary Authentication Simulation (JWT would be implemented in real backend)
  async authenticateSecretary(email: string, password: string): Promise<{ 
    success: boolean; 
    secretary?: SecretaryUser; 
    token?: string 
  }> {
    // In real implementation, this would validate against secure backend
    const secretary = this.secretaryUsers.find(s => s.email === email && s.is_active);
    
    if (secretary) {
      secretary.last_active = new Date().toISOString();
      await this.saveToStorage();
      
      return {
        success: true,
        secretary,
        token: 'mock_jwt_token_' + secretary.id // In real app: JWT with limited scope
      };
    }
    
    return { success: false };
  }

  // Storage Management
  private async saveToStorage(): Promise<void> {
    localStorage.setItem('secretary_users', JSON.stringify(this.secretaryUsers));
    localStorage.setItem('secretary_requests', JSON.stringify(this.secretaryRequests));
    localStorage.setItem('secretary_notifications', JSON.stringify(this.notifications));
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const users = localStorage.getItem('secretary_users');
      const requests = localStorage.getItem('secretary_requests');
      const notifications = localStorage.getItem('secretary_notifications');
      
      if (users) this.secretaryUsers = JSON.parse(users);
      if (requests) this.secretaryRequests = JSON.parse(requests);
      if (notifications) this.notifications = JSON.parse(notifications);
    } catch (error) {
      console.error('Failed to load secretary data from storage:', error);
    }
  }

  // پاکسازی کامل داده‌های دبیرخانه
  cleanupAllData(): void {
    console.log('🏢 پاکسازی داده‌های دبیرخانه...');
    
    // پاک کردن تمام localStorage keys مرتبط
    localStorage.removeItem('secretary_users');
    localStorage.removeItem('secretary_requests');
    localStorage.removeItem('secretary_notifications');
    localStorage.removeItem('secretaryNotifications');
    localStorage.removeItem('secretary_audit_log');
    localStorage.removeItem('secretary_permissions');
    
    console.log('✅ پاکسازی دبیرخانه کامل شد');
  }
}

export const secretaryService = new SecretaryService();