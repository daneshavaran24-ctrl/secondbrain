import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, Download, FileSpreadsheet } from "lucide-react";
import { IdeaPdfExportService, IdeaData } from "@/services/ideaPdfExportService";
import { toast } from "sonner";

interface IdeaPdfExportButtonProps {
  idea?: IdeaData;
  ideas?: IdeaData[];
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showDropdown?: boolean;
}

export function IdeaPdfExportButton({
  idea,
  ideas,
  variant = "outline",
  size = "sm",
  showDropdown = true,
}: IdeaPdfExportButtonProps) {
  const handleExport = async (template: 'executive' | 'detailed' | 'comparison') => {
    try {
      toast.info("در حال تهیه فایل PDF...");

      if (idea) {
        await IdeaPdfExportService.exportSingleIdea(idea, {
          template,
          includeLogo: true,
          includeSWOT: true,
          includeRisks: true,
          includeCharts: true,
        });
      } else if (ideas && ideas.length > 0) {
        await IdeaPdfExportService.exportMultipleIdeas(ideas, {
          template,
          includeLogo: true,
          includeSWOT: template === 'detailed',
          includeRisks: template === 'detailed',
          includeCharts: true,
        });
      }

      toast.success("فایل PDF با موفقیت دانلود شد");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("خطا در ایجاد فایل PDF");
    }
  };

  if (!showDropdown) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={() => handleExport('detailed')}
        className="gap-2"
      >
        <FileText className="w-4 h-4" />
        خروجی PDF
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <FileText className="w-4 h-4" />
          خروجی PDF
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => handleExport('executive')}>
          <FileSpreadsheet className="w-4 h-4 ml-2" />
          <div className="flex flex-col">
            <span className="font-medium">خلاصه مدیریتی</span>
            <span className="text-xs text-muted-foreground">گزارش کوتاه و مختصر</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('detailed')}>
          <FileText className="w-4 h-4 ml-2" />
          <div className="flex flex-col">
            <span className="font-medium">گزارش کامل</span>
            <span className="text-xs text-muted-foreground">شامل تمام جزئیات</span>
          </div>
        </DropdownMenuItem>
        {ideas && ideas.length > 1 && (
          <DropdownMenuItem onClick={() => handleExport('comparison')}>
            <Download className="w-4 h-4 ml-2" />
            <div className="flex flex-col">
              <span className="font-medium">گزارش مقایسه‌ای</span>
              <span className="text-xs text-muted-foreground">مقایسه چند ایده</span>
            </div>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
