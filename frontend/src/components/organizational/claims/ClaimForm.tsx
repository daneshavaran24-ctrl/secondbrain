import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TextInputWithVoice } from "@/components/ui/text-input-with-voice";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { claimsService, Claim } from "@/services/claimsService";
import { useToast } from "@/hooks/use-toast";

const claimSchema = z.object({
  title: z.string().min(1, "عنوان الزامی است"),
  description: z.string().optional(),
  claim_type: z.string().optional(),
  amount: z.number().optional(),
  currency: z.string().optional(),
});

type ClaimFormData = z.infer<typeof claimSchema>;

interface ClaimFormProps {
  organizationId: string;
  claim?: Claim;
  onSuccess?: (claim: Claim) => void;
  onCancel?: () => void;
}

export function ClaimForm({ organizationId, claim, onSuccess, onCancel }: ClaimFormProps) {
  const { toast } = useToast();
  const isEditing = !!claim;

  const form = useForm<ClaimFormData>({
    resolver: zodResolver(claimSchema),
    defaultValues: {
      title: claim?.title || "",
      description: claim?.description || "",
      claim_type: claim?.claim_type || "financial",
      amount: claim?.amount || 0,
      currency: claim?.currency || "IRR",
    },
  });

  const onSubmit = async (data: ClaimFormData) => {
    try {
      let result: Claim | null = null;

      if (isEditing && claim) {
        result = await claimsService.updateClaim(claim.id, {
          ...data,
          organization_id: organizationId,
        });
      } else {
        result = await claimsService.createClaim({
          title: data.title,
          description: data.description,
          claim_type: data.claim_type,
          amount: data.amount,
          currency: data.currency,
          claim_number: claimsService.generateClaimNumber(),
          status: 'open',
          organization_id: organizationId,
          user_id: '', // Will be set by RLS
        });
      }

      if (result) {
        toast({
          title: isEditing ? "مطالبه به‌روزرسانی شد" : "مطالبه ایجاد شد",
          description: isEditing 
            ? "اطلاعات مطالبه با موفقیت به‌روزرسانی شد"
            : "مطالبه جدید با موفقیت ثبت شد",
        });
        onSuccess?.(result);
      }
    } catch (error) {
      toast({
        title: "خطا",
        description: "در پردازش مطالبه مشکلی پیش آمد",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "ویرایش مطالبه" : "ثبت مطالبه جدید"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>عنوان مطالبه *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="عنوان مطالبه را وارد کنید" className="text-right" />
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
                    <TextInputWithVoice
                      value={field.value || ''}
                      onChange={field.onChange}
                      type="textarea"
                      placeholder="توضیحات تکمیلی..."
                      rows={4}
                      enableVoice={true}
                      className="text-right min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="claim_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نوع مطالبه</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="نوع مطالبه را انتخاب کنید" />
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مبلغ</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="text-right"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>واحد پول</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب واحد" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="IRR">ریال</SelectItem>
                        <SelectItem value="USD">دلار</SelectItem>
                        <SelectItem value="EUR">یورو</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2 space-x-reverse pt-4">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  انصراف
                </Button>
              )}
              <Button type="submit">
                {isEditing ? "ذخیره تغییرات" : "ثبت مطالبه"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
