import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Target, Calendar, BarChart3, Bell, Mail } from "lucide-react";
import { NetworkingContactsList } from "./NetworkingContactsList";
import { NetworkingStats } from "./NetworkingStats";
import { NetworkingGoalsEnhanced } from "./NetworkingGoalsEnhanced";
import { NetworkingEvents } from "./NetworkingEvents";
import { NetworkingFollowupsEnhanced } from "./NetworkingFollowupsEnhanced";
import { NetworkingAnalytics } from "./NetworkingAnalytics";
import { NetworkingEmailTab } from "./NetworkingEmailTab";

interface NetworkingSectionProps {
  companyId?: string;
  organizationId?: string;
}

export function NetworkingSection({ companyId, organizationId }: NetworkingSectionProps) {
  const [activeTab, setActiveTab] = useState("contacts");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">استراتژی نتورکینگ</h2>
          <p className="text-muted-foreground">مدیریت ارتباطات حرفه‌ای و استراتژیک</p>
        </div>
      </div>

      <NetworkingStats companyId={companyId} organizationId={organizationId} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">مخاطبین</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">ایمیل</span>
          </TabsTrigger>
          <TabsTrigger value="followups" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">فالوآپ</span>
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">اهداف</span>
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">رویدادها</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">تحلیل</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="mt-6">
          <NetworkingContactsList companyId={companyId} organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="email" className="mt-6">
          <NetworkingEmailTab companyId={companyId} organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="followups" className="mt-6">
          <NetworkingFollowupsEnhanced companyId={companyId} organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="goals" className="mt-6">
          <NetworkingGoalsEnhanced companyId={companyId} organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          <NetworkingEvents companyId={companyId} organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <NetworkingAnalytics companyId={companyId} organizationId={organizationId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
