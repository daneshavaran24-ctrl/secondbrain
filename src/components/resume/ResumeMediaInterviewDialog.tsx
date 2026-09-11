import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MOCK_USER_ID } from '@/config/mockUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResumeFileUploader } from './ResumeFileUploader';
import { createMediaInterview, updateMediaInterview, MediaInterview } from '@/services/resumeService';
import { toast } from '@/hooks/use-toast';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ResumeMediaInterviewDialogProps {
  open: boolean;
  onClose: () => void;
  interview?: MediaInterview;
}

export function ResumeMediaInterviewDialog({ open, onClose, interview }: ResumeMediaInterviewDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    media_source: '',
    interview_date: '',
    content_type: 'text' as 'text' | 'video' | 'podcast',
    content_url: '',
    description: '',
    topics: [] as string[],
  });
  const [topicInput, setTopicInput] = useState('');

  useEffect(() => {
    if (interview) {
      setFormData({
        title: interview.title || '',
        media_source: interview.media_source || '',
        interview_date: interview.interview_date || '',
        content_type: interview.content_type || 'text',
        content_url: interview.content_url || '',
        description: interview.description || '',
        topics: interview.topics || [],
      });
    } else {
      setFormData({
        title: '',
        media_source: '',
        interview_date: '',
        content_type: 'text',
        content_url: '',
        description: '',
        topics: [],
      });
    }
  }, [interview, open]);

  const handleAddTopic = () => {
    if (topicInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        topics: [...prev.topics, topicInput.trim()],
      }));
      setTopicInput('');
    }
  };

  const handleRemoveTopic = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      topics: prev.topics.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      if (interview?.id) {
        await updateMediaInterview(interview.id, formData);
        toast({ title: 'مصاحبه با موفقیت به‌روزرسانی شد' });
      } else {
        await createMediaInterview({ ...formData, user_id: MOCK_USER_ID });
        toast({ title: 'مصاحبه با موفقیت ایجاد شد' });
      }
      onClose();
    } catch (error) {
      console.error('Error saving interview:', error);
      toast({
        title: 'خطا در ذخیره مصاحبه',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getAcceptTypes = () => {
    switch (formData.content_type) {
      case 'video':
        return { 'video/*': ['.mp4', '.mov'] };
      case 'podcast':
        return { 'audio/*': ['.mp3', '.wav', '.m4a'] };
      default:
        return { 'application/pdf': ['.pdf'], 'text/*': ['.txt'] };
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {interview ? 'ویرایش مصاحبه' : 'افزودن مصاحبه جدید'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>عنوان مصاحبه *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>منبع رسانه *</Label>
              <Input
                value={formData.media_source}
                onChange={(e) => setFormData({ ...formData, media_source: e.target.value })}
                required
                placeholder="نام روزنامه، سایت، رادیو..."
              />
            </div>
            <div>
              <Label>تاریخ مصاحبه *</Label>
              <Input
                type="date"
                value={formData.interview_date}
                onChange={(e) => setFormData({ ...formData, interview_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label>نوع محتوا *</Label>
            <Select
              value={formData.content_type}
              onValueChange={(value: 'text' | 'video' | 'podcast') =>
                setFormData({ ...formData, content_type: value, content_url: '' })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">متنی</SelectItem>
                <SelectItem value="video">ویدیو</SelectItem>
                <SelectItem value="podcast">پادکست</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>توضیحات</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <Label>موضوعات</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTopic())}
                placeholder="موضوع مصاحبه"
              />
              <Button type="button" onClick={handleAddTopic}>
                افزودن
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.topics.map((topic, index) => (
                <Badge key={index} variant="secondary">
                  {topic}
                  <X
                    className="w-3 h-3 mr-1 cursor-pointer"
                    onClick={() => handleRemoveTopic(index)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label>آپلود محتوا یا وارد کردن لینک</Label>
            <Input
              value={formData.content_url}
              onChange={(e) => setFormData({ ...formData, content_url: e.target.value })}
              placeholder="لینک یوتیوب، آپارات، یا آپلود فایل..."
              className="mb-2"
            />
            <ResumeFileUploader
              userId={MOCK_USER_ID}
                category="media-interviews"
                onUploadComplete={(url) => setFormData({ ...formData, content_url: url })}
              accept={getAcceptTypes()}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              انصراف
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'در حال ذخیره...' : 'ذخیره'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
