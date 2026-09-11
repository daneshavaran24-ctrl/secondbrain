import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserOrganizationsManager } from '@/components/user-management/UserOrganizationsManager';

const MyOrganizationsPage = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">سازمان‌های من</CardTitle>
        </CardHeader>
        <CardContent>
          <UserOrganizationsManager />
        </CardContent>
      </Card>
    </div>
  );
};

export default MyOrganizationsPage;
