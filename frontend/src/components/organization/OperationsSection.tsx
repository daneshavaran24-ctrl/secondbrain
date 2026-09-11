import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SOPEditor } from './operations/SOPEditor';
import { ChecklistBuilder } from './operations/ChecklistBuilder';
import { FormBuilder } from './operations/FormBuilder';

interface OperationsSectionProps {
  organizationId: string;
}

export function OperationsSection({ organizationId }: OperationsSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">عملیات و فرایندها</h2>
        <p className="text-muted-foreground">مدیریت SOPها، چک‌لیست‌ها و فرم‌ها</p>
      </div>

      <Tabs defaultValue="sop">
        <TabsList>
          <TabsTrigger value="sop">SOPها</TabsTrigger>
          <TabsTrigger value="checklist">چک‌لیست‌ها</TabsTrigger>
          <TabsTrigger value="forms">سازنده فرم</TabsTrigger>
        </TabsList>

        <TabsContent value="sop">
          <SOPEditor />
        </TabsContent>

        <TabsContent value="checklist">
          <ChecklistBuilder />
        </TabsContent>

        <TabsContent value="forms">
          <FormBuilder organizationId={organizationId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
