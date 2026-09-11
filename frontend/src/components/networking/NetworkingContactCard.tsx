import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Mail, Phone, Linkedin, Edit, Trash2, MessageSquare, 
  Calendar, Target, MoreVertical, ChevronDown, ChevronUp, Sparkles
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NetworkingContact } from "@/services/networkingService";
import { NetworkingInteractionForm } from "./NetworkingInteractionForm";
import { NetworkingInteractionsList } from "./NetworkingInteractionsList";
import { NetworkingEmailGenerator } from "./NetworkingEmailGenerator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";
import { faIR } from "date-fns/locale";

interface NetworkingContactCardProps {
  contact: NetworkingContact;
  onEdit: () => void;
  onDelete: () => void;
  onRefresh: () => void;
}

const categoryLabels: Record<string, string> = {
  mentor: "منتور",
  advisor: "مشاور",
  investor: "سرمایه‌گذار",
  partner: "شریک",
  client: "مشتری",
  peer: "همکار",
  influencer: "اینفلوئنسر",
  contact: "مخاطب",
};

const statusConfig: Record<string, { label: string; color: string }> = {
  hot: { label: "داغ", color: "bg-red-500" },
  warm: { label: "گرم", color: "bg-orange-500" },
  cold: { label: "سرد", color: "bg-cyan-500" },
  active: { label: "فعال", color: "bg-green-500" },
  dormant: { label: "خاموش", color: "bg-gray-500" },
};

export function NetworkingContactCard({ contact, onEdit, onDelete, onRefresh }: NetworkingContactCardProps) {
  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [showInteractions, setShowInteractions] = useState(false);
  const [showEmailGenerator, setShowEmailGenerator] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const strengthBars = Array(5).fill(0).map((_, i) => i < contact.relationship_strength);
  const statusInfo = statusConfig[contact.status] || statusConfig.active;

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={contact.photo_url || ""} />
              <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-lg">{contact.name}</h3>
                  {contact.title && (
                    <p className="text-sm text-muted-foreground">{contact.title}</p>
                  )}
                  {contact.organization_name && (
                    <p className="text-sm text-muted-foreground">{contact.organization_name}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline">{categoryLabels[contact.category] || contact.category}</Badge>
                  <Badge className={`${statusInfo.color} text-white`}>{statusInfo.label}</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={onEdit}>
                        <Edit className="h-4 w-4 ml-2" />
                        ویرایش
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowInteractionForm(true)}>
                        <MessageSquare className="h-4 w-4 ml-2" />
                        ثبت تعامل
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowInteractions(true)}>
                        <Calendar className="h-4 w-4 ml-2" />
                        تاریخچه تعاملات
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowEmailGenerator(true)}>
                        <Sparkles className="h-4 w-4 ml-2" />
                        تولید ایمیل با AI
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={onDelete} className="text-destructive">
                        <Trash2 className="h-4 w-4 ml-2" />
                        حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-1 hover:text-primary">
                    <Mail className="h-3 w-3" />
                    {contact.email}
                  </a>
                )}
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-1 hover:text-primary">
                    <Phone className="h-3 w-3" />
                    {contact.phone}
                  </a>
                )}
                {contact.linkedin_url && (
                  <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                    <Linkedin className="h-3 w-3" />
                    LinkedIn
                  </a>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">قدرت رابطه:</span>
                  <div className="flex gap-0.5">
                    {strengthBars.map((filled, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-sm ${filled ? "bg-primary" : "bg-muted"}`}
                      />
                    ))}
                  </div>
                </div>

                {contact.last_interaction_date && (
                  <span className="text-xs text-muted-foreground">
                    آخرین تعامل: {formatDistanceToNow(new Date(contact.last_interaction_date), { locale: faIR, addSuffix: true })}
                  </span>
                )}

                {contact.next_followup_date && (
                  <span className="text-xs text-yellow-600">
                    فالوآپ: {new Date(contact.next_followup_date).toLocaleDateString("fa-IR")}
                  </span>
                )}
              </div>

              {contact.networking_goal && (
                <div className="mt-2 flex items-center gap-1 text-sm">
                  <Target className="h-3 w-3 text-primary" />
                  <span className="text-muted-foreground">هدف:</span>
                  <span>{contact.networking_goal}</span>
                </div>
              )}

              {contact.tags && contact.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {contact.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">#{tag}</Badge>
                  ))}
                </div>
              )}

              {expanded && contact.notes && (
                <div className="mt-3 p-3 bg-muted rounded-lg text-sm">
                  <p className="text-muted-foreground">{contact.notes}</p>
                </div>
              )}

              {(contact.notes || contact.how_met) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {expanded ? "بستن" : "جزئیات بیشتر"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showInteractionForm} onOpenChange={setShowInteractionForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ثبت تعامل با {contact.name}</DialogTitle>
          </DialogHeader>
          <NetworkingInteractionForm
            contactId={contact.id}
            onSuccess={() => {
              setShowInteractionForm(false);
              onRefresh();
            }}
            onCancel={() => setShowInteractionForm(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showInteractions} onOpenChange={setShowInteractions}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تاریخچه تعاملات با {contact.name}</DialogTitle>
          </DialogHeader>
          <NetworkingInteractionsList contactId={contact.id} />
        </DialogContent>
      </Dialog>

      <NetworkingEmailGenerator
        contact={contact}
        open={showEmailGenerator}
        onOpenChange={setShowEmailGenerator}
      />
    </>
  );
}
