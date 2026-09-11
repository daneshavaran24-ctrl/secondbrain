import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Successor {
  id: string;
  employee_name: string;
  performance_rating: number;
  potential_rating: number;
  current_position: string;
  plan_id: string;
}

interface NineBoxGridProps {
  organizationId: string;
  plans: any[];
}

export function NineBoxGrid({ organizationId, plans }: NineBoxGridProps) {
  const [successors, setSuccessors] = useState<Successor[]>([]);

  useEffect(() => {
    loadSuccessors();
  }, [organizationId]);

  const loadSuccessors = async () => {
    if (plans.length === 0) return;
    
    const planIds = plans.map(p => p.id);
    const { data } = await supabase
      .from('organization_succession_successors')
      .select('*')
      .in('plan_id', planIds);
    
    setSuccessors(data || []);
  };

  const getBoxLabel = (performance: number, potential: number) => {
    if (performance >= 7 && potential >= 7) return { text: 'ستاره‌ها', color: 'bg-green-500' };
    if (performance >= 7 && potential >= 4) return { text: 'کارکنان کلیدی', color: 'bg-blue-500' };
    if (performance >= 7) return { text: 'عملکرد قوی', color: 'bg-cyan-500' };
    if (performance >= 4 && potential >= 7) return { text: 'استعدادهای آینده', color: 'bg-yellow-500' };
    if (performance >= 4 && potential >= 4) return { text: 'مستحکم', color: 'bg-gray-500' };
    if (performance >= 4) return { text: 'قابل اعتماد', color: 'bg-slate-500' };
    if (potential >= 7) return { text: 'نیاز به راهنمایی', color: 'bg-orange-500' };
    if (potential >= 4) return { text: 'نیاز به توسعه', color: 'bg-amber-500' };
    return { text: 'بازنگری لازم', color: 'bg-red-500' };
  };

  const getSuccessorsInBox = (perfMin: number, perfMax: number, potMin: number, potMax: number) => {
    return successors.filter(s => 
      s.performance_rating >= perfMin && 
      s.performance_rating <= perfMax &&
      s.potential_rating >= potMin && 
      s.potential_rating <= potMax
    );
  };

  const renderBox = (perfMin: number, perfMax: number, potMin: number, potMax: number) => {
    const boxSuccessors = getSuccessorsInBox(perfMin, perfMax, potMin, potMax);
    const { text, color } = getBoxLabel(perfMin, potMin);

    return (
      <div className="border rounded-lg p-3 min-h-[150px] bg-card hover:shadow-md transition-shadow">
        <div className={`${color} text-white text-xs font-medium px-2 py-1 rounded mb-2 text-center`}>
          {text}
        </div>
        <div className="space-y-2">
          {boxSuccessors.map(successor => (
            <div key={successor.id} className="flex items-center gap-2 p-2 bg-muted rounded text-xs">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-xs">
                  {successor.employee_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{successor.employee_name}</div>
                <div className="text-muted-foreground truncate">{successor.current_position}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">9-Box Grid - ماتریس عملکرد و پتانسیل</h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span>ستاره‌ها</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span>کلیدی</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded" />
              <span>آینده‌دار</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded" />
              <span>نیاز به بررسی</span>
            </div>
          </div>
        </div>

        <div className="relative">
          {/* Y-axis label */}
          <div className="absolute -left-12 top-1/2 -translate-y-1/2 -rotate-90 text-sm font-medium text-muted-foreground whitespace-nowrap">
            پتانسیل →
          </div>
          
          {/* Grid */}
          <div className="grid grid-cols-3 gap-2">
            {/* Row 3: High Potential (7-9) */}
            {renderBox(1, 3, 7, 9)}
            {renderBox(4, 6, 7, 9)}
            {renderBox(7, 9, 7, 9)}
            
            {/* Row 2: Medium Potential (4-6) */}
            {renderBox(1, 3, 4, 6)}
            {renderBox(4, 6, 4, 6)}
            {renderBox(7, 9, 4, 6)}
            
            {/* Row 1: Low Potential (1-3) */}
            {renderBox(1, 3, 1, 3)}
            {renderBox(4, 6, 1, 3)}
            {renderBox(7, 9, 1, 3)}
          </div>
          
          {/* X-axis label */}
          <div className="text-center mt-2 text-sm font-medium text-muted-foreground">
            ← عملکرد →
          </div>
        </div>

        <div className="mt-4 text-xs text-muted-foreground">
          * برای اضافه کردن افراد به Grid، ابتدا جانشین‌ها را در هر پست تعریف کرده و امتیاز عملکرد و پتانسیل آنها را مشخص کنید.
        </div>
      </CardContent>
    </Card>
  );
}
