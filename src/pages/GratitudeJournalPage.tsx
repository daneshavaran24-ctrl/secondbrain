import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TextInputWithVoice } from "@/components/ui/text-input-with-voice";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Heart, Plus, Calendar as CalendarIcon, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import GratitudeQuoteDisplay from "@/components/gratitude/GratitudeQuoteDisplay";
import { Session } from "@supabase/supabase-js";
import { gratitudeLocalService } from "@/services/gratitudeLocalService";
import { enhancedGratitudeService } from "@/services/enhancedGratitudeService";

interface GratitudeEntry {
  id: string;
  date: string;
  content: string;
  mood?: string;
  tags?: string[];
  created_at: string;
}

const GratitudeJournalPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [entries, setEntries] = useState<GratitudeEntry[]>([]);
  const [todayEntry, setTodayEntry] = useState<GratitudeEntry | null>(null);
  const [gratitudeContent, setGratitudeContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const { toast } = useToast();

  const fetchEntries = async () => {
    try {
      if (session?.user) {
        // Fetch from enhanced service for authenticated users
        const data = await enhancedGratitudeService.getAllEntries(session.user.id);
        setEntries(data);
        
        // Find today's entry
        const today = format(new Date(), 'yyyy-MM-dd');
        const todayData = await enhancedGratitudeService.getEntryForDate(today, session.user.id);
        setTodayEntry(todayData || null);
        
        if (todayData) {
          setGratitudeContent(todayData.content || "");
        }
      } else {
        // Load from local storage for non-authenticated users
        const localEntries = gratitudeLocalService.getAll();
        setEntries(localEntries as any);
        
        // Find today's entry
        const today = format(new Date(), 'yyyy-MM-dd');
        const todayData = gratitudeLocalService.getForDate(today);
        setTodayEntry(todayData as any || null);
        
        if (todayData) {
          setGratitudeContent(todayData.gratitude_item_1 || "");
        }
      }
    } catch (error: any) {
      console.error('Error fetching gratitude entries:', error);
      toast({
        title: "خطا",
        description: `امکان بارگیری ورودی‌های شکرگذاری وجود ندارد: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const saveGratitudeEntry = async () => {
    if (!gratitudeContent.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً مورد شکرگذاری خود را وارد کنید",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      if (session?.user) {
        // Save using enhanced service for authenticated users
        await enhancedGratitudeService.saveEntry(
          today,
          gratitudeContent.trim(),
          undefined,
          [],
          [],
          [],
          session.user.id,
          todayEntry?.id
        );

        toast({
          title: "ذخیره شد",
          description: "شکرگذاری امروز شما با موفقیت ثبت شد",
        });
      } else {
        // Save to local storage for non-authenticated users
        gratitudeLocalService.upsertForDate(today, { gratitude_item_1: gratitudeContent.trim() }, [], []);
        
        toast({
          title: "ذخیره شد",
          description: "شکرگذاری امروز شما روی این دستگاه ذخیره شد",
        });
      }

      fetchEntries();
    } catch (error: any) {
      console.error('Error saving gratitude entry:', error);
      toast({
        title: "خطا",
        description: `امکان ذخیره شکرگذاری وجود ندارد: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      // Always fetch entries regardless of auth status
      fetchEntries();
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        // Always fetch entries when auth state changes
        setTimeout(() => {
          fetchEntries();
        }, 0);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Realtime subscription for gratitude entries - auto-refresh when assistant saves
  useEffect(() => {
    if (!session?.user) return;

    const channel = supabase
      .channel('gratitude-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gratitude_entries',
          filter: `user_id=eq.${session.user.id}`
        },
        (payload) => {
          console.log('[Gratitude] Realtime update:', payload);
          fetchEntries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  // Fallback polling every 10 seconds for guaranteed updates
  useEffect(() => {
    if (!session?.user) return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchEntries();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [session?.user?.id]);

  const selectedDateEntry = entries.find(
    entry => entry.date === format(selectedDate, 'yyyy-MM-dd')
  );

  const entriesWithData = entries.filter(entry => entry.date);
  const datesWithEntries = entriesWithData.map(entry => new Date(entry.date));

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto p-6 md:p-8 space-y-8">
        {/* Hero Header - Modern & Elegant */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-luxury-rose p-8 md:p-12 shadow-luxury-glow">
          <div className="absolute inset-0 bg-gradient-glow opacity-30"></div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
              <Heart className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">دفتر شکرگذاری</h1>
              <p className="text-white/90 text-lg">هر روز، سه چیز که بابتشان شکرگذارم...</p>
            </div>
          </div>
        </div>

        {/* Inspirational Quote Display */}
        <GratitudeQuoteDisplay />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Gratitude Entry Form - Modern Card */}
        <div className="bg-gradient-card backdrop-blur-sm rounded-2xl p-8 shadow-elegant border border-border/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">شکرگذاری امروز</h2>
          </div>
          
          <div className="space-y-6">
            <TextInputWithVoice
              id="content"
              value={gratitudeContent}
              onChange={setGratitudeContent}
              type="textarea"
              placeholder="امروز بابت چه چیزی شکرگذارم..."
              rows={8}
              enableVoice={true}
              label="شکرگذاری امروز *"
              className="rounded-xl border-2 focus:border-primary transition-all bg-background/50"
            />
            
            <Button
              onClick={saveGratitudeEntry} 
              disabled={isLoading}
              className="w-full h-12 text-lg font-medium rounded-xl bg-gradient-primary hover:shadow-glow transition-all duration-300"
            >
              {isLoading ? "در حال ذخیره..." : todayEntry ? "بروزرسانی" : "ثبت شکرگذاری"}
            </Button>
          </div>
        </div>

        {/* Calendar View - Modern Card */}
        <div className="bg-gradient-card backdrop-blur-sm rounded-2xl p-8 shadow-elegant border border-border/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-accent/10 rounded-xl">
              <CalendarIcon className="h-6 w-6 text-accent" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-luxury-rose bg-clip-text text-transparent">تقویم شکرگذاری</h2>
          </div>
          
          <div className="bg-background/50 rounded-xl p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              modifiers={{
                hasEntry: datesWithEntries
              }}
              modifiersStyles={{
                hasEntry: { 
                  backgroundColor: 'hsl(var(--accent))', 
                  color: 'white',
                  borderRadius: '50%',
                  fontWeight: 'bold'
                }
              }}
              className="rounded-xl border-0 pointer-events-auto"
            />
          </div>
          
          {selectedDateEntry && (
            <div className="mt-4 space-y-3">
              <h3 className="font-medium">شکرگذاری {format(selectedDate, 'yyyy/MM/dd')}</h3>
              <p className="text-sm bg-muted p-2 rounded">{selectedDateEntry.content}</p>
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-gradient-card backdrop-blur-sm rounded-2xl p-8 shadow-elegant border border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-app-readable">آمار شکرگذاری</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{entries.length}</div>
            <div className="text-sm text-muted-foreground">کل روزهای ثبت شده</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {entries.filter(entry => 
                new Date(entry.date).getMonth() === new Date().getMonth()
              ).length}
            </div>
            <div className="text-sm text-muted-foreground">این ماه</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {entries.filter(entry => 
                Date.now() - new Date(entry.date).getTime() < 7 * 24 * 60 * 60 * 1000
              ).length}
            </div>
            <div className="text-sm text-muted-foreground">هفته گذشته</div>
          </div>
        </div>
      </div>

      {/* Recent Entries */}
      {entries.length > 0 && (
        <div className="bg-gradient-card backdrop-blur-sm rounded-2xl p-8 shadow-elegant border border-border/50">
          <h2 className="text-xl font-semibold text-app-readable mb-4">شکرگذاری‌های اخیر</h2>
          <div className="space-y-3">
            {entries.slice(0, 5).map((entry) => (
              <div key={entry.id} className="border rounded-lg p-3">
                <Badge variant="outline" className="mb-2">
                  {format(new Date(entry.date), 'yyyy/MM/dd')}
                </Badge>
                <p className="text-sm">{entry.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default GratitudeJournalPage;