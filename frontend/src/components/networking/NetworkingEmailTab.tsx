import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Sparkles, Users } from "lucide-react";
import { QuickNetworkingEmail } from "./QuickNetworkingEmail";

interface NetworkingEmailTabProps {
  companyId?: string;
  organizationId?: string;
}

export function NetworkingEmailTab({ companyId, organizationId }: NetworkingEmailTabProps) {
  const [showQuickEmail, setShowQuickEmail] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            تولید ایمیل با هوش مصنوعی
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            ایمیل‌های حرفه‌ای به زبان‌ها و فرهنگ‌های مختلف تولید کنید.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-dashed cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setShowQuickEmail(true)}>
              <CardContent className="flex flex-col items-center justify-center py-8 gap-3">
                <Sparkles className="h-10 w-10 text-primary" />
                <span className="font-medium">ایمیل جدید بسازید</span>
                <span className="text-xs text-muted-foreground">با AI ایمیل حرفه‌ای تولید کنید</span>
              </CardContent>
            </Card>
            
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8 gap-3">
                <Users className="h-10 w-10 text-muted-foreground" />
                <span className="font-medium text-muted-foreground">انتخاب از مخاطبین</span>
                <span className="text-xs text-muted-foreground">از تب مخاطبین انتخاب کنید</span>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center">
            <Button onClick={() => setShowQuickEmail(true)} size="lg">
              <Sparkles className="ml-2 h-4 w-4" />
              تولید ایمیل سریع
            </Button>
          </div>
        </CardContent>
      </Card>

      <QuickNetworkingEmail open={showQuickEmail} onOpenChange={setShowQuickEmail} />
    </div>
  );
}
