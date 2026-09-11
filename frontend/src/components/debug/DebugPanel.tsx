import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const DebugPanel: React.FC = () => {
  const { debugAuth, forceReset, isLoading, isAuthenticated, user, role } = useAuth();

  // فقط در development mode نمایش دهیم
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 bg-background/95 backdrop-blur-sm border-2 border-yellow-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-yellow-600">🔧 Debug Panel</CardTitle>
        <CardDescription className="text-xs">
          Development Mode Only
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-xs space-y-1">
          <div>Loading: <span className={isLoading ? 'text-red-500' : 'text-green-500'}>{isLoading.toString()}</span></div>
          <div>Authenticated: <span className={isAuthenticated ? 'text-green-500' : 'text-red-500'}>{isAuthenticated.toString()}</span></div>
          <div>User: <span className="text-blue-500">{user?.email || 'None'}</span></div>
          <div>Role: <span className="text-purple-500">{role || 'None'}</span></div>
        </div>
        <div className="flex flex-col gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={debugAuth}
            className="text-xs h-7"
          >
            📊 Debug Info
          </Button>
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={forceReset}
            className="text-xs h-7"
          >
            🔄 Force Reset
          </Button>
          <Button 
            size="sm" 
            variant="secondary" 
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              window.location.reload();
            }}
            className="text-xs h-7"
          >
            🧹 Clear & Reload
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DebugPanel;
