import { useState } from "react";
import { Plus, Mic, Camera, FileText, Brain, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fabActions = [
  { icon: Mic, label: "ضبط صوتی", color: "bg-medical-purple", action: "record" },
  { icon: Camera, label: "عکس", color: "bg-medical-blue", action: "camera" },
  { icon: FileText, label: "یادداشت", color: "bg-medical-amber", action: "note" },
  { icon: Brain, label: "ایده", color: "bg-medical-green", action: "idea" },
];

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (action: string) => {
    // console.log removed for production: Action clicked
    setIsOpen(false);
    // Implement actual actions here
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Action buttons */}
      <div className={cn(
        "flex flex-col-reverse items-end gap-3 mb-3 transition-all duration-300",
        isOpen ? "opacity-100 visible" : "opacity-0 invisible"
      )}>
        {fabActions.map((item, index) => (
          <div
            key={item.action}
            className="flex items-center gap-3 group"
            style={{
              transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
              transitionDelay: `${index * 50}ms`,
            }}
          >
            <div className="bg-background border border-border/50 rounded-lg px-3 py-2 shadow-floating opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              <span className="text-sm font-medium text-foreground">{item.label}</span>
            </div>
            <Button
              size="icon"
              className={cn(
                "h-12 w-12 rounded-full shadow-floating hover-scale transition-elegant",
                item.color,
                "text-white hover:brightness-110"
              )}
              onClick={() => handleAction(item.action)}
            >
              <item.icon className="h-5 w-5" />
            </Button>
          </div>
        ))}
      </div>

      {/* Main FAB */}
      <Button
        size="icon"
        className={cn(
          "h-14 w-14 rounded-full shadow-glow transition-elegant hover-scale",
          "bg-gradient-hero text-white",
          isOpen && "rotate-45"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </Button>
    </div>
  );
}