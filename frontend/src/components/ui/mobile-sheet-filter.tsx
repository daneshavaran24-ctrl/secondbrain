import { ReactNode } from "react";
import { Filter } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./sheet";
import { Button } from "./button";
import { useIsMobile } from "@/hooks/use-mobile";
import { AppIcon } from "./app-icon";

interface MobileSheetFilterProps {
  children: ReactNode;
  title: string;
}

export function MobileSheetFilter({ children, title }: MobileSheetFilterProps) {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return <div className="flex gap-3 items-center">{children}</div>;
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="min-h-[44px] min-w-[44px]">
          <AppIcon size="sm">
            <Filter />
          </AppIcon>
          فیلترها
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 pt-6">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}