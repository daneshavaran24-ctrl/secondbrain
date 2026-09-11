import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProcurementOverviewProps {
  organizationId: string;
}

export function ProcurementOverview({ organizationId }: ProcurementOverviewProps) {
  const navigate = useNavigate();
  const stats = { total: 0 };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-border/50 bg-gradient-to-br from-card to-card/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-indigo-500" />
          </div>
          <CardTitle className="text-lg">تدارکات</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/organization/${organizationId}?tab=procurement`)}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="text-3xl font-bold text-indigo-500">{stats.total}</div>
            <div className="text-sm text-muted-foreground">سفارشات</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
