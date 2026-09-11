import React from 'react';
import { Button } from '@/components/ui/button';
import { Lightbulb, HelpCircle, TrendingUp } from 'lucide-react';

interface QuickRepliesProps {
  sessionType: 'mentor' | 'coach' | 'decision-maker';
  onSelect: (text: string) => void;
}

const QuickReplies: React.FC<QuickRepliesProps> = ({ sessionType, onSelect }) => {
  const suggestions = {
    mentor: [
      { icon: <Lightbulb className="w-4 h-4" />, text: "چطور می‌تونم اهداف SMART تعیین کنم؟" },
      { icon: <TrendingUp className="w-4 h-4" />, text: "روش‌های افزایش انگیزه رو بهم بگو" },
      { icon: <HelpCircle className="w-4 h-4" />, text: "چطور با چالش‌ها کنار بیام؟" },
    ],
    coach: [
      { icon: <Lightbulb className="w-4 h-4" />, text: "نقاط قوت و ضعف من رو تحلیل کن" },
      { icon: <TrendingUp className="w-4 h-4" />, text: "یه برنامه بهبود بهم پیشنهاد بده" },
      { icon: <HelpCircle className="w-4 h-4" />, text: "چطور مهارت‌هام رو توسعه بدم؟" },
    ],
    'decision-maker': [
      { icon: <Lightbulb className="w-4 h-4" />, text: "گزینه‌های من رو تحلیل کن" },
      { icon: <TrendingUp className="w-4 h-4" />, text: "ریسک و فرصت‌ها چیه؟" },
      { icon: <HelpCircle className="w-4 h-4" />, text: "بهترین تصمیم کدومه؟" },
    ],
  };

  const currentSuggestions = suggestions[sessionType] || suggestions.mentor;

  return (
    <div className="flex gap-2 flex-wrap mb-4">
      {currentSuggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => onSelect(suggestion.text)}
          className="gap-2 text-sm"
        >
          {suggestion.icon}
          {suggestion.text}
        </Button>
      ))}
    </div>
  );
};

export default QuickReplies;