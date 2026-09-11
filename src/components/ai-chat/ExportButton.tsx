import React, { useState } from 'react';
import { Download, FileText, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ExportButtonProps {
  sessionId: string;
  sessionTitle: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({ sessionId, sessionTitle }) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportToText = async () => {
    setIsExporting(true);
    try {
      const { data: messages, error } = await supabase
        .from('ai_chat_messages')
        .select('role, content, created_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      let text = `مکالمه: ${sessionTitle}\n`;
      text += `تاریخ صدور: ${new Date().toLocaleDateString('fa-IR')}\n\n`;
      text += '='.repeat(50) + '\n\n';

      messages?.forEach((msg) => {
        const role = msg.role === 'user' ? 'شما' : 'دستیار AI';
        const date = new Date(msg.created_at).toLocaleString('fa-IR');
        text += `[${role}] - ${date}\n`;
        text += `${msg.content}\n\n`;
        text += '-'.repeat(50) + '\n\n';
      });

      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-${sessionTitle.replace(/\s+/g, '-')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'موفق',
        description: 'فایل با موفقیت دانلود شد',
      });
    } catch (error) {
      console.error('Error exporting:', error);
      toast({
        title: 'خطا',
        description: 'خطا در صدور فایل',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToMarkdown = async () => {
    setIsExporting(true);
    try {
      const { data: messages, error } = await supabase
        .from('ai_chat_messages')
        .select('role, content, created_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      let markdown = `# ${sessionTitle}\n\n`;
      markdown += `**تاریخ صدور:** ${new Date().toLocaleDateString('fa-IR')}\n\n`;
      markdown += '---\n\n';

      messages?.forEach((msg) => {
        const role = msg.role === 'user' ? '👤 شما' : '🤖 دستیار AI';
        const date = new Date(msg.created_at).toLocaleString('fa-IR');
        markdown += `### ${role} - ${date}\n\n`;
        markdown += `${msg.content}\n\n`;
        markdown += '---\n\n';
      });

      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-${sessionTitle.replace(/\s+/g, '-')}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'موفق',
        description: 'فایل Markdown با موفقیت دانلود شد',
      });
    } catch (error) {
      console.error('Error exporting:', error);
      toast({
        title: 'خطا',
        description: 'خطا در صدور فایل',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span className="mr-2">صدور</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToText}>
          <FileText className="w-4 h-4 ml-2" />
          صدور به متن
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToMarkdown}>
          <FileText className="w-4 h-4 ml-2" />
          صدور به Markdown
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportButton;
