import React, { useState, useEffect } from 'react';
import { Users, Star, BookOpen, Target, AlertCircle, TrendingUp, Calendar, Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { successionService, successionLocalService } from '@/services/successionServiceAggregator';
import { type SuccessionPosition, type TalentPoolMember, type DevelopmentProgram, type PositionGoal, type SuccessionServiceAPI } from '@/services/successionServiceTypes';
import { PositionForm } from './succession/PositionForm';
import { TalentForm } from './succession/TalentForm';
import { ProgramForm } from './succession/ProgramForm';
import { GoalForm } from './succession/GoalForm';
import { GoalsList } from './succession/GoalsList';

interface SuccessionPlanningProps {
  organizationName: string;
}

const SuccessionPlanning: React.FC<SuccessionPlanningProps> = ({ organizationName }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Determine which service to use based on organization availability
  const organizationId = user?.organization_id;
  const isPersonalMode = !organizationId;
  const service: SuccessionServiceAPI = isPersonalMode ? successionLocalService : successionService;
  
  // State for data
  const [positions, setPositions] = useState<SuccessionPosition[]>([]);
  const [talentPool, setTalentPool] = useState<TalentPoolMember[]>([]);
  const [programs, setPrograms] = useState<DevelopmentProgram[]>([]);
  const [goals, setGoals] = useState<PositionGoal[]>([]);
  
  // State for modals
  const [positionFormOpen, setPositionFormOpen] = useState(false);
  const [talentFormOpen, setTalentFormOpen] = useState(false);
  const [programFormOpen, setProgramFormOpen] = useState(false);
  const [goalFormOpen, setGoalFormOpen] = useState(false);
  
  // State for editing
  const [editingPosition, setEditingPosition] = useState<SuccessionPosition | undefined>();
  const [editingTalent, setEditingTalent] = useState<TalentPoolMember | undefined>();
  const [editingProgram, setEditingProgram] = useState<DevelopmentProgram | undefined>();
  const [editingGoal, setEditingGoal] = useState<PositionGoal | undefined>();

  // Get organization ID from authenticated user
  
  useEffect(() => {
    loadAllData();
  }, [organizationId]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [positionsData, talentData, programsData, goalsData] = await Promise.all([
        service.getPositions(organizationId),
        service.getTalentPool(organizationId),
        service.getDevelopmentPrograms(organizationId),
        service.getPositionGoals(organizationId)
      ]);
      
      setPositions(positionsData);
      setTalentPool(talentData);
      setPrograms(programsData);
      setGoals(goalsData);
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در بارگذاری اطلاعات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePosition = async (id: string) => {
    try {
      await service.deletePosition(id);
      toast({
        title: "موفقیت",
        description: "سمت کلیدی حذف شد"
      });
      loadAllData();
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در حذف سمت کلیدی",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTalent = async (id: string) => {
    try {
      await service.deleteTalentMember(id);
      toast({
        title: "موفقیت",
        description: "عضو از بانک استعداد حذف شد"
      });
      loadAllData();
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در حذف عضو",
        variant: "destructive"
      });
    }
  };

  const handleDeleteProgram = async (id: string) => {
    try {
      await service.deleteDevelopmentProgram(id);
      toast({
        title: "موفقیت",
        description: "برنامه توسعه حذف شد"
      });
      loadAllData();
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در حذف برنامه توسعه",
        variant: "destructive"
      });
    }
  };

  const openAddPosition = () => {
    setEditingPosition(undefined);
    setPositionFormOpen(true);
  };

  const openEditPosition = (position: SuccessionPosition) => {
    setEditingPosition(position);
    setPositionFormOpen(true);
  };

  const openAddTalent = () => {
    setEditingTalent(undefined);
    setTalentFormOpen(true);
  };

  const openEditTalent = (talent: TalentPoolMember) => {
    setEditingTalent(talent);
    setTalentFormOpen(true);
  };

  const openAddProgram = () => {
    setEditingProgram(undefined);
    setProgramFormOpen(true);
  };

  const openEditProgram = (program: DevelopmentProgram) => {
    setEditingProgram(program);
    setProgramFormOpen(true);
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      await service.deletePositionGoal(id);
      toast({
        title: "موفقیت",
        description: "هدف حذف شد"
      });
      loadAllData();
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در حذف هدف",
        variant: "destructive"
      });
    }
  };

  const openAddGoal = () => {
    setEditingGoal(undefined);
    setGoalFormOpen(true);
  };

  const openEditGoal = (goal: PositionGoal) => {
    setEditingGoal(goal);
    setGoalFormOpen(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">در حال بارگذاری...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Personal Mode Banner */}
      {isPersonalMode && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            شما در حالت شخصی کار می‌کنید. اطلاعات در مرورگر شما ذخیره می‌شود.
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <Users className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">جانشین‌پروری</h1>
            <p className="text-muted-foreground">
              {isPersonalMode ? "حالت شخصی - داده‌ها در مرورگر ذخیره می‌شود" : `${organizationName} - توسعه جانشینان آینده`}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="positions" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="positions">پست‌های کلیدی</TabsTrigger>
          <TabsTrigger value="talents">بانک استعدادها</TabsTrigger>
          <TabsTrigger value="development">برنامه‌های توسعه</TabsTrigger>
          <TabsTrigger value="goals">اهداف و استراتژی</TabsTrigger>
          <TabsTrigger value="matrix">ماتریس آمادگی</TabsTrigger>
        </TabsList>

        {/* Critical Positions */}
        <TabsContent value="positions" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">پست‌های کلیدی</h2>
            <Button onClick={openAddPosition} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              افزودن سمت کلیدی
            </Button>
          </div>

          {positions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64">
                <Users className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">هیچ سمت کلیدی تعریف نشده</h3>
                <p className="text-muted-foreground text-center mb-4">برای شروع، اولین سمت کلیدی خود را اضافه کنید</p>
                <Button onClick={openAddPosition}>افزودن سمت کلیدی</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {positions.map((position) => (
                <Card key={position.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{position.position_title}</CardTitle>
                        <CardDescription>
                          {position.department && `${position.department} • `}
                          {position.current_holder_name || 'بدون صاحب سمت'}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={service.getCriticalityBadgeVariant(position.criticality)}>
                          {service.formatCriticalityText(position.criticality)}
                        </Badge>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditPosition(position)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeletePosition(position.id!)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">آمادگی:</span>
                          <p className="font-medium">{service.formatReadinessText(position.readiness_level)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">جانشین‌ها:</span>
                          <p className="font-medium">{position.successor_count || 0} نفر</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">وضعیت:</span>
                          <Badge variant={service.getReadinessBadgeVariant(position.readiness_level)}>
                            {service.formatReadinessText(position.readiness_level)}
                          </Badge>
                        </div>
                      </div>
                      
                      {position.skills_required && position.skills_required.length > 0 && (
                        <div>
                          <span className="text-sm text-muted-foreground">مهارت‌های مورد نیاز:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {position.skills_required.map((skill, index) => (
                              <Badge key={index} variant="outline">{skill}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {position.notes && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">یادداشت:</span>
                          <p className="mt-1">{position.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Talent Pool */}
        <TabsContent value="talents" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">بانک استعدادها</h2>
            <Button onClick={openAddTalent} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              افزودن عضو جدید
            </Button>
          </div>

          {talentPool.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64">
                <Star className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">بانک استعداد خالی است</h3>
                <p className="text-muted-foreground text-center mb-4">اولین عضو بانک استعداد خود را اضافه کنید</p>
                <Button onClick={openAddTalent}>افزودن عضو جدید</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {talentPool.map((talent) => (
                <Card key={talent.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback>{talent.employee_name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{talent.employee_name}</CardTitle>
                        <CardDescription>
                          {talent.current_position} {talent.target_position_id && `→ هدف: ${positions.find(p => p.id === talent.target_position_id)?.position_title || 'ارتقا'}`}
                          {talent.employee_id && ` • کد: ${talent.employee_id}`}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium">{talent.performance_rating}/5</span>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditTalent(talent)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteTalent(talent.id!)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">عملکرد:</span>
                          <p className="font-medium">{talent.performance_rating}/5</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">پتانسیل:</span>
                          <p className="font-medium">{talent.potential_rating}/5</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">آمادگی:</span>
                          <Badge variant={service.getReadinessBadgeVariant(talent.readiness_level)}>
                            {service.formatReadinessText(talent.readiness_level)}
                          </Badge>
                        </div>
                      </div>

                      {talent.skills && talent.skills.length > 0 && (
                        <div>
                          <span className="text-sm text-muted-foreground">مهارت‌ها:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {talent.skills.map((skill, index) => (
                              <Badge key={index} variant="outline">{skill}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {talent.development_needs && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">نیازهای توسعه:</span>
                          <p className="mt-1">{talent.development_needs}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Development Programs */}
        <TabsContent value="development" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">برنامه‌های توسعه</h2>
            <Button onClick={openAddProgram} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              افزودن برنامه جدید
            </Button>
          </div>

          {programs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64">
                <BookOpen className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">هیچ برنامه توسعه‌ای وجود ندارد</h3>
                <p className="text-muted-foreground text-center mb-4">اولین برنامه توسعه خود را ایجاد کنید</p>
                <Button onClick={openAddProgram}>افزودن برنامه جدید</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {programs.map((program) => (
                <Card key={program.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-6 h-6 text-primary" />
                        <div>
                          <CardTitle className="text-lg">{program.program_name}</CardTitle>
                          <CardDescription>
                            {program.duration_months && `مدت: ${program.duration_months} ماه`}
                            {program.facilitator && ` • مسئول: ${program.facilitator}`}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                          <Badge variant={service.getStatusBadgeVariant(program.status)}>
                            {service.formatStatusText(program.status)}
                        </Badge>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditProgram(program)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteProgram(program.id!)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">شرکت‌کنندگان:</span>
                          <p className="font-medium">{program.participants?.length || 0} نفر</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">پیشرفت:</span>
                          <p className="font-medium">{program.completion_rate || 0}%</p>
                        </div>
                        {program.budget && (
                          <div>
                            <span className="text-muted-foreground">بودجه:</span>
                            <p className="font-medium">{program.budget?.toLocaleString()} {program.currency}</p>
                          </div>
                        )}
                      </div>

                      {program.completion_rate && program.completion_rate > 0 && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>پیشرفت دوره</span>
                            <span>{program.completion_rate}%</span>
                          </div>
                          <Progress value={program.completion_rate} className="h-2" />
                        </div>
                      )}

                      {program.learning_objectives && program.learning_objectives.length > 0 && (
                        <div>
                          <span className="text-sm text-muted-foreground">اهداف یادگیری:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {program.learning_objectives.map((objective, index) => (
                              <Badge key={index} variant="outline">{objective}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Goals and Strategy */}
        <TabsContent value="goals" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">اهداف و استراتژی‌ها</h2>
            <Button onClick={openAddGoal} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              افزودن هدف جدید
            </Button>
          </div>

          {/* Goals Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  کوتاه‌مدت
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {goals.filter(g => g.goal_type === 'short_term').length}
                </div>
                <p className="text-xs text-muted-foreground">۳-۶ ماه</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  بلندمدت
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {goals.filter(g => g.goal_type === 'long_term').length}
                </div>
                <p className="text-xs text-muted-foreground">۱-۳ سال</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  استراتژیک
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {goals.filter(g => g.goal_type === 'strategic').length}
                </div>
                <p className="text-xs text-muted-foreground">۳+ سال</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  میانگین پیشرفت
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {goals.length > 0
                    ? Math.round(goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length)
                    : 0}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Goals by Type */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">همه</TabsTrigger>
              <TabsTrigger value="short_term">کوتاه‌مدت</TabsTrigger>
              <TabsTrigger value="long_term">بلندمدت</TabsTrigger>
              <TabsTrigger value="strategic">استراتژیک</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <GoalsList
                goals={goals}
                service={service}
                onEdit={openEditGoal}
                onDelete={handleDeleteGoal}
              />
            </TabsContent>

            <TabsContent value="short_term" className="mt-4">
              <GoalsList
                goals={goals.filter(g => g.goal_type === 'short_term')}
                service={service}
                onEdit={openEditGoal}
                onDelete={handleDeleteGoal}
              />
            </TabsContent>

            <TabsContent value="long_term" className="mt-4">
              <GoalsList
                goals={goals.filter(g => g.goal_type === 'long_term')}
                service={service}
                onEdit={openEditGoal}
                onDelete={handleDeleteGoal}
              />
            </TabsContent>

            <TabsContent value="strategic" className="mt-4">
              <GoalsList
                goals={goals.filter(g => g.goal_type === 'strategic')}
                service={service}
                onEdit={openEditGoal}
                onDelete={handleDeleteGoal}
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Readiness Matrix */}
        <TabsContent value="matrix" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                ماتریس آمادگی (آمادگی × اهمیت شغلی)
              </CardTitle>
              <CardDescription>
                تحلیل وضعیت آمادگی جانشینان برای پست‌های کلیدی
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 border-2 border-dashed rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>ماتریس آمادگی جانشین‌پروری</p>
                  <p className="text-sm">نمودار دوبعدی آمادگی در برابر اهمیت شغلی</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gaps Report */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                گزارش نقاط خلأ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {positions.filter(p => (p.successor_count || 0) === 0).map(position => (
                  <div key={position.id} className="p-4 border border-red-200 rounded-lg bg-red-50">
                    <h4 className="font-medium text-red-800">اولویت بحرانی</h4>
                    <p className="text-sm text-red-600 mt-1">
                      پست {position.position_title} فاقد جانشین آماده است و نیاز به اقدام فوری دارد
                    </p>
                  </div>
                ))}
                
                {positions.filter(p => p.readiness_level === 'not_ready').map(position => (
                  <div key={position.id} className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                    <h4 className="font-medium text-orange-800">نیاز به بهبود</h4>
                    <p className="text-sm text-orange-600 mt-1">
                      سطح آمادگی جانشینان پست {position.position_title} نیاز به افزایش دارد
                    </p>
                  </div>
                ))}

                {positions.length === 0 && (
                  <div className="text-center text-muted-foreground">
                    <p>هیچ گزارش خلأ وجود ندارد</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Forms */}
      <PositionForm
        open={positionFormOpen}
        onOpenChange={setPositionFormOpen}
        position={editingPosition}
        organizationId={organizationId || 'personal'}
        service={service}
        onSuccess={loadAllData}
      />
      
      <TalentForm
        open={talentFormOpen}
        onOpenChange={setTalentFormOpen}
        member={editingTalent}
        organizationId={organizationId || 'personal'}
        service={service}
        onSuccess={loadAllData}
      />
      
      <ProgramForm
        open={programFormOpen}
        onOpenChange={setProgramFormOpen}
        program={editingProgram}
        organizationId={organizationId || 'personal'}
        service={service}
        onSuccess={loadAllData}
      />
      
      <GoalForm
        open={goalFormOpen}
        onOpenChange={setGoalFormOpen}
        goal={editingGoal}
        organizationId={organizationId || 'personal'}
        service={service}
        onSuccess={loadAllData}
      />
    </div>
  );
};

export default SuccessionPlanning;