import { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { getActiveUserId } from '@/config/mockUser';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ResumeCertificateDialog } from './ResumeCertificateDialog';
import { getCertificates, deleteCertificate, Certificate } from '@/services/resumeService';
import { toast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/ui/empty-state';
import { Award } from 'lucide-react';

export function ResumeCertificates() {
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Certificate | undefined>();

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    setLoading(true);
    try {
      const data = await getCertificates(getActiveUserId());
      setCertificates(data);
    } catch (error) {
      console.error('Error loading certificates:', error);
      toast({
        title: 'خطا در بارگذاری گواهینامه‌ها',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این گواهینامه مطمئن هستید؟')) return;

    try {
      await deleteCertificate(id);
      toast({ title: 'گواهینامه با موفقیت حذف شد' });
      loadCertificates();
    } catch (error) {
      console.error('Error deleting certificate:', error);
      toast({
        title: 'خطا در حذف گواهینامه',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (certificate: Certificate) => {
    setEditItem(certificate);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditItem(undefined);
    loadCertificates();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">گواهینامه‌ها</h2>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          افزودن گواهینامه
        </Button>
      </div>

      {certificates.length === 0 ? (
        <EmptyState
          icon={<Award className="w-12 h-12" />}
          title="هنوز گواهینامه‌ای ثبت نکرده‌اید"
          description="گواهینامه‌های حرفه‌ای خود را اضافه کنید"
          action={{
            label: 'افزودن گواهینامه',
            onClick: () => setDialogOpen(true),
            icon: <Plus className="w-4 h-4" />,
          }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {certificates.map((cert) => (
            <Card key={cert.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{cert.title}</h3>
                  <p className="text-sm text-muted-foreground">{cert.issuing_organization}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(cert)}>
                    ویرایش
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => cert.id && handleDelete(cert.id)}
                  >
                    حذف
                  </Button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">تاریخ صدور: </span>
                  {new Date(cert.issue_date).toLocaleDateString('fa-IR')}
                </p>
                {cert.expiry_date && (
                  <p>
                    <span className="font-medium">تاریخ انقضا: </span>
                    {new Date(cert.expiry_date).toLocaleDateString('fa-IR')}
                  </p>
                )}
                {cert.description && (
                  <p className="text-muted-foreground">{cert.description}</p>
                )}
              </div>

              {cert.skills && cert.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {cert.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}

              {cert.certificate_url && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => window.open(cert.certificate_url, '_blank')}
                >
                  مشاهده گواهینامه
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      <ResumeCertificateDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        certificate={editItem}
      />
    </div>
  );
}