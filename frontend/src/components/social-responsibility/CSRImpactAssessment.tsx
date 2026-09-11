import { useState, useEffect } from "react";
import { socialResponsibilityService, CSRAssessment } from "@/services/socialResponsibilityService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star, Users, TrendingUp, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface CSRImpactAssessmentProps {
  projectId: string;
}

export function CSRImpactAssessment({ projectId }: CSRImpactAssessmentProps) {
  const [assessments, setAssessments] = useState<CSRAssessment[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    assessment_date: new Date().toISOString().split('T')[0],
    beneficiaries_count: 0,
    satisfaction_score: 5,
    feedback: '',
    assessor_name: '',
    assessment_method: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadAssessments();
  }, [projectId]);

  const loadAssessments = async () => {
    const data = await socialResponsibilityService.getImpactAssessments(projectId);
    setAssessments(data);
  };

  const handleSubmit = async () => {
      const result = await socialResponsibilityService.submitAssessment({
        project_id: projectId,
        ...formData,
        satisfaction_score: formData.satisfaction_score,
      } as any);

    if (result) {
      toast({ title: "ارزیابی ثبت شد" });
      setFormData({
        assessment_date: new Date().toISOString().split('T')[0],
        beneficiaries_count: 0,
        satisfaction_score: 5,
        feedback: '',
        assessor_name: '',
        assessment_method: '',
      });
      setOpen(false);
      loadAssessments();
    } else {
      toast({ title: "خطا در ثبت ارزیابی", variant: "destructive" });
    }
  };

  const chartData = assessments.map(a => ({
    date: format(new Date(a.assessment_date), 'MM/dd'),
    score: Number(a.satisfaction_score),
    beneficiaries: a.beneficiaries_count,
  }));

  const totalBeneficiaries = assessments.reduce((sum, a) => sum + (a.beneficiaries_count || 0), 0);
  const avgSatisfaction = assessments.length 
    ? assessments.reduce((sum, a) => sum + (Number(a.satisfaction_score) || 0), 0) / assessments.length 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">ارزیابی اثرگذاری</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <TrendingUp className="h-4 w-4 ml-2" />
              ثبت ارزیابی
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ارزیابی جدید</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="date">تاریخ ارزیابی</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.assessment_date}
                  onChange={(e) => setFormData({ ...formData, assessment_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="beneficiaries">تعداد ذینفعان</Label>
                <Input
                  id="beneficiaries"
                  type="number"
                  value={formData.beneficiaries_count}
                  onChange={(e) => setFormData({ ...formData, beneficiaries_count: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="satisfaction">امتیاز رضایت (۰-۵)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="satisfaction"
                    type="number"
                    min="0"
                    max="5"
                    step="0.5"
                    value={formData.satisfaction_score}
                    onChange={(e) => setFormData({ ...formData, satisfaction_score: Number(e.target.value) })}
                  />
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 ${star <= formData.satisfaction_score ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="assessor">نام ارزیاب</Label>
                <Input
                  id="assessor"
                  value={formData.assessor_name}
                  onChange={(e) => setFormData({ ...formData, assessor_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="method">روش ارزیابی</Label>
                <Input
                  id="method"
                  value={formData.assessment_method}
                  onChange={(e) => setFormData({ ...formData, assessment_method: e.target.value })}
                  placeholder="مصاحبه، نظرسنجی، مشاهده، ..."
                />
              </div>
              <div>
                <Label htmlFor="feedback">بازخورد و نظرات</Label>
                <Textarea
                  id="feedback"
                  value={formData.feedback}
                  onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                  placeholder="بازخورد کلی از پروژه..."
                />
              </div>
              <Button onClick={handleSubmit} className="w-full">
                ثبت ارزیابی
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">کل ذینفعان</p>
              <p className="text-3xl font-bold mt-2">{totalBeneficiaries.toLocaleString('fa-IR')}</p>
            </div>
            <div className="p-3 bg-chart-2/10 rounded-lg">
              <Users className="h-6 w-6 text-chart-2" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">میانگین رضایت</p>
              <p className="text-3xl font-bold mt-2">{avgSatisfaction.toFixed(1)}</p>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${star <= avgSatisfaction ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
            </div>
            <div className="p-3 bg-chart-1/10 rounded-lg">
              <Heart className="h-6 w-6 text-chart-1" />
            </div>
          </div>
        </Card>
      </div>

      {/* Satisfaction Chart */}
      {chartData.length > 0 && (
        <Card className="p-6">
          <h4 className="font-semibold mb-4">روند رضایت‌مندی</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="hsl(var(--chart-1))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Assessments List */}
      <div className="space-y-4">
        {assessments.map((assessment) => (
          <Card key={assessment.id} className="p-4">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">
                    {format(new Date(assessment.assessment_date), 'yyyy-MM-dd')}
                  </p>
                  {assessment.assessor_name && (
                    <p className="text-sm text-muted-foreground">ارزیاب: {assessment.assessor_name}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${star <= Number(assessment.satisfaction_score) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-4 text-sm">
                <span>ذینفعان: {assessment.beneficiaries_count?.toLocaleString('fa-IR')}</span>
                {assessment.assessment_method && <span>روش: {assessment.assessment_method}</span>}
              </div>
              {assessment.feedback && (
                <p className="text-sm text-muted-foreground mt-2">{assessment.feedback}</p>
              )}
            </div>
          </Card>
        ))}
      </div>

      {assessments.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          هیچ ارزیابی ثبت نشده است
        </div>
      )}
    </div>
  );
}