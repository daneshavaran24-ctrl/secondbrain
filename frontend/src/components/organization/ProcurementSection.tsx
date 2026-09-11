import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ShoppingCart } from 'lucide-react';

interface ProcurementSectionProps {
  organizationId: string;
}

export function ProcurementSection({ organizationId }: ProcurementSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">تدارکات و تأمین‌کنندگان</h2>
          <p className="text-muted-foreground">مدیریت Vendor، ارزیابی عملکرد و SLA</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          افزودن آیتم
        </Button>
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">بخش تدارکات</h3>
          <p className="text-muted-foreground mb-4">
            این بخش به زودی فعال می‌شود
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
