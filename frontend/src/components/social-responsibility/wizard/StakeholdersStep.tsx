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

interface StakeholdersStepProps {
  form: UseFormReturn<any>;
}

const PARTNER_SUGGESTIONS = [
  "سازمان بهزیستی",
  "کمیته امداد",
  "هلال احمر",
  "سازمان محیط زیست",
  "شهرداری",
  "آموزش و پرورش",
  "دانشگاه",
  "بخش خصوصی",
];

const BENEFICIARY_SUGGESTIONS = [
  "کودکان یتیم",
  "خانواده‌های نیازمند",
  "سالمندان",
  "دانش‌آموزان",
  "معلولان",
  "زنان سرپرست خانوار",
  "جامعه محلی",
  "محیط زیست",
];

export function StakeholdersStep({ form }: StakeholdersStepProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="partners"
        render={({ field }) => (
          <FormItem>
            <FormLabel>شرکا و همکاران</FormLabel>
            <FormControl>
              <TagInput
                value={field.value || []}
                onChange={field.onChange}
                placeholder="نام شریک را وارد کنید..."
                suggestions={PARTNER_SUGGESTIONS}
              />
            </FormControl>
            <FormDescription>
              سازمان‌ها و افرادی که در پروژه همکاری می‌کنند
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="beneficiaries"
        render={({ field }) => (
          <FormItem>
            <FormLabel>ذینفعان و بهره‌برداران</FormLabel>
            <FormControl>
              <TagInput
                value={field.value || []}
                onChange={field.onChange}
                placeholder="گروه‌های بهره‌بردار را اضافه کنید..."
                suggestions={BENEFICIARY_SUGGESTIONS}
              />
            </FormControl>
            <FormDescription>
              افراد یا گروه‌هایی که از این پروژه بهره‌مند می‌شوند
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
