import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModernButton } from "@/components/ui/modern-button";
import { Plus, Heart, TreePine, GraduationCap, Folder, BarChart3 } from "lucide-react";
import { CSRProjectWizard } from "@/components/social-responsibility/wizard/CSRProjectWizard";
import { CSRProjectList } from "@/components/social-responsibility/CSRProjectList";
import { CSRFilterPanel, CSRFilters } from "@/components/social-responsibility/CSRFilterPanel";
import {
  socialResponsibilityService,
  CSRProject,
} from "@/services/socialResponsibilityService";
import { toast } from "@/hooks/use-toast";

export default function SocialResponsibilityPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "all";
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<CSRProject | undefined>();
  const [projects, setProjects] = useState<CSRProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CSRFilters>({
    search: "",
    types: [],
    statuses: [],
    priorities: [],
    sortBy: "date",
  });

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    const data = await socialResponsibilityService.getCSRProjects();
    setProjects(data);
    setLoading(false);
  };

  const handleCreateNew = () => {
    setEditingProject(undefined);
    setFormOpen(true);
  };

  const handleEdit = (project: CSRProject) => {
    setEditingProject(project);
    setFormOpen(true);
  };

  const handleSubmit = async (data: Partial<CSRProject>) => {
    try {
      if (editingProject) {
        await socialResponsibilityService.updateCSRProject(editingProject.id, data);
        toast({
          title: "موفق",
          description: "پروژه با موفقیت به‌روزرسانی شد",
        });
      } else {
        await socialResponsibilityService.createCSRProject(data);
        toast({
          title: "موفق",
          description: "پروژه جدید با موفقیت ایجاد شد",
        });
      }
      loadProjects();
    } catch (error) {
      toast({
        title: "خطا",
        description: "مشکلی در ذخیره پروژه رخ داد",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این پروژه اطمینان دارید؟")) return;

    try {
      await socialResponsibilityService.deleteCSRProject(id);
      toast({
        title: "موفق",
        description: "پروژه با موفقیت حذف شد",
      });
      loadProjects();
    } catch (error) {
      toast({
        title: "خطا",
        description: "مشکلی در حذف پروژه رخ داد",
        variant: "destructive",
      });
    }
  };

  const filterProjects = (type?: string) => {
    let filtered = type ? projects.filter((p) => p.type === type) : projects;

    // Apply search
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(search) ||
          p.description?.toLowerCase().includes(search)
      );
    }

    // Apply type filters
    if (filters.types.length > 0) {
      filtered = filtered.filter((p) => filters.types.includes(p.type));
    }

    // Apply status filters
    if (filters.statuses.length > 0) {
      filtered = filtered.filter((p) => filters.statuses.includes(p.status));
    }

    // Apply priority filters
    if (filters.priorities.length > 0) {
      filtered = filtered.filter((p) => filters.priorities.includes(p.priority));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case "priority":
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority as keyof typeof priorityOrder] - 
                 priorityOrder[a.priority as keyof typeof priorityOrder];
        case "budget":
          return (Number(b.budget) || 0) - (Number(a.budget) || 0);
        case "title":
          return a.title.localeCompare(b.title, "fa");
        case "date":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <CSRProjectWizard
        open={formOpen}
        onOpenChange={setFormOpen}
        project={editingProject}
        onSubmit={handleSubmit}
      />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">مسئولیت اجتماعی</h1>
            <p className="text-muted-foreground">
              مدیریت پروژه‌های مسئولیت اجتماعی شرکت (CSR)
            </p>
          </div>
          <ModernButton onClick={handleCreateNew} size="lg">
            <Plus className="h-5 w-5 ml-2" />
            پروژه جدید
          </ModernButton>
        </div>

        <CSRFilterPanel filters={filters} onChange={setFilters} />
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">
            <Folder className="h-4 w-4 ml-2" />
            همه
          </TabsTrigger>
          <TabsTrigger value="charity">
            <Heart className="h-4 w-4 ml-2" />
            خیریه
          </TabsTrigger>
          <TabsTrigger value="environment">
            <TreePine className="h-4 w-4 ml-2" />
            محیط زیست
          </TabsTrigger>
          <TabsTrigger value="education">
            <GraduationCap className="h-4 w-4 ml-2" />
            آموزش
          </TabsTrigger>
          <TabsTrigger value="reports">
            <BarChart3 className="h-4 w-4 ml-2" />
            گزارش‌ها
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <CSRProjectList
            projects={filterProjects()}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCreateNew={handleCreateNew}
            emptyIcon={<Folder className="h-12 w-12" />}
            emptyTitle="هیچ پروژه‌ای وجود ندارد"
            emptyDescription="اولین پروژه مسئولیت اجتماعی خود را ایجاد کنید"
          />
        </TabsContent>

        <TabsContent value="charity" className="mt-6">
          <CSRProjectList
            projects={filterProjects("charity")}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCreateNew={handleCreateNew}
            emptyIcon={<Heart className="h-12 w-12" />}
            emptyTitle="پروژه خیریه‌ای وجود ندارد"
            emptyDescription="اولین پروژه خیریه خود را ایجاد کنید"
          />
        </TabsContent>

        <TabsContent value="environment" className="mt-6">
          <CSRProjectList
            projects={filterProjects("environment")}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCreateNew={handleCreateNew}
            emptyIcon={<TreePine className="h-12 w-12" />}
            emptyTitle="پروژه زیست‌محیطی وجود ندارد"
            emptyDescription="اولین پروژه محیط زیست خود را ایجاد کنید"
          />
        </TabsContent>

        <TabsContent value="education" className="mt-6">
          <CSRProjectList
            projects={filterProjects("education")}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCreateNew={handleCreateNew}
            emptyIcon={<GraduationCap className="h-12 w-12" />}
            emptyTitle="پروژه آموزشی وجود ندارد"
            emptyDescription="اولین پروژه آموزشی خود را ایجاد کنید"
          />
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <div className="text-center py-12 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4" />
            <p>بخش گزارش‌ها به زودی اضافه خواهد شد</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
