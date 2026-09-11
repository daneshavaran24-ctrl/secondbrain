import { useState, useEffect } from "react";
import { ModernCard } from "@/components/ui/modern-card";
import { ModernButton } from "@/components/ui/modern-button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TextInputWithVoice } from "@/components/ui/text-input-with-voice";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VoiceRecorder } from "@/components/journal/VoiceRecorder";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { 
  BookOpen, 
  Heart, 
  PenTool, 
  Image, 
  Video, 
  Link, 
  Search,
  Filter,
  Calendar,
  Star,
  Edit3,
  Trash2,
  Upload,
  Tag,
  Moon,
  Sun,
  Sparkles,
  Brain,
  Coffee,
  Mic,
  Loader2
} from "lucide-react";

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  type: string;
  tags: string[];
  mood: string;
  createdAt: string;
  media: string[];
  favorite: boolean;
}

const PersonalJournalPage = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newEntry, setNewEntry] = useState({
    title: "",
    content: "",
    type: "دل‌نوشته",
    tags: [],
    mood: "خنثی"
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("همه");

  const entryTypes = ["دل‌نوشته", "شعر", "خاطره", "ایده", "خواب"];
  const moods = ["شاد", "غمگین", "امیدوار", "نگران", "آرام", "هیجان‌زده", "خنثی"];

  // Fetch entries from Supabase
  const fetchEntries = async () => {
    if (!session?.user) {
      setIsLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('author_id', session.user.id)
        .eq('category', 'دل‌نوشته')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setEntries(data?.map(item => ({
        id: item.id,
        title: item.title || 'بدون عنوان',
        content: item.content || '',
        type: 'دل‌نوشته',
        tags: item.tags || [],
        mood: 'خنثی',
        createdAt: item.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        media: [],
        favorite: false
      })) || []);
    } catch (error) {
      console.error('Error fetching journals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auth initialization
  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };
    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Fetch entries when session changes
  useEffect(() => {
    if (session?.user) {
      fetchEntries();
    } else {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  // Realtime subscription for journal entries
  useEffect(() => {
    if (!session?.user) return;

    const channel = supabase
      .channel('journal-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'knowledge_base', filter: `author_id=eq.${session.user.id}` },
        () => fetchEntries()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session?.user?.id]);

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.title.includes(searchTerm) || entry.content.includes(searchTerm);
    const matchesType = filterType === "همه" || entry.type === filterType;
    return matchesSearch && matchesType;
  });

  const getEntryTypeColor = (type: string) => {
    switch (type) {
      case "شعر": return "bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20 text-purple-700 dark:text-purple-300";
      case "خاطره": return "bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300";
      case "دل‌نوشته": return "bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300";
      case "ایده": return "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20 text-green-700 dark:text-green-300";
      case "خواب": return "bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border-indigo-500/20 text-indigo-700 dark:text-indigo-300";
      default: return "bg-muted/50 border-border text-muted-foreground";
    }
  };

  const getEntryTypeIcon = (type: string) => {
    switch (type) {
      case "شعر": return <Sparkles className="h-4 w-4" />;
      case "خاطره": return <Heart className="h-4 w-4" />;
      case "دل‌نوشته": return <PenTool className="h-4 w-4" />;
      case "ایده": return <Brain className="h-4 w-4" />;
      case "خواب": return <Moon className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case "شاد": return "hsl(var(--mood-happy))";
      case "غمگین": return "hsl(var(--mood-sad))";
      case "امیدوار": return "hsl(var(--mood-hopeful))";
      case "نگران": return "hsl(var(--mood-worried))";
      case "آرام": return "hsl(var(--mood-calm))";
      case "هیجان‌زده": return "hsl(var(--mood-excited))";
      default: return "hsl(var(--muted-foreground))";
    }
  };

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case "شاد": return "😊";
      case "غمگین": return "😢";
      case "امیدوار": return "🌟";
      case "نگران": return "😰";
      case "آرام": return "😌";
      case "هیجان‌زده": return "🤩";
      default: return "😐";
    }
  };

  const getContentFont = (type: string) => {
    return type === "شعر" ? "font-poetry" : "font-prose";
  };

  const handleSaveEntry = async () => {
    if (!session?.user) {
      console.error('User not authenticated');
      return;
    }

    try {
      const now = new Date().toISOString();
      const newEntryData = {
        author_id: session.user.id,
        title: newEntry.title || `دل‌نوشته ${new Date().toLocaleDateString('fa-IR')}`,
        content: newEntry.content,
        category: 'دل‌نوشته',
        tags: newEntry.tags.length > 0 ? newEntry.tags : [newEntry.type, newEntry.mood],
        created_at: now,
        updated_at: now
      };

      const { error } = await supabase
        .from('knowledge_base')
        .insert([newEntryData]);

      if (error) throw error;

      // Refresh entries after save
      await fetchEntries();
      
      setNewEntry({
        title: "",
        content: "",
        type: "دل‌نوشته",
        tags: [],
        mood: "خنثی"
      });
      setShowNewEntry(false);
    } catch (error) {
      console.error('Error saving entry:', error);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!session?.user) return;
    
    try {
      const { error } = await supabase
        .from('knowledge_base')
        .delete()
        .eq('id', id)
        .eq('author_id', session.user.id);
      
      if (error) throw error;
      
      setEntries(entries.filter(entry => entry.id !== id));
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const toggleFavorite = (id: string) => {
    setEntries(entries.map(entry =>
      entry.id === id ? { ...entry, favorite: !entry.favorite } : entry
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl backdrop-blur-sm">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            دل‌نوشته‌ها
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            مجموعه شخصی از شعر، خاطرات و تأملات زندگی
          </p>
          
          <div className="flex gap-3 mt-6">
            <ModernButton 
              onClick={() => setShowNewEntry(true)}
              icon={<Edit3 className="h-4 w-4" />}
              glow
              magnetic
            >
              نوشته جدید
            </ModernButton>
            <ModernButton 
              onClick={() => setShowVoiceRecorder(true)}
              icon={<Mic className="h-4 w-4" />}
              variant="outline"
              glow
            >
              ضبط صوتی
            </ModernButton>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 animate-slide-up">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="جستجو در نوشته‌ها..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 bg-card/50 backdrop-blur-sm border-border/50"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full md:w-[200px] bg-card/50 backdrop-blur-sm border-border/50">
              <Filter className="h-4 w-4 ml-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="همه">همه انواع</SelectItem>
              {entryTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* New Entry Form */}
        {showNewEntry && (
          <div className="animate-scale-in">
            <ModernCard
              title="نوشته جدید"
              icon={<PenTool className="h-5 w-5" />}
              className="bg-card/80 backdrop-blur-md border-border/50"
              glow
            >
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <TextInputWithVoice
                      value={newEntry.title}
                      onChange={(title) => setNewEntry({...newEntry, title})}
                      type="input"
                      placeholder="عنوان نوشته"
                      enableVoice={true}
                      label="عنوان"
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">نوع</label>
                    <Select value={newEntry.type} onValueChange={(value) => setNewEntry({...newEntry, type: value})}>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {entryTypes.map(type => (
                          <SelectItem key={type} value={type}>
                            <div className="flex items-center gap-2">
                              {getEntryTypeIcon(type)}
                              {type}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <TextInputWithVoice
                    value={newEntry.content}
                    onChange={(content) => setNewEntry({...newEntry, content})}
                    type="textarea"
                    placeholder="متن نوشته خود را اینجا بنویسید یا از voice استفاده کنید..."
                    rows={8}
                    enableVoice={true}
                    label="متن"
                    className={`bg-background/50 ${getContentFont(newEntry.type)}`}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">حالت</label>
                    <Select value={newEntry.mood} onValueChange={(value) => setNewEntry({...newEntry, mood: value})}>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {moods.map(mood => (
                          <SelectItem key={mood} value={mood}>
                            <div className="flex items-center gap-2">
                              <span>{getMoodEmoji(mood)}</span>
                              <span>{mood}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">فایل‌های ضمیمه</label>
                    <div className="flex gap-2">
                      <ModernButton variant="outline" size="sm" icon={<Image className="h-4 w-4" />}>
                        عکس
                      </ModernButton>
                      <ModernButton variant="outline" size="sm" icon={<Video className="h-4 w-4" />}>
                        فیلم
                      </ModernButton>
                      <ModernButton variant="outline" size="sm" icon={<Link className="h-4 w-4" />}>
                        لینک
                      </ModernButton>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border/30">
                  <ModernButton variant="outline" onClick={() => setShowNewEntry(false)}>
                    انصراف
                  </ModernButton>
                  <ModernButton 
                    onClick={handleSaveEntry}
                    icon={<Heart className="h-4 w-4" />}
                    glow
                  >
                    ذخیره نوشته
                  </ModernButton>
                </div>
              </div>
            </ModernCard>
          </div>
        )}

        {/* Voice Recorder Modal */}
        <Dialog open={showVoiceRecorder} onOpenChange={setShowVoiceRecorder}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-center">ضبط صوتی دل‌نوشته</DialogTitle>
            </DialogHeader>
            <VoiceRecorder
              onTextReceived={(text) => {
                setNewEntry({...newEntry, content: newEntry.content + (newEntry.content ? '\n\n' : '') + text});
                setShowVoiceRecorder(false);
                setShowNewEntry(true);
              }}
              onCancel={() => setShowVoiceRecorder(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Entries Grid */}
        {filteredEntries.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="max-w-md mx-auto space-y-6">
              <div className="p-6 bg-gradient-to-r from-muted/50 to-muted/30 rounded-3xl backdrop-blur-sm">
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  هنوز نوشته‌ای ندارید
                </h3>
                <p className="text-muted-foreground mb-6">
                  اولین دل‌نوشته، شعر یا خاطره خود را بنویسید
                </p>
                <ModernButton 
                  onClick={() => setShowNewEntry(true)}
                  icon={<Edit3 className="h-4 w-4" />}
                  glow
                >
                  شروع نوشتن
                </ModernButton>
              </div>
            </div>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {filteredEntries.map((entry, index) => (
            <div key={entry.id} className="break-inside-avoid animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <ModernCard
                title=""
                className={`bg-card/60 backdrop-blur-md border-border/30 hover:bg-card/80 transition-all duration-500 ${
                  entry.favorite ? 'ring-2 ring-primary/20' : ''
                }`}
                hover
                glow={entry.favorite}
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <h3 className="text-lg font-semibold text-foreground leading-tight">
                        {entry.title}
                      </h3>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`${getEntryTypeColor(entry.type)} text-xs font-medium px-2 py-1`}>
                          <div className="flex items-center gap-1">
                            {getEntryTypeIcon(entry.type)}
                            {entry.type}
                          </div>
                        </Badge>
                        
                        <div 
                          className="flex items-center gap-1 text-sm px-2 py-1 rounded-full"
                          style={{ 
                            backgroundColor: `${getMoodColor(entry.mood)}20`,
                            color: getMoodColor(entry.mood)
                          }}
                        >
                          <span>{getMoodEmoji(entry.mood)}</span>
                          <span className="font-medium">{entry.mood}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      <ModernButton 
                        variant="ghost" 
                        size="sm"
                        onClick={() => toggleFavorite(entry.id)}
                        className={entry.favorite ? 'text-primary' : ''}
                      >
                        <Star className={`h-4 w-4 ${entry.favorite ? 'fill-current' : ''}`} />
                      </ModernButton>
                      <ModernButton variant="ghost" size="sm">
                        <Edit3 className="h-4 w-4" />
                      </ModernButton>
                      <ModernButton 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </ModernButton>
                    </div>
                  </div>

                  {/* Content */}
                  <div className={`text-muted-foreground leading-relaxed ${getContentFont(entry.type)}`}>
                    <p className="whitespace-pre-line">
                      {entry.content.length > 200 
                        ? `${entry.content.substring(0, 200)}...`
                        : entry.content
                      }
                    </p>
                  </div>
                  
                  {/* Media */}
                  {entry.media.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {entry.media.map((media, index) => (
                        <Badge key={index} variant="outline" className="text-xs bg-muted/50">
                          <div className="flex items-center gap-1">
                            {media.includes('.mp4') ? <Video className="h-3 w-3" /> : <Image className="h-3 w-3" />}
                            {media}
                          </div>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/20">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>{entry.createdAt}</span>
                    </div>
                    
                    {entry.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {entry.tags.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs bg-muted/30">
                            <Tag className="h-3 w-3 ml-1" />
                            {tag}
                          </Badge>
                        ))}
                        {entry.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs bg-muted/30">
                            +{entry.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </ModernCard>
            </div>
           ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalJournalPage;