import React, { useState } from 'react';
import { Database, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { legalTestDataService } from '@/services/legalTestDataService';
import { useToast } from '@/hooks/use-toast';

export function LegalTestDataButton() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [dataStats, setDataStats] = useState<{
    cases: number;
    meetings: number;
    documents: number;
    notes: number;
  } | null>(null);

  const initializeData = async () => {
    setIsLoading(true);
    try {
      await legalTestDataService.initializeLegalTestData();
      
      // Get updated stats
      const stats = await legalTestDataService.getLegalDataStats();
      setDataStats(stats);
      
      toast({
        title: "موفقیت",
        description: "داده‌های تست حقوقی با موفقیت ایجاد شدند",
      });
      
      // Reload the page to show new data
      window.location.reload();
    } catch (error) {
      console.error('Error initializing legal test data:', error);
      toast({
        title: "خطا",
        description: "خطا در ایجاد داده‌های تست",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetData = async () => {
    setIsLoading(true);
    try {
      await legalTestDataService.resetLegalData();
      
      // Get updated stats
      const stats = await legalTestDataService.getLegalDataStats();
      setDataStats(stats);
      
      toast({
        title: "بازنشانی شد",
        description: "داده‌های حقوقی بازنشانی و مجدداً ایجاد شدند",
      });
      
      // Reload the page to show new data
      window.location.reload();
    } catch (error) {
      console.error('Error resetting legal test data:', error);
      toast({
        title: "خطا",
        description: "خطا در بازنشانی داده‌ها",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load stats on component mount
  React.useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await legalTestDataService.getLegalDataStats();
        setDataStats(stats);
      } catch (error) {
        console.error('Error loading legal stats:', error);
      }
    };
    loadStats();
  }, []);

  const hasData = dataStats && (dataStats.cases > 0 || dataStats.meetings > 0 || dataStats.documents > 0 || dataStats.notes > 0);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Database className="h-4 w-4 text-primary" />
          داده‌های تست حقوقی
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Data Stats */}
        {dataStats && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between">
              <span>پرونده‌ها:</span>
              <Badge variant={dataStats.cases > 0 ? "default" : "secondary"}>
                {dataStats.cases}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>جلسات:</span>
              <Badge variant={dataStats.meetings > 0 ? "default" : "secondary"}>
                {dataStats.meetings}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>اسناد:</span>
              <Badge variant={dataStats.documents > 0 ? "default" : "secondary"}>
                {dataStats.documents}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>یادداشت‌ها:</span>
              <Badge variant={dataStats.notes > 0 ? "default" : "secondary"}>
                {dataStats.notes}
              </Badge>
            </div>
          </div>
        )}

        {/* Status Indicator */}
        <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
          {hasData ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-700">داده‌های تست موجود است</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-orange-700">داده‌های تست ایجاد نشده</span>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={initializeData}
            disabled={isLoading}
            size="sm"
            className="flex-1"
          >
            {isLoading ? (
              <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
            ) : (
              <Database className="h-3 w-3 mr-2" />
            )}
            {hasData ? 'تازه‌سازی' : 'ایجاد داده‌ها'}
          </Button>
          
          {hasData && (
            <Button
              onClick={resetData}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Usage Guide */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>نحوه استفاده:</strong></p>
          <p>1. روی پرونده کلیک کنید</p>
          <p>2. تب "یادداشت‌ها" را انتخاب کنید</p>
          <p>3. "یادداشت جدید" را کلیک کنید</p>
        </div>
      </CardContent>
    </Card>
  );
}