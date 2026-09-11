/**
 * Voice Response Toggle Component
 * Switch for enabling/disabling TTS responses
 */

import { Volume2, VolumeX } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { usePersianTTS } from '@/hooks/usePersianTTS';
import { cn } from '@/lib/utils';

interface VoiceToggleProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'default';
}

export function VoiceToggle({ 
  className, 
  showLabel = true,
  size = 'default' 
}: VoiceToggleProps) {
  const { isEnabled, toggleEnabled, isSupported, isSpeaking } = usePersianTTS();

  if (!isSupported) {
    return null;
  }

  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const Icon = isEnabled ? Volume2 : VolumeX;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Switch
        id="voice-toggle"
        checked={isEnabled}
        onCheckedChange={toggleEnabled}
        aria-label={isEnabled ? 'غیرفعال کردن پاسخ صوتی' : 'فعال کردن پاسخ صوتی'}
      />
      {showLabel && (
        <Label 
          htmlFor="voice-toggle" 
          className="flex items-center gap-2 cursor-pointer text-sm"
        >
          <Icon 
            className={cn(
              iconSize,
              'transition-colors',
              isEnabled ? 'text-primary' : 'text-muted-foreground',
              isSpeaking && 'animate-pulse text-green-500'
            )} 
          />
          <span className="text-foreground">پاسخ با صدا</span>
        </Label>
      )}
    </div>
  );
}
