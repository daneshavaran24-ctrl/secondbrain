import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Download, FileSpreadsheet, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { claimsService, Claim } from "@/services/claimsService";
import { Input } from "@/components/ui/input";

interface ClaimExporterProps {
  organizationId: string;
  claims: Claim[];
}

interface ExportFilters {
  status: string;
  claimType: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export function ClaimExporter({ organizationId, claims }: ClaimExporterProps) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<ExportFilters>({
    status: 'all',
    claimType: 'all'
  });
  const [selectedFields, setSelectedFields] = useState({
    claim_number: true,
    title: true,
    status: true,
    amount: true,
    filed_date: true,
    resolution_date: true,
    description: false,
    claim_type: true,
  });
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const filterClaims = () => {
    return claims.filter(claim => {
      if (filters.status !== 'all' && claim.status !== filters.status) return false;
      if (filters.claimType !== 'all' && claim.claim_type !== filters.claimType) return false;
      
      if (filters.dateFrom) {
        const claimDate = claim.filed_date ? new Date(claim.filed_date) : null;
        if (!claimDate || claimDate < filters.dateFrom) return false;
      }
      
      if (filters.dateTo) {
        const claimDate = claim.filed_date ? new Date(claim.filed_date) : null;
        if (!claimDate || claimDate > filters.dateTo) return false;
      }
      
      return true;
    });
  };

  const exportToCSV = async () => {
    setExporting(true);
    try {
      const filteredClaims = filterClaims();
      
      if (filteredClaims.length === 0) {
        toast({
          title: "هیچ مطالبه‌ای برای خروجی یافت نشد",
          description: "لطفاً فیلترهای خود را بررسی کنید.",
          variant: "destructive",
        });
        return;
      }

      const headers = [];
      const fieldLabels = {
        claim_number: 'شماره مطالبه',
        title: 'عنوان',
        status: 'وضعیت',
        amount: 'مبلغ',
        filed_date: 'تاریخ ثبت',
        resolution_date: 'تاریخ حل',
        description: 'شرح',
        claim_type: 'نوع مطالبه',
      };

      Object.keys(selectedFields).forEach(field => {
        if (selectedFields[field as keyof typeof selectedFields]) {
          headers.push(fieldLabels[field as keyof typeof fieldLabels]);
        }
      });

      const rows = filteredClaims.map(claim => {
        const row: string[] = [];
        
        if (selectedFields.claim_number) row.push(claim.claim_number || '');
        if (selectedFields.title) row.push(claim.title || '');
        if (selectedFields.status) row.push(claimsService.getStatusLabel(claim.status || 'open'));
        if (selectedFields.claim_type) row.push(claimsService.getClaimTypeLabel(claim.claim_type || 'other'));
        if (selectedFields.amount) row.push(claim.amount?.toString() || '0');
        if (selectedFields.description) row.push(claim.description || '');
        
        if (selectedFields.filed_date) row.push(claim.filed_date ? new Date(claim.filed_date).toLocaleDateString('fa-IR') : '');
        if (selectedFields.resolution_date) row.push(claim.resolution_date ? new Date(claim.resolution_date).toLocaleDateString('fa-IR') : '');

        return row.map(value => {
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        });
      });

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `گزارش_مطالبات_${new Date().toLocaleDateString('fa-IR').replace(/\//g, '-')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "گزارش با موفقیت ایجاد شد",
        description: `${filteredClaims.length} مطالبه در فایل خروجی گنجانده شد.`,
      });

      setOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "خطا در ایجاد گزارش",
        description: "لطفاً دوباره تلاش کنید.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const selectedFieldCount = Object.values(selectedFields).filter(Boolean).length;
  const filteredCount = filterClaims().length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="h-4 w-4 ml-2" />
          گزارش‌گیری
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            خروجی گزارش مطالبات
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">فیلترها</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>وضعیت</Label>
                  <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب وضعیت" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                      <SelectItem value="pending">در انتظار</SelectItem>
                      <SelectItem value="reviewing">در حال بررسی</SelectItem>
                      <SelectItem value="resolved">حل شده</SelectItem>
                      <SelectItem value="rejected">رد شده</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>نوع مطالبه</Label>
                  <Select value={filters.claimType} onValueChange={(value) => setFilters({...filters, claimType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب نوع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه انواع</SelectItem>
                      <SelectItem value="financial">مالی</SelectItem>
                      <SelectItem value="legal">حقوقی</SelectItem>
                      <SelectItem value="service">خدماتی</SelectItem>
                      <SelectItem value="warranty">گارانتی</SelectItem>
                      <SelectItem value="insurance">بیمه</SelectItem>
                      <SelectItem value="other">سایر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    از تاریخ
                  </Label>
                  <Input
                    type="date"
                    value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ''}
                    onChange={(e) => setFilters({ 
                      ...filters, 
                      dateFrom: e.target.value ? new Date(e.target.value) : undefined 
                    })}
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    تا تاریخ
                  </Label>
                  <Input
                    type="date"
                    value={filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : ''}
                    onChange={(e) => setFilters({ 
                      ...filters, 
                      dateTo: e.target.value ? new Date(e.target.value) : undefined 
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">انتخاب فیلدهای خروجی</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {Object.entries(selectedFields).map(([field, checked]) => {
                  const labels = {
                    claim_number: 'شماره مطالبه',
                    title: 'عنوان',
                    status: 'وضعیت',
                    amount: 'مبلغ',
                    filed_date: 'تاریخ ثبت',
                    resolution_date: 'تاریخ حل',
                    description: 'شرح',
                    claim_type: 'نوع مطالبه',
                  };

                  return (
                    <div key={field} className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id={field}
                        checked={checked}
                        onCheckedChange={(checked) =>
                          setSelectedFields(prev => ({ ...prev, [field]: !!checked }))
                        }
                      />
                      <Label htmlFor={field} className="text-sm">
                        {labels[field as keyof typeof labels]}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  <Badge variant="outline">
                    {filteredCount} مطالبه انتخاب شده
                  </Badge>
                  <Badge variant="outline">
                    {selectedFieldCount} فیلد انتخاب شده
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              انصراف
            </Button>
            <Button 
              onClick={exportToCSV} 
              disabled={selectedFieldCount === 0 || filteredCount === 0 || exporting}
            >
              {exporting ? 'در حال ایجاد...' : 'دانلود CSV'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
