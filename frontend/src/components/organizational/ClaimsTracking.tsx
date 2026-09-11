import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, Download, AlertTriangle, Clock, CheckCircle, XCircle, Calendar, User, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { claimsService, Claim, ClaimStats } from "@/services/claimsService";
import { ClaimForm } from "./claims/ClaimForm";
import { ClaimDetailsDrawer } from "./claims/ClaimDetailsDrawer";
import { BulkClaimImport } from "./claims/BulkClaimImport";
import { ClaimExporter } from "./claims/ClaimExporter";
import { QuickClaimEntry } from "./claims/QuickClaimEntry";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface ClaimsTrackingProps {
  organizationName: string;
}

export function ClaimsTracking({ organizationName }: ClaimsTrackingProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [claims, setClaims] = useState<Claim[]>([]);
  const [stats, setStats] = useState<ClaimStats>({
    total: 0,
    pending: 0,
    reviewing: 0,
    resolved: 0,
    rejected: 0,
    overdue: 0,
    critical: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [organizationId, setOrganizationId] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserOrganization = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Organization ID would come from user_organizations table
        }
      } catch (error) {
        console.error('Error fetching user organization:', error);
      }
    };

    fetchUserOrganization();
  }, []);

  useEffect(() => {
    if (organizationId) {
      loadClaims();
    }
  }, [organizationId]);

  const loadClaims = async () => {
    if (!organizationId) return;
    
    setLoading(true);
    try {
      const [claimsData, statsData] = await Promise.all([
        claimsService.getClaimsByOrganization(organizationId),
        claimsService.getClaimStats(organizationId)
      ]);
      
      setClaims(claimsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading claims:', error);
      toast({
        title: "خطا در بارگذاری مطالبات",
        description: "لطفاً دوباره تلاش کنید.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClaimUpdate = (updatedClaim: Claim) => {
    setClaims(prev => prev.map(claim => 
      claim.id === updatedClaim.id ? updatedClaim : claim
    ));
    loadClaims();
  };

  const handleClaimDelete = (claimId: string) => {
    setClaims(prev => prev.filter(claim => claim.id !== claimId));
    loadClaims();
  };

  const handleFormSuccess = (claim: Claim) => {
    setShowForm(false);
    loadClaims();
  };

  const claimsStats = [
    { title: "کل مطالبات", value: stats.total, icon: AlertTriangle, color: "text-blue-600" },
    { title: "در انتظار بررسی", value: stats.pending, icon: Clock, color: "text-yellow-600" },
    { title: "در حال بررسی", value: stats.reviewing, icon: Search, color: "text-orange-600" },
    { title: "حل شده", value: stats.resolved, icon: CheckCircle, color: "text-green-600" },
    { title: "رد شده", value: stats.rejected, icon: XCircle, color: "text-red-600" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "reviewing":
        return "default";
      case "resolved":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = claim.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.claim_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || claim.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || claim.claim_type === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">پیگیری مطالبات - {organizationName}</h1>
          <p className="text-muted-foreground">مدیریت و پیگیری مطالبات سازمان</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                مطالبه جدید
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>ایجاد مطالبه جدید</DialogTitle>
              </DialogHeader>
              <ClaimForm
                organizationId={organizationId}
                onSuccess={handleFormSuccess}
                onCancel={() => setShowForm(false)}
              />
            </DialogContent>
          </Dialog>
          <QuickClaimEntry 
            organizationId={organizationId}
            onSuccess={handleFormSuccess}
          />
          <BulkClaimImport 
            organizationId={organizationId}
            onImportComplete={loadClaims}
          />
          <ClaimExporter 
            organizationId={organizationId}
            claims={claims}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {claimsStats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <IconComponent className={`h-8 w-8 ${stat.color}`} />
                  <div className="ml-4">
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setStatusFilter}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">همه</TabsTrigger>
          <TabsTrigger value="pending">در انتظار</TabsTrigger>
          <TabsTrigger value="reviewing">در حال بررسی</TabsTrigger>
          <TabsTrigger value="resolved">حل شده</TabsTrigger>
          <TabsTrigger value="rejected">رد شده</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="جستجو در مطالبات..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="نوع مطالبه" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه انواع</SelectItem>
                    <SelectItem value="financial">مالی</SelectItem>
                    <SelectItem value="legal">حقوقی</SelectItem>
                    <SelectItem value="service">خدماتی</SelectItem>
                    <SelectItem value="warranty">گارانتی</SelectItem>
                    <SelectItem value="insurance">بیمه</SelectItem>
                    <SelectItem value="other">سایر</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => {
                  setSearchTerm("");
                  setCategoryFilter("all");
                }}>
                  <Filter className="h-4 w-4 ml-2" />
                  پاک کردن فیلترها
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">در حال بارگذاری مطالبات...</p>
                  </div>
                </CardContent>
              </Card>
            ) : filteredClaims.length > 0 ? (
              filteredClaims.map((claim) => (
                <Card 
                  key={claim.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedClaim(claim)}
                >
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{claim.title}</h3>
                          <Badge variant={getStatusBadge(claim.status || 'open')}>
                            {claimsService.getStatusLabel(claim.status || 'open')}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-3">{claim.description}</p>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <p><strong>شماره:</strong> {claim.claim_number || 'ندارد'}</p>
                          {claim.amount && (
                            <p><strong>مبلغ:</strong> {claim.amount.toLocaleString('fa-IR')} {claim.currency || 'IRR'}</p>
                          )}
                          <p><strong>نوع:</strong> {claimsService.getClaimTypeLabel(claim.claim_type || 'other')}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm mt-2">
                          <Clock className="w-4 h-4" />
                          {claim.filed_date ? (
                            <span>
                              تاریخ ثبت: {new Date(claim.filed_date).toLocaleDateString('fa-IR')}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">بدون تاریخ</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-xs text-muted-foreground">شماره مطالبه</span>
                        <span className="font-mono text-sm">{claim.claim_number}</span>
                        <div className="text-xs text-muted-foreground">
                          {new Date(claim.created_at).toLocaleDateString('fa-IR')}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">مطالبه‌ای یافت نشد</h3>
                    <p className="text-muted-foreground">با فیلترهای اعمال شده هیچ مطالبه‌ای پیدا نشد.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {['pending', 'reviewing', 'resolved', 'rejected'].map(status => (
          <TabsContent key={status} value={status} className="space-y-4">
            <div className="space-y-4">
              {filteredClaims
                .filter(claim => claim.status === status)
                .map((claim) => (
                  <Card 
                    key={claim.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedClaim(claim)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{claim.title}</h3>
                            <Badge variant={getStatusBadge(claim.status || 'open')}>
                              {claimsService.getStatusLabel(claim.status || 'open')}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mb-3">{claim.description}</p>
                          <div className="space-y-2 text-sm">
                            <p><strong>شماره:</strong> {claim.claim_number || 'ندارد'}</p>
                            {claim.amount && (
                              <p><strong>مبلغ:</strong> {claim.amount.toLocaleString('fa-IR')} {claim.currency || 'IRR'}</p>
                            )}
                            <p><strong>نوع:</strong> {claimsService.getClaimTypeLabel(claim.claim_type || 'other')}</p>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                            <Clock className="w-4 w-4" />
                            {claim.filed_date ? (
                              <span>
                                تاریخ ثبت: {new Date(claim.filed_date).toLocaleDateString('fa-IR')}
                              </span>
                            ) : (
                              <span>بدون تاریخ</span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <span className="text-xs text-muted-foreground">شماره مطالبه</span>
                          <span className="font-mono text-sm">{claim.claim_number}</span>
                          <div className="text-xs text-muted-foreground">
                            {new Date(claim.created_at).toLocaleDateString('fa-IR')}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {selectedClaim && (
        <ClaimDetailsDrawer
          claim={selectedClaim}
          isOpen={!!selectedClaim}
          onClose={() => setSelectedClaim(null)}
          onUpdate={handleClaimUpdate}
          onDelete={handleClaimDelete}
        />
      )}
    </div>
  );
}
