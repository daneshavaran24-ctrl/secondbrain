import React, { useState } from 'react';
import { EmptyState } from '@/components/ui/empty-state';
import { ModernButton } from '@/components/ui/modern-button';
import { AppIcon } from '@/components/ui/app-icon';
import { supabaseProjectService } from '@/services/supabaseProjectService';
import { Briefcase, Plus, Database, Sparkles } from 'lucide-react';

interface ProjectEmptyStateProps {
  onCreateProject: () => void;
  onDataInitialized: () => void;
}

export function ProjectEmptyState({ onCreateProject, onDataInitialized }: ProjectEmptyStateProps) {
  const [isInitializing, setIsInitializing] = useState(false);

  const handleInitializeSampleData = async () => {
    setIsInitializing(true);
    try {
      const success = await supabaseProjectService.initializeSampleData();
      if (success) {
        onDataInitialized();
      }
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-center max-w-md mx-auto space-y-6">
        <div className="w-20 h-20 mx-auto bg-gradient-to-r from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
          <AppIcon size="lg">
            <Briefcase className="text-primary" />
          </AppIcon>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">
            هنوز پروژه‌ای ایجاد نشده
          </h3>
          <p className="text-muted-foreground">
            برای شروع کار با سیستم مدیریت پروژه، ابتدا یک پروژه ایجاد کنید یا از داده‌های نمونه استفاده کنید
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <ModernButton 
            onClick={onCreateProject}
            icon={<AppIcon size="sm"><Plus /></AppIcon>}
            magnetic
            glow
            className="bg-gradient-to-r from-primary to-primary/80"
          >
            ایجاد پروژه جدید
          </ModernButton>
          
          <ModernButton 
            onClick={handleInitializeSampleData}
            disabled={isInitializing}
            icon={<AppIcon size="sm"><Database /></AppIcon>}
            variant="outline"  
            magnetic
            className="border-primary/50 text-primary hover:bg-primary/10"
          >
            {isInitializing ? (
              <>
                <AppIcon size="sm" className="animate-spin"><Sparkles /></AppIcon>
                در حال ایجاد...
              </>
            ) : (
              'ایجاد داده‌های نمونه'
            )}
          </ModernButton>
        </div>

        <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
          💡 <strong>راهنما:</strong> داده‌های نمونه شامل چند پروژه آماده با وضعیت‌های مختلف می‌باشد که به شما کمک می‌کند تا با امکانات سیستم آشنا شوید.
        </div>
      </div>
    </div>
  );
}