import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Package } from 'lucide-react';

interface ProjectsSectionProps {
  organizationId: string;
}

export function ProjectsSection({ organizationId }: ProjectsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">پروژه‌ها و محصولات</h2>
          <p className="text-muted-foreground">مدیریت پورتفولیو، بریف پروژه و ریسک‌ها</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          افزودن پروژه
        </Button>
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">بخش پروژه‌ها</h3>
          <p className="text-muted-foreground mb-4">
            این بخش به زودی فعال می‌شود
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
