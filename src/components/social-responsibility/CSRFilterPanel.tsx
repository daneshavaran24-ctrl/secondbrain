import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ModernButton } from "@/components/ui/modern-button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface CSRFilters {
  search: string;
  types: string[];
  statuses: string[];
  priorities: string[];
  sortBy: "date" | "priority" | "budget" | "title";
}

interface CSRFilterPanelProps {
  filters: CSRFilters;
  onChange: (filters: CSRFilters) => void;
}

const TYPE_OPTIONS = [
  { value: "charity", label: "خیریه" },
  { value: "environment", label: "محیط زیست" },
  { value: "education", label: "آموزش" },
  { value: "other", label: "سایر" },
];

const STATUS_OPTIONS = [
  { value: "planning", label: "برنامه‌ریزی" },
  { value: "active", label: "فعال" },
  { value: "completed", label: "تکمیل شده" },
  { value: "on_hold", label: "معلق" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "کم" },
  { value: "medium", label: "متوسط" },
  { value: "high", label: "بالا" },
];

export function CSRFilterPanel({ filters, onChange }: CSRFilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSearchChange = (value: string) => {
    onChange({ ...filters, search: value });
  };

  const toggleFilter = (
    category: "types" | "statuses" | "priorities",
    value: string
  ) => {
    const current = filters[category];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...filters, [category]: updated });
  };

  const clearFilters = () => {
    onChange({
      search: "",
      types: [],
      statuses: [],
      priorities: [],
      sortBy: "date",
    });
  };

  const activeFilterCount =
    filters.types.length + filters.statuses.length + filters.priorities.length;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="جستجو در پروژه‌ها..."
            className="pr-10"
          />
        </div>

        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <ModernButton variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              فیلتر
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </ModernButton>
          </CollapsibleTrigger>
        </Collapsible>

        <Select
          value={filters.sortBy}
          onValueChange={(value: any) => onChange({ ...filters, sortBy: value })}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">تاریخ</SelectItem>
            <SelectItem value="priority">اولویت</SelectItem>
            <SelectItem value="budget">بودجه</SelectItem>
            <SelectItem value="title">عنوان</SelectItem>
          </SelectContent>
        </Select>

        {activeFilterCount > 0 && (
          <ModernButton variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4" />
          </ModernButton>
        )}
      </div>

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">نوع پروژه</Label>
              <div className="grid grid-cols-2 gap-2">
                {TYPE_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`type-${option.value}`}
                      checked={filters.types.includes(option.value)}
                      onCheckedChange={() =>
                        toggleFilter("types", option.value)
                      }
                    />
                    <Label
                      htmlFor={`type-${option.value}`}
                      className="text-sm cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">وضعیت</Label>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`status-${option.value}`}
                      checked={filters.statuses.includes(option.value)}
                      onCheckedChange={() =>
                        toggleFilter("statuses", option.value)
                      }
                    />
                    <Label
                      htmlFor={`status-${option.value}`}
                      className="text-sm cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">اولویت</Label>
              <div className="grid grid-cols-3 gap-2">
                {PRIORITY_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`priority-${option.value}`}
                      checked={filters.priorities.includes(option.value)}
                      onCheckedChange={() =>
                        toggleFilter("priorities", option.value)
                      }
                    />
                    <Label
                      htmlFor={`priority-${option.value}`}
                      className="text-sm cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
