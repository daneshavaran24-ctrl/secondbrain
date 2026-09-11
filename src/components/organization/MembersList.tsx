import { useState } from "react";
import { OrganizationMember, OrganizationRole } from "@/types/organization";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { MemberRoleSelector } from "./MemberRoleSelector";
import { organizationMemberService } from "@/services/organizationMemberService";
import { Trash2, Crown } from "lucide-react";
import { toast } from "sonner";

interface MembersListProps {
  members: OrganizationMember[];
  organizationId: string;
  currentUserRole?: OrganizationRole;
  onMemberRemoved?: () => void;
}

export function MembersList({
  members,
  organizationId,
  currentUserRole,
  onMemberRemoved,
}: MembersListProps) {
  const [removingMember, setRemovingMember] = useState<OrganizationMember | null>(null);
  const [changingRole, setChangingRole] = useState<string | null>(null);

  const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'admin';

  const handleRoleChange = async (member: OrganizationMember, newRole: OrganizationRole) => {
    if (member.role === 'owner') {
      toast.error('نمی‌توانید نقش مالک را تغییر دهید');
      return;
    }

    setChangingRole(member.id);
    try {
      await organizationMemberService.updateMemberRole(
        organizationId,
        member.user_id,
        newRole
      );
      onMemberRemoved?.();
    } finally {
      setChangingRole(null);
    }
  };

  const handleRemoveMember = async () => {
    if (!removingMember) return;

    try {
      await organizationMemberService.removeMember(
        organizationId,
        removingMember.user_id
      );
      setRemovingMember(null);
      onMemberRemoved?.();
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  return (
    <>
      <div className="grid gap-4">
        {members.map((member) => (
          <Card key={member.id}>
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4 flex-1">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={member.profiles?.avatar_url} />
                  <AvatarFallback>
                    {member.profiles?.display_name?.charAt(0) ||
                      member.profiles?.email?.charAt(0) ||
                      '?'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">
                      {member.profiles?.display_name || member.profiles?.email || 'کاربر ناشناس'}
                    </h3>
                    {member.role === 'owner' && (
                      <Crown className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  {member.profiles?.email && (
                    <p className="text-sm text-muted-foreground">{member.profiles.email}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    عضو از {new Date(member.joined_at).toLocaleDateString('fa-IR')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {canManageMembers && member.role !== 'owner' ? (
                  <MemberRoleSelector
                    value={member.role as OrganizationRole}
                    onChange={(role) => handleRoleChange(member, role)}
                    disabled={changingRole === member.id}
                  />
                ) : (
                  <Badge variant="secondary">{member.role}</Badge>
                )}

                {canManageMembers && member.role !== 'owner' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setRemovingMember(member)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {members.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12">
              <p className="text-muted-foreground">هنوز عضوی وجود ندارد</p>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={!!removingMember} onOpenChange={() => setRemovingMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف عضو</AlertDialogTitle>
            <AlertDialogDescription>
              آیا مطمئن هستید که می‌خواهید این عضو را از سازمان حذف کنید؟
              این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>لغو</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember} className="bg-destructive">
              حذف عضو
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
