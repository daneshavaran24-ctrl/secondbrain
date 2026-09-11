import React from 'react';
import { Copy, Share2, RefreshCw, Bookmark, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface MessageActionsProps {
  content: string;
  messageId: string;
  onRegenerate?: () => void;
}

const MessageActions: React.FC<MessageActionsProps> = ({ content, messageId, onRegenerate }) => {
  const { toast } = useToast();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    toast({
      title: "کپی شد",
      description: "متن پیام کپی شد",
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          text: content,
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      handleCopy();
    }
  };

  const handleBookmark = () => {
    toast({
      title: "ذخیره شد",
      description: "پیام به لیست نشان‌شده‌ها اضافه شد",
    });
  };

  const handleRate = (isPositive: boolean) => {
    toast({
      title: isPositive ? "بازخورد مثبت ثبت شد" : "بازخورد منفی ثبت شد",
      description: "متشکریم از نظر شما",
    });
  };

  return (
    <div className="flex items-center gap-1 mt-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="h-7 px-2 text-xs hover:bg-accent"
      >
        <Copy className="w-3 h-3 ml-1" />
        کپی
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleShare}
        className="h-7 px-2 text-xs hover:bg-accent"
      >
        <Share2 className="w-3 h-3 ml-1" />
        اشتراک
      </Button>
      {onRegenerate && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRegenerate}
          className="h-7 px-2 text-xs hover:bg-accent"
        >
          <RefreshCw className="w-3 h-3 ml-1" />
          دوباره
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBookmark}
        className="h-7 px-2 text-xs hover:bg-accent"
      >
        <Bookmark className="w-3 h-3 ml-1" />
        ذخیره
      </Button>
      <div className="flex-1" />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleRate(true)}
        className="h-7 w-7 p-0 hover:bg-accent hover:text-green-600"
      >
        <ThumbsUp className="w-3 h-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleRate(false)}
        className="h-7 w-7 p-0 hover:bg-accent hover:text-red-600"
      >
        <ThumbsDown className="w-3 h-3" />
      </Button>
    </div>
  );
};

export default MessageActions;