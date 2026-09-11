import { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Target, Map, GitBranch, ArrowLeft } from 'lucide-react';
import { OKRForm } from './strategy/OKRForm';
import { RoadmapForm } from './strategy/RoadmapForm';
import { DecisionLogForm } from './strategy/DecisionLogForm';
import { OKRList } from './strategy/OKRList';
import { RoadmapList } from './strategy/RoadmapList';
import { DecisionLogList } from './strategy/DecisionLogList';
import { OKRDetail } from './strategy/OKRDetail';
import { RoadmapDetail } from './strategy/RoadmapDetail';
import { DecisionLogDetail } from './strategy/DecisionLogDetail';
import { StrategyStats } from './strategy/StrategyStats';
import { StrategyFilters } from './strategy/StrategyFilters';
import { DeleteStrategyDialog } from './strategy/DeleteStrategyDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface StrategySectionProps {
  organizationId: string;
}

type ViewMode = 'list' | 'create' | 'edit' | 'detail';
type StrategyType = 'okr' | 'roadmap' | 'decisions';

export function StrategySection({ organizationId }: StrategySectionProps) {
  const [activeTab, setActiveTab] = useState<StrategyType>('okr');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [strategies, setStrategies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  
  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    loadStrategies();
    
    // Setup real-time subscription
    const channel = supabase
      .channel('strategy-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'organization_strategies',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          console.log('Strategy change detected:', payload);
          loadStrategies(); // Reload data
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab, organizationId]);

  const loadStrategies = async () => {
    setIsLoading(true);
    try {
      const typeMap: any = {
        okr: 'okr',
        roadmap: 'roadmap',
        decisions: 'decision_log'
      };

      const { data, error } = await (supabase as any)
        .from('organization_strategies')
        .select(`
          *,
          organization_okr_key_results(*),
          organization_roadmap_milestones(*),
          organization_decision_options(*)
        `)
        .eq('organization_id', organizationId)
        .eq('type', typeMap[activeTab]);

      if (error) throw error;
      setStrategies(data || []);
    } catch (error) {
      console.error('Error loading strategies:', error);
      toast.error('خطا در بارگذاری اطلاعات');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAndSortedStrategies = useMemo(() => {
    let filtered = [...strategies];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(s => {
        const title = (s.content as any)?.title || (s.content as any)?.objective || s.title || '';
        return title.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (activeTab === 'okr') {
        filtered = filtered.filter(s => (s.content as any)?.status === statusFilter);
      } else if (activeTab === 'roadmap') {
        filtered = filtered.filter(s => {
          const milestones = s.organization_roadmap_milestones || [];
          return milestones.some((m: any) => m.status === statusFilter);
        });
      } else if (activeTab === 'decisions') {
        filtered = filtered.filter(s => (s.content as any)?.impact === statusFilter);
      }
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === 'progress_high' || sortBy === 'progress_low') {
        // Calculate progress for comparison
        const getProgress = (strategy: any) => {
          if (activeTab === 'okr') {
            const krs = strategy.organization_okr_key_results || [];
            if (krs.length === 0) return 0;
            const totalWeight = krs.reduce((sum: number, kr: any) => sum + (kr.weight || 0), 0);
            if (totalWeight === 0) return 0;
            return krs.reduce((sum: number, kr: any) => {
              const progress = (kr.current_value / kr.target) * 100;
              return sum + (progress * (kr.weight || 0));
            }, 0) / totalWeight;
          } else if (activeTab === 'roadmap') {
            const milestones = strategy.organization_roadmap_milestones || [];
            if (milestones.length === 0) return 0;
            const completed = milestones.filter((m: any) => m.status === 'completed').length;
            return (completed / milestones.length) * 100;
          }
          return 0;
        };
        
        const aProgress = getProgress(a);
        const bProgress = getProgress(b);
        return sortBy === 'progress_high' ? bProgress - aProgress : aProgress - bProgress;
      }
      return 0;
    });

    return filtered;
  }, [strategies, searchQuery, statusFilter, sortBy, activeTab]);

  const handleEdit = (id: string) => {
    setSelectedItemId(id);
    setViewMode('edit');
  };

  const handleView = (id: string) => {
    setSelectedItemId(id);
    setViewMode('detail');
  };

  const handleDelete = (id: string) => {
    const strategy = strategies.find(s => s.id === id);
    if (strategy) {
      setItemToDelete({ 
        id, 
        title: (strategy.content as any)?.title || (strategy.content as any)?.objective || 'این مورد' 
      });
      setDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      const typeMap: Record<string, string> = {
        okr: 'organization_okr_key_results',
        roadmap: 'organization_roadmap_milestones',
        decisions: 'organization_decision_options'
      };

      // Delete related records
      const relatedTable = typeMap[activeTab] as 'organization_okr_key_results' | 'organization_roadmap_milestones' | 'organization_decision_options';
      await supabase
        .from(relatedTable)
        .delete()
        .eq('strategy_id', itemToDelete.id);

      // Delete main strategy
      const { error } = await supabase
        .from('organization_strategies')
        .delete()
        .eq('id', itemToDelete.id);

      if (error) throw error;

      toast.success('با موفقیت حذف شد');
      loadStrategies();
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error('Error deleting strategy:', error);
      toast.error('خطا در حذف');
    }
  };

  const handleSuccess = () => {
    setViewMode('list');
    loadStrategies();
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedItemId(null);
  };

  const getCounts = () => {
    const okrCount = strategies.filter(s => s.type === 'okr').length;
    const roadmapCount = strategies.filter(s => s.type === 'roadmap').length;
    const decisionCount = strategies.filter(s => s.type === 'decision_log').length;
    return { okrCount, roadmapCount, decisionCount };
  };

  const counts = getCounts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h2 className="text-2xl font-bold">استراتژی و تصمیم‌ها</h2>
          <p className="text-muted-foreground">مدیریت OKRها، نقشه راه و لاگ تصمیم‌ها</p>
        </div>
        {viewMode !== 'list' ? (
          <Button onClick={handleCancel} variant="outline">
            <ArrowLeft className="h-4 w-4 ml-2" />
            بازگشت
          </Button>
        ) : (
          <Button onClick={() => setViewMode('create')} className="bg-gradient-to-r from-primary to-primary/80">
            <Plus className="h-4 w-4 ml-2" />
            ایجاد جدید
          </Button>
        )}
      </motion.div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as StrategyType); setViewMode('list'); }}>
        <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1">
          <TabsTrigger value="okr" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span>OKRها</span>
            <Badge variant="secondary" className="mr-1">{counts.okrCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="roadmap" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            <span>نقشه راه</span>
            <Badge variant="secondary" className="mr-1">{counts.roadmapCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="decisions" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            <span>لاگ تصمیم</span>
            <Badge variant="secondary" className="mr-1">{counts.decisionCount}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="okr" className="space-y-6">
          {viewMode === 'list' ? (
            <>
              <StrategyStats type="okr" organizationId={organizationId} />
              <StrategyFilters
                type="okr"
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                sortBy={sortBy}
                onSortByChange={setSortBy}
              />
              <OKRList
                items={filteredAndSortedStrategies}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
              />
            </>
          ) : viewMode === 'create' ? (
            <OKRForm
              organizationId={organizationId}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          ) : viewMode === 'edit' && selectedItemId ? (
            <OKRForm
              organizationId={organizationId}
              existingData={strategies.find(s => s.id === selectedItemId)}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          ) : viewMode === 'detail' && selectedItemId ? (
            <OKRDetail 
              strategyId={selectedItemId}
              organizationId={organizationId}
              onEdit={() => setViewMode('edit')}
              onDelete={() => {
                handleDelete(selectedItemId);
                setViewMode('list');
              }}
              onBack={() => setViewMode('list')}
            />
          ) : null}
        </TabsContent>

        <TabsContent value="roadmap" className="space-y-6">
          {viewMode === 'list' ? (
            <>
              <StrategyStats type="roadmap" organizationId={organizationId} />
              <StrategyFilters
                type="roadmap"
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                sortBy={sortBy}
                onSortByChange={setSortBy}
              />
              <RoadmapList
                items={filteredAndSortedStrategies}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
              />
            </>
          ) : viewMode === 'create' ? (
            <RoadmapForm
              organizationId={organizationId}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          ) : viewMode === 'edit' && selectedItemId ? (
            <RoadmapForm
              organizationId={organizationId}
              existingData={strategies.find(s => s.id === selectedItemId)}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          ) : viewMode === 'detail' && selectedItemId ? (
            <RoadmapDetail 
              strategyId={selectedItemId}
              organizationId={organizationId}
              onEdit={() => setViewMode('edit')}
              onDelete={() => {
                handleDelete(selectedItemId);
                setViewMode('list');
              }}
              onBack={() => setViewMode('list')}
            />
          ) : null}
        </TabsContent>

        <TabsContent value="decisions" className="space-y-6">
          {viewMode === 'list' ? (
            <>
              <StrategyStats type="decisions" organizationId={organizationId} />
              <StrategyFilters
                type="decisions"
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                sortBy={sortBy}
                onSortByChange={setSortBy}
              />
              <DecisionLogList
                items={filteredAndSortedStrategies}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
              />
            </>
          ) : viewMode === 'create' ? (
            <DecisionLogForm
              organizationId={organizationId}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          ) : viewMode === 'edit' && selectedItemId ? (
            <DecisionLogForm
              organizationId={organizationId}
              existingData={strategies.find(s => s.id === selectedItemId)}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          ) : viewMode === 'detail' && selectedItemId ? (
            <DecisionLogDetail 
              strategyId={selectedItemId}
              organizationId={organizationId}
              onEdit={() => setViewMode('edit')}
              onDelete={() => {
                handleDelete(selectedItemId);
                setViewMode('list');
              }}
              onBack={() => setViewMode('list')}
            />
          ) : null}
        </TabsContent>
      </Tabs>

      <DeleteStrategyDialog
        isOpen={deleteDialogOpen}
        onClose={() => { setDeleteDialogOpen(false); setItemToDelete(null); }}
        onConfirm={confirmDelete}
        title={itemToDelete?.title || ''}
      />
    </div>
  );
}
