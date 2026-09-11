import React, { useState, useEffect } from 'react';
import { Project, ProjectTask } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Upload, 
  File, 
  FileText, 
  Image, 
  Video, 
  Download, 
  Trash2,
  Eye,
  MessageSquare,
  Clock,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { projectManagementService } from '@/services/projectManagementService';
import { useToast } from '@/hooks/use-toast';

interface ProjectFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  projectId: string;
  taskId?: string;
  tags: string[];
  description?: string;
}

interface FileComment {
  id: string;
  fileId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  comment: string;
  createdAt: string;
}

interface ProjectFileSharingProps {
  project: Project;
  task?: ProjectTask;
  currentUserId?: string;
}

export function ProjectFileSharing({ project, task, currentUserId = 'member_1' }: ProjectFileSharingProps) {
  const { toast } = useToast();
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [comments, setComments] = useState<FileComment[]>([]);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [newComment, setNewComment] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const storageKey = `project_files_${project.id}${task ? `_task_${task.id}` : ''}`;
  const commentsKey = `file_comments_${project.id}`;

  useEffect(() => {
    loadFiles();
    loadComments();
  }, [project.id, task?.id]);

  const loadFiles = () => {
    const stored = localStorage.getItem(storageKey);
    setFiles(stored ? JSON.parse(stored) : []);
  };

  const loadComments = () => {
    const stored = localStorage.getItem(commentsKey);
    setComments(stored ? JSON.parse(stored) : []);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    setIsUploading(true);
    const members = projectManagementService.getMembers();
    const uploader = members.find(m => m.id === currentUserId);

    for (const file of Array.from(selectedFiles)) {
      // Simulate upload progress
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Create file object (in real app, would upload to server)
      const projectFile: ProjectFile = {
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file), // In real app, would be server URL
        uploadedBy: currentUserId,
        uploadedAt: new Date().toISOString(),
        projectId: project.id,
        taskId: task?.id,
        tags: [],
        description: ''
      };

      setTimeout(() => {
        setUploadProgress(100);
        const updatedFiles = [...files, projectFile];
        setFiles(updatedFiles);
        localStorage.setItem(storageKey, JSON.stringify(updatedFiles));
        
        clearInterval(interval);
        setUploadProgress(0);
        
        toast({
          title: "موفقیت",
          description: `فایل "${file.name}" با موفقیت آپلود شد`
        });
      }, 1000);
    }

    setIsUploading(false);
    event.target.value = '';
  };

  const deleteFile = (fileId: string) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    setFiles(updatedFiles);
    localStorage.setItem(storageKey, JSON.stringify(updatedFiles));
    
    toast({
      title: "موفقیت",
      description: "فایل حذف شد"
    });
  };

  const addComment = (fileId: string) => {
    if (!newComment.trim()) return;

    const members = projectManagementService.getMembers();
    const commenter = members.find(m => m.id === currentUserId);

    const comment: FileComment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fileId,
      userId: currentUserId,
      userName: commenter?.name || 'کاربر ناشناس',
      userAvatar: commenter?.avatar,
      comment: newComment.trim(),
      createdAt: new Date().toISOString()
    };

    const updatedComments = [...comments, comment];
    setComments(updatedComments);
    localStorage.setItem(commentsKey, JSON.stringify(updatedComments));
    setNewComment('');

    toast({
      title: "موفقیت",
      description: "نظر اضافه شد"
    });
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-5 w-5 text-green-500" />;
    if (type.startsWith('video/')) return <Video className="h-5 w-5 text-purple-500" />;
    if (type.includes('pdf') || type.includes('document')) return <FileText className="h-5 w-5 text-red-500" />;
    return <File className="h-5 w-5 text-blue-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileComments = (fileId: string) => {
    return comments.filter(c => c.fileId === fileId);
  };

  const members = projectManagementService.getMembers();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            اشتراک فایل
            {task && <Badge variant="outline">وظیفه: {task.title}</Badge>}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <label htmlFor="file-upload">
              <Button variant="outline" size="sm" className="cursor-pointer" asChild>
                <span>
                  <Upload className="h-4 w-4 ml-1" />
                  آپلود فایل
                </span>
              </Button>
            </label>
            <input
              id="file-upload"
              type="file"
              multiple
              className="hidden"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </div>
        </div>
        
        {isUploading && (
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-96">
          {files.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Upload className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>هنوز فایلی آپلود نشده است</p>
              <p className="text-xs mt-1">فایل‌های خود را اینجا آپلود کنید</p>
            </div>
          ) : (
            <div className="space-y-3">
              {files.map((file) => {
                const uploader = members.find(m => m.id === file.uploadedBy);
                const fileComments = getFileComments(file.id);
                
                return (
                  <div key={file.id} className="p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {getFileIcon(file.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm line-clamp-1">
                            {file.name}
                          </h4>
                          <div className="flex items-center gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setSelectedFile(file)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>{file.name}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span>اندازه: {formatFileSize(file.size)}</span>
                                    <span>•</span>
                                    <span>آپلود شده توسط: {uploader?.name}</span>
                                    <span>•</span>
                                    <span>{format(new Date(file.uploadedAt), 'dd/MM/yyyy HH:mm')}</span>
                                  </div>
                                  
                                  {file.type.startsWith('image/') && (
                                    <img 
                                      src={file.url} 
                                      alt={file.name}
                                      className="max-w-full h-auto rounded-lg"
                                    />
                                  )}
                                  
                                  {/* Comments */}
                                  <div className="border-t pt-4">
                                    <h4 className="font-medium mb-3">نظرات ({fileComments.length})</h4>
                                    
                                    <div className="space-y-3 mb-4">
                                      {fileComments.map((comment) => (
                                        <div key={comment.id} className="flex gap-2">
                                          <Avatar className="h-6 w-6">
                                            <AvatarImage src={comment.userAvatar} />
                                            <AvatarFallback className="text-xs">
                                              {comment.userName.charAt(0)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className="text-sm font-medium">
                                                {comment.userName}
                                              </span>
                                              <span className="text-xs text-muted-foreground">
                                                {format(new Date(comment.createdAt), 'HH:mm')}
                                              </span>
                                            </div>
                                            <p className="text-sm">{comment.comment}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    
                                    <div className="flex gap-2">
                                      <Textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="نظر خود را بنویسید..."
                                        className="flex-1"
                                        rows={2}
                                      />
                                      <Button
                                        onClick={() => addComment(file.id)}
                                        disabled={!newComment.trim()}
                                        size="sm"
                                      >
                                        ارسال
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            
                            <Button variant="ghost" size="sm" asChild>
                              <a href={file.url} download={file.name}>
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => deleteFile(file.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{formatFileSize(file.size)}</span>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{uploader?.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{format(new Date(file.uploadedAt), 'dd/MM HH:mm')}</span>
                          </div>
                          {fileComments.length > 0 && (
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              <span>{fileComments.length} نظر</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}