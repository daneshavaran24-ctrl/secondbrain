import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, Filter, TrendingUp, CheckCircle2, XCircle, Clock, BarChart3, Trash2 } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AnalysisHistoryService, AnalysisHistoryItem } from "@/services/analysisHistoryService";
import { AnalysisHistoryCard } from "./AnalysisHistoryCard";
import { toast } from "sonner";

export function AnalysisHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "failed" | "pending" | "processing">("all");
  const [domainFilter, setDomainFilter] = useState<"all" | "personal" | "professional" | "organizational">("all");
  const [selectedItem, setSelectedItem] = useState<AnalysisHistoryItem | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch analysis history
  const { data: historyItems, isLoading } = useQuery({
    queryKey: ["analysis-history", searchTerm, statusFilter, domainFilter],
    queryFn: () => AnalysisHistoryService.getAnalysisHistory({
      status: statusFilter,
      domain: domainFilter,
      search: searchTerm
    })
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["analysis-stats"],
    queryFn: () => AnalysisHistoryService.getAnalysisStats()
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => AnalysisHistoryService.deleteAnalysis(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analysis-history"] });
      queryClient.invalidateQueries({ queryKey: ["analysis-stats"] });
      toast.success("تحلیل با موفقیت حذف شد");
    },
    onError: () => {
      toast.error("خطا در حذف تحلیل");
    }
  });

  // Retry mutation
  const retryMutation = useMutation({
    mutationFn: (id: string) => AnalysisHistoryService.retryFailedAnalysis(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analysis-history"] });
      queryClient.invalidateQueries({ queryKey: ["analysis-stats"] });
      toast.success("تحلیل مجدد شروع شد");
    },
    onError: () => {
      toast.error("خطا در شروع تحلیل مجدد");
    }
  });

  // Cleanup mutation
  const cleanupMutation = useMutation({
    mutationFn: () => AnalysisHistoryService.cleanupStaleAnalyses(24),
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["analysis-history"] });
      queryClient.invalidateQueries({ queryKey: ["analysis-stats"] });
      toast.success(`${count} تحلیل قدیمی پاک شد`);
    },
    onError: () => {
      toast.error("خطا در پاکسازی");
    }
  });

  const handleView = (item: AnalysisHistoryItem) => {
    setSelectedItem(item);
    setViewDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("آیا از حذف این تحلیل اطمینان دارید؟")) {
      deleteMutation.mutate(id);
    }
  };

  const handleRetry = (id: string) => {
    retryMutation.mutate(id);
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds} ثانیه`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes} دقیقه`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-primary flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            تاریخچه تحلیل‌ها
          </h1>
          <p className="text-body mt-1">مشاهده و مدیریت تحلیل‌های انجام شده</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => cleanupMutation.mutate()}
          disabled={cleanupMutation.isPending}
          className="interactive-button"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          پاکسازی تحلیل‌های قدیمی
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">کل</span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold">{stats.total}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">موفق</span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium">ناموفق</span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium">در حال انجام</span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-yellow-600">{stats.pending + stats.processing}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">میانگین زمان</span>
              </div>
              <div className="mt-2">
                <div className="text-lg font-bold text-blue-600">{formatTime(stats.averageTime)}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4 bg-muted/30 border-dashed">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="جستجو در عنوان و توضیحات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background/50 backdrop-blur-sm"
            />
          </div>

          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-full md:w-48 bg-background/50 backdrop-blur-sm">
              <SelectValue placeholder="فیلتر وضعیت" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه وضعیت‌ها</SelectItem>
              <SelectItem value="completed">موفق</SelectItem>
              <SelectItem value="failed">ناموفق</SelectItem>
              <SelectItem value="processing">در حال انجام</SelectItem>
              <SelectItem value="pending">در صف</SelectItem>
            </SelectContent>
          </Select>

          <Select value={domainFilter} onValueChange={(value: any) => setDomainFilter(value)}>
            <SelectTrigger className="w-full md:w-48 bg-background/50 backdrop-blur-sm">
              <SelectValue placeholder="فیلتر حوزه" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه حوزه‌ها</SelectItem>
              <SelectItem value="personal">شخصی</SelectItem>
              <SelectItem value="professional">حرفه‌ای</SelectItem>
              <SelectItem value="organizational">سازمانی</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* History List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : historyItems && historyItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {historyItems.map((item, index) => (
            <div
              key={item.id}
              className="slide-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <AnalysisHistoryCard
                item={item}
                onView={handleView}
                onDelete={handleDelete}
                onRetry={handleRetry}
              />
            </div>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-2">
          <CardContent className="text-center py-16">
            <Filter className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="heading-tertiary mb-2">تحلیلی یافت نشد</h3>
            <p className="text-body">
              {searchTerm || statusFilter !== "all" || domainFilter !== "all"
                ? "فیلترهای جستجو را تغییر دهید"
                : "هنوز تحلیلی انجام نشده است"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>نتایج تحلیل</DialogTitle>
            <DialogDescription>{selectedItem?.idea.title}</DialogDescription>
          </DialogHeader>
          {selectedItem?.analysis_result && (
            <div className="space-y-6">
              {/* SWOT Analysis */}
              {selectedItem.analysis_result.swot && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">تحلیل SWOT</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-green-600">نقاط قوت</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1 text-sm">
                          {selectedItem.analysis_result.swot.strengths?.map((s: string, i: number) => (
                            <li key={i}>• {s}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-red-600">نقاط ضعف</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1 text-sm">
                          {selectedItem.analysis_result.swot.weaknesses?.map((w: string, i: number) => (
                            <li key={i}>• {w}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-blue-600">فرصت‌ها</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1 text-sm">
                          {selectedItem.analysis_result.swot.opportunities?.map((o: string, i: number) => (
                            <li key={i}>• {o}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-orange-600">تهدیدها</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1 text-sm">
                          {selectedItem.analysis_result.swot.threats?.map((t: string, i: number) => (
                            <li key={i}>• {t}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Risks */}
              {selectedItem.analysis_result.risks && selectedItem.analysis_result.risks.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">ریسک‌ها</h3>
                  <div className="space-y-2">
                    {selectedItem.analysis_result.risks.map((risk: any, i: number) => (
                      <Card key={i}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{risk.title}</h4>
                              <p className="text-xs text-muted-foreground mt-1">{risk.description}</p>
                            </div>
                            <span className="text-xs font-medium px-2 py-1 bg-orange-500/10 text-orange-600 rounded">
                              {risk.severity}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Actions */}
              {selectedItem.analysis_result.suggestedActions && selectedItem.analysis_result.suggestedActions.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">اقدامات پیشنهادی</h3>
                  <div className="space-y-2">
                    {selectedItem.analysis_result.suggestedActions.map((action: any, i: number) => (
                      <Card key={i}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">
                              {i + 1}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{action.title}</h4>
                              <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
