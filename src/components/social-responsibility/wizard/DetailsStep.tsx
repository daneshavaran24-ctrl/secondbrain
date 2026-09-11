import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { TagInput } from "@/components/ui/TagInput";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface DetailsStepProps {
  form: UseFormReturn<any>;
}

const TAG_SUGGESTIONS = [
  "کودکان",
  "آموزش",
  "محیط زیست",
  "سلامت",
  "درمان",
  "حمایت",
  "خیریه",
  "توسعه",
  "بازیافت",
  "درختکاری",
  "فقر",
  "بیماران",
  "سالمندان",
  "زنان",
  "جوانان",
];

export function DetailsStep({ form }: DetailsStepProps) {
  const values = form.getValues();

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="tags"
        render={({ field }) => (
          <FormItem>
            <FormLabel>برچسب‌ها</FormLabel>
            <FormControl>
              <TagInput
                value={field.value || []}
                onChange={field.onChange}
                placeholder="برچسب اضافه کنید..."
                suggestions={TAG_SUGGESTIONS}
              />
            </FormControl>
            <FormDescription>
              برچسب‌هایی برای دسته‌بندی و جستجوی آسان‌تر پروژه
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <h4 className="font-semibold mb-2">خلاصه پروژه:</h4>
          <div className="space-y-1 text-sm">
            <p><strong>عنوان:</strong> {values.title || "-"}</p>
            <p><strong>نوع:</strong> {
              values.type === "charity" ? "خیریه" :
              values.type === "environment" ? "محیط زیست" :
              values.type === "education" ? "آموزش" : "سایر"
            }</p>
            <p><strong>اولویت:</strong> {
              values.priority === "high" ? "بالا" :
              values.priority === "medium" ? "متوسط" : "کم"
            }</p>
            {values.budget && (
              <p><strong>بودجه:</strong> {values.budget.toLocaleString()} ریال</p>
            )}
            {values.partners?.length > 0 && (
              <p><strong>شرکا:</strong> {values.partners.join("، ")}</p>
            )}
            {values.beneficiaries?.length > 0 && (
              <p><strong>ذینفعان:</strong> {values.beneficiaries.join("، ")}</p>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
