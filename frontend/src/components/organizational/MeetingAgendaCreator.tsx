import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Minus, 
  Clock, 
  Users, 
  FileText,
  Download,
  Calendar,
  Move,
  Edit
} from "lucide-react";

interface AgendaItem {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  presenter: string;
  type: 'discussion' | 'presentation' | 'decision' | 'information';
  order: number;
}

interface Meeting {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  participants: string[];
}

interface MeetingAgendaCreatorProps {
  meeting?: Meeting;
  isOpen: boolean;
  onClose: () => void;
  onSave: (agenda: AgendaItem[]) => void;
}

export const MeetingAgendaCreator: React.FC<MeetingAgendaCreatorProps> = ({
  meeting,
  isOpen,
  onClose,
  onSave
}) => {
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [newItem, setNewItem] = useState<Partial<AgendaItem>>({
    title: '',
    description: '',
    duration: 10,
    presenter: '',
    type: 'discussion'
  });
  const [isAddingItem, setIsAddingItem] = useState(false);

  const addAgendaItem = () => {
    if (newItem.title && newItem.presenter) {
      const item: AgendaItem = {
        id: Date.now().toString(),
        title: newItem.title,
        description: newItem.description || '',
        duration: newItem.duration || 10,
        presenter: newItem.presenter,
        type: newItem.type as AgendaItem['type'],
        order: agendaItems.length + 1
      };
      
      setAgendaItems([...agendaItems, item]);
      setNewItem({
        title: '',
        description: '',
        duration: 10,
        presenter: '',
        type: 'discussion'
      });
      setIsAddingItem(false);
    }
  };

  const removeAgendaItem = (id: string) => {
    setAgendaItems(agendaItems.filter(item => item.id !== id));
  };

  const updateAgendaItem = (id: string, updates: Partial<AgendaItem>) => {
    setAgendaItems(agendaItems.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const moveItem = (id: string, direction: 'up' | 'down') => {
    const currentIndex = agendaItems.findIndex(item => item.id === id);
    if (
      (direction === 'up' && currentIndex > 0) ||
      (direction === 'down' && currentIndex < agendaItems.length - 1)
    ) {
      const newItems = [...agendaItems];
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      [newItems[currentIndex], newItems[targetIndex]] = [newItems[targetIndex], newItems[currentIndex]];
      
      // Update order numbers
      newItems.forEach((item, index) => {
        item.order = index + 1;
      });
      
      setAgendaItems(newItems);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'discussion':
        return 'bg-blue-100 text-blue-800';
      case 'presentation':
        return 'bg-green-100 text-green-800';
      case 'decision':
        return 'bg-orange-100 text-orange-800';
      case 'information':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'discussion':
        return 'بحث و بررسی';
      case 'presentation':
        return 'ارائه';
      case 'decision':
        return 'تصمیم‌گیری';
      case 'information':
        return 'اطلاع‌رسانی';
      default:
        return type;
    }
  };

  const getTotalDuration = () => {
    return agendaItems.reduce((total, item) => total + item.duration, 0);
  };

  const exportAgenda = () => {
    const agendaText = agendaItems.map((item, index) => 
      `${index + 1}. ${item.title} (${item.duration} دقیقه)\n   ارائه‌دهنده: ${item.presenter}\n   توضیحات: ${item.description}\n`
    ).join('\n');
    
    const fullAgenda = `دستور جلسه: ${meeting?.title || "جلسه جدید"}\nتاریخ: ${meeting?.date || ""}\n\n${agendaText}`;
    
    const blob = new Blob([fullAgenda], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agenda-${meeting?.title || 'meeting'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    onSave(agendaItems);
    onClose();
  };

  return (
    <ResponsiveDialog 
      open={isOpen} 
      onOpenChange={onClose}
      title="ایجاد دستور جلسه"
    >
      <div className="space-y-6">
        {/* Meeting Info */}
        {meeting && (
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">عنوان جلسه:</span>
                  <p className="text-muted-foreground">{meeting.title}</p>
                </div>
                <div>
                  <span className="font-medium">تاریخ:</span>
                  <p className="text-muted-foreground">{meeting.date}</p>
                </div>
                <div>
                  <span className="font-medium">زمان:</span>
                  <p className="text-muted-foreground">{meeting.startTime} - {meeting.endTime}</p>
                </div>
                <div>
                  <span className="font-medium">مکان:</span>
                  <p className="text-muted-foreground">{meeting.location}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{agendaItems.length}</div>
              <div className="text-sm text-muted-foreground">موضوع دستور جلسه</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{getTotalDuration()}</div>
              <div className="text-sm text-muted-foreground">دقیقه زمان کل</div>
            </CardContent>
          </Card>
        </div>

        {/* Agenda Items */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>موضوعات دستور جلسه</CardTitle>
              <Button onClick={() => setIsAddingItem(true)}>
                <Plus className="h-4 w-4 mr-2" />
                افزودن موضوع
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {agendaItems.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                        <span className="font-medium text-lg">{item.order}. {item.title}</span>
                        <span className={`px-2 py-1 rounded text-xs ${getTypeColor(item.type)}`}>
                          {getTypeText(item.type)}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-muted-foreground text-sm mb-2">{item.description}</p>
                      )}
                      <div className="flex items-center space-x-4 rtl:space-x-reverse text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {item.presenter}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {item.duration} دقیقه
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 rtl:space-x-reverse">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveItem(item.id, 'up')}
                        disabled={item.order === 1}
                      >
                        ↑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveItem(item.id, 'down')}
                        disabled={item.order === agendaItems.length}
                      >
                        ↓
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAgendaItem(item.id)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {agendaItems.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>هنوز موضوعی به دستور جلسه اضافه نشده است</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add New Item Modal */}
        <ResponsiveDialog
          open={isAddingItem}
          onOpenChange={setIsAddingItem}
          title="افزودن موضوع جدید"
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">عنوان موضوع</label>
              <Input
                value={newItem.title}
                onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                placeholder="عنوان موضوع دستور جلسه..."
              />
            </div>

            <div>
              <label className="text-sm font-medium">نوع موضوع</label>
              <Select 
                value={newItem.type} 
                onValueChange={(value) => setNewItem({...newItem, type: value as AgendaItem['type']})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="discussion">بحث و بررسی</SelectItem>
                  <SelectItem value="presentation">ارائه</SelectItem>
                  <SelectItem value="decision">تصمیم‌گیری</SelectItem>
                  <SelectItem value="information">اطلاع‌رسانی</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">ارائه‌دهنده</label>
                <Input
                  value={newItem.presenter}
                  onChange={(e) => setNewItem({...newItem, presenter: e.target.value})}
                  placeholder="نام ارائه‌دهنده..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">مدت زمان (دقیقه)</label>
                <Input
                  type="number"
                  min="5"
                  max="120"
                  value={newItem.duration}
                  onChange={(e) => setNewItem({...newItem, duration: parseInt(e.target.value) || 10})}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">توضیحات</label>
              <Textarea
                value={newItem.description}
                onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                placeholder="توضیحات اضافی..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2 rtl:space-x-reverse">
              <Button variant="outline" onClick={() => setIsAddingItem(false)}>
                انصراف
              </Button>
              <Button onClick={addAgendaItem}>
                افزودن
              </Button>
            </div>
          </div>
        </ResponsiveDialog>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <div className="flex space-x-2 rtl:space-x-reverse">
            <Button variant="outline" onClick={exportAgenda} disabled={agendaItems.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              خروجی دستور جلسه
            </Button>
          </div>
          <div className="flex space-x-2 rtl:space-x-reverse">
            <Button variant="outline" onClick={onClose}>
              انصراف
            </Button>
            <Button onClick={handleSave} disabled={agendaItems.length === 0}>
              ذخیره دستور جلسه
            </Button>
          </div>
        </div>
      </div>
    </ResponsiveDialog>
  );
};