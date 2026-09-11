import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Bell, Calendar, MessageSquare, Check, Phone, Mail, 
  Clock, AlarmClock, Filter, ChevronDown, Linkedin, Send
} from "lucide-react";
import { networkingService, NetworkingContact } from "@/services/networkingService";
import { NetworkingInteractionForm } from "./NetworkingInteractionForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, isPast, isToday, addDays, differenceInDays } from "date-fns";
import { faIR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

interface NetworkingFollowupsProps {
  companyId?: string;
  organizationId?: string;
}

type GroupType = "overdue" | "today" | "week" | "later";

const groupLabels: Record<GroupType, string> = {
  overdue: "عقب‌افتاده",
  today: "امروز",
  week: "این هفته",
  later: "بعداً",
};

const groupColors: Record<GroupType, string> = {
  overdue: "text-destructive",
  today: "text-yellow-500",
  week: "text-blue-500",
  later: "text-muted-foreground",
};

export function NetworkingFollowupsEnhanced({ companyId, organizationId }: NetworkingFollowupsProps) {
  const [contacts, setContacts] = useState<NetworkingContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<NetworkingContact | null>(null);
  const [filter, setFilter] = useState<"all" | "overdue" | "today" | "week">("all");
  const { toast } = useToast();

  useEffect(() => {
    loadFollowups();
  }, [companyId, organizationId]);

  const loadFollowups = async () => {
    try {
      // Get all contacts with followup dates (not just upcoming week)
      const allContacts = await networkingService.getContacts(companyId, organizationId);
      const withFollowups = allContacts.filter(c => c.next_followup_date);
      setContacts(withFollowups);
    } catch (error) {
      console.error("Error loading followups:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDone = async (contact: NetworkingContact) => {
    try {
      await networkingService.updateContact(contact.id, {
        next_followup_date: null,
        last_interaction_date: new Date().toISOString(),
      });
      toast({ title: "فالوآپ انجام شد ✓" });
      loadFollowups();
    } catch (error) {
      toast({ title: "خطا در بروزرسانی", variant: "destructive" });
    }
  };

  const handleSnooze = async (contact: NetworkingContact, days: number) => {
    try {
      const newDate = addDays(new Date(), days);
      await networkingService.updateContact(contact.id, {
        next_followup_date: newDate.toISOString(),
      });
      toast({ title: `فالوآپ به ${days} روز بعد موکول شد` });
      loadFollowups();
    } catch (error) {
      toast({ title: "خطا در بروزرسانی", variant: "destructive" });
    }
  };

  const getContactGroup = (contact: NetworkingContact): GroupType => {
    if (!contact.next_followup_date) return "later";
    const followupDate = new Date(contact.next_followup_date);
    if (isPast(followupDate) && !isToday(followupDate)) return "overdue";
    if (isToday(followupDate)) return "today";
    const days = differenceInDays(followupDate, new Date());
    if (days <= 7) return "week";
    return "later";
  };

  const getDaysDisplay = (date: string) => {
    const followupDate = new Date(date);
    const days = differenceInDays(followupDate, new Date());
    if (days < 0) return `${Math.abs(days)} روز گذشته`;
    if (days === 0) return "امروز";
    if (days === 1) return "فردا";
    return `${days} روز مانده`;
  };

  const filteredContacts = contacts.filter(c => {
    if (filter === "all") return true;
    return getContactGroup(c) === filter;
  });

  const groupedContacts = filteredContacts.reduce((acc, contact) => {
    const group = getContactGroup(contact);
    if (!acc[group]) acc[group] = [];
    acc[group].push(contact);
    return acc;
  }, {} as Record<GroupType, NetworkingContact[]>);

  // Sort each group by date
  Object.keys(groupedContacts).forEach(group => {
    groupedContacts[group as GroupType]?.sort((a, b) => {
      const dateA = new Date(a.next_followup_date!).getTime();
      const dateB = new Date(b.next_followup_date!).getTime();
      return dateA - dateB;
    });
  });

  const handleQuickAction = (type: string, contact: NetworkingContact) => {
    switch (type) {
      case "call":
        if (contact.phone) {
          window.open(`tel:${contact.phone}`, "_blank");
        } else {
          toast({ title: "شماره تلفن ثبت نشده", variant: "destructive" });
        }
        break;
      case "email":
        if (contact.email) {
          window.open(`mailto:${contact.email}`, "_blank");
        } else {
          toast({ title: "ایمیل ثبت نشده", variant: "destructive" });
        }
        break;
      case "linkedin":
        if (contact.linkedin_url) {
          window.open(contact.linkedin_url, "_blank");
        } else {
          toast({ title: "لینکدین ثبت نشده", variant: "destructive" });
        }
        break;
      case "whatsapp":
        if (contact.phone) {
          const cleanPhone = contact.phone.replace(/\D/g, "");
          window.open(`https://wa.me/${cleanPhone}`, "_blank");
        } else {
          toast({ title: "شماره تلفن ثبت نشده", variant: "destructive" });
        }
        break;
    }
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
        <p className="text-muted-foreground">هیچ فالوآپی تنظیم نشده</p>
        <p className="text-sm text-muted-foreground mt-2">
          برای مخاطبین خود تاریخ فالوآپ تنظیم کنید
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-semibold">فالوآپ‌ها</h3>
          <Badge variant="secondary">{contacts.length}</Badge>
        </div>
        <Select value={filter} onValueChange={(v: typeof filter) => setFilter(v)}>
          <SelectTrigger className="w-32">
            <Filter className="h-4 w-4 ml-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه</SelectItem>
            <SelectItem value="overdue">عقب‌افتاده</SelectItem>
            <SelectItem value="today">امروز</SelectItem>
            <SelectItem value="week">این هفته</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <AnimatePresence>
        {(["overdue", "today", "week", "later"] as GroupType[]).map((group) => {
          const groupContacts = groupedContacts[group];
          if (!groupContacts?.length) return null;

          return (
            <motion.div
              key={group}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              <div className={`flex items-center gap-2 ${groupColors[group]}`}>
                {group === "overdue" && <AlarmClock className="h-4 w-4" />}
                {group === "today" && <Clock className="h-4 w-4" />}
                {group === "week" && <Calendar className="h-4 w-4" />}
                <span className="font-medium">{groupLabels[group]}</span>
                <Badge variant="outline" className="text-xs">{groupContacts.length}</Badge>
              </div>

              <div className="grid gap-3">
                {groupContacts.map((contact, index) => (
                  <motion.div
                    key={contact.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`hover:shadow-md transition-all group ${
                      group === "overdue" ? "border-destructive/50 bg-destructive/5" : ""
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={contact.photo_url || ""} />
                            <AvatarFallback className="text-lg">{contact.name.charAt(0)}</AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-medium">{contact.name}</h4>
                              <Badge 
                                variant={group === "overdue" ? "destructive" : group === "today" ? "default" : "outline"}
                                className="text-xs"
                              >
                                {contact.next_followup_date && getDaysDisplay(contact.next_followup_date)}
                              </Badge>
                            </div>
                            {contact.title && (
                              <p className="text-sm text-muted-foreground truncate">
                                {contact.title} {contact.organization_name && `- ${contact.organization_name}`}
                              </p>
                            )}
                            {contact.networking_goal && (
                              <p className="text-xs text-muted-foreground mt-1">
                                🎯 {contact.networking_goal}
                              </p>
                            )}
                          </div>

                          {/* Quick Actions - visible on hover on desktop, always on mobile */}
                          <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleQuickAction("call", contact)}
                              title="تماس"
                            >
                              <Phone className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleQuickAction("email", contact)}
                              title="ایمیل"
                            >
                              <Mail className="h-4 w-4 text-blue-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleQuickAction("whatsapp", contact)}
                              title="واتساپ"
                            >
                              <Send className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleQuickAction("linkedin", contact)}
                              title="لینکدین"
                            >
                              <Linkedin className="h-4 w-4 text-blue-600" />
                            </Button>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedContact(contact)}
                            >
                              <MessageSquare className="h-4 w-4 ml-1" />
                              <span className="hidden sm:inline">ثبت تعامل</span>
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Clock className="h-4 w-4 ml-1" />
                                  <ChevronDown className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleSnooze(contact, 1)}>
                                  <AlarmClock className="h-4 w-4 ml-2" />
                                  فردا
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSnooze(contact, 3)}>
                                  <AlarmClock className="h-4 w-4 ml-2" />
                                  ۳ روز بعد
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSnooze(contact, 7)}>
                                  <AlarmClock className="h-4 w-4 ml-2" />
                                  هفته بعد
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleMarkDone(contact)}
                                  className="text-green-600"
                                >
                                  <Check className="h-4 w-4 ml-2" />
                                  انجام شد
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

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
