import React, { useState } from 'react';
import { Project, ProjectMember } from '@/types';
import { projectManagementService } from '@/services/projectManagementService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PersianDatePicker } from '@/components/ui/persian-date-picker';
import { convertGregorianToJalali, convertJalaliToGregorian } from '@/lib/date-utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Plus, Briefcase, Calendar, Target, Users } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface ProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
  onSuccess: () => void;
}

const statusOptions = [
  { value: 'planning', label: 'در حال برنامه‌ریزی' },
  { value: 'active', label: 'فعال' },
  { value: 'on-hold', label: 'متوقف' },
  { value: 'completed', label: 'تکمیل شده' },
  { value: 'cancelled', label: 'لغو شده' }
];

const colorOptions = [
  { value: '#3B82F6', label: 'آبی', color: 'bg-blue-500' },
  { value: '#10B981', label: 'سبز', color: 'bg-green-500' },
  { value: '#F59E0B', label: 'نارنجی', color: 'bg-yellow-500' },
  { value: '#EF4444', label: 'قرمز', color: 'bg-red-500' },
  { value: '#8B5CF6', label: 'بنفش', color: 'bg-purple-500' },
  { value: '#EC4899', label: 'صورتی', color: 'bg-pink-500' }
];

export function ProjectForm({ open, onOpenChange, project, onSuccess }: ProjectFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [availableMembers] = useState<ProjectMember[]>(projectManagementService.getMembers());
  const [newTag, setNewTag] = useState('');
  
  const [formData, setFormData] = useState({
    name: project?.name || '',
    description: project?.description || '',
    goal: project?.goal || '',
    managerId: project?.managerId || '',
    memberIds: project?.teamMembers || [],
    status: project?.status || 'planning',
    startDate: project?.startDate ? format(new Date(project.startDate), 'yyyy-MM-dd') : '',
    endDate: project?.endDate ? format(new Date(project.endDate), 'yyyy-MM-dd') : '',
    budget: project?.budget || undefined,
    color: project?.color || '#3B82F6',
    tags: project?.tags || []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.goal.trim() || !formData.managerId || !formData.startDate || !formData.endDate) {
      toast({
        title: "خطا",
        description: "لطفاً تمام فیلدهای ضروری را پر کنید",
        variant: "destructive"
      });
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      toast({
        title: "خطا",
        description: "تاریخ پایان باید بعد از تاریخ شروع باشد",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const manager = availableMembers.find(m => m.id === formData.managerId);
      const members = availableMembers.filter(m => formData.memberIds.includes(m.id));
      
      if (!manager) throw new Error('مدیر انتخاب شده یافت نشد');

      const projectData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        goal: formData.goal.trim(),
        managerId: formData.managerId,
        teamMembers: [formData.managerId, ...formData.memberIds.filter(id => id !== formData.managerId)],
        status: formData.status as Project['status'],
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        budget: formData.budget,
        color: formData.color,
        tags: formData.tags
      };

      if (project) {
        // Update existing project
        const updatedProject = projectManagementService.updateProject(project.id, projectData);
        if (updatedProject) {
          toast({
            title: "موفقیت",
            description: "پروژه با موفقیت به‌روزرسانی شد"
          });
        }
      } else {
        // Create new project
        const newProject = projectManagementService.createProject(projectData);
        if (newProject) {
          toast({
            title: "موفقیت", 
            description: "پروژه جدید با موفقیت ایجاد شد"
          });
        }
      }
      
      onSuccess();
      onOpenChange(false);
      resetForm();
      
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطایی در ذخیره پروژه رخ داد",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      goal: '',
      managerId: '',
      memberIds: [],
      status: 'planning',
      startDate: '',
      endDate: '',
      budget: undefined,
      color: '#3B82F6',
      tags: []
    });
    setNewTag('');
  };

  const addMember = (memberId: string) => {
    if (!formData.memberIds.includes(memberId)) {
      setFormData(prev => ({
        ...prev,
        memberIds: [...prev.memberIds, memberId]
      }));
    }
  };

  const removeMember = (memberId: string) => {
    setFormData(prev => ({
      ...prev,
      memberIds: prev.memberIds.filter(id => id !== memberId)
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.currentTarget === e.target) {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-right pr-8">
            <Briefcase className="h-5 w-5 text-primary" />
            {project ? 'ویرایش پروژه' : 'ایجاد پروژه جدید'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">نام پروژه *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="نام پروژه را وارد کنید..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label>رنگ پروژه</Label>
              <Select 
                value={formData.color} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${option.color}`}></div>
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">توضیحات</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="توضیحات پروژه..."
              rows={3}
            />
          </div>

          {/* Goal */}
          <div className="space-y-2">
            <Label htmlFor="goal">هدف پروژه *</Label>
            <Textarea
              id="goal"
              value={formData.goal}
              onChange={(e) => setFormData(prev => ({ ...prev, goal: e.target.value }))}
              placeholder="هدف اصلی و نتیجه مورد انتظار از این پروژه..."
              rows={2}
              required
            />
          </div>

          {/* Manager and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>مدیر پروژه *</Label>
              <Select 
                value={formData.managerId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, managerId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب مدیر..." />
                </SelectTrigger>
                <SelectContent>
                  {availableMembers.filter(m => m.role === 'manager' || m.role === 'member').map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback className="text-xs">
                            {member.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{member.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {member.role}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>وضعیت پروژه</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as Project['status'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates and Budget */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>تاریخ شروع *</Label>
              <PersianDatePicker
                value={formData.startDate ? new Date(formData.startDate) : null}
                onChange={(date) => {
                  if (date) {
                    const gregorianDate = date.toISOString().split('T')[0];
                    setFormData(prev => ({ ...prev, startDate: gregorianDate }));
                  } else {
                    setFormData(prev => ({ ...prev, startDate: '' }));
                  }
                }}
                placeholder="تاریخ شروع پروژه"
              />
            </div>

            <div className="space-y-2">
              <Label>تاریخ پایان *</Label>
              <PersianDatePicker
                value={formData.endDate ? new Date(formData.endDate) : null}
                onChange={(date) => {
                  if (date) {
                    const gregorianDate = date.toISOString().split('T')[0];
                    setFormData(prev => ({ ...prev, endDate: gregorianDate }));
                  } else {
                    setFormData(prev => ({ ...prev, endDate: '' }));
                  }
                }}
                placeholder="تاریخ پایان پروژه"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">بودجه (تومان)</Label>
              <Input
                id="budget"
                type="number"
                min="0"
                value={formData.budget || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  budget: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
                placeholder="مثال: 10000000"
              />
            </div>
          </div>

          {/* Team Members */}
          <div className="space-y-2">
            <Label>اعضای تیم</Label>
            <div className="space-y-3">
              {/* Selected members */}
              {formData.memberIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.memberIds.map(memberId => {
                    const member = availableMembers.find(m => m.id === memberId);
                    if (!member) return null;
                    
                    return (
                      <Badge key={memberId} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback className="text-xs">
                            {member.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {member.name}
                        <button
                          type="button"
                          onClick={() => removeMember(memberId)}
                          className="ml-1 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
              
              {/* Add member selector */}
              <Select onValueChange={addMember}>
                <SelectTrigger>
                  <SelectValue placeholder="افزودن عضو جدید..." />
                </SelectTrigger>
                <SelectContent>
                  {availableMembers
                    .filter(member => !formData.memberIds.includes(member.id) && member.id !== formData.managerId)
                    .map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback className="text-xs">
                            {member.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{member.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {member.role}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>برچسب‌ها</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="برچسب جدید..."
                className="flex-1"
              />
              <Button type="button" onClick={addTag} variant="outline" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              انصراف
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'در حال ذخیره...' : project ? 'به‌روزرسانی' : 'ایجاد پروژه'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}