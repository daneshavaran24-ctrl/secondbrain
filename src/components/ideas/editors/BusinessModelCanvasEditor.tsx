import { useState } from "react";
import { Save, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ideaAnalysisService } from "@/services/ideaAnalysisService";

interface BusinessModelCanvasEditorProps {
  ideaId: string;
  bmcData: any;
  onSave: () => void;
  onClose: () => void;
}

export function BusinessModelCanvasEditor({
  ideaId,
  bmcData,
  onSave,
  onClose,
}: BusinessModelCanvasEditorProps) {
  const [data, setData] = useState({
    value_propositions: bmcData?.value_propositions || [],
    customer_segments: bmcData?.customer_segments || [],
    channels: bmcData?.channels || [],
    customer_relationships: bmcData?.customer_relationships || [],
    revenue_streams: bmcData?.revenue_streams || [],
    key_resources: bmcData?.key_resources || [],
    key_activities: bmcData?.key_activities || [],
    key_partnerships: bmcData?.key_partnerships || [],
    cost_structure: bmcData?.cost_structure || [],
  });

  const [newItems, setNewItems] = useState<{ [key: string]: string }>({});

  const sections = [
    { key: "value_propositions", label: "پیشنهادات ارزشی", color: "bg-blue-50 dark:bg-blue-950" },
    { key: "customer_segments", label: "بخش‌های مشتری", color: "bg-green-50 dark:bg-green-950" },
    { key: "channels", label: "کانال‌ها", color: "bg-purple-50 dark:bg-purple-950" },
    { key: "customer_relationships", label: "روابط با مشتری", color: "bg-pink-50 dark:bg-pink-950" },
    { key: "revenue_streams", label: "جریان‌های درآمد", color: "bg-yellow-50 dark:bg-yellow-950" },
    { key: "key_resources", label: "منابع کلیدی", color: "bg-orange-50 dark:bg-orange-950" },
    { key: "key_activities", label: "فعالیت‌های کلیدی", color: "bg-indigo-50 dark:bg-indigo-950" },
    { key: "key_partnerships", label: "شراکت‌های کلیدی", color: "bg-teal-50 dark:bg-teal-950" },
    { key: "cost_structure", label: "ساختار هزینه", color: "bg-red-50 dark:bg-red-950" },
  ];

  const handleAddItem = (sectionKey: string) => {
    const value = newItems[sectionKey]?.trim();
    if (value) {
      setData(prev => ({
        ...prev,
        [sectionKey]: [...(prev[sectionKey as keyof typeof prev] || []), value],
      }));
      setNewItems(prev => ({ ...prev, [sectionKey]: "" }));
    }
  };

  const handleRemoveItem = (sectionKey: string, index: number) => {
    setData(prev => ({
      ...prev,
      [sectionKey]: (prev[sectionKey as keyof typeof prev] || []).filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    try {
      await ideaAnalysisService.updateBusinessModelCanvas(ideaId, data);
      toast.success("مدل کسب‌وکار بروزرسانی شد");
      onSave();
      onClose();
    } catch (error) {
      toast.error("خطا در ذخیره مدل کسب‌وکار");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">ویرایش مدل کسب‌وکار (BMC)</h3>
        <p className="text-sm text-muted-foreground mt-1">
          هر بخش را ویرایش کرده و آیتم‌های جدید اضافه یا حذف کنید
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((section) => (
          <div key={section.key} className={`p-4 rounded-lg border ${section.color}`}>
            <h4 className="font-semibold mb-3">{section.label}</h4>
            
            <div className="space-y-2 mb-3">
              {(data[section.key as keyof typeof data] || []).map((item: string, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge variant="outline" className="flex-1">
                    {item}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveItem(section.key, index)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="آیتم جدید..."
                value={newItems[section.key] || ""}
                onChange={(e) => setNewItems(prev => ({ ...prev, [section.key]: e.target.value }))}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddItem(section.key);
                  }
                }}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAddItem(section.key)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          انصراف
        </Button>
        <Button onClick={handleSave}>
          <Save className="w-4 h-4 ml-2" />
          ذخیره تغییرات
        </Button>
      </div>
    </div>
  );
}
