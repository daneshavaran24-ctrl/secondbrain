import { useState } from "react";
import { Save, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ideaAnalysisService } from "@/services/ideaAnalysisService";

interface SWOTEditorProps {
  ideaId: string;
  swotId: string;
  swotData: any;
  onSave: () => void;
  onClose: () => void;
}

export function SWOTEditor({
  swotId,
  swotData,
  onSave,
  onClose,
}: SWOTEditorProps) {
  const [data, setData] = useState({
    strengths: swotData?.strengths || [],
    weaknesses: swotData?.weaknesses || [],
    opportunities: swotData?.opportunities || [],
    threats: swotData?.threats || [],
    so_strategies: swotData?.so_strategies || [],
    st_strategies: swotData?.st_strategies || [],
    wo_strategies: swotData?.wo_strategies || [],
    wt_strategies: swotData?.wt_strategies || [],
    overall_assessment: swotData?.overall_assessment || "",
  });

  const [newItems, setNewItems] = useState<{ [key: string]: string }>({});

  const sections = [
    {
      key: "strengths",
      label: "نقاط قوت (S)",
      color: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800",
    },
    {
      key: "weaknesses",
      label: "نقاط ضعف (W)",
      color: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800",
    },
    {
      key: "opportunities",
      label: "فرصت‌ها (O)",
      color: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
    },
    {
      key: "threats",
      label: "تهدیدها (T)",
      color: "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800",
    },
  ];

  const strategySections = [
    { key: "so_strategies", label: "استراتژی‌های SO (قوت-فرصت)", color: "bg-emerald-50 dark:bg-emerald-950" },
    { key: "st_strategies", label: "استراتژی‌های ST (قوت-تهدید)", color: "bg-cyan-50 dark:bg-cyan-950" },
    { key: "wo_strategies", label: "استراتژی‌های WO (ضعف-فرصت)", color: "bg-violet-50 dark:bg-violet-950" },
    { key: "wt_strategies", label: "استراتژی‌های WT (ضعف-تهدید)", color: "bg-rose-50 dark:bg-rose-950" },
  ];

  const handleAddItem = (sectionKey: string) => {
    const value = newItems[sectionKey]?.trim();
    if (value) {
      setData((prev) => ({
        ...prev,
        [sectionKey]: [...(prev[sectionKey as keyof typeof prev] || []), value],
      }));
      setNewItems((prev) => ({ ...prev, [sectionKey]: "" }));
    }
  };

  const handleRemoveItem = (sectionKey: string, index: number) => {
    setData((prev) => ({
      ...prev,
      [sectionKey]: (prev[sectionKey as keyof typeof prev] || []).filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    try {
      await ideaAnalysisService.updateSWOT(swotId, data);
      toast.success("تحلیل SWOT بروزرسانی شد");
      onSave();
      onClose();
    } catch (error) {
      toast.error("خطا در ذخیره تحلیل SWOT");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">ویرایش تحلیل SWOT</h3>
        <p className="text-sm text-muted-foreground mt-1">
          تحلیل نقاط قوت، ضعف، فرصت‌ها و تهدیدها را ویرایش کنید
        </p>
      </div>

      {/* Main SWOT Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                onChange={(e) => setNewItems((prev) => ({ ...prev, [section.key]: e.target.value }))}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddItem(section.key);
                  }
                }}
              />
              <Button size="sm" variant="outline" onClick={() => handleAddItem(section.key)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Strategy Sections */}
      <div>
        <h4 className="font-semibold mb-3">استراتژی‌های ترکیبی</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {strategySections.map((section) => (
            <div key={section.key} className={`p-4 rounded-lg border ${section.color}`}>
              <h4 className="font-semibold mb-3 text-sm">{section.label}</h4>

              <div className="space-y-2 mb-3">
                {(data[section.key as keyof typeof data] || []).map((item: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="outline" className="flex-1 text-xs">
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
                  placeholder="استراتژی جدید..."
                  value={newItems[section.key] || ""}
                  onChange={(e) => setNewItems((prev) => ({ ...prev, [section.key]: e.target.value }))}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleAddItem(section.key);
                    }
                  }}
                  className="text-sm"
                />
                <Button size="sm" variant="outline" onClick={() => handleAddItem(section.key)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overall Assessment */}
      <div>
        <Label>ارزیابی کلی</Label>
        <Textarea
          value={data.overall_assessment}
          onChange={(e) => setData((prev) => ({ ...prev, overall_assessment: e.target.value }))}
          rows={4}
          placeholder="ارزیابی کلی از وضعیت ایده بر اساس تحلیل SWOT..."
        />
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
