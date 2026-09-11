import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { ModernButton } from "@/components/ui/modern-button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AIAssistantButtonProps {
  title?: string;
  type?: string;
  onSuggestion: (suggestion: {
    description?: string;
    tags?: string[];
    beneficiaries?: string[];
    partners?: string[];
  }) => void;
}

export function AIAssistantButton({
  title,
  type,
  onSuggestion,
}: AIAssistantButtonProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const getSuggestions = async () => {
    if (!title || !type) {
      toast.error("لطفا ابتدا عنوان و نوع پروژه را وارد کنید");
      return;
    }

    setLoading(true);

    try {
      const typeLabels: Record<string, string> = {
        charity: "خیریه",
        environment: "محیط زیست",
        education: "آموزش",
        other: "سایر",
      };

      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          messages: [
            {
              role: "user",
              content: `برای یک پروژه مسئولیت اجتماعی (CSR) با عنوان "${title}" و نوع "${typeLabels[type] || type}":

1. یک توضیحات کامل و جذاب (حداکثر 150 کلمه) پیشنهاد بده
2. 5 برچسب مرتبط فارسی
3. 3-4 گروه ذینفع احتمالی
4. 2-3 شریک یا همکار پیشنهادی

فقط به صورت JSON با این ساختار پاسخ بده:
{
  "description": "...",
  "tags": ["...", "..."],
  "beneficiaries": ["...", "..."],
  "partners": ["...", "..."]
}`,
            },
          ],
        },
      });

      if (error) throw error;

      // Parse JSON response
      const responseText = data.content || data.text || "";
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const suggestion = JSON.parse(jsonMatch[0]);
        onSuggestion(suggestion);
        toast.success("پیشنهادات هوشمند اعمال شد");
        setOpen(false);
      } else {
        throw new Error("فرمت پاسخ نامعتبر است");
      }
    } catch (error) {
      console.error("AI suggestion error:", error);
      toast.error("خطا در دریافت پیشنهادات هوشمند");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ModernButton
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={!title || !type}
        >
          <Sparkles className="h-4 w-4" />
          پیشنهاد هوشمند
        </ModernButton>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold mb-1 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              دستیار هوشمند
            </h4>
            <p className="text-xs text-muted-foreground">
              براساس عنوان و نوع پروژه، پیشنهادات هوشمند برای تکمیل فرم ارائه می‌شود
            </p>
          </div>

          <ModernButton
            onClick={getSuggestions}
            disabled={loading || !title || !type}
            className="w-full"
            magnetic
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                در حال پردازش...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 ml-2" />
                دریافت پیشنهادات
              </>
            )}
          </ModernButton>

          {!title || !type ? (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              ⚠️ ابتدا عنوان و نوع پروژه را در مرحله اول وارد کنید
            </p>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
