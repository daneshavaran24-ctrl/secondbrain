import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Database, Cloud, Zap, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface HealthStatus {
  service: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  icon: React.ReactNode;
  timestamp: Date;
}

export const HealthCheck: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthStatus[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  const checkDatabaseHealth = async (): Promise<HealthStatus> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);

      if (error) throw error;

      return {
        service: 'Database',
        status: 'healthy',
        message: 'Database connection successful',
        icon: <Database className="w-4 h-4" />,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        service: 'Database',
        status: 'error',
        message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        icon: <Database className="w-4 h-4" />,
        timestamp: new Date()
      };
    }
  };

  const checkAuthHealth = async (): Promise<HealthStatus> => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) throw error;

      return {
        service: 'Authentication',
        status: user ? 'healthy' : 'warning',
        message: user ? 'User authenticated' : 'No user session',
        icon: <Shield className="w-4 h-4" />,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        service: 'Authentication',
        status: 'error',
        message: `Auth check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        icon: <Shield className="w-4 h-4" />,
        timestamp: new Date()
      };
    }
  };

  const checkStorageHealth = async (): Promise<HealthStatus> => {
    try {
      const { data, error } = await supabase.storage.listBuckets();

      if (error) throw error;

      return {
        service: 'Storage',
        status: 'healthy',
        message: `${data.length} storage buckets available`,
        icon: <Cloud className="w-4 h-4" />,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        service: 'Storage',
        status: 'error',
        message: `Storage check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        icon: <Cloud className="w-4 h-4" />,
        timestamp: new Date()
      };
    }
  };

  const checkEdgeFunctionsHealth = async (): Promise<HealthStatus> => {
    try {
      // Simple ping to a lightweight edge function
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { test: true }
      });

      return {
        service: 'Edge Functions',
        status: error ? 'warning' : 'healthy',
        message: error ? 'Edge functions may have issues' : 'Edge functions responsive',
        icon: <Zap className="w-4 h-4" />,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        service: 'Edge Functions',
        status: 'error',
        message: `Edge functions check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        icon: <Zap className="w-4 h-4" />,
        timestamp: new Date()
      };
    }
  };

  const runHealthCheck = async () => {
    setIsChecking(true);
    
    try {
      const checks = await Promise.all([
        checkDatabaseHealth(),
        checkAuthHealth(),
        checkStorageHealth(),
        checkEdgeFunctionsHealth()
      ]);

      setHealthData(checks);
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusColor = (status: HealthStatus['status']) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: HealthStatus['status']) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return null;
    }
  };

  const overallStatus = healthData.length > 0 ? (
    healthData.some(h => h.status === 'error') ? 'error' :
    healthData.some(h => h.status === 'warning') ? 'warning' : 'healthy'
  ) : 'healthy'; // Default to healthy instead of unknown

  useEffect(() => {
    runHealthCheck();
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          System Health Check
          <Badge 
            variant="secondary" 
            className={`${getStatusColor(overallStatus)} text-white`}
          >
            {overallStatus.toUpperCase()}
          </Badge>
        </CardTitle>
        <Button 
          onClick={runHealthCheck} 
          disabled={isChecking}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${isChecking ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {healthData.length === 0 && !isChecking ? (
          <p className="text-muted-foreground text-center py-4">
            Click refresh to run health checks
          </p>
        ) : (
          healthData.map((health, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                {health.icon}
                <div>
                  <div className="font-medium">{health.service}</div>
                  <div className="text-sm text-muted-foreground">
                    {health.message}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(health.status)}
                <span className="text-xs text-muted-foreground">
                  {health.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}
        {isChecking && (
          <div className="text-center py-4">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Running health checks...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};