import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  Calendar,
  Edit,
  Bell,
  BarChart3
} from "lucide-react";

interface Resolution {
  id: string;
  meetingTitle: string;
  resolutionText: string;
  responsiblePerson: string;
  deadline: string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  progress: number;
  implementationNotes: string;
  lastUpdate: string;
}

interface MeetingTrackingDashboardProps {
  resolutions: Resolution[];
  onUpdateResolution: (id: string, updates: Partial<Resolution>) => void;
}

export const MeetingTrackingDashboard: React.FC<MeetingTrackingDashboardProps> = ({
  resolutions,
  onUpdateResolution
}) => {
  const [selectedResolution, setSelectedResolution] = useState<Resolution | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    progress: 0,
    status: '',
    implementationNotes: ''
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'تکمیل شده';
      case 'in-progress':
        return 'در حال اجرا';
      case 'overdue':
        return 'معوق';
      default:
        return 'در انتظار';
    }
  };

  const openUpdateModal = (resolution: Resolution) => {
    setSelectedResolution(resolution);
    setUpdateForm({
      progress: resolution.progress,
      status: resolution.status,
      implementationNotes: resolution.implementationNotes
    });
    setIsUpdateModalOpen(true);
  };

  const handleUpdate = () => {
    if (selectedResolution) {
      onUpdateResolution(selectedResolution.id, {
        ...updateForm,
        status: updateForm.status as Resolution['status'],
        lastUpdate: new Date().toLocaleDateString('fa-IR')
      });
      setIsUpdateModalOpen(false);
    }
  };

  const stats = {
    total: resolutions.length,
    completed: resolutions.filter(r => r.status === 'completed').length,
    inProgress: resolutions.filter(r => r.status === 'in-progress').length,
    overdue: resolutions.filter(r => r.status === 'overdue').length
  };

  const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">کل مصوبات</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">تکمیل شده</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">در حال اجرا</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">معوق</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            پیشرفت کلی
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>نرخ تکمیل</span>
              <span>{completionRate.toFixed(1)}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Resolutions List */}
      <Card>
        <CardHeader>
          <CardTitle>مصوبات و پیگیری</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {resolutions.map((resolution) => (
              <div key={resolution.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium">{resolution.resolutionText}</h4>
                    <p className="text-sm text-muted-foreground">جلسه: {resolution.meetingTitle}</p>
                  </div>
                  <Badge className={getStatusColor(resolution.status)}>
                    {getStatusText(resolution.status)}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">مسئول اجرا:</span>
                    <p className="text-muted-foreground">{resolution.responsiblePerson}</p>
                  </div>
                  <div>
                    <span className="font-medium">مهلت اجرا:</span>
                    <p className="text-muted-foreground">{resolution.deadline}</p>
                  </div>
                  <div>
                    <span className="font-medium">آخرین بروزرسانی:</span>
                    <p className="text-muted-foreground">{resolution.lastUpdate}</p>
                  </div>
                </div>

                {resolution.status !== 'completed' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>پیشرفت</span>
                      <span>{resolution.progress}%</span>
                    </div>
                    <Progress value={resolution.progress} className="h-2" />
                  </div>
                )}

                {resolution.implementationNotes && (
                  <div className="bg-muted p-3 rounded">
                    <p className="text-sm">
                      <span className="font-medium">یادداشت اجرا:</span> {resolution.implementationNotes}
                    </p>
                  </div>
                )}

                <div className="flex justify-end space-x-2 rtl:space-x-reverse">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openUpdateModal(resolution)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    بروزرسانی وضعیت
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Update Modal */}
      <ResponsiveDialog 
        open={isUpdateModalOpen} 
        onOpenChange={setIsUpdateModalOpen}
        title="بروزرسانی وضعیت مصوبه"
      >
        <div className="space-y-4">
          {selectedResolution && (
            <>
              <div>
                <h4 className="font-medium mb-2">{selectedResolution.resolutionText}</h4>
                <p className="text-sm text-muted-foreground">
                  مسئول: {selectedResolution.responsiblePerson}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">وضعیت</label>
                <Select 
                  value={updateForm.status} 
                  onValueChange={(value) => setUpdateForm({...updateForm, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">در انتظار</SelectItem>
                    <SelectItem value="in-progress">در حال اجرا</SelectItem>
                    <SelectItem value="completed">تکمیل شده</SelectItem>
                    <SelectItem value="overdue">معوق</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">پیشرفت (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={updateForm.progress}
                  onChange={(e) => setUpdateForm({...updateForm, progress: parseInt(e.target.value) || 0})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">یادداشت اجرا</label>
                <Textarea
                  value={updateForm.implementationNotes}
                  onChange={(e) => setUpdateForm({...updateForm, implementationNotes: e.target.value})}
                  placeholder="توضیحات درباره پیشرفت یا مشکلات..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2 rtl:space-x-reverse">
                <Button variant="outline" onClick={() => setIsUpdateModalOpen(false)}>
                  انصراف
                </Button>
                <Button onClick={handleUpdate}>
                  بروزرسانی
                </Button>
              </div>
            </>
          )}
        </div>
      </ResponsiveDialog>
    </div>
  );
};