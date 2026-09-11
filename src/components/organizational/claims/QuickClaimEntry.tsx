import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Zap } from "lucide-react";
import { claimsService, Claim } from "@/services/claimsService";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const quickClaimSchema = z.object({
  title: z.string().min(1, "عنوان الزامی است"),
  claimType: z.string(),
  amount: z.number().optional(),
  description: z.string().optional(),
});

type QuickClaimFormData = z.infer<typeof quickClaimSchema>;

interface QuickClaimEntryProps {
  organizationId: string;
  onSuccess?: (claim: Claim) => void;
}

export function QuickClaimEntry({ organizationId, onSuccess }: QuickClaimEntryProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<QuickClaimFormData>({
    resolver: zodResolver(quickClaimSchema),
    defaultValues: {
      title: "",
      claimType: "financial",
      amount: 0,
      description: "",
    },
  });

  const onSubmit = async (data: QuickClaimFormData) => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "خطا",
          description: "کاربر یافت نشد",
          variant: "destructive",
        });
        return;
      }

      const claimData = {
        user_id: user.id,
        organization_id: organizationId,
        title: data.title,
        claim_type: data.claimType,
        amount: data.amount,
        description: data.description,
        status: 'open',
        claim_number: claimsService.generateClaimNumber(),
      };

      const result = await claimsService.createClaim(claimData);

      if (result) {
        toast({
          title: "مطالبه سریع ایجاد شد",
          description: `مطالبه "${result.title}" با موفقیت ایجاد شد.`,
        });
        form.reset();
        setOpen(false);
        onSuccess?.(result);
      }
    } catch (error) {
      console.error('Error creating quick claim:', error);
      toast({
        title: "خطا در ایجاد مطالبه",
        description: "لطفاً دوباره تلاش کنید.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Zap className="h-4 w-4" />
          ثبت سریع
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            ثبت سریع مطالبه
          </DialogTitle>
        </DialogHeader>

        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>عنوان مطالبه *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="عنوان مطالبه..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="claimType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نوع مطالبه</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="financial">مالی</SelectItem>
                            <SelectItem value="legal">حقوقی</SelectItem>
                            <SelectItem value="service">خدماتی</SelectItem>
                            <SelectItem value="warranty">گارانتی</SelectItem>
                            <SelectItem value="insurance">بیمه</SelectItem>
                            <SelectItem value="other">سایر</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>مبلغ (ریال)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            placeholder="0"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>توضیحات</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="توضیح مختصری از مطالبه..." rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    انصراف
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'در حال ایجاد...' : 'ایجاد مطالبه'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
