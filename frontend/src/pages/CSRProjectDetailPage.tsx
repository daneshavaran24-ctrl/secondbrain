import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModernButton } from "@/components/ui/modern-button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Users,
  FileText,
  Target,
  TrendingUp,
  Edit,
} from "lucide-react";
import {
  socialResponsibilityService,
  CSRProject,
  CSRDocument,
  CSRTeamMember,
  CSRMilestone,
} from "@/services/socialResponsibilityService";
import { DocumentUploadSection } from "@/components/social-responsibility/DocumentUploadSection";
import { toast } from "sonner";

export default function CSRProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<CSRProject | null>(null);
  const [documents, setDocuments] = useState<CSRDocument[]>([]);
  const [team, setTeam] = useState<CSRTeamMember[]>([]);
  const [milestones, setMilestones] = useState<CSRMilestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadProjectDetails();
  }, [id]);

  const loadProjectDetails = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const [projectData, docsData, teamData, milestonesData] = await Promise.all([
        socialResponsibilityService.getCSRProjects().then((projects) =>
          projects.find((p) => p.id === id)
        ),
        socialResponsibilityService.getProjectDocuments(id),
        socialResponsibilityService.getProjectTeam(id),
        socialResponsibilityService.getMilestones(id),
      ]);

      setProject(projectData || null);
      setDocuments(docsData);
      setTeam(teamData);
      setMilestones(milestonesData);
    } catch (error) {
      console.error("Error loading project:", error);
      toast.error("خطا در بارگذاری جزئیات پروژه");
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = () => {
    if (!project) return 0;
    if (project.start_date && project.end_date) {
      const start = new Date(project.start_date).getTime();
      const end = new Date(project.end_date).getTime();
      const now = Date.now();
      if (now >= end) return 100;
      if (now <= start) return 0;
      return Math.round(((now - start) / (end - start)) * 100);
    }
    return project.status === "completed" ? 100 : project.status === "active" ? 50 : 0;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto p-6 text-center">
        <p className="text-muted-foreground">پروژه یافت نشد</p>
        <ModernButton onClick={() => navigate("/social-responsibility")} className="mt-4">
          بازگشت
        </ModernButton>
      </div>
    );
  }

  const progress = calculateProgress();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <ModernButton
            variant="ghost"
            size="sm"
            onClick={() => navigate("/social-responsibility")}
          >
            <ArrowLeft className="h-4 w-4" />
          </ModernButton>
          <div>
            <h1 className="text-3xl font-bold">{project.title}</h1>
            <p className="text-muted-foreground mt-1">{project.description}</p>
          </div>
        </div>
        <ModernButton>
          <Edit className="h-4 w-4 ml-2" />
          ویرایش
        </ModernButton>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">تاریخ شروع</span>
          </div>
          <p className="text-lg font-semibold">
            {project.start_date
              ? new Date(project.start_date).toLocaleDateString("fa-IR")
              : "-"}
          </p>
        </div>

        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm">بودجه</span>
          </div>
          <p className="text-lg font-semibold">
            {project.budget
              ? `${Number(project.budget).toLocaleString()} ریال`
              : "-"}
          </p>
        </div>

        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Users className="h-4 w-4" />
            <span className="text-sm">تیم</span>
          </div>
          <p className="text-lg font-semibold">{team.length} نفر</p>
        </div>

        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <FileText className="h-4 w-4" />
            <span className="text-sm">مستندات</span>
          </div>
          <p className="text-lg font-semibold">{documents.length} فایل</p>
        </div>
      </div>

      {/* Progress */}
      <div className="border rounded-lg p-6 bg-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">پیشرفت پروژه</h3>
          </div>
          <span className="text-2xl font-bold text-primary">{progress}%</span>
        </div>
        <Progress value={progress} className="h-3" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">نمای کلی</TabsTrigger>
          <TabsTrigger value="milestones">مراحل</TabsTrigger>
          <TabsTrigger value="team">تیم</TabsTrigger>
          <TabsTrigger value="documents">مستندات</TabsTrigger>
          <TabsTrigger value="impact">اثرگذاری</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="border rounded-lg p-6 bg-card">
            <h3 className="font-semibold text-lg mb-4">اطلاعات پروژه</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">نوع پروژه</p>
                <Badge variant="outline">
                  {project.type === "charity"
                    ? "خیریه"
                    : project.type === "environment"
                    ? "محیط زیست"
                    : project.type === "education"
                    ? "آموزش"
                    : "سایر"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">وضعیت</p>
                <Badge>
                  {project.status === "planning"
                    ? "برنامه‌ریزی"
                    : project.status === "active"
                    ? "فعال"
                    : project.status === "completed"
                    ? "تکمیل شده"
                    : "معلق"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">اولویت</p>
                <Badge variant="secondary">
                  {project.priority === "high"
                    ? "بالا"
                    : project.priority === "medium"
                    ? "متوسط"
                    : "کم"}
                </Badge>
              </div>
              {project.tags && project.tags.length > 0 && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground mb-2">برچسب‌ها</p>
                  <div className="flex flex-wrap gap-1">
                    {project.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {project.partners && project.partners.length > 0 && (
            <div className="border rounded-lg p-6 bg-card">
              <h3 className="font-semibold text-lg mb-4">شرکا</h3>
              <div className="flex flex-wrap gap-2">
                {project.partners.map((partner) => (
                  <Badge key={partner} variant="secondary">
                    {partner}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="milestones">
          <div className="border rounded-lg p-6 bg-card">
            <h3 className="font-semibold text-lg mb-4">مراحل پروژه</h3>
            {milestones.length > 0 ? (
              <div className="space-y-3">
                {milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="border rounded-lg p-4 bg-muted/30"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{milestone.title}</h4>
                      <Badge
                        variant={
                          milestone.status === "completed"
                            ? "default"
                            : "outline"
                        }
                      >
                        {milestone.progress_percentage}%
                      </Badge>
                    </div>
                    {milestone.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {milestone.description}
                      </p>
                    )}
                    <Progress
                      value={milestone.progress_percentage || 0}
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                هنوز مرحله‌ای تعریف نشده است
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="team">
          <div className="border rounded-lg p-6 bg-card">
            <h3 className="font-semibold text-lg mb-4">اعضای تیم</h3>
            {team.length > 0 ? (
              <div className="space-y-3">
                {team.map((member) => (
                  <div key={member.id} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{member.member_name}</p>
                      {member.role && (
                        <p className="text-sm text-muted-foreground">
                          {member.role}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                هنوز عضوی به تیم اضافه نشده است
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <div className="border rounded-lg p-6 bg-card">
            <h3 className="font-semibold text-lg mb-4">مستندات پروژه</h3>
            <DocumentUploadSection
              projectId={project.id}
              documents={documents}
              onDocumentsChange={loadProjectDetails}
            />
          </div>
        </TabsContent>

        <TabsContent value="impact">
          <div className="border rounded-lg p-6 bg-card text-center py-12">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold text-lg mb-2">ارزیابی اثرگذاری</h3>
            <p className="text-muted-foreground">
              این بخش به زودی اضافه خواهد شد
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
