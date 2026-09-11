import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SubUsersList } from "@/components/sub-users/SubUsersList";
import { SubUserForm } from "@/components/sub-users/SubUserForm";
import { useSubUsers, useCanCreateSubUser } from "@/hooks/useSubUsers";
import { Plus, AlertCircle, Users } from "lucide-react";

export default function SubUsersManagementPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSubUserId, setEditingSubUserId] = useState<string | null>(null);

  const { createSubUser } = useSubUsers();
  const { data: canCreate } = useCanCreateSubUser();

  const handleEdit = (id: string) => {
    setEditingSubUserId(id);
    // TODO: Implement edit dialog
  };

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            مدیریت کاربران فرعی
          </h1>
          <p className="text-muted-foreground">
            ایجاد و مدیریت کاربران فرعی با دسترسی محدود (حداکثر 3 کاربر فعال)
          </p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          disabled={!canCreate}
        >
          <Plus className="h-4 w-4 ml-2" />
          کاربر فرعی جدید
        </Button>
      </div>

      {!canCreate && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            شما به حداکثر تعداد مجاز کاربران فرعی (3 کاربر فعال) رسیده‌اید. 
            برای افزودن کاربر جدید، ابتدا یکی از کاربران فعلی را غیرفعال کنید.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>لیست کاربران فرعی</CardTitle>
          <CardDescription>
            مدیریت کاربران فرعی، دسترسی‌ها و وضعیت فعال/غیرفعال آنها
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubUsersList onEdit={handleEdit} />
        </CardContent>
      </Card>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ایجاد کاربر فرعی جدید</DialogTitle>
          </DialogHeader>
          <SubUserForm
            onSubmit={(data) => {
              createSubUser.mutate(data, {
                onSuccess: () => {
                  setIsCreateDialogOpen(false);
                },
              });
            }}
            isPending={createSubUser.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
