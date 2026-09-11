import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useSubUsers } from "@/hooks/useSubUsers";
import { Edit, Trash2, Mail } from "lucide-react";
import { format } from "date-fns-jalali";
import { DOMAIN_CONFIGS } from "@/types/sub-user";

interface SubUsersListProps {
  onEdit: (id: string) => void;
}

export function SubUsersList({ onEdit }: SubUsersListProps) {
  const { subUsers, isLoading, toggleStatus, deleteSubUser } = useSubUsers();

  if (isLoading) {
    return <div className="text-center p-8">در حال بارگذاری...</div>;
  }

  if (!subUsers || subUsers.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          هنوز کاربر فرعی ایجاد نکرده‌اید
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {subUsers.map((subUser) => (
        <Card key={subUser.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{subUser.name}</CardTitle>
                  <Badge variant={subUser.is_active ? "default" : "secondary"}>
                    {subUser.is_active ? 'فعال' : 'غیرفعال'}
                  </Badge>
                  {subUser.expires_at && (
                    <Badge variant="outline">
                      انقضا: {format(new Date(subUser.expires_at), 'yyyy/MM/dd')}
                    </Badge>
                  )}
                </div>
                <CardDescription className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {subUser.email}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={subUser.is_active}
                  onCheckedChange={(checked) => 
                    toggleStatus.mutate({ id: subUser.id, isActive: checked })
                  }
                  disabled={toggleStatus.isPending}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onEdit(subUser.id)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (confirm('آیا مطمئن هستید که می‌خواهید این کاربر را حذف کنید؟')) {
                      deleteSubUser.mutate(subUser.id);
                    }
                  }}
                  disabled={deleteSubUser.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm font-medium">دسترسی‌ها:</div>
              <div className="flex flex-wrap gap-2">
                {subUser.permissions && subUser.permissions.length > 0 ? (
                  subUser.permissions.map((perm) => {
                    const domainConfig = DOMAIN_CONFIGS.find(d => d.id === perm.domain);
                    return (
                      <Badge key={perm.id} variant="outline" className="gap-1">
                        {domainConfig?.name || perm.domain}
                        <span className="text-xs text-muted-foreground">
                          ({perm.permissions.join(', ')})
                        </span>
                      </Badge>
                    );
                  })
                ) : (
                  <span className="text-sm text-muted-foreground">بدون دسترسی</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
