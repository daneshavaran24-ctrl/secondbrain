import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Edit, Trash2, Target, Calendar, User, TrendingUp } from "lucide-react";
import { PositionGoal, SuccessionServiceAPI } from "@/services/successionServiceTypes";

interface GoalsListProps {
  goals: PositionGoal[];
  service: SuccessionServiceAPI;
  onEdit: (goal: PositionGoal) => void;
  onDelete: (id: string) => void;
}

export function GoalsList({ goals, service, onEdit, onDelete }: GoalsListProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fa-IR');
    } catch {
      return dateString;
    }
  };

  if (goals.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Target className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            هیچ هدفی تعریف نشده است
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {goals.map((goal) => (
        <Card key={goal.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant={service.getGoalTypeBadgeVariant(goal.goal_type)}>
                    {service.formatGoalTypeText(goal.goal_type)}
                  </Badge>
                  <Badge variant={service.getGoalStatusBadgeVariant(goal.status)}>
                    {service.formatGoalStatusText(goal.status)}
                  </Badge>
                  {goal.priority && (
                    <Badge variant={goal.priority === 'critical' || goal.priority === 'high' ? 'destructive' : 'outline'}>
                      {goal.priority === 'critical' ? 'بحرانی' : 
                       goal.priority === 'high' ? 'بالا' :
                       goal.priority === 'medium' ? 'متوسط' : 'پایین'}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg">{goal.title}</CardTitle>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(goal)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => goal.id && onDelete(goal.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {goal.description && (
              <p className="text-sm text-muted-foreground">{goal.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              {goal.target_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>تاریخ هدف: {formatDate(goal.target_date)}</span>
                </div>
              )}
              {goal.responsible_person && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{goal.responsible_person}</span>
                </div>
              )}
            </div>

            {(goal.progress !== undefined && goal.progress !== null) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span>پیشرفت</span>
                  </div>
                  <span className="font-medium">{goal.progress}%</span>
                </div>
                <Progress value={goal.progress} className="h-2" />
              </div>
            )}

            {goal.budget && (
              <div className="text-sm">
                <span className="text-muted-foreground">بودجه: </span>
                <span className="font-medium">
                  {goal.budget.toLocaleString()} {goal.currency || 'IRR'}
                </span>
              </div>
            )}

            {goal.notes && (
              <div className="text-sm border-t pt-3">
                <span className="text-muted-foreground">یادداشت: </span>
                <span>{goal.notes}</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
