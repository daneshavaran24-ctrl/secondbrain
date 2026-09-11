import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Shield, Target, AlertTriangle } from 'lucide-react';

interface SWOTData {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  soStrategies?: string[];
  stStrategies?: string[];
  woStrategies?: string[];
  wtStrategies?: string[];
  overallAssessment?: string;
  priorityActions?: string[];
}

interface SWOTMatrixProps {
  data: SWOTData;
  showStrategies?: boolean;
}

export const SWOTMatrix: React.FC<SWOTMatrixProps> = ({ 
  data, 
  showStrategies = false 
}) => {
  const renderSWOTSection = (
    title: string,
    items: string[],
    icon: React.ReactNode,
    bgColor: string,
    textColor: string
  ) => (
    <Card className={`${bgColor} border hover:shadow-lg transition-all duration-300 group h-full`}>
      <CardHeader className="pb-4">
        <CardTitle className={`text-base font-bold ${textColor} flex items-center gap-3 group-hover:scale-105 transition-transform`}>
          <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
            {icon}
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="text-xs font-medium opacity-70 mb-3">
          {items.length} مورد شناسایی شده
        </div>
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li 
              key={index} 
              className={`text-sm ${textColor} leading-relaxed flex items-start gap-2 group-hover:translate-x-1 transition-transform duration-200`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current mt-2 flex-shrink-0"></span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );

  const renderStrategySection = (
    title: string,
    strategies: string[],
    bgColor: string,
    textColor: string
  ) => (
    <Card className={`${bgColor} border-2`}>
      <CardHeader className="pb-2">
        <CardTitle className={`text-xs font-bold ${textColor}`}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-1">
          {strategies.map((strategy, index) => (
            <li key={index} className={`text-xs ${textColor} leading-relaxed`}>
              • {strategy}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="text-center space-y-2">
        <h3 className="heading-secondary">تحلیل SWOT</h3>
        <p className="text-body">تحلیل جامع نقاط قوت، ضعف، فرصت‌ها و تهدیدها</p>
      </div>

      {/* Enhanced SWOT Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderSWOTSection(
          "نقاط قوت",
          data.strengths,
          <Shield className="h-5 w-5" />,
          "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/50 dark:from-green-950/20 dark:to-emerald-950/20 dark:border-green-800/30",
          "text-green-800 dark:text-green-300"
        )}
        
        {renderSWOTSection(
          "نقاط ضعف",
          data.weaknesses,
          <AlertTriangle className="h-5 w-5" />,
          "bg-gradient-to-br from-red-50 to-rose-50 border-red-200/50 dark:from-red-950/20 dark:to-rose-950/20 dark:border-red-800/30",
          "text-red-800 dark:text-red-300"
        )}
        
        {renderSWOTSection(
          "فرصت‌ها",
          data.opportunities,
          <Target className="h-5 w-5" />,
          "bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200/50 dark:from-blue-950/20 dark:to-cyan-950/20 dark:border-blue-800/30",
          "text-blue-800 dark:text-blue-300"
        )}
        
        {renderSWOTSection(
          "تهدیدها",
          data.threats,
          <Lightbulb className="h-5 w-5" />,
          "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200/50 dark:from-orange-950/20 dark:to-amber-950/20 dark:border-orange-800/30",
          "text-orange-800 dark:text-orange-300"
        )}
      </div>

      {/* Strategic Combinations (if available and requested) */}
      {showStrategies && (data.soStrategies || data.stStrategies || data.woStrategies || data.wtStrategies) && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">استراتژی‌های ترکیبی</h3>
          <div className="grid grid-cols-2 gap-3">
            {data.soStrategies && data.soStrategies.length > 0 && renderStrategySection(
              "SO - استراتژی تهاجمی",
              data.soStrategies,
              "bg-emerald-50 border-emerald-200",
              "text-emerald-800"
            )}
            
            {data.stStrategies && data.stStrategies.length > 0 && renderStrategySection(
              "ST - استراتژی رقابتی",
              data.stStrategies,
              "bg-cyan-50 border-cyan-200",
              "text-cyan-800"
            )}
            
            {data.woStrategies && data.woStrategies.length > 0 && renderStrategySection(
              "WO - استراتژی توسعه‌ای",
              data.woStrategies,
              "bg-purple-50 border-purple-200",
              "text-purple-800"
            )}
            
            {data.wtStrategies && data.wtStrategies.length > 0 && renderStrategySection(
              "WT - استراتژی دفاعی",
              data.wtStrategies,
              "bg-amber-50 border-amber-200",
              "text-amber-800"
            )}
          </div>
        </div>
      )}

      {/* Overall Assessment and Priority Actions */}
      {(data.overallAssessment || data.priorityActions) && (
        <div className="space-y-4">
          {data.overallAssessment && (
            <Card className="bg-slate-50 border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-slate-800">
                  ارزیابی کلی
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-slate-700 leading-relaxed">
                  {data.overallAssessment}
                </p>
              </CardContent>
            </Card>
          )}

          {data.priorityActions && data.priorityActions.length > 0 && (
            <Card className="bg-indigo-50 border-indigo-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-indigo-800">
                  اقدامات اولویت‌دار
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {data.priorityActions.map((action, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="text-xs bg-indigo-100 text-indigo-700 border-indigo-300"
                    >
                      {action}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};