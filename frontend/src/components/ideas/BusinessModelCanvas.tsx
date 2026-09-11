import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Heart, 
  Megaphone, 
  Package, 
  Handshake,
  DollarSign,
  Wrench,
  TrendingUp,
  Building
} from "lucide-react";

interface BusinessModelCanvasProps {
  idea: any;
}

interface BMCSection {
  title: string;
  icon: any;
  color: string;
  items: string[];
}

export const BusinessModelCanvas = ({ idea }: BusinessModelCanvasProps) => {
  const bmc = idea.business_model_canvas || {};

  const sections: BMCSection[] = [
    {
      title: "شرکای کلیدی",
      icon: Handshake,
      color: "border-purple-500/20 bg-purple-500/5",
      items: bmc.key_partners || []
    },
    {
      title: "فعالیت‌های کلیدی",
      icon: Wrench,
      color: "border-blue-500/20 bg-blue-500/5",
      items: bmc.key_activities || []
    },
    {
      title: "منابع کلیدی",
      icon: Package,
      color: "border-cyan-500/20 bg-cyan-500/5",
      items: bmc.key_resources || []
    },
    {
      title: "پیشنهاد ارزش",
      icon: Heart,
      color: "border-red-500/20 bg-red-500/5",
      items: bmc.value_propositions || []
    },
    {
      title: "روابط با مشتری",
      icon: Users,
      color: "border-orange-500/20 bg-orange-500/5",
      items: bmc.customer_relationships || []
    },
    {
      title: "کانال‌های توزیع",
      icon: Megaphone,
      color: "border-yellow-500/20 bg-yellow-500/5",
      items: bmc.channels || []
    },
    {
      title: "بخش‌های مشتری",
      icon: Building,
      color: "border-green-500/20 bg-green-500/5",
      items: bmc.customer_segments || []
    },
    {
      title: "ساختار هزینه",
      icon: DollarSign,
      color: "border-gray-500/20 bg-gray-500/5",
      items: bmc.cost_structure || []
    },
    {
      title: "جریان‌های درآمد",
      icon: TrendingUp,
      color: "border-emerald-500/20 bg-emerald-500/5",
      items: bmc.revenue_streams || []
    }
  ];

  const hasData = Object.keys(bmc).length > 0 && Object.values(bmc).some((arr: any) => arr?.length > 0);

  if (!hasData) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Business Model Canvas هنوز ایجاد نشده</h3>
          <p className="text-sm">از تحلیل AI برای تولید خودکار استفاده کنید</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((section, index) => (
          <Card key={index} className={section.color}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <section.icon className="w-5 h-5" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {section.items.length > 0 ? (
                <ul className="space-y-2">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span className="text-sm flex-1">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  موردی ثبت نشده
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {bmc.unique_value_proposition && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              ارزش پیشنهادی منحصر به فرد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">{bmc.unique_value_proposition}</p>
          </CardContent>
        </Card>
      )}

      {bmc.competitive_advantage && (
        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              مزیت رقابتی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{bmc.competitive_advantage}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};