import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrganizationRole, ROLE_NAMES } from "@/types/organization";
import { organizationMemberService } from "@/services/organizationMemberService";
import { Loader2 } from "lucide-react";

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  onSuccess?: () => void;
}

export function InviteMemberDialog({
  open,
  onOpenChange,
  organizationId,
  onSuccess,
}: InviteMemberDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrganizationRole>("member");
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) return;

    setLoading(true);
    try {
      const result = await organizationMemberService.inviteMember(
        organizationId,
        email.trim(),
        role
      );

      if (result) {
        setEmail("");
        setRole("member");
        onOpenChange(false);
        onSuccess?.();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>دعوت عضو جدید</DialogTitle>
          <DialogDescription>
            ایمیل فرد مورد نظر را وارد کنید و نقش او را انتخاب نمایید
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email">ایمیل</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="role">نقش</Label>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as OrganizationRole)}
              disabled={loading}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">{ROLE_NAMES.viewer}</SelectItem>
                <SelectItem value="member">{ROLE_NAMES.member}</SelectItem>
                <SelectItem value="manager">{ROLE_NAMES.manager}</SelectItem>
                <SelectItem value="admin">{ROLE_NAMES.admin}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            لغو
          </Button>
          <Button onClick={handleInvite} disabled={loading || !email.trim()}>
            {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            ارسال دعوتنامه
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
