import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Calendar, MessageSquare, Check } from "lucide-react";
import { networkingService, NetworkingContact } from "@/services/networkingService";
import { NetworkingInteractionForm } from "./NetworkingInteractionForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, isPast, isToday } from "date-fns";
import { faIR } from "date-fns/locale";

interface NetworkingFollowupsProps {
  companyId?: string;
  organizationId?: string;
}

export function NetworkingFollowups({ companyId, organizationId }: NetworkingFollowupsProps) {
  const [contacts, setContacts] = useState<NetworkingContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<NetworkingContact | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadFollowups();
  }, [companyId, organizationId]);

  const loadFollowups = async () => {
    try {
      const data = await networkingService.getUpcomingFollowups(companyId, organizationId);
      setContacts(data);
    } catch (error) {
      console.error("Error loading followups:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDone = async (contact: NetworkingContact) => {
    try {
      // Clear followup date and update last interaction
      await networkingService.updateContact(contact.id, {
        next_followup_date: null,
        last_interaction_date: new Date().toISOString(),
      });
      toast({ title: "فالوآپ انجام شد" });
      loadFollowups();
    } catch (error) {
      toast({ title: "خطا در بروزرسانی", variant: "destructive" });
    }
  };

  const getUrgencyBadge = (date: string) => {
    const followupDate = new Date(date);
    if (isPast(followupDate) && !isToday(followupDate)) {
      return <Badge variant="destructive">عقب‌افتاده</Badge>;
    }
    if (isToday(followupDate)) {
      return <Badge className="bg-yellow-500">امروز</Badge>;
    }
    return <Badge variant="outline">آینده</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="text-center py-12">
        <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">هیچ فالوآپی در هفته آینده ندارید</p>
        <p className="text-sm text-muted-foreground mt-2">
          برای مخاطبین خود تاریخ فالوآپ تنظیم کنید
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-yellow-500" />
        <h3 className="text-lg font-semibold">فالوآپ‌های پیش رو</h3>
        <Badge variant="secondary">{contacts.length}</Badge>
      </div>

      <div className="grid gap-4">
        {contacts.map(contact => (
          <Card key={contact.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={contact.photo_url || ""} />
                  <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{contact.name}</h4>
                    {contact.next_followup_date && getUrgencyBadge(contact.next_followup_date)}
                  </div>
                  {contact.title && (
                    <p className="text-sm text-muted-foreground truncate">
                      {contact.title} {contact.organization_name && `- ${contact.organization_name}`}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {contact.next_followup_date && (
                      <span>
                        {new Date(contact.next_followup_date).toLocaleDateString("fa-IR")} 
                        ({formatDistanceToNow(new Date(contact.next_followup_date), { locale: faIR, addSuffix: true })})
                      </span>
                    )}
                  </div>
                  {contact.networking_goal && (
                    <p className="text-xs text-muted-foreground mt-1">
                      هدف: {contact.networking_goal}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedContact(contact)}
                  >
                    <MessageSquare className="h-4 w-4 ml-1" />
                    ثبت تعامل
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkDone(contact)}
                  >
                    <Check className="h-4 w-4 ml-1" />
                    انجام شد
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedContact} onOpenChange={() => setSelectedContact(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ثبت تعامل با {selectedContact?.name}</DialogTitle>
          </DialogHeader>
          {selectedContact && (
            <NetworkingInteractionForm
              contactId={selectedContact.id}
              onSuccess={() => {
                setSelectedContact(null);
                loadFollowups();
              }}
              onCancel={() => setSelectedContact(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
