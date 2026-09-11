import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CSRProject } from "@/services/socialResponsibilityService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ModernButton } from "@/components/ui/modern-button";
import { Calendar } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(3, "عنوان باید حداقل 3 کاراکتر باشد"),
  description: z.string().optional(),
  type: z.enum(["charity", "environment", "education", "other"]),
  status: z.enum(["planning", "active", "completed", "on_hold"]),
  priority: z.enum(["low", "medium", "high"]),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  budget: z.string().optional(),
  partners: z.string().optional(),
  tags: z.string().optional(),
});

interface CSRProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: CSRProject;
  onSubmit: (data: Partial<CSRProject>) => void;
}

export function CSRProjectForm({
  open,
  onOpenChange,
  project,
  onSubmit,
}: CSRProjectFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: project?.title || "",
      description: project?.description || "",
      type: (project?.type as "charity" | "environment" | "education" | "other") || "charity",
      status: (project?.status as "planning" | "active" | "completed" | "on_hold") || "planning",
      priority: (project?.priority as "low" | "medium" | "high") || "medium",
      start_date: project?.start_date || "",
      end_date: project?.end_date || "",
      budget: project?.budget?.toString() || "",
      partners: project?.partners?.join(", ") || "",
      tags: project?.tags?.join(", ") || "",
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    const data: Partial<CSRProject> = {
      title: values.title,
      description: values.description,
      type: values.type,
      status: values.status,
      priority: values.priority,
      start_date: values.start_date || undefined,
      end_date: values.end_date || undefined,
      budget: values.budget ? parseFloat(values.budget) : undefined,
      partners: values.partners
        ? values.partners.split(",").map((p) => p.trim())
        : [],
      tags: values.tags ? values.tags.split(",").map((t) => t.trim()) : [],
    };

    onSubmit(data);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {project ? "ویرایش پروژه CSR" : "پروژه CSR جدید"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>عنوان پروژه *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="مثال: کمک به کودکان یتیم" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>توضیحات</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="توضیحات کامل پروژه..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع پروژه *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="charity">خیریه</SelectItem>
                        <SelectItem value="environment">محیط زیست</SelectItem>
                        <SelectItem value="education">آموزش</SelectItem>
                        <SelectItem value="other">سایر</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>وضعیت *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="planning">برنامه‌ریزی</SelectItem>
                        <SelectItem value="active">فعال</SelectItem>
                        <SelectItem value="completed">تکمیل شده</SelectItem>
                        <SelectItem value="on_hold">معلق</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اولویت *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">کم</SelectItem>
                        <SelectItem value="medium">متوسط</SelectItem>
                        <SelectItem value="high">بالا</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاریخ شروع</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاریخ پایان</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>بودجه (ریال)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder="مثال: 10000000"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="partners"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>شرکا (با کاما جدا کنید)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="مثال: سازمان الف، شرکت ب"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>برچسب‌ها (با کاما جدا کنید)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="مثال: کودکان، آموزش" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 justify-end pt-4">
              <ModernButton
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                انصراف
              </ModernButton>
              <ModernButton type="submit" magnetic glow>
                {project ? "ذخیره تغییرات" : "ایجاد پروژه"}
              </ModernButton>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
