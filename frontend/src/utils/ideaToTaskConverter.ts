import { PersonalTask } from '@/types';

export interface ConvertIdeaToTaskData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'completed';
  domain: 'personal' | 'professional' | 'organizational';
  mainCategory?: string;
  subCategory?: string;
  category?: string;
  tags: string[];
  due_date?: string;
  estimated_hours?: number;
}

/**
 * تبدیل ایده به وظیفه
 * Convert idea to task with proper mapping based on domain
 */
export function convertIdeaToTask(idea: any, domain: string): ConvertIdeaToTaskData {
  // Build comprehensive description
  let description = idea.description || '';
  
  // Add SWOT analysis if available
  if (idea.swotAnalysis) {
    description += '\n\n📊 تحلیل SWOT:\n';
    if (idea.swotAnalysis.strengths?.length > 0) {
      description += `\n✅ نقاط قوت: ${idea.swotAnalysis.strengths.join(', ')}`;
    }
    if (idea.swotAnalysis.opportunities?.length > 0) {
      description += `\n🎯 فرصت‌ها: ${idea.swotAnalysis.opportunities.join(', ')}`;
    }
  }
  
  // Add risk information if available
  if (idea.idea_risks && idea.idea_risks.length > 0) {
    description += '\n\n⚠️ ریسک‌های شناسایی شده:\n';
    idea.idea_risks.forEach((risk: any) => {
      description += `\n- ${risk.risk_type}: ${risk.description}`;
      if (risk.mitigation_strategy) {
        description += ` (راهکار: ${risk.mitigation_strategy})`;
      }
    });
  }
  
  // Add metrics if available
  if (idea.feasibility_score || idea.potential_impact) {
    description += '\n\n📈 معیارها:\n';
    if (idea.feasibility_score) {
      description += `\n- امکان‌پذیری: ${idea.feasibility_score}/10`;
    }
    if (idea.potential_impact) {
      description += `\n- تأثیر بالقوه: ${idea.potential_impact}/10`;
    }
  }
  
  description += `\n\n💡 این وظیفه از ایده "${idea.title}" ایجاد شده است`;
  
  // Map priority
  const priorityMap: Record<string, 'low' | 'medium' | 'high'> = {
    low: 'low',
    medium: 'medium',
    high: 'high'
  };
  
  // Base task data
  const taskData: ConvertIdeaToTaskData = {
    title: idea.title,
    description: description.trim(),
    priority: priorityMap[idea.priority] || 'medium',
    status: 'todo',
    domain: domain as any,
    tags: ['از-ایده', `مرحله-${idea.stage || 'concept'}`],
  };
  
  // Add domain-specific data
  if (domain === 'personal') {
    taskData.mainCategory = 'personal_development';
    taskData.subCategory = 'goal_setting';
  } else if (domain === 'professional') {
    taskData.category = 'project';
  } else if (domain === 'organizational') {
    taskData.category = 'strategic';
  }
  
  // Add timeline if available
  if (idea.estimated_timeline) {
    // Parse timeline and set due date
    const timelineMatch = idea.estimated_timeline.match(/(\d+)/);
    if (timelineMatch) {
      const months = parseInt(timelineMatch[1]);
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + months);
      taskData.due_date = dueDate.toISOString().split('T')[0];
    }
  }
  
  return taskData;
}

/**
 * تهیه پیش‌نمایش وظیفه
 * Get task preview text
 */
export function getTaskPreview(taskData: ConvertIdeaToTaskData): string {
  const domainLabels = {
    personal: 'فردی',
    professional: 'حرفه‌ای',
    organizational: 'سازمانی'
  };
  
  const priorityLabels = {
    low: 'کم',
    medium: 'متوسط',
    high: 'بالا'
  };
  
  return `
📋 عنوان: ${taskData.title}
🎯 حوزه: ${domainLabels[taskData.domain]}
⭐ اولویت: ${priorityLabels[taskData.priority]}
${taskData.due_date ? `📅 سررسید: ${new Date(taskData.due_date).toLocaleDateString('fa-IR')}` : ''}
${taskData.tags.length > 0 ? `🏷️ برچسب‌ها: ${taskData.tags.join(', ')}` : ''}
  `.trim();
}
