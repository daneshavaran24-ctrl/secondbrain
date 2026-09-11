import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, CheckCircle, AlertCircle, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { claimsService } from "@/services/claimsService";

interface BulkClaimImportProps {
  organizationId: string;
  onImportComplete: () => void;
}

interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: string[];
}

export function BulkClaimImport({ organizationId, onImportComplete }: BulkClaimImportProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const template = [
      'عنوان مطالبه,شرح,نام مطالبه‌کننده,اطلاعات تماس,نوع مطالبه,منبع,اولویت,مبلغ,واحد پول,مهلت (روز),یادداشت',
      'مطالبه نمونه,شرح کامل از مطالبه,احمد احمدی,09123456789,financial,email,medium,1000000,IRR,30,یادداشت نمونه'
    ].join('\n');

    const blob = new Blob(['\uFEFF' + template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'قالب_مطالبات.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',');
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length >= headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          const value = values[index]?.trim();
          switch (index) {
            case 0: row.title = value; break;
            case 1: row.description = value; break;
            case 2: row.claimant_name = value; break;
            case 3: row.claimant_contact = value; break;
            case 4: row.claim_type = value; break;
            case 5: row.source = value; break;
            case 6: row.priority = value; break;
            case 7: row.amount = parseFloat(value) || 0; break;
            case 8: row.currency = value || 'IRR'; break;
            case 9: row.deadline_days = parseInt(value) || 30; break;
            case 10: row.notes = value; break;
          }
        });
        if (row.title) {
          data.push(row);
        }
      }
    }
    return data;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
      } else {
        toast({
          title: "نوع فایل نامعتبر",
          description: "لطفاً فایل CSV انتخاب کنید.",
          variant: "destructive",
        });
      }
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setProgress(0);
    setResult(null);

    try {
      const text = await file.text();
      const data = parseCSV(text);

      if (data.length === 0) {
        throw new Error('هیچ داده معتبری در فایل یافت نشد');
      }

      const result: ImportResult = {
        total: data.length,
        success: 0,
        failed: 0,
        errors: []
      };

      for (let i = 0; i < data.length; i++) {
        try {
          await claimsService.createClaim({
            ...data[i],
            claim_number: claimsService.generateClaimNumber(),
            status: 'pending' as const,
            organization_id: organizationId,
            date_received: new Date().toISOString().split('T')[0],
          });
          result.success++;
        } catch (error) {
          result.failed++;
          result.errors.push(`ردیف ${i + 2}: ${error instanceof Error ? error.message : 'خطای ناشناخته'}`);
        }

        setProgress(Math.round(((i + 1) / data.length) * 100));
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for UI
      }

      setResult(result);
      
      if (result.success > 0) {
        toast({
          title: "وارد کردن اطلاعات تکمیل شد",
          description: `${result.success} مطالبه با موفقیت ایجاد شد.`,
        });
        onImportComplete();
      }

    } catch (error) {
      toast({
        title: "خطا در وارد کردن اطلاعات",
        description: error instanceof Error ? error.message : "خطای ناشناخته رخ داد.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setProgress(0);
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 ml-2" />
          وارد کردن دسته‌ای
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            وارد کردن دسته‌ای مطالبات
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Download */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">مرحله ۱: دانلود قالب</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                ابتدا قالب CSV را دانلود کرده و اطلاعات مطالبات خود را در آن وارد کنید.
              </p>
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="h-4 w-4 ml-2" />
                دانلود قالب CSV
              </Button>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">مرحله ۲: انتخاب فایل</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label htmlFor="csv-file">فایل CSV پر شده:</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={importing}
                />
                {file && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {file.name} انتخاب شد
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Import Progress */}
          {importing && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">در حال وارد کردن...</span>
                    <span className="text-sm text-muted-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Import Results */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">نتیجه وارد کردن</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{result.total}</div>
                      <div className="text-xs text-muted-foreground">کل</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{result.success}</div>
                      <div className="text-xs text-muted-foreground">موفق</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{result.failed}</div>
                      <div className="text-xs text-muted-foreground">ناموفق</div>
                    </div>
                  </div>

                  {result.errors.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-red-600">خطاها:</Label>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {result.errors.map((error, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm">
                            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <span className="text-red-600">{error}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              بستن
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={!file || importing}
            >
              {importing ? 'در حال وارد کردن...' : 'شروع وارد کردن'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}