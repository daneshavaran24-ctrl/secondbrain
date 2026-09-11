import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Flame, Thermometer, Snowflake, Bell, Target, Activity } from "lucide-react";
import { networkingService, NetworkingStats as StatsType } from "@/services/networkingService";

interface NetworkingStatsProps {
  companyId?: string;
  organizationId?: string;
}

export function NetworkingStats({ companyId, organizationId }: NetworkingStatsProps) {
  const [stats, setStats] = useState<StatsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [companyId, organizationId]);

  const loadStats = async () => {
    try {
      const data = await networkingService.getStats(companyId, organizationId);
      setStats(data);
    } catch (error) {
      console.error("Error loading networking stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {[...Array(7)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-12 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statItems = [
    { label: "کل مخاطبین", value: stats.totalContacts, icon: Users, color: "text-blue-500" },
    { label: "داغ", value: stats.hotContacts, icon: Flame, color: "text-red-500" },
    { label: "گرم", value: stats.warmContacts, icon: Thermometer, color: "text-orange-500" },
    { label: "سرد", value: stats.coldContacts, icon: Snowflake, color: "text-cyan-500" },
    { label: "فالوآپ", value: stats.upcomingFollowups, icon: Bell, color: "text-yellow-500" },
    { label: "پیشرفت اهداف", value: `${stats.goalsProgress}%`, icon: Target, color: "text-green-500" },
    { label: "تعامل اخیر", value: stats.recentInteractions, icon: Activity, color: "text-purple-500" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {statItems.map((item, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <item.icon className={`h-6 w-6 mx-auto mb-2 ${item.color}`} />
            <div className="text-2xl font-bold">{item.value}</div>
            <div className="text-xs text-muted-foreground">{item.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
