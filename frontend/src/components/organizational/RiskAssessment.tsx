import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, TrendingDown, Activity, Eye, Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import RiskForm from './risk/RiskForm';
import RiskMatrix from './risk/RiskMatrix';
import { riskAssessmentService, Risk, RiskFormData } from '@/services/riskAssessmentService';

interface RiskAssessmentProps {
  organizationName: string;
}

const RiskAssessment: React.FC<RiskAssessmentProps> = ({ organizationName }) => {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [riskStats, setRiskStats] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
  const [deletingRisk, setDeletingRisk] = useState<Risk | null>(null);
  const [selectedTab, setSelectedTab] = useState('risks');

  useEffect(() => {
    loadRisks();
  }, [organizationName]);

  const loadRisks = () => {
    const organizationRisks = riskAssessmentService.getRisks(organizationName);
    const stats = riskAssessmentService.getRiskStatistics(organizationName);
    setRisks(organizationRisks);
    setRiskStats(stats);
  };

  const handleAddRisk = (formData: RiskFormData) => {
    const newRisk = riskAssessmentService.addRisk(organizationName, formData);
    if (newRisk) {
      loadRisks();
      setShowForm(false);
    }
  };

  const handleEditRisk = (formData: RiskFormData) => {
    if (editingRisk) {
      const updatedRisk = riskAssessmentService.updateRisk(organizationName, editingRisk.id, formData);
      if (updatedRisk) {
        loadRisks();
        setEditingRisk(null);
      }
    }
  };

  const handleDeleteRisk = () => {
    if (deletingRisk) {
      riskAssessmentService.deleteRisk(organizationName, deletingRisk.id);
      loadRisks();
      setDeletingRisk(null);
    }
  };

  const openEditForm = (risk: Risk) => {
    setEditingRisk(risk);
  };

  // Convert Risk to RiskFormData for editing
  const riskToFormData = (risk: Risk): RiskFormData => {
    return {
      title: risk.title,
      description: risk.description,
      category: risk.category,
      probability: risk.probability,
      impact: risk.impact,
      responsiblePerson: risk.responsiblePerson,
      mitigationStrategy: risk.mitigationStrategy,
      contingencyPlan: risk.contingencyPlan,
      status: risk.status,
    };
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingRisk(null);
  };

  const getRiskLevelBadge = (level: string) => {
    const variants = {
      'بحرانی': { variant: 'destructive' as const },
      'بالا': { variant: 'secondary' as const },
      'متوسط': { variant: 'outline' as const },
      'پایین': { variant: 'outline' as const }
    };
    return variants[level] || variants['متوسط'];
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'فعال': { variant: 'destructive' as const },
      'در نظارت': { variant: 'secondary' as const },
      'کنترل شده': { variant: 'default' as const },
      'غیرفعال': { variant: 'outline' as const }
    };
    return variants[status] || variants['فعال'];
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'فناوری': 'text-purple-600',
      'مالی': 'text-emerald-600',
      'محیطی': 'text-blue-600',
      'داخلی': 'text-orange-600'
    };
    return colors[category as keyof typeof colors] || 'text-gray-600';
  };

  const calculateRiskScore = (probability: number, impact: number) => {
    return riskAssessmentService.calculateRiskScore(probability, impact);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <AlertTriangle className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">ارزیابی ریسک‌ها</h1>
            <p className="text-muted-foreground">{organizationName} - شناسایی، تحلیل و مدیریت ریسک‌ها</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          ریسک جدید
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {riskStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <AlertTriangle className={`w-8 h-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="risks">لیست ریسک‌ها</TabsTrigger>
          <TabsTrigger value="matrix">ماتریس ریسک</TabsTrigger>
          <TabsTrigger value="mitigation">کاهش ریسک</TabsTrigger>
          <TabsTrigger value="monitoring">نظارت مستمر</TabsTrigger>
          <TabsTrigger value="alerts">هشدارها</TabsTrigger>
        </TabsList>

        {/* Risk List */}
        <TabsContent value="risks" className="space-y-6">
          <div className="grid gap-6">
            {risks.map((risk) => (
              <Card key={risk.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${getCategoryColor(risk.category)} bg-current`}></span>
                        {risk.title}
                      </CardTitle>
                      <CardDescription>{risk.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={getRiskLevelBadge(risk.riskLevel).variant}>
                        {risk.riskLevel}
                      </Badge>
                      <Badge variant={getStatusBadge(risk.status).variant}>
                        {risk.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">احتمال:</span>
                        <p className="font-medium">{risk.probability}/10</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">تأثیر:</span>
                        <p className="font-medium">{risk.impact}/10</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">امتیاز ریسک:</span>
                        <p className="font-medium">{calculateRiskScore(risk.probability, risk.impact)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">مسئول:</span>
                        <p className="font-medium">{risk.responsiblePerson}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">استراتژی کاهش:</span>
                        <p className="text-sm mt-1 p-2 bg-muted rounded">{risk.mitigationStrategy}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">برنامه اضطراری:</span>
                        <p className="text-sm mt-1 p-2 bg-muted rounded">{risk.contingencyPlan}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>آخرین بازبینی: {risk.lastReviewDate}</span>
                      <span>بازبینی بعدی: {risk.nextReviewDate}</span>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 ml-1" />
                        جزئیات کامل
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEditForm(risk)}>
                        <Edit className="w-4 h-4 ml-1" />
                        ویرایش
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => setDeletingRisk(risk)}
                      >
                        <Trash2 className="w-4 h-4 ml-1" />
                        حذف
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Risk Matrix */}
        <TabsContent value="matrix" className="space-y-6">
          <RiskMatrix risks={risks} />
        </TabsContent>

        {/* Risk Mitigation */}
        <TabsContent value="mitigation" className="space-y-6">
          <div className="grid gap-6">
            {risks.filter(risk => risk.riskLevel === 'بحرانی' || risk.riskLevel === 'بالا').map((risk) => (
              <Card key={risk.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{risk.title}</CardTitle>
                      <CardDescription>برنامه کاهش و واکنش به ریسک</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">استراتژی کاهش ریسک</h4>
                        <p className="text-sm p-3 bg-blue-50 rounded-lg border border-blue-200">
                          {risk.mitigationStrategy}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">برنامه اضطراری</h4>
                        <p className="text-sm p-3 bg-orange-50 rounded-lg border border-orange-200">
                          {risk.contingencyPlan}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        مسئول اجرا: <span className="font-medium">{risk.responsiblePerson}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">ویرایش برنامه</Button>
                        <Button size="sm">گزارش پیشرفت</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Continuous Monitoring */}
        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5" />
                نظارت مستمر و بروزرسانی
              </CardTitle>
              <CardDescription>
                پیگیری وضعیت ریسک‌ها و بروزرسانی منظم ارزیابی‌ها
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {risks.map((risk) => (
                  <div key={risk.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{risk.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        بازبینی بعدی: {risk.nextReviewDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">وضعیت نظارت</p>
                        <Progress value={75} className="w-24 h-2" />
                      </div>
                      <Badge variant={getStatusBadge(risk.status).variant}>
                        {risk.status}
                      </Badge>
                      <Button variant="outline" size="sm">بروزرسانی</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Alerts */}
        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                هشدارهای خودکار
              </CardTitle>
              <CardDescription>
                هشدارها و اطلاع‌رسانی‌های خودکار برای ریسک‌های بحرانی
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-800">هشدار بحرانی</h4>
                      <p className="text-sm text-red-600 mt-1">
                        ریسک سایبری نیاز به بررسی فوری دارد - مهلت بازبینی نزدیک است
                      </p>
                      <p className="text-xs text-red-500 mt-2">2 روز پیش</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-orange-800">هشدار متوسط</h4>
                      <p className="text-sm text-orange-600 mt-1">
                        ریسک مالی نیاز به بروزرسانی استراتژی کاهش دارد
                      </p>
                      <p className="text-xs text-orange-500 mt-2">1 هفته پیش</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Risk Form Dialog */}
      <Dialog open={showForm || editingRisk !== null} onOpenChange={closeForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <RiskForm
            onSubmit={editingRisk ? handleEditRisk : handleAddRisk}
            onCancel={closeForm}
            initialData={editingRisk ? riskToFormData(editingRisk) : undefined}
            isEdit={editingRisk !== null}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deletingRisk !== null}
        onOpenChange={(open) => !open && setDeletingRisk(null)}
        title="حذف ریسک"
        description={`آیا از حذف ریسک "${deletingRisk?.title}" اطمینان دارید؟ این عمل قابل بازگشت نیست.`}
        confirmText="حذف"
        cancelText="لغو"
        onConfirm={handleDeleteRisk}
        variant="destructive"
      />
    </div>
  );
};

export default RiskAssessment;