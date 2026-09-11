import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrganizationRole, ROLE_NAMES } from "@/types/organization";

interface MemberRoleSelectorProps {
  value: OrganizationRole;
  onChange: (role: OrganizationRole) => void;
  disabled?: boolean;
}

export function MemberRoleSelector({
  value,
  onChange,
  disabled,
}: MemberRoleSelectorProps) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as OrganizationRole)}
      disabled={disabled}
    >
      <SelectTrigger className="w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="owner" disabled>
          {ROLE_NAMES.owner}
        </SelectItem>
        <SelectItem value="admin">{ROLE_NAMES.admin}</SelectItem>
        <SelectItem value="manager">{ROLE_NAMES.manager}</SelectItem>
        <SelectItem value="member">{ROLE_NAMES.member}</SelectItem>
        <SelectItem value="viewer">{ROLE_NAMES.viewer}</SelectItem>
      </SelectContent>
    </Select>
  );
}
