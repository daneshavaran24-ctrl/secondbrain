import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MembersList } from "@/components/organization/MembersList";
import { PendingInvitations } from "@/components/organization/PendingInvitations";
import { InviteMemberDialog } from "@/components/organization/InviteMemberDialog";
import { OrganizationExportButtons } from "@/components/organization/OrganizationExportButtons";
import { organizationMemberService } from "@/services/organizationMemberService";
import { organizationExportService } from "@/services/organizationExportService";
import { supabase } from "@/integrations/supabase/client";
import { OrganizationMember, OrganizationInvitation, OrganizationRole } from "@/types/organization";
import { ArrowRight, UserPlus, Loader2, Download } from "lucide-react";

export default function OrganizationMembersPage() {
  const { organizationId } = useParams();
  const navigate = useNavigate();
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<OrganizationRole | null>(null);

  useEffect(() => {
    if (organizationId) {
      loadData();
    }
  }, [organizationId]);

  const loadData = async () => {
    if (!organizationId) return;

    setLoading(true);
    try {
      const [membersData, invitationsData] = await Promise.all([
        organizationMemberService.getMembers(organizationId),
        organizationMemberService.getPendingInvitations(organizationId),
      ]);

      setMembers(membersData);
      setInvitations(invitationsData);

      // دریافت نقش کاربر فعلی
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const role = await organizationMemberService.getUserRole(organizationId, user.id);
        setCurrentUserRole(role);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportMembers = async () => {
    if (!organizationId) return;
    await organizationExportService.exportMembersToExcel(organizationId, members);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">مدیریت اعضا</h1>
            <p className="text-muted-foreground">اعضا و دعوتنامه‌های سازمان</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportMembers}>
            <Download className="ml-2 h-4 w-4" />
            دریافت لیست اعضا
          </Button>
          <Button onClick={() => setInviteDialogOpen(true)}>
            <UserPlus className="ml-2 h-4 w-4" />
            دعوت عضو جدید
          </Button>
        </div>
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="members">
            اعضا ({members.length})
          </TabsTrigger>
          <TabsTrigger value="invitations">
            دعوتنامه‌ها ({invitations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-6">
          <MembersList
            members={members}
            organizationId={organizationId!}
            currentUserRole={currentUserRole || undefined}
            onMemberRemoved={loadData}
          />
        </TabsContent>

        <TabsContent value="invitations" className="mt-6">
          <PendingInvitations
            invitations={invitations}
            onInvitationCanceled={loadData}
          />
        </TabsContent>
      </Tabs>

      <InviteMemberDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        organizationId={organizationId!}
        onSuccess={loadData}
      />
    </div>
  );
}
