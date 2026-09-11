import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/CurrencyInput";

interface TimelineBudgetStepProps {
  form: UseFormReturn<any>;
}

export function TimelineBudgetStep({ form }: TimelineBudgetStepProps) {
  return (
    <div className="space-y-4">
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
              <FormDescription>
                تاریخ شروع پروژه را انتخاب کنید
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="end_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>تاریخ پایان (پیش‌بینی)</FormLabel>
              <FormControl>
                <Input {...field} type="date" />
              </FormControl>
              <FormDescription>
                تاریخ پیش‌بینی شده برای پایان پروژه
              </FormDescription>
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
            <FormLabel>بودجه</FormLabel>
            <FormControl>
              <CurrencyInput
                value={field.value || 0}
                onChange={field.onChange}
                currency="ریال"
                placeholder="مثال: 10,000,000"
              />
            </FormControl>
            <FormDescription>
              بودجه تخمینی پروژه را وارد کنید
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
