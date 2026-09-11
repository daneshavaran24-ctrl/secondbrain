import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PersonalInfoSection } from "@/components/profile/PersonalInfoSection";
import { SecuritySection } from "@/components/profile/SecuritySection";
import { SubUsersSection } from "@/components/profile/SubUsersSection";
import { ActivityLogSection } from "@/components/profile/ActivityLogSection";
import { User, Shield, Users, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserType } from "@/hooks/useSubUsers";

export default function ProfilePage() {
  const { user } = useAuth();
  const { data: userType } = useUserType();
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">پروفایل کاربری</h1>
        <p className="text-muted-foreground mt-2">مدیریت اطلاعات شخصی و تنظیمات حساب کاربری</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-6">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            <span>پروفایل من</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" />
            <span>امنیت</span>
          </TabsTrigger>
          {userType === 'owner' && (
            <TabsTrigger value="sub-users" className="gap-2">
              <Users className="w-4 h-4" />
              <span>کاربران فرعی</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="activity" className="gap-2">
            <Clock className="w-4 h-4" />
            <span>تاریخچه فعالیت</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <PersonalInfoSection />
        </TabsContent>

        <TabsContent value="security">
          <SecuritySection />
        </TabsContent>

        {userType === 'owner' && (
          <TabsContent value="sub-users">
            <SubUsersSection />
          </TabsContent>
        )}

        <TabsContent value="activity">
          <ActivityLogSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
