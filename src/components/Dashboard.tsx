import { useState, useEffect } from "react"
import { ModernCard } from "@/components/ui/modern-card"
import { ModernButton } from "@/components/ui/modern-button"
import { SectionHeader } from "@/components/ui/section-header"
import { ProgressCharts } from "@/components/ui/progress-charts"
import { PersianNumber } from "@/components/ui/persian-number"
import SecretaryRequestsPanel from "@/components/Secretary/SecretaryRequestsPanel"
import { QuickActions } from "@/components/core/QuickActions"
import { SampleDataInitializer } from "@/components/ui/sample-data-initializer"
import CleanupCompleteButton from "@/components/debug/CleanupCompleteButton"
import { Calendar, MessageCircle, Target, Lightbulb, TrendingUp, Clock, Users, CheckCircle2 } from "lucide-react"
import { useLocation } from "react-router-dom"
import { getDashboardStats, type DashboardStats } from "@/services/dashboardService"
import { toast } from "sonner"
import { AuroraBackground } from "@/components/ui/luxe/AuroraBackground"
import { LuxeCard } from "@/components/ui/luxe/LuxeCard"
import { OfflineChip } from "@/components/ui/luxe/OfflineChip"
import { SmartSkeleton } from "@/components/ui/luxe/SmartSkeleton"

interface DashboardProps {
  sidebarOpen?: boolean;
}

