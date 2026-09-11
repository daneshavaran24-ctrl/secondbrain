import { Card, CardContent } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

interface FinanceSectionProps {
  organizationId: string;
}

export function FinanceSection({ organizationId }: FinanceSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">مالی</h2>
        <p className="text-muted-foreground">مدیریت بودجه، گزارش‌ها و سیاست‌های مالی</p>
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">داشبورد مالی</h3>
          <p className="text-muted-foreground mb-4">
            نمودارهای بودجه، صورت سود و زیان و جریان نقدی به زودی اضافه می‌شود
          </p>
          <p className="text-sm text-muted-foreground">
            این بخش به دلیل پیچیدگی معماری جداول مالی، در آپدیت بعدی تکمیل خواهد شد
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
