import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SubUsersList } from "@/components/sub-users/SubUsersList";
import { SubUserForm } from "@/components/sub-users/SubUserForm";
import { useSubUsers, useCanCreateSubUser } from "@/hooks/useSubUsers";
import { Plus, Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function SubUsersSection() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { createSubUser, subUsers } = useSubUsers();
  const { data: canCreate } = useCanCreateSubUser();

  const handleCreateSubUser = async (data: any) => {
    try {
      await createSubUser.mutateAsync(data);
      setIsCreateDialogOpen(false);
      toast.success('کاربر فرعی با موفقیت ایجاد شد');
    } catch (error: any) {
      toast.error('خطا در ایجاد کاربر فرعی: ' + error.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              کاربران فرعی
            </CardTitle>
            <CardDescription>
              مدیریت کاربران فرعی و دسترسی‌های آنها
            </CardDescription>
          </div>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            disabled={!canCreate}
          >
            <Plus className="w-4 h-4 ml-2" />
            افزودن کاربر جدید
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!canCreate && (
          <Alert className="mb-4">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              شما به حداکثر تعداد کاربران فرعی مجاز (3 کاربر) رسیده‌اید.
              برای افزودن کاربر جدید، ابتدا یکی از کاربران فعلی را غیرفعال کنید.
            </AlertDescription>
          </Alert>
        )}

        <SubUsersList onEdit={() => {}} />
      </CardContent>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ایجاد کاربر فرعی جدید</DialogTitle>
          </DialogHeader>
          <SubUserForm
            onSubmit={handleCreateSubUser}
            isPending={createSubUser.isPending}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
