import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ProfessionalCompanyGoal, GOAL_TYPES, GOAL_STATUS, GOAL_PRIORITY } from "@/services/professionalCompanyGoalsService";
import { Edit, Trash2, Target, TrendingUp, Calendar, DollarSign } from "lucide-react";

interface CompanyGoalsListProps {
  goals: ProfessionalCompanyGoal[];
  onEdit: (goal: ProfessionalCompanyGoal) => void;
  onDelete: (goalId: string) => void;
}

export function CompanyGoalsList({ goals, onEdit, onDelete }: CompanyGoalsListProps) {
  if (goals.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          هنوز هدفی تعریف نشده است
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {goals.map((goal) => (
        <Card key={goal.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-lg">{goal.title}</CardTitle>
                  <Badge variant="outline" className={GOAL_TYPES[goal.goal_type].color}>
                    {GOAL_TYPES[goal.goal_type].icon} {GOAL_TYPES[goal.goal_type].label}
                  </Badge>
                  <Badge className={GOAL_STATUS[goal.status].color}>
                    {GOAL_STATUS[goal.status].label}
                  </Badge>
                  <Badge variant="secondary" className={GOAL_PRIORITY[goal.priority].color}>
                    {GOAL_PRIORITY[goal.priority].label}
                  </Badge>
                </div>
                {goal.description && (
                  <p className="text-sm text-muted-foreground">{goal.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => onEdit(goal)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(goal.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>پیشرفت</span>
                <span className="font-medium">{goal.progress}%</span>
              </div>
              <Progress value={goal.progress} />
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {goal.target_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-muted-foreground">تاریخ هدف</div>
                    <div className="font-medium">
                      {new Date(goal.target_date).toLocaleDateString('fa-IR')}
                    </div>
                  </div>
                </div>
              )}

              {goal.responsible_person && (
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-muted-foreground">مسئول</div>
                    <div className="font-medium">{goal.responsible_person}</div>
                  </div>
                </div>
              )}

              {goal.budget && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-muted-foreground">بودجه</div>
                    <div className="font-medium">
                      {goal.budget.toLocaleString()} {goal.currency}
                    </div>
                  </div>
                </div>
              )}

              {goal.actual_roi !== undefined && goal.actual_roi !== null && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-muted-foreground">ROI</div>
                    <div className="font-medium text-green-600">{goal.actual_roi}%</div>
                  </div>
                </div>
              )}
            </div>

            {/* Success Metrics */}
            {goal.success_metrics && goal.success_metrics.length > 0 && (
              <div className="border-t pt-3">
                <div className="text-sm font-medium mb-2">معیارهای موفقیت:</div>
                <div className="space-y-1">
                  {goal.success_metrics.map((metric, idx) => (
                    <div key={idx} className="text-sm flex items-center justify-between">
                      <span className="text-muted-foreground">{metric.metric}</span>
                      <span>
                        {metric.current && <span className="text-primary">{metric.current}</span>}
                        {metric.current && metric.target && <span className="mx-1">/</span>}
                        <span className="text-muted-foreground">{metric.target}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strategy */}
            {(goal.market_strategy || goal.competitive_advantage) && (
              <div className="border-t pt-3 space-y-2">
                {goal.market_strategy && (
                  <div className="text-sm">
                    <span className="font-medium">استراتژی بازار: </span>
                    <span className="text-muted-foreground">{goal.market_strategy}</span>
                  </div>
                )}
                {goal.competitive_advantage && (
                  <div className="text-sm">
                    <span className="font-medium">مزیت رقابتی: </span>
                    <span className="text-muted-foreground">{goal.competitive_advantage}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
