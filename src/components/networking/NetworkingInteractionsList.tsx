import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { networkingService, NetworkingInteraction } from "@/services/networkingService";
import { format } from "date-fns";
import { faIR } from "date-fns/locale";
import { Video, Phone, Mail, Linkedin, Calendar, Users, MessageSquare, Clock } from "lucide-react";

interface NetworkingInteractionsListProps {
  contactId: string;
}

const typeConfig: Record<string, { label: string; icon: any; color: string }> = {
  meeting: { label: "جلسه حضوری", icon: Users, color: "bg-blue-500" },
  call: { label: "تماس تلفنی", icon: Phone, color: "bg-green-500" },
  email: { label: "ایمیل", icon: Mail, color: "bg-purple-500" },
  linkedin: { label: "LinkedIn", icon: Linkedin, color: "bg-sky-500" },
  event: { label: "رویداد", icon: Calendar, color: "bg-orange-500" },
  referral: { label: "معرفی", icon: MessageSquare, color: "bg-pink-500" },
  video_call: { label: "تماس تصویری", icon: Video, color: "bg-red-500" },
};

const outcomeLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  positive: { label: "مثبت", variant: "default" },
  neutral: { label: "خنثی", variant: "secondary" },
  needs_followup: { label: "نیاز به پیگیری", variant: "outline" },
  no_response: { label: "بدون پاسخ", variant: "destructive" },
};

export function NetworkingInteractionsList({ contactId }: NetworkingInteractionsListProps) {
  const [interactions, setInteractions] = useState<NetworkingInteraction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInteractions();
  }, [contactId]);

  const loadInteractions = async () => {
    try {
      const data = await networkingService.getInteractions(contactId);
      setInteractions(data);
    } catch (error) {
      console.error("Error loading interactions:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (interactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        هنوز تعاملی ثبت نشده است
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {interactions.map((interaction) => {
        const typeInfo = typeConfig[interaction.interaction_type] || typeConfig.meeting;
        const outcomeInfo = outcomeLabels[interaction.outcome || "neutral"];
        const Icon = typeInfo.icon;

        return (
          <Card key={interaction.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${typeInfo.color} text-white`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{interaction.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {typeInfo.label} - {format(new Date(interaction.interaction_date), "PPP", { locale: faIR })}
                      </p>
                    </div>
                    <Badge variant={outcomeInfo.variant}>{outcomeInfo.label}</Badge>
                  </div>

                  {interaction.description && (
                    <p className="mt-2 text-sm">{interaction.description}</p>
                  )}

                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {interaction.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {interaction.duration} دقیقه
                      </span>
                    )}
                    {interaction.follow_up_action && (
                      <span className="flex items-center gap-1">
                        پیگیری: {interaction.follow_up_action}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
