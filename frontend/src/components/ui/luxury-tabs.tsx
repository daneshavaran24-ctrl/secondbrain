import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";
import { TabsListScrollable } from "./tabs-list-scrollable";
import { useIsMobile } from "@/hooks/use-mobile";

interface LuxuryTabItem {
  value: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

interface LuxuryTabsProps {
  items: LuxuryTabItem[];
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export function LuxuryTabs({
  items,
  value,
  onValueChange,
  children,
  className
}: LuxuryTabsProps) {
  const isMobile = useIsMobile();

  return (
    <Tabs value={value} onValueChange={onValueChange} className={className} dir="rtl">
      {isMobile ? (
        <TabsListScrollable 
          className="gap-2 h-auto p-2 bg-gradient-lux rounded-xl shadow-luxury-soft"
          dir="rtl"
        >
          {items.map((item) => (
            <TabsTrigger
              key={item.value}
              value={item.value}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-lg transition-elegant text-right whitespace-nowrap",
                "data-[state=active]:bg-gradient-luxury-gold data-[state=active]:text-white data-[state=active]:shadow-luxury-glow",
                "hover:bg-white/50 font-medium min-w-max"
              )}
              dir="rtl"
            >
              {item.icon && (
                <span className="text-current opacity-90 order-1">{item.icon}</span>
              )}
              <span className="order-2">{item.label}</span>
              {item.count !== undefined && (
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-semibold order-3",
                  "bg-white/20 text-current"
                )}>
                  {item.count}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsListScrollable>
      ) : (
        <TabsList 
          className="grid w-full gap-2 h-auto p-2 bg-gradient-lux rounded-xl shadow-luxury-soft"
          style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
          dir="rtl"
        >
          {items.map((item) => (
            <TabsTrigger
              key={item.value}
              value={item.value}
              className={cn(
                "flex items-center gap-3 px-6 py-4 rounded-lg transition-elegant text-right",
                "data-[state=active]:bg-gradient-luxury-gold data-[state=active]:text-white data-[state=active]:shadow-luxury-glow",
                "hover:bg-white/50 font-medium"
              )}
              dir="rtl"
            >
              {item.icon && (
                <span className="text-current opacity-90 order-1">{item.icon}</span>
              )}
              <span className="order-2">{item.label}</span>
              {item.count !== undefined && (
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-semibold order-3",
                  "bg-white/20 text-current"
                )}>
                  {item.count}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      )}
      <div dir="rtl">
        {children}
      </div>
    </Tabs>
  );
}