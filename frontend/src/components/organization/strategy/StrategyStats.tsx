import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Target, TrendingUp, CheckCircle, Clock, AlertCircle, Map, GitBranch, Flag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StrategyStatsProps {
  type: 'okr' | 'roadmap' | 'decisions';
  organizationId: string;
}

interface OKRStats {
  total: number;
  active: number;
  achieved: number;
  averageProgress: number;
}

interface RoadmapStats {
  total: number;
  completedMilestones: number;
  inProgressMilestones: number;
  blockedMilestones: number;
}

interface DecisionStats {
  total: number;
  highImpact: number;
  averageOptions: number;
  thisMonth: number;
}

export function StrategyStats({ type, organizationId }: StrategyStatsProps) {
  const [okrStats, setOkrStats] = useState<OKRStats>({ total: 0, active: 0, achieved: 0, averageProgress: 0 });
  const [roadmapStats, setRoadmapStats] = useState<RoadmapStats>({ total: 0, completedMilestones: 0, inProgressMilestones: 0, blockedMilestones: 0 });
  const [decisionStats, setDecisionStats] = useState<DecisionStats>({ total: 0, highImpact: 0, averageOptions: 0, thisMonth: 0 });

  useEffect(() => {
    loadStats();
  }, [type, organizationId]);

  const loadStats = async () => {
    try {
      if (type === 'okr') {
        const { data: strategies } = await (supabase as any)
          .from('organization_strategies')
          .select('*, organization_okr_key_results(*)')
          .eq('organization_id', organizationId)
          .eq('type', 'okr');

        if (strategies) {
          const total = strategies.length;
          const active = strategies.filter(s => (s.content as any)?.status === 'active').length;
          const achieved = strategies.filter(s => (s.content as any)?.status === 'achieved').length;
          
          let totalProgress = 0;
          strategies.forEach(s => {
            const krs = s.organization_okr_key_results || [];
            if (krs.length > 0) {
              const progress = krs.reduce((sum, kr) => {
                return sum + ((kr.current_value / kr.target) * (kr.weight || 0));
              }, 0) / krs.reduce((sum, kr) => sum + (kr.weight || 0), 0);
              totalProgress += progress || 0;
            }
          });
          
          setOkrStats({
            total,
            active,
            achieved,
            averageProgress: strategies.length > 0 ? Math.round((totalProgress / strategies.length) * 100) : 0
          });
        }
      } else if (type === 'roadmap') {
        const { data: strategies } = await (supabase as any)
          .from('organization_strategies')
          .select('*, organization_roadmap_milestones(*)')
          .eq('organization_id', organizationId)
          .eq('type', 'roadmap');

        if (strategies) {
          const total = strategies.length;
          let completed = 0, inProgress = 0, blocked = 0;
          
          strategies.forEach(s => {
            const milestones = s.organization_roadmap_milestones || [];
            completed += milestones.filter(m => m.status === 'completed').length;
            inProgress += milestones.filter(m => m.status === 'in-progress').length;
            blocked += milestones.filter(m => m.status === 'blocked').length;
          });
          
          setRoadmapStats({
            total,
            completedMilestones: completed,
            inProgressMilestones: inProgress,
            blockedMilestones: blocked
          });
        }
      } else if (type === 'decisions') {
        const { data: strategies } = await (supabase as any)
          .from('organization_strategies')
          .select('*, organization_decision_options(*)')
          .eq('organization_id', organizationId)
          .eq('type', 'decision_log');

        if (strategies) {
          const total = strategies.length;
          const highImpact = strategies.filter(s => 
            (s.content as any)?.impact === 'high' || (s.content as any)?.impact === 'critical'
          ).length;
          
          const totalOptions = strategies.reduce((sum, s) => 
            sum + (s.organization_decision_options?.length || 0), 0
          );
          const averageOptions = strategies.length > 0 ? Math.round(totalOptions / strategies.length) : 0;
          
          const thisMonth = strategies.filter(s => {
            const date = new Date((s.content as any)?.date || s.created_at);
            const now = new Date();
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
          }).length;
          
          setDecisionStats({
            total,
            highImpact,
            averageOptions,
            thisMonth
          });
        }
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  if (type === 'okr') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<Target />}
          label="کل OKRها"
          value={okrStats.total}
          gradient="from-violet-500 to-purple-500"
          delay={0}
        />
        <StatCard
          icon={<Clock />}
          label="OKRهای فعال"
          value={okrStats.active}
          gradient="from-blue-500 to-cyan-500"
          delay={0.1}
        />
        <StatCard
          icon={<CheckCircle />}
          label="محقق شده"
          value={okrStats.achieved}
          gradient="from-green-500 to-emerald-500"
          delay={0.2}
        />
        <StatCard
          icon={<TrendingUp />}
          label="میانگین پیشرفت"
          value={`${okrStats.averageProgress}%`}
          gradient="from-orange-500 to-amber-500"
          delay={0.3}
        />
      </div>
    );
  }

  if (type === 'roadmap') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<Map />}
          label="کل نقشه‌ها"
          value={roadmapStats.total}
          gradient="from-emerald-500 to-teal-500"
          delay={0}
        />
        <StatCard
          icon={<CheckCircle />}
          label="تکمیل شده"
          value={roadmapStats.completedMilestones}
          gradient="from-green-500 to-lime-500"
          delay={0.1}
        />
        <StatCard
          icon={<Clock />}
          label="در حال انجام"
          value={roadmapStats.inProgressMilestones}
          gradient="from-blue-500 to-indigo-500"
          delay={0.2}
        />
        <StatCard
          icon={<AlertCircle />}
          label="مسدود شده"
          value={roadmapStats.blockedMilestones}
          gradient="from-red-500 to-rose-500"
          delay={0.3}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        icon={<GitBranch />}
        label="کل تصمیمات"
        value={decisionStats.total}
        gradient="from-indigo-500 to-purple-500"
        delay={0}
      />
      <StatCard
        icon={<AlertCircle />}
        label="تأثیر بالا"
        value={decisionStats.highImpact}
        gradient="from-orange-500 to-red-500"
        delay={0.1}
      />
      <StatCard
        icon={<Flag />}
        label="میانگین گزینه‌ها"
        value={decisionStats.averageOptions}
        gradient="from-cyan-500 to-blue-500"
        delay={0.2}
      />
      <StatCard
        icon={<Clock />}
        label="این ماه"
        value={decisionStats.thisMonth}
        gradient="from-pink-500 to-rose-500"
        delay={0.3}
      />
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  gradient: string;
  delay: number;
}

function StatCard({ icon, label, value, gradient, delay }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Card className="relative overflow-hidden hover:shadow-luxury-soft transition-all duration-300">
        <div className={`absolute top-0 left-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-10 rounded-full -ml-12 -mt-12`} />
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{label}</p>
              <p className="text-3xl font-bold">{value}</p>
            </div>
            <div className={`p-3 bg-gradient-to-br ${gradient} bg-opacity-10 rounded-lg`}>
              <div className="text-white [&>svg]:w-6 [&>svg]:h-6">
                {icon}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
