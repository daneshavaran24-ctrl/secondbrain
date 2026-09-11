import { ResolutionComment } from "@/types";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns-jalali";
import { useState } from "react";

interface ResolutionCommentsProps {
  comments: ResolutionComment[];
  onAddComment: (comment: string) => void;
}

export const ResolutionComments = ({ comments, onAddComment }: ResolutionCommentsProps) => {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = () => {
    if (newComment.trim()) {
      onAddComment(newComment);
      setNewComment('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Comments List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {comments.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">
            هنوز نظری ثبت نشده است
          </Card>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} className="p-4 animate-fade-in">
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-sm">
                    {comment.user_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{comment.user_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { 
                        addSuffix: true
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {comment.comment}
                  </p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Comment Input */}
      <Card className="p-4">
        <div className="space-y-3">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="نظر خود را بنویسید..."
            className="min-h-[100px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                handleSubmit();
              }
            }}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              Ctrl + Enter برای ارسال
            </span>
            <Button onClick={handleSubmit} disabled={!newComment.trim()}>
              <Send className="h-4 w-4 ml-2" />
              ارسال نظر
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};