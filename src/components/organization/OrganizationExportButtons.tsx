import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { organizationExportService } from "@/services/organizationExportService";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface OrganizationExportButtonsProps {
  organizationId: string;
}

export function OrganizationExportButtons({ organizationId }: OrganizationExportButtonsProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async (format: 'pdf' | 'excel', type: 'stats' | 'activities' | 'full') => {
    setLoading(true);
    try {
      if (format === 'pdf') {
        await organizationExportService.exportToPDF(organizationId, type);
      } else {
        await organizationExportService.exportToExcel(organizationId, type);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              در حال تولید...
            </>
          ) : (
            <>
              <Download className="ml-2 h-4 w-4" />
              دریافت گزارش
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>انتخاب نوع گزارش</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          فرمت PDF
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleExport('pdf', 'stats')}>
          <FileText className="ml-2 h-4 w-4" />
          فقط آمار
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf', 'activities')}>
          <FileText className="ml-2 h-4 w-4" />
          فقط فعالیت‌ها
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf', 'full')}>
          <FileText className="ml-2 h-4 w-4" />
          گزارش کامل
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          فرمت Excel
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleExport('excel', 'stats')}>
          <FileSpreadsheet className="ml-2 h-4 w-4" />
          فقط آمار
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('excel', 'activities')}>
          <FileSpreadsheet className="ml-2 h-4 w-4" />
          فقط فعالیت‌ها
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('excel', 'full')}>
          <FileSpreadsheet className="ml-2 h-4 w-4" />
          گزارش کامل
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
