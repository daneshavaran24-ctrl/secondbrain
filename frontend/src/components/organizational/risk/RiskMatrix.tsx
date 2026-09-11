import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Activity } from 'lucide-react';

export interface Risk {
  id: number;
  title: string;
  category: string;
  probability: number;
  impact: number;
  riskLevel: string;
}

interface RiskMatrixProps {
  risks: Risk[];
}

const getRiskLevelColor = (level: string): string => {
  switch (level) {
    case 'بحرانی': return 'bg-red-600 hover:bg-red-700';
    case 'بالا': return 'bg-orange-500 hover:bg-orange-600';
    case 'متوسط': return 'bg-yellow-400 hover:bg-yellow-500';
    case 'پایین': return 'bg-green-500 hover:bg-green-600';
    default: return 'bg-gray-400 hover:bg-gray-500';
  }
};

const calculateRiskLevel = (probability: number, impact: number): string => {
  const score = probability * impact;
  if (score >= 70) return 'بحرانی';
  if (score >= 40) return 'بالا';
  if (score >= 20) return 'متوسط';
  return 'پایین';
};

const getMatrixCellColor = (prob: number, impact: number): string => {
  const score = prob * impact;
  if (score >= 70) return 'bg-red-100 border-red-300';
  if (score >= 40) return 'bg-orange-100 border-orange-300';
  if (score >= 20) return 'bg-yellow-100 border-yellow-300';
  return 'bg-green-100 border-green-300';
};

export default function RiskMatrix({ risks }: RiskMatrixProps) {
  // Create a 10x10 grid for the matrix
  const gridSize = 10;
  
  // Group risks by their position in the matrix
  const getRisksAtPosition = (probability: number, impact: number) => {
    return risks.filter(risk => risk.probability === probability && risk.impact === impact);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            ماتریس ریسک (احتمال × تأثیر)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TooltipProvider>
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                {/* Matrix Grid */}
                <div className="relative">
                  {/* Y-axis label */}
                  <div className="absolute -left-16 top-1/2 transform -translate-y-1/2 -rotate-90">
                    <span className="text-sm font-medium text-muted-foreground">تأثیر</span>
                  </div>
                  
                  {/* X-axis label */}
                  <div className="text-center mb-2">
                    <span className="text-sm font-medium text-muted-foreground">احتمال</span>
                  </div>
                  
                  {/* Grid */}
                  <div className="grid grid-cols-11 gap-1 mb-4">
                    {/* Empty top-left corner */}
                    <div></div>
                    
                    {/* Column headers (Probability 1-10) */}
                    {Array.from({ length: gridSize }, (_, i) => (
                      <div key={`col-${i}`} className="text-center text-xs font-medium p-2">
                        {i + 1}
                      </div>
                    ))}
                    
                    {/* Rows (Impact 10 to 1, reversed for visual clarity) */}
                    {Array.from({ length: gridSize }, (_, impactIndex) => {
                      const impact = gridSize - impactIndex; // 10, 9, 8, ..., 1
                      return (
                        <React.Fragment key={`row-${impact}`}>
                          {/* Row header */}
                          <div className="text-center text-xs font-medium p-2 flex items-center justify-center">
                            {impact}
                          </div>
                          
                          {/* Matrix cells */}
                          {Array.from({ length: gridSize }, (_, probIndex) => {
                            const probability = probIndex + 1; // 1, 2, 3, ..., 10
                            const cellRisks = getRisksAtPosition(probability, impact);
                            const cellColor = getMatrixCellColor(probability, impact);
                            
                            return (
                              <Tooltip key={`cell-${probability}-${impact}`}>
                                <TooltipTrigger asChild>
                                  <div
                                    className={`
                                      relative h-12 w-12 border-2 rounded cursor-pointer transition-all
                                      ${cellColor}
                                      ${cellRisks.length > 0 ? 'shadow-md hover:shadow-lg' : ''}
                                    `}
                                  >
                                    {cellRisks.length > 0 && (
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="bg-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold border">
                                          {cellRisks.length}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <div className="space-y-2">
                                    <div className="font-medium">
                                      احتمال: {probability} | تأثیر: {impact}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      امتیاز ریسک: {probability * impact}
                                    </div>
                                    {cellRisks.length > 0 && (
                                      <div className="space-y-1">
                                        <div className="font-medium">ریسک‌ها:</div>
                                        {cellRisks.map((risk) => (
                                          <div key={risk.id} className="text-sm">
                                            • {risk.title}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>

      {/* Risk Level Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">راهنمای سطوح ریسک</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-600 rounded"></div>
              <div>
                <div className="font-medium">بحرانی</div>
                <div className="text-sm text-muted-foreground">۷۰-۱۰۰</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <div>
                <div className="font-medium">بالا</div>
                <div className="text-sm text-muted-foreground">۴۰-۶۹</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-400 rounded"></div>
              <div>
                <div className="font-medium">متوسط</div>
                <div className="text-sm text-muted-foreground">۲۰-۳۹</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <div>
                <div className="font-medium">پایین</div>
                <div className="text-sm text-muted-foreground">۱-۱۹</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Distribution Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">توزیع ریسک‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {['بحرانی', 'بالا', 'متوسط', 'پایین'].map((level) => {
              const levelRisks = risks.filter(risk => calculateRiskLevel(risk.probability, risk.impact) === level);
              const percentage = risks.length > 0 ? Math.round((levelRisks.length / risks.length) * 100) : 0;
              
              return (
                <div key={level} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge variant={level === 'بحرانی' ? 'destructive' : level === 'بالا' ? 'secondary' : 'outline'}>
                        {level}
                      </Badge>
                      <span className="text-sm font-medium">{levelRisks.length} ریسک</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{percentage}%</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${getRiskLevelColor(level).replace('hover:', '')}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}