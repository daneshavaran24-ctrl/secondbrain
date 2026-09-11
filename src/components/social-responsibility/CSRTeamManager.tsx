import { useState, useEffect } from "react";
import { socialResponsibilityService, CSRTeamMember } from "@/services/socialResponsibilityService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, Mail, Trash2, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface CSRTeamManagerProps {
  projectId: string;
}

const roleLabels: Record<string, string> = {
  manager: 'مدیر پروژه',
  coordinator: 'هماهنگ‌کننده',
  volunteer: 'داوطلب',
  consultant: 'مشاور',
};

const roleColors: Record<string, string> = {
  manager: 'bg-chart-1/10 text-chart-1',
  coordinator: 'bg-chart-2/10 text-chart-2',
  volunteer: 'bg-chart-3/10 text-chart-3',
  consultant: 'bg-chart-4/10 text-chart-4',
};

export function CSRTeamManager({ projectId }: CSRTeamManagerProps) {
  const [team, setTeam] = useState<CSRTeamMember[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    member_name: '',
    member_email: '',
    role: 'volunteer' as string,
    responsibilities: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadTeam();
  }, [projectId]);

  const loadTeam = async () => {
    const data = await socialResponsibilityService.getProjectTeam(projectId);
    setTeam(data);
  };

  const handleSubmit = async () => {
    if (!formData.member_name) {
      toast({ title: "نام عضو الزامی است", variant: "destructive" });
      return;
    }

    const result = await socialResponsibilityService.addTeamMember({
      project_id: projectId,
      user_id: null,
      ...formData,
    });

    if (result) {
      toast({ title: "عضو جدید اضافه شد" });
      setFormData({ member_name: '', member_email: '', role: 'volunteer', responsibilities: '' });
      setOpen(false);
      loadTeam();
    } else {
      toast({ title: "خطا در افزودن عضو", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    const success = await socialResponsibilityService.removeTeamMember(id);
    if (success) {
      toast({ title: "عضو حذف شد" });
      loadTeam();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">تیم پروژه</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 ml-2" />
              افزودن عضو
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>افزودن عضو جدید</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">نام و نام خانوادگی *</Label>
                <Input
                  id="name"
                  value={formData.member_name}
                  onChange={(e) => setFormData({ ...formData, member_name: e.target.value })}
                  placeholder="نام عضو..."
                />
              </div>
              <div>
                <Label htmlFor="email">ایمیل</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.member_email}
                  onChange={(e) => setFormData({ ...formData, member_email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label htmlFor="role">نقش</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">مدیر پروژه</SelectItem>
                    <SelectItem value="coordinator">هماهنگ‌کننده</SelectItem>
                    <SelectItem value="volunteer">داوطلب</SelectItem>
                    <SelectItem value="consultant">مشاور</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="responsibilities">مسئولیت‌ها</Label>
                <Textarea
                  id="responsibilities"
                  value={formData.responsibilities}
                  onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                  placeholder="شرح مسئولیت‌ها..."
                />
              </div>
              <Button onClick={handleSubmit} className="w-full">
                افزودن
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {team.map((member) => (
          <Card key={member.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{member.member_name}</p>
                  {member.member_email && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <Mail className="h-3 w-3" />
                      {member.member_email}
                    </div>
                  )}
                  {member.role && (
                    <span className={`inline-block px-2 py-1 rounded-md text-xs mt-2 ${roleColors[member.role] || 'bg-secondary'}`}>
                      {roleLabels[member.role] || member.role}
                    </span>
                  )}
                  {member.responsibilities && (
                    <p className="text-sm text-muted-foreground mt-2">{member.responsibilities}</p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(member.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {team.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          هیچ عضوی به تیم اضافه نشده است
        </div>
      )}
    </div>
  );
}