import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface StrategyFiltersProps {
  type: 'okr' | 'roadmap' | 'decisions';
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
}

export function StrategyFilters({
  type,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange
}: StrategyFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      {/* Search */}
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="جستجو..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pr-10"
          />
        </div>
      </div>
      
      {/* Status Filter */}
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="وضعیت" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">همه</SelectItem>
          {type === 'okr' && (
            <>
              <SelectItem value="draft">پیش‌نویس</SelectItem>
              <SelectItem value="active">فعال</SelectItem>
              <SelectItem value="achieved">محقق شده</SelectItem>
            </>
          )}
          {type === 'roadmap' && (
            <>
              <SelectItem value="completed">تکمیل شده</SelectItem>
              <SelectItem value="in-progress">در حال انجام</SelectItem>
              <SelectItem value="blocked">مسدود شده</SelectItem>
              <SelectItem value="planned">برنامه‌ریزی شده</SelectItem>
            </>
          )}
          {type === 'decisions' && (
            <>
              <SelectItem value="critical">بحرانی</SelectItem>
              <SelectItem value="high">بالا</SelectItem>
              <SelectItem value="medium">متوسط</SelectItem>
              <SelectItem value="low">پایین</SelectItem>
            </>
          )}
        </SelectContent>
      </Select>
      
      {/* Sort */}
      <Select value={sortBy} onValueChange={onSortByChange}>
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="مرتب‌سازی" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">جدیدترین</SelectItem>
          <SelectItem value="oldest">قدیمی‌ترین</SelectItem>
          {type === 'okr' && (
            <>
              <SelectItem value="progress_high">بیشترین پیشرفت</SelectItem>
              <SelectItem value="progress_low">کمترین پیشرفت</SelectItem>
            </>
          )}
          {type === 'roadmap' && (
            <>
              <SelectItem value="progress_high">بیشترین پیشرفت</SelectItem>
              <SelectItem value="end_date">تاریخ پایان</SelectItem>
            </>
          )}
          {type === 'decisions' && (
            <>
              <SelectItem value="impact_high">بیشترین تأثیر</SelectItem>
              <SelectItem value="date">تاریخ تصمیم</SelectItem>
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
