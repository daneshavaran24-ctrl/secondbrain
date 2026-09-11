import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  X, 
  Calendar,
  Mail,
  Phone,
  MessageSquare,
  RefreshCw
} from 'lucide-react';

interface DelegationFiltersProps {
  searchQuery: string;
  statusFilter: string;
  priorityFilter: string;
  methodFilter: string;
  dateRangeFilter: string;
  onSearchChange: (query: string) => void;
  onStatusChange: (status: string) => void;
  onPriorityChange: (priority: string) => void;
  onMethodChange: (method: string) => void;
  onDateRangeChange: (range: string) => void;
  onClearFilters: () => void;
  onRefresh: () => void;
}

export function DelegationFilters({
  searchQuery,
  statusFilter,
  priorityFilter,
  methodFilter,
  dateRangeFilter,
  onSearchChange,
  onStatusChange,
  onPriorityChange,
  onMethodChange,
  onDateRangeChange,
  onClearFilters,
  onRefresh
}: DelegationFiltersProps) {
  const hasActiveFilters = searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || 
                          methodFilter !== 'all' || dateRangeFilter !== 'all';

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <Phone className="h-4 w-4" />;
      case 'secretary': return <MessageSquare className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <Card className="card-glass">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Search and Main Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="جستجو در عنوان، توضیحات، یا اطلاعات گیرنده..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10 input-glass"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={onRefresh}
                className="btn-glass"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={onClearFilters}
                  className="btn-glass"
                >
                  <X className="h-4 w-4 ml-1" />
                  پاک کردن فیلترها
                </Button>
              )}
            </div>
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select value={statusFilter} onValueChange={onStatusChange}>
              <SelectTrigger className="input-glass">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                <SelectItem value="pending">در انتظار</SelectItem>
                <SelectItem value="in_progress">در حال انجام</SelectItem>
                <SelectItem value="completed">تکمیل شده</SelectItem>
                <SelectItem value="declined">رد شده</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={onPriorityChange}>
              <SelectTrigger className="input-glass">
                <SelectValue placeholder="اولویت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه اولویت‌ها</SelectItem>
                <SelectItem value="high">بالا</SelectItem>
                <SelectItem value="medium">متوسط</SelectItem>
                <SelectItem value="low">پایین</SelectItem>
              </SelectContent>
            </Select>

            <Select value={methodFilter} onValueChange={onMethodChange}>
              <SelectTrigger className="input-glass">
                <SelectValue placeholder="روش ارسال" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه روش‌ها</SelectItem>
                <SelectItem value="email">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    ایمیل
                  </div>
                </SelectItem>
                <SelectItem value="sms">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    پیامک
                  </div>
                </SelectItem>
                <SelectItem value="secretary">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    کارتابل منشی
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRangeFilter} onValueChange={onDateRangeChange}>
              <SelectTrigger className="input-glass">
                <Calendar className="h-4 w-4 ml-2" />
                <SelectValue placeholder="بازه زمانی" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه زمان‌ها</SelectItem>
                <SelectItem value="today">امروز</SelectItem>
                <SelectItem value="yesterday">دیروز</SelectItem>
                <SelectItem value="this_week">این هفته</SelectItem>
                <SelectItem value="last_week">هفته گذشته</SelectItem>
                <SelectItem value="this_month">این ماه</SelectItem>
                <SelectItem value="last_month">ماه گذشته</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
              <span className="text-xs text-muted-foreground">فیلترهای فعال:</span>
              
              {searchQuery && (
                <Badge variant="secondary" className="text-xs">
                  جستجو: {searchQuery}
                  <button onClick={() => onSearchChange('')} className="mr-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              {statusFilter !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  وضعیت: {statusFilter === 'pending' ? 'در انتظار' :
                          statusFilter === 'in_progress' ? 'در حال انجام' :
                          statusFilter === 'completed' ? 'تکمیل شده' : 'رد شده'}
                  <button onClick={() => onStatusChange('all')} className="mr-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              {priorityFilter !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  اولویت: {priorityFilter === 'high' ? 'بالا' :
                           priorityFilter === 'medium' ? 'متوسط' : 'پایین'}
                  <button onClick={() => onPriorityChange('all')} className="mr-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              {methodFilter !== 'all' && (
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  {getMethodIcon(methodFilter)}
                  روش: {methodFilter === 'email' ? 'ایمیل' :
                        methodFilter === 'sms' ? 'پیامک' : 'کارتابل منشی'}
                  <button onClick={() => onMethodChange('all')} className="mr-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              {dateRangeFilter !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  زمان: {dateRangeFilter === 'today' ? 'امروز' :
                         dateRangeFilter === 'yesterday' ? 'دیروز' :
                         dateRangeFilter === 'this_week' ? 'این هفته' :
                         dateRangeFilter === 'last_week' ? 'هفته گذشته' :
                         dateRangeFilter === 'this_month' ? 'این ماه' : 'ماه گذشته'}
                  <button onClick={() => onDateRangeChange('all')} className="mr-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}