import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ResolutionFilters } from "@/types";
import { CalendarIcon, X, Filter } from "lucide-react";
import { format } from "date-fns-jalali";
import { useState } from "react";

interface ResolutionFilterPanelProps {
  filters: ResolutionFilters;
  onFiltersChange: (filters: ResolutionFilters) => void;
  onReset: () => void;
}

export const ResolutionFilterPanel = ({ filters, onFiltersChange, onReset }: ResolutionFilterPanelProps) => {
  const [dueDateFromOpen, setDueDateFromOpen] = useState(false);
  const [dueDateToOpen, setDueDateToOpen] = useState(false);

  const statusOptions = [
    { value: 'pending', label: 'در انتظار' },
    { value: 'approved', label: 'تایید شده' },
    { value: 'in_progress', label: 'در حال اجرا' },
    { value: 'completed', label: 'تکمیل شده' },
    { value: 'cancelled', label: 'لغو شده' },
    { value: 'rejected', label: 'رد شده' }
  ];

  const priorityOptions = [
    { value: 'high', label: 'بالا' },
    { value: 'medium', label: 'متوسط' },
    { value: 'low', label: 'پایین' }
  ];

  return (
    <div className="space-y-6 p-6 bg-card rounded-lg border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">فیلترها</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onReset}>
          <X className="h-4 w-4 ml-2" />
          پاک کردن همه
        </Button>
      </div>

      {/* جستجو */}
      <div className="space-y-2">
        <Label>جستجو</Label>
        <Input
          placeholder="جستجو در عنوان، شرح یا مسئول..."
          value={filters.search || ''}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
        />
      </div>

      {/* وضعیت */}
      <div className="space-y-2">
        <Label>وضعیت</Label>
        <MultiSelect
          options={statusOptions}
          value={filters.status || []}
          onChange={(status) => onFiltersChange({ ...filters, status })}
          placeholder="انتخاب وضعیت..."
        />
      </div>

      {/* اولویت */}
      <div className="space-y-2">
        <Label>اولویت</Label>
        <MultiSelect
          options={priorityOptions}
          value={filters.priority || []}
          onChange={(priority) => onFiltersChange({ ...filters, priority })}
          placeholder="انتخاب اولویت..."
        />
      </div>

      {/* بازه مهلت */}
      <div className="space-y-2">
        <Label>بازه مهلت</Label>
        <div className="grid grid-cols-2 gap-2">
          <Popover open={dueDateFromOpen} onOpenChange={setDueDateFromOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-right">
                <CalendarIcon className="ml-2 h-4 w-4" />
                {filters.dueDateFrom ? format(new Date(filters.dueDateFrom), 'yyyy/MM/dd') : 'از تاریخ'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dueDateFrom ? new Date(filters.dueDateFrom) : undefined}
                onSelect={(date) => {
                  onFiltersChange({ ...filters, dueDateFrom: date?.toISOString() });
                  setDueDateFromOpen(false);
                }}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <Popover open={dueDateToOpen} onOpenChange={setDueDateToOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-right">
                <CalendarIcon className="ml-2 h-4 w-4" />
                {filters.dueDateTo ? format(new Date(filters.dueDateTo), 'yyyy/MM/dd') : 'تا تاریخ'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dueDateTo ? new Date(filters.dueDateTo) : undefined}
                onSelect={(date) => {
                  onFiltersChange({ ...filters, dueDateTo: date?.toISOString() });
                  setDueDateToOpen(false);
                }}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* پیشرفت */}
      <div className="space-y-2">
        <Label>بازه پیشرفت: {filters.progressMin || 0}% - {filters.progressMax || 100}%</Label>
        <Slider
          min={0}
          max={100}
          step={5}
          value={[filters.progressMin || 0, filters.progressMax || 100]}
          onValueChange={([min, max]) => onFiltersChange({ ...filters, progressMin: min, progressMax: max })}
          className="mt-2"
        />
      </div>
    </div>
  );
};