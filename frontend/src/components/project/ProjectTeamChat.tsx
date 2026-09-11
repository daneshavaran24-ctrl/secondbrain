import React, { useState, useEffect, useRef } from 'react';
import { Project, ProjectTask } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Users, PaperclipIcon } from 'lucide-react';
import { format } from 'date-fns';
import { projectManagementService } from '@/services/projectManagementService';

interface ChatMessage {
  id: string;
  projectId: string;
  taskId?: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  message: string;
  timestamp: string;
  type: 'text' | 'file' | 'system';
  attachments?: string[];
}

interface ProjectTeamChatProps {
  project: Project;
  task?: ProjectTask;
  currentUserId?: string;
}

export function ProjectTeamChat({ project, task, currentUserId = 'member_1' }: ProjectTeamChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const storageKey = `project_chat_${project.id}${task ? `_task_${task.id}` : ''}`;

  useEffect(() => {
    loadMessages();
  }, [project.id, task?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = () => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      setMessages(JSON.parse(stored));
    } else {
      // Initialize with welcome message
      const welcomeMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        projectId: project.id,
        taskId: task?.id,
        senderId: 'system',
        senderName: 'سیستم',
        message: task 
          ? `چت وظیفه "${task.title}" آغاز شد` 
          : `چت پروژه "${project.name}" آغاز شد`,
        timestamp: new Date().toISOString(),
        type: 'system'
      };
      setMessages([welcomeMessage]);
      localStorage.setItem(storageKey, JSON.stringify([welcomeMessage]));
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const members = projectManagementService.getMembers();
    const currentUser = members.find(m => m.id === currentUserId);

    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId: project.id,
      taskId: task?.id,
      senderId: currentUserId,
      senderName: currentUser?.name || 'کاربر ناشناس',
      senderAvatar: currentUser?.avatar,
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);
    localStorage.setItem(storageKey, JSON.stringify(updatedMessages));
    setNewMessage('');

    // Simulate typing indicator
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getMessageTime = (timestamp: string) => {
    return format(new Date(timestamp), 'HH:mm');
  };

  const members = projectManagementService.getMembers();
  const teamMembers = members.filter(m => project.teamMembers.includes(m.id));

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="h-5 w-5" />
            {task ? `چت وظیفه: ${task.title}` : `چت تیم پروژه`}
          </CardTitle>
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {teamMembers.length} نفر
          </Badge>
        </div>
        
        {/* Team members */}
        <div className="flex items-center gap-2 pt-2">
          {teamMembers.slice(0, 4).map((member) => (
            <Avatar key={member.id} className="h-6 w-6">
              <AvatarImage src={member.avatar} />
              <AvatarFallback className="text-xs">
                {member.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          ))}
          {teamMembers.length > 4 && (
            <span className="text-xs text-muted-foreground">
              +{teamMembers.length - 4} نفر دیگر
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* Messages */}
        <ScrollArea className="flex-1 mb-4" style={{ height: '300px' }}>
          <div className="space-y-3">
            {messages.map((message) => (
              <div key={message.id}>
                {message.type === 'system' ? (
                  <div className="text-center py-2">
                    <Badge variant="secondary" className="text-xs">
                      {message.message}
                    </Badge>
                  </div>
                ) : (
                  <div className={`flex gap-3 ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}>
                    {message.senderId !== currentUserId && (
                      <Avatar className="h-6 w-6 mt-1">
                        <AvatarImage src={message.senderAvatar} />
                        <AvatarFallback className="text-xs">
                          {message.senderName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`max-w-[70%] ${message.senderId === currentUserId ? 'text-right' : 'text-left'}`}>
                      {message.senderId !== currentUserId && (
                        <p className="text-xs text-muted-foreground mb-1">
                          {message.senderName}
                        </p>
                      )}
                      <div className={`rounded-lg px-3 py-2 ${
                        message.senderId === currentUserId
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}>
                        <p className="text-sm">{message.message}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getMessageTime(message.timestamp)}
                      </p>
                    </div>
                    {message.senderId === currentUserId && (
                      <Avatar className="h-6 w-6 mt-1">
                        <AvatarImage src={message.senderAvatar} />
                        <AvatarFallback className="text-xs">
                          {message.senderName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-current rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-current rounded-full animate-bounce delay-100"></div>
                  <div className="w-1 h-1 bg-current rounded-full animate-bounce delay-200"></div>
                </div>
                <span className="text-xs">در حال تایپ...</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message input */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-shrink-0">
            <PaperclipIcon className="h-4 w-4" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="پیام خود را تایپ کنید..."
            className="flex-1"
          />
          <Button onClick={sendMessage} size="sm" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}