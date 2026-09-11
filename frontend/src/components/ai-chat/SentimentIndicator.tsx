import React from 'react';
import { Smile, Meh, Frown } from 'lucide-react';

interface SentimentIndicatorProps {
  sentiment?: string;
}

const SentimentIndicator: React.FC<SentimentIndicatorProps> = ({ sentiment }) => {
  if (!sentiment) return null;

  const getSentimentIcon = () => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return <Smile className="w-4 h-4 text-green-500" />;
      case 'neutral':
        return <Meh className="w-4 h-4 text-yellow-500" />;
      case 'negative':
        return <Frown className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getSentimentLabel = () => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return 'مثبت';
      case 'neutral':
        return 'خنثی';
      case 'negative':
        return 'منفی';
      default:
        return '';
    }
  };

  return (
    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/50 text-xs">
      {getSentimentIcon()}
      <span>{getSentimentLabel()}</span>
    </div>
  );
};

export default SentimentIndicator;
