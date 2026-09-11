import React from 'react';
import { TaskFilter } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { MobileSheetFilter } from '@/components/ui/mobile-sheet-filter';
import { useIsMobile } from '@/hooks/use-mobile';
import { Search, SortAsc, SortDesc, Filter, RotateCcw } from 'lucide-react';

interface TaskFiltersProps {
  filter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
  tasksCount: number;
  domain?: 'personal' | 'professional' | 'organizational';
}

const TaskFilters: React.FC<TaskFiltersProps> = ({
  filter,
  onFilterChange,
  tasksCount,
  domain = 'personal'
}) => {
  const isMobile = useIsMobile();
  const handleFilterChange = (key: keyof TaskFilter, value: any) => {
    onFilterChange({ ...filter, [key]: value });
  };

  const resetFilters = () => {
    onFilterChange({
      status: 'all',
      priority: 'all',
      category: 'all',
      search: '',
      sortBy: 'priority',
      sortOrder: 'desc'
    });
  };

  const toggleSortOrder = () => {
    const newOrder = filter.sortOrder === 'asc' ? 'desc' : 'asc';
    onFilterChange({ ...filter, sortOrder: newOrder });
  };

  const hasActiveFilters = filter.status !== 'all' || 
                          filter.priority !== 'all' || 
                          filter.category !== 'all' || 
                          (filter.search && filter.search.length > 0);

  const filtersContent = (
    <div className="space-y-4">
      {/* Mobile Search (always visible on mobile) */}
      {isMobile && (
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="جستجو در وظایف..."
            value={filter.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pr-10"
          />
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Desktop Search */}
        {!isMobile && (
          <div className="lg:col-span-2 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="جستجو در عنوان، توضیحات و برچسب‌ها..."
              value={filter.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pr-10"
            />
          </div>
        )}

        {/* Status Filter */}
        <div>
          <Select
            value={filter.status || 'all'}
            onValueChange={(value) => handleFilterChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه وضعیت‌ها</SelectItem>
              <SelectItem value="todo">انتظار</SelectItem>
              <SelectItem value="in_progress">در حال انجام</SelectItem>
              <SelectItem value="completed">تکمیل شده</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Priority Filter */}
        <div>
          <Select
            value={filter.priority || 'all'}
            onValueChange={(value) => handleFilterChange('priority', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه اولویت‌ها</SelectItem>
              <SelectItem value="high">بالا</SelectItem>
              <SelectItem value="medium">متوسط</SelectItem>
              <SelectItem value="low">پایین</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Category Filter */}
        <div>
          {domain === 'personal' ? (
            <Select
              value={filter.category || 'all'}
              onValueChange={(value) => handleFilterChange('category', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه دسته‌ها</SelectItem>
                <SelectGroup>
                  <SelectLabel>زندگی شخصی</SelectLabel>
                  <SelectItem value="personal">شخصی</SelectItem>
                  <SelectItem value="family">خانواده</SelectItem>
                  <SelectItem value="health">سلامت</SelectItem>
                  <SelectItem value="work">کار</SelectItem>
                  <SelectItem value="learning">یادگیری</SelectItem>
                  <SelectItem value="finance">مالی</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>رشد و توسعه فردی</SelectLabel>
                  <SelectItem value="spiritual_development">رشد معنوی</SelectItem>
                  <SelectItem value="educational_development">رشد آموزشی</SelectItem>
                  <SelectItem value="moral_development">رشد اخلاقی</SelectItem>
                  <SelectItem value="social_development">رشد اجتماعی</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          ) : (
            <Input
              placeholder={`جستجو در دسته‌بندی ${domain === 'professional' ? 'حرفه‌ای' : 'سازمانی'}`}
              value={filter.category === 'all' ? '' : filter.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value || 'all')}
            />
          )}
        </div>

        {/* Sort */}
        <div className="flex gap-2">
          <Select
            value={filter.sortBy || 'priority'}
            onValueChange={(value) => handleFilterChange('sortBy', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">اولویت</SelectItem>
              <SelectItem value="due_date">سررسید</SelectItem>
              <SelectItem value="created_at">تاریخ ایجاد</SelectItem>
              <SelectItem value="title">عنوان</SelectItem>
              <SelectItem value="progress">پیشرفت</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleSortOrder}
            title={filter.sortOrder === 'asc' ? 'صعودی' : 'نزولی'}
          >
            {filter.sortOrder === 'asc' ? 
              <SortAsc className="h-4 w-4" /> : 
              <SortDesc className="h-4 w-4" />
            }
          </Button>
        </div>
      </div>

      {/* Reset Filters */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          onClick={resetFilters}
          className="w-full sm:w-auto"
        >
          <RotateCcw className="h-4 w-4 ml-2" />
          پاک کردن فیلترها
        </Button>
      )}
    </div>
  );

  return (
    <div className="card-app-spacious bg-background border">
      {isMobile ? (
        <MobileSheetFilter title="فیلتر وظایف">
          {filtersContent}
        </MobileSheetFilter>
      ) : (
        filtersContent
      )}

      {/* Results Info */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t">
        <div className="text-sm text-muted-foreground">
          {tasksCount} وظیفه یافت شد
          {hasActiveFilters && (
            <span className="text-primary mr-2">
              (فیلتر شده)
            </span>
          )}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && !isMobile && (
          <div className="flex flex-wrap gap-2">
            {filter.status !== 'all' && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                وضعیت: {filter.status === 'todo' ? 'انتظار' : 
                        filter.status === 'in_progress' ? 'در حال انجام' : 
                        'تکمیل شده'}
              </span>
            )}
            {filter.priority !== 'all' && (
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                اولویت: {filter.priority === 'high' ? 'بالا' : 
                         filter.priority === 'medium' ? 'متوسط' : 'پایین'}
              </span>
            )}
            {filter.category !== 'all' && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                دسته: {filter.category}
              </span>
            )}
            {filter.search && (
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                جستجو: "{filter.search}"
              </span>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default TaskFilters;