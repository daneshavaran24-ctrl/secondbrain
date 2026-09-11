import { UseFormReturn } from "react-hook-form";
import { AIAssistantButton } from "@/components/social-responsibility/AIAssistantButton";
import {
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

interface BasicInfoStepProps {
  form: UseFormReturn<any>;
}

export function BasicInfoStep({ form }: BasicInfoStepProps) {
  const title = form.watch("title");
  const type = form.watch("type");

  const handleAISuggestion = (suggestion: any) => {
    if (suggestion.description) form.setValue("description", suggestion.description);
    if (suggestion.tags) form.setValue("tags", suggestion.tags);
    if (suggestion.beneficiaries) form.setValue("beneficiaries", suggestion.beneficiaries);
    if (suggestion.partners) form.setValue("partners", suggestion.partners);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-muted-foreground">
          اطلاعات اولیه پروژه را وارد کنید
        </p>
        <AIAssistantButton
          title={title}
          type={type}
          onSuggestion={handleAISuggestion}
        />
      </div>
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>عنوان پروژه *</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="مثال: کمک به کودکان یتیم"
                className="text-base"
              />
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
                placeholder="توضیحات کامل پروژه و اهداف آن را بنویسید..."
                rows={4}
                className="resize-none"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
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
      </div>

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
  );
}