export default function Dashboard({ sidebarOpen }: DashboardProps) {
  const location = useLocation()
  const showQuickActions = location.pathname === '/'
  
  const [stats, setStats] = useState<DashboardStats>({
    todayActivities: 0,
    activeProjects: 0,
    newIdeas: 0,
    weeklyMeetings: 0,
    activeMissions: 0,
    activePolicies: 0,
    totalClaims: 0,
    totalKnowledgeItems: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true)
        const dashboardStats = await getDashboardStats()
        setStats(dashboardStats)
      } catch (error) {
        console.error('خطا در بارگیری آمار داشبورد:', error)
        toast.error('خطا در بارگیری آمار داشبورد')
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  return (
    <AuroraBackground intensity="normal" className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        {loading && <SmartSkeleton variant="dashboard" className="!p-0" />}
        {/* Hero — Luxe glass */}
        <LuxeCard variant="glow" className="overflow-hidden">
          <div className="relative px-6 py-12 md:py-16 text-center">
            <div className="absolute top-4 left-4">
              <OfflineChip />
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4 animate-fade-in bg-gradient-to-br from-primary via-accent to-primary bg-clip-text text-transparent">
              Mora
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-medium">مرکز کنترل هوشمند</p>
            <div className="mt-6 flex justify-center gap-2" aria-hidden>
              <div className="w-2 h-2 rounded-full bg-primary/80 animate-pulse"></div>
              <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </LuxeCard>

        {/* Stats Cards - Enhanced Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group bg-gradient-card backdrop-blur-sm rounded-2xl p-6 shadow-card hover:shadow-elegant transition-all duration-500 hover:-translate-y-2 border border-border/50">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/5"></div>
            </div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">فعالیت‌های امروز</h3>
            <p className="text-4xl font-bold text-primary mb-1">
              {loading ? '...' : <PersianNumber>{stats.todayActivities}</PersianNumber>}
            </p>
            <div className="mt-4 h-1 bg-primary/10 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-3/4 rounded-full animate-pulse"></div>
            </div>
          </div>

          <div className="group bg-gradient-card backdrop-blur-sm rounded-2xl p-6 shadow-card hover:shadow-medical transition-all duration-500 hover:-translate-y-2 border border-border/50">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
                <Target className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-500/5"></div>
            </div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">ماموریت‌های فعال</h3>
            <p className="text-4xl font-bold text-emerald-500 mb-1">
              {loading ? '...' : <PersianNumber>{stats.activeMissions}</PersianNumber>}
            </p>
            <div className="mt-4 h-1 bg-emerald-500/10 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-2/3 rounded-full animate-pulse"></div>
            </div>
          </div>

          <div className="group bg-gradient-card backdrop-blur-sm rounded-2xl p-6 shadow-card hover:shadow-elegant transition-all duration-500 hover:-translate-y-2 border border-border/50">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500/5"></div>
            </div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">پروژه‌های فعال</h3>
            <p className="text-4xl font-bold text-blue-500 mb-1">
              {loading ? '...' : <PersianNumber>{stats.activeProjects}</PersianNumber>}
            </p>
            <div className="mt-4 h-1 bg-blue-500/10 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-4/5 rounded-full animate-pulse"></div>
            </div>
          </div>

          <div className="group bg-gradient-card backdrop-blur-sm rounded-2xl p-6 shadow-card hover:shadow-elegant transition-all duration-500 hover:-translate-y-2 border border-border/50">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-cyan-500/10 rounded-xl group-hover:bg-cyan-500/20 transition-colors">
                <CheckCircle2 className="w-6 h-6 text-cyan-500" />
              </div>
              <div className="w-12 h-12 rounded-full bg-cyan-500/5"></div>
            </div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">سیاست‌های فعال</h3>
            <p className="text-4xl font-bold text-cyan-500 mb-1">
              {loading ? '...' : <PersianNumber>{stats.activePolicies}</PersianNumber>}
            </p>
            <div className="mt-4 h-1 bg-cyan-500/10 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500 w-1/2 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Secondary Stats - Compact Modern Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-card backdrop-blur-sm rounded-xl p-5 shadow-card hover:shadow-elegant transition-all duration-300 border border-border/50">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-yellow-500/10 rounded-full">
                <Lightbulb className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-3xl font-bold text-yellow-500">
                  {loading ? '...' : <PersianNumber>{stats.newIdeas}</PersianNumber>}
                </p>
                <p className="text-sm text-muted-foreground mt-1">ایده‌های جدید</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-card backdrop-blur-sm rounded-xl p-5 shadow-card hover:shadow-elegant transition-all duration-300 border border-border/50">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-indigo-500/10 rounded-full">
                <TrendingUp className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <p className="text-3xl font-bold text-indigo-500">
                  {loading ? '...' : <PersianNumber>{stats.totalKnowledgeItems}</PersianNumber>}
                </p>
                <p className="text-sm text-muted-foreground mt-1">آیتم‌های دانش</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-card backdrop-blur-sm rounded-xl p-5 shadow-card hover:shadow-elegant transition-all duration-300 border border-border/50">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-green-500/10 rounded-full">
                <MessageCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-3xl font-bold text-green-500">
                  {loading ? '...' : <PersianNumber>{stats.weeklyMeetings}</PersianNumber>}
                </p>
                <p className="text-sm text-muted-foreground mt-1">جلسات این هفته</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-card backdrop-blur-sm rounded-xl p-5 shadow-card hover:shadow-elegant transition-all duration-300 border border-border/50">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-orange-500/10 rounded-full">
                <Clock className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-3xl font-bold text-orange-500">
                  {loading ? '...' : <PersianNumber>{stats.totalClaims}</PersianNumber>}
                </p>
                <p className="text-sm text-muted-foreground mt-1">کل ادعاها</p>
              </div>
            </div>
          </div>
        </div>

        {/* Smart Suggestions - Modern Glassmorphic Design */}
        <div className="bg-gradient-glass backdrop-blur-md rounded-2xl p-8 shadow-glass border border-white/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/5 rounded-full blur-3xl -z-10"></div>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-primary rounded-xl shadow-glow">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              پیشنهادات هوشمند
            </h2>
          </div>
          
          <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 p-6 rounded-xl border border-primary/10 backdrop-blur-sm">
            <p className="text-base text-foreground/80 leading-relaxed">
              داشبورد آماده دریافت داده‌های جدید است. برای تجربه بهتر، از بخش‌های مختلف سیستم استفاده کنید.
            </p>
          </div>
        </div>

        {/* Main Layout */}
        <div className={`grid gap-6 ${sidebarOpen ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} transition-all duration-300`}>
          {/* Quick Actions */}
          <div className={`${sidebarOpen ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-6`}>
            {showQuickActions && <QuickActions />}
            
            {/* Sample Data Initializer */}
            <div className="space-y-6">
              <SampleDataInitializer />
            </div>
            
            <ModernCard title="وظایف سریع" className="p-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  وظایف سریع
                </h2>
                <div className="space-y-3">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">آماده برای وظایف جدید</p>
                        <p className="text-xs text-muted-foreground">داشبورد پاک شده</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ModernCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <ProgressCharts />
            <SecretaryRequestsPanel />
          </div>
        </div>
      </div>
      
      {/* دکمه پاکسازی نهایی */}
       {/* <CleanupCompleteButton /> */}
    </AuroraBackground>
  )
}