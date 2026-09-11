import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cpu, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TechOverviewProps {
  organizationId: string;
}

export function TechOverview({ organizationId }: TechOverviewProps) {
  const navigate = useNavigate();
  const stats = { total: 0 };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-border/50 bg-gradient-to-br from-card to-card/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
            <Cpu className="w-5 h-5 text-cyan-500" />
          </div>
          <CardTitle className="text-lg">فناوری و داده</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/organization/${organizationId}?tab=tech`)}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="text-3xl font-bold text-cyan-500">{stats.total}</div>
            <div className="text-sm text-muted-foreground">سیستم‌ها و داده</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
