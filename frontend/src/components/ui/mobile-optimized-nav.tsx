import React from 'react';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home,
  CheckSquare,
  Users,
  Brain,
  Calendar,
  Settings,
  Plus
} from 'lucide-react';

interface MobileOptimizedNavProps {
  className?: string;
}

export function MobileOptimizedNav({ className }: MobileOptimizedNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      id: 'home',
      label: 'خانه',
      icon: Home,
      route: '/',
      color: 'text-primary'
    },
    {
      id: 'personal',
      label: 'شخصی',
      icon: CheckSquare,
      route: '/personal-planning',
      color: 'text-medical-green'
    },
    {
      id: 'professional',
      label: 'حرفه‌ای',
      icon: Users,
      route: '/professional-planning',
      color: 'text-medical-blue'
    },
    {
      id: 'ai',
      label: 'هوشمند',
      icon: Brain,
      route: '/ai-chat',
      color: 'text-tech-cyan'
    },
    {
      id: 'calendar',
      label: 'تقویم',
      icon: Calendar,
      route: '/calendar',
      color: 'text-medical-amber'
    }
  ];

  const isActive = (route: string) => location.pathname === route;

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50",
      "bg-card/95 backdrop-blur-sm border-t border-border/50",
      "safe-area-pb",
      className
    )}>
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.route)}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200",
              "min-w-[60px] flex-1 max-w-[80px]",
              isActive(item.route)
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5 transition-colors",
              isActive(item.route) && item.color
            )} />
            <span className="text-xs font-medium truncate">
              {item.label}
            </span>
          </button>
        ))}
        
        {/* Quick Add FAB */}
        <button 
          onClick={() => {
            // Add haptic feedback for native apps
            if ('vibrate' in navigator) {
              navigator.vibrate(50);
            }
            // Navigate to quick actions
            navigate('/personal-planning');
          }}
          className={cn(
            "relative flex items-center justify-center",
            "w-12 h-12 rounded-full bg-gradient-primary text-primary-foreground",
            "shadow-glow hover:shadow-luxury-glow transition-all duration-300",
            "hover:scale-105 active:scale-95",
            "touch-manipulation" // Improves touch responsiveness
          )}
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}