import { useState } from "react";
import { OrganizationInvitation } from "@/types/organization";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { organizationMemberService } from "@/services/organizationMemberService";
import { Mail, X, Clock, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface PendingInvitationsProps {
  invitations: OrganizationInvitation[];
  onInvitationCanceled?: () => void;
}

export function PendingInvitations({
  invitations,
  onInvitationCanceled,
}: PendingInvitationsProps) {
  const [cancelingInvitation, setCancelingInvitation] = useState<OrganizationInvitation | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const handleCancelInvitation = async () => {
    if (!cancelingInvitation) return;

    try {
      await organizationMemberService.cancelInvitation(cancelingInvitation.id);
      setCancelingInvitation(null);
      onInvitationCanceled?.();
    } catch (error) {
      console.error('Error canceling invitation:', error);
    }
  };

  const copyInvitationLink = (token: string) => {
    const link = `${window.location.origin}/accept-invitation/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    toast.success('لینک دعوت کپی شد');
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const getExpiryText = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return 'منقضی شده';
    if (days === 0) return 'امروز منقضی می‌شود';
    if (days === 1) return 'فردا منقضی می‌شود';
    return `${days} روز دیگر منقضی می‌شود`;
  };

  if (invitations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12">
          <Mail className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">دعوتنامه‌ای در انتظار تایید نیست</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4">
        {invitations.map((invitation) => (
          <Card key={invitation.id}>
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4 flex-1">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-primary" />
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold">{invitation.email}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">{invitation.role}</Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {getExpiryText(invitation.expires_at)}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    ارسال شده در {new Date(invitation.created_at).toLocaleDateString('fa-IR')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyInvitationLink(invitation.token)}
                >
                  {copiedToken === invitation.token ? (
                    <>
                      <Check className="ml-2 h-4 w-4" />
                      کپی شد
                    </>
                  ) : (
                    <>
                      <Copy className="ml-2 h-4 w-4" />
                      کپی لینک
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCancelingInvitation(invitation)}
                >
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog
        open={!!cancelingInvitation}
        onOpenChange={() => setCancelingInvitation(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>لغو دعوتنامه</AlertDialogTitle>
            <AlertDialogDescription>
              آیا مطمئن هستید که می‌خواهید این دعوتنامه را لغو کنید؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelInvitation} className="bg-destructive">
              لغو دعوتنامه
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
