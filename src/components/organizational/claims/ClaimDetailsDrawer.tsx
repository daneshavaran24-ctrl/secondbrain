import React, { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Calendar, 
  DollarSign, 
  Clock, 
  FileText, 
  Edit, 
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye
} from "lucide-react";
import { Claim, claimsService } from "@/services/claimsService";
import { ClaimForm } from "./ClaimForm";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface ClaimDetailsDrawerProps {
  claim: Claim | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (claim: Claim) => void;
  onDelete: (claimId: string) => void;
}

export function ClaimDetailsDrawer({ claim, isOpen, onClose, onUpdate, onDelete }: ClaimDetailsDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const handleStatusChange = async (newStatus: Claim['status']) => {
    if (!claim) return;

    const updates: Partial<Claim> = { 
      status: newStatus,
      ...(newStatus === 'resolved' && { resolution_date: new Date().toISOString() })
    };
    
    const updated = await claimsService.updateClaim(claim.id, updates);
    if (updated) {
      onUpdate(updated);
      toast({
        title: "وضعیت به‌روزرسانی شد",
        description: `وضعیت به "${claimsService.getStatusLabel(newStatus)}" تغییر یافت.`,
      });
    }
  };

  const handleDelete = async () => {
    if (!claim) return;

    try {
      const success = await claimsService.deleteClaim(claim.id);
      if (success) {
        onDelete(claim.id);
        onClose();
        toast({
          title: "مطالبه حذف شد",
          description: "مطالبه با موفقیت حذف شد.",
        });
      }
    } catch (error) {
      console.error('Error deleting claim:', error);
      toast({
        title: "خطا در حذف مطالبه",
        description: "لطفاً دوباره تلاش کنید.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'reviewing':
        return <Eye className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'reviewing':
        return 'default';
      case 'resolved':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  if (!claim) return null;

  if (isEditing) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="max-w-4xl mx-auto">
          <DrawerHeader>
            <DrawerTitle>ویرایش مطالبه</DrawerTitle>
          </DrawerHeader>
          <div className="p-6">
            <ClaimForm
              organizationId={claim.organization_id}
              claim={claim}
              onSuccess={(updatedClaim) => {
                onUpdate(updatedClaim);
                setIsEditing(false);
              }}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-w-4xl mx-auto">
        <DrawerHeader>
          <DrawerTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5" />
              جزئیات مطالبه
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 ml-2" />
                ویرایش
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 ml-2" />
                    حذف
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>حذف مطالبه</AlertDialogTitle>
                    <AlertDialogDescription>
                      آیا از حذف این مطالبه اطمینان دارید؟ این عمل قابل بازگشت نیست.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>انصراف</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>حذف</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </DrawerTitle>
        </DrawerHeader>
        
        <ScrollArea className="max-h-[80vh] p-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusVariant(claim.status || 'open')}>
                      {getStatusIcon(claim.status || 'open')}
                      {claimsService.getStatusLabel(claim.status || 'open')}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{claim.title}</h3>
                    <p className="text-muted-foreground">{claim.claim_number}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {claim.description && (
                  <p className="text-muted-foreground">{claim.description}</p>
                )}
              </CardContent>
            </Card>

            {claim.status !== 'resolved' && claim.status !== 'rejected' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">تغییر وضعیت</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    {claim.status === 'pending' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStatusChange('reviewing')}
                      >
                        <Eye className="h-4 w-4 ml-2" />
                        شروع بررسی
                      </Button>
                    )}
                    {(claim.status === 'pending' || claim.status === 'reviewing') && (
                      <>
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => handleStatusChange('resolved')}
                        >
                          <CheckCircle className="h-4 w-4 ml-2" />
                          حل شده
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleStatusChange('rejected')}
                        >
                          <XCircle className="h-4 w-4 ml-2" />
                          رد مطالبه
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">اطلاعات مدعی</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span>اطلاعات مدعی در حال حاضر موجود نیست</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    جزئیات مطالبه
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">نوع:</span>
                    <Badge variant="outline">
                      {claimsService.getClaimTypeLabel(claim.claim_type || 'other')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    اطلاعات مالی
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">مبلغ:</label>
                    <p className="text-muted-foreground">
                      {claim.amount ? `${claim.amount.toLocaleString()} ${claim.currency || 'IRR'}` : '-'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    تاریخ‌ها
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">تاریخ ثبت:</span>
                    <span>{claim.filed_date ? formatDate(claim.filed_date) : 'نامشخص'}</span>
                  </div>
                  {claim.resolution_date && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="font-medium">تاریخ حل:</span>
                      <span>{formatDate(claim.resolution_date)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {claim.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">توضیحات</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {claim.description}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
