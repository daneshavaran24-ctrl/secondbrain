import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Cpu } from 'lucide-react';

interface TechSectionProps {
  organizationId: string;
}

export function TechSection({ organizationId }: TechSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">فناوری و داده</h2>
          <p className="text-muted-foreground">مدیریت معماری، API، امنیت و بکاپ</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          افزودن آیتم
        </Button>
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <Cpu className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">بخش فناوری</h3>
          <p className="text-muted-foreground mb-4">
            این بخش به زودی فعال می‌شود
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
