import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Sun, Moon, Settings, Plus, X } from "lucide-react";
import { toPersianNumbers } from "@/utils/persian-numbers";

interface TimeZone {
  id: string;
  name: string;
  timezone: string;
  flag?: string;
}

const defaultTimeZones: TimeZone[] = [
  { id: 'tehran', name: 'تهران', timezone: 'Asia/Tehran', flag: '🇮🇷' },
  { id: 'dubai', name: 'دبی', timezone: 'Asia/Dubai', flag: '🇦🇪' },
  { id: 'london', name: 'لندن', timezone: 'Europe/London', flag: '🇬🇧' },
  { id: 'newyork', name: 'نیویورک', timezone: 'America/New_York', flag: '🇺🇸' },
  { id: 'tokyo', name: 'توکیو', timezone: 'Asia/Tokyo', flag: '🇯🇵' },
];

interface WorldClockProps {
  className?: string;
  compact?: boolean;
  customTimeZones?: TimeZone[];
}

export const WorldClock: React.FC<WorldClockProps> = ({
  className,
  compact = false,
  customTimeZones,
}) => {
  const [times, setTimes] = useState<{[key: string]: Date}>({});
  const [selectedTimeZones, setSelectedTimeZones] = useState<TimeZone[]>(
    customTimeZones || defaultTimeZones.slice(0, 3)
  );
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const updateTimes = () => {
      const newTimes: {[key: string]: Date} = {};
      selectedTimeZones.forEach(tz => {
        newTimes[tz.id] = new Date();
      });
      setTimes(newTimes);
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, [selectedTimeZones]);

  const formatTime = (date: Date, timezone: string): string => {
    return new Intl.DateTimeFormat('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone,
    }).format(date);
  };

  const formatDate = (date: Date, timezone: string): string => {
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: timezone,
    }).format(date);
  };

  const isDaytime = (date: Date, timezone: string): boolean => {
    const hour = parseInt(new Intl.DateTimeFormat('en', {
      hour: 'numeric',
      hour12: false,
      timeZone: timezone,
    }).format(date));
    return hour >= 6 && hour < 18;
  };

  const addTimeZone = (timezone: TimeZone) => {
    if (!selectedTimeZones.find(tz => tz.id === timezone.id)) {
      setSelectedTimeZones([...selectedTimeZones, timezone]);
    }
  };

  const removeTimeZone = (timezoneId: string) => {
    setSelectedTimeZones(selectedTimeZones.filter(tz => tz.id !== timezoneId));
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-4", className)}>
        {selectedTimeZones.slice(0, 2).map((tz) => (
          <div key={tz.id} className="flex items-center gap-2 text-sm">
            <span className="text-lg">{tz.flag}</span>
            <div className="text-right">
              <div className="font-mono font-semibold">
                {toPersianNumbers(formatTime(times[tz.id] || new Date(), tz.timezone))}
              </div>
              <div className="text-xs text-muted-foreground">{tz.name}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          <h3 className="font-semibold">ساعت جهانی</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {selectedTimeZones.map((tz) => {
          const currentTime = times[tz.id] || new Date();
          const isDay = isDaytime(currentTime, tz.timezone);
          
          return (
            <div
              key={tz.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{tz.flag}</span>
                <div>
                  <div className="font-medium">{tz.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(currentTime, tz.timezone)}
                  </div>
                </div>
              </div>
              
              <div className="text-left">
                <div className="font-mono text-lg font-semibold">
                  {toPersianNumbers(formatTime(currentTime, tz.timezone))}
                </div>
                <div className="flex items-center gap-1 justify-end">
                  {isDay ? (
                    <Sun className="h-3 w-3 text-yellow-500" />
                  ) : (
                    <Moon className="h-3 w-3 text-blue-500" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {isDay ? 'روز' : 'شب'}
                  </span>
                </div>
              </div>

              {showSettings && selectedTimeZones.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTimeZone(tz.id)}
                  className="p-1 h-6 w-6"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {showSettings && (
        <div className="mt-4 pt-4 border-t">
          <div className="text-sm font-medium mb-2">منطقه زمانی اضافه کنید:</div>
          <div className="grid grid-cols-2 gap-2">
            {defaultTimeZones
              .filter(tz => !selectedTimeZones.find(selected => selected.id === tz.id))
              .map((tz) => (
                <Button
                  key={tz.id}
                  variant="outline"
                  size="sm"
                  onClick={() => addTimeZone(tz)}
                  className="justify-start gap-2"
                >
                  <span>{tz.flag}</span>
                  {tz.name}
                </Button>
              ))}
          </div>
        </div>
      )}
    </Card>
  );
};