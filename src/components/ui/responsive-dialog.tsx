import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./dialog";
import { useIsMobile } from "@/hooks/use-mobile";

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function ResponsiveDialog({ 
  open, 
  onOpenChange, 
  title, 
  description, 
  children, 
  footer, 
  className 
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        isMobile 
          ? "w-[95vw] max-w-[95vw] h-[90vh] max-h-[90vh] p-0 flex flex-col m-2" 
          : "sm:max-w-lg max-w-2xl",
        className
      )}>
        <DialogHeader className={cn(
          isMobile ? "p-4 pb-0 flex-shrink-0" : "p-6 pb-4"
        )}>
          <DialogTitle className={cn(
            "text-right",
            isMobile ? "text-lg" : "text-xl"
          )}>
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className={cn(
              "text-right",
              isMobile ? "text-sm" : "text-base"
            )}>
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        
        <div className={cn(
          "space-y-4",
          isMobile ? "p-4 py-2 overflow-y-auto flex-1 min-h-0" : "p-6 pt-0"
        )}>
          {children}
        </div>
        
        {footer && (
          <DialogFooter className={cn(
            "gap-2 sm:gap-2 flex-shrink-0",
            isMobile ? "p-4 pt-0 flex-col-reverse space-y-2 space-y-reverse" : "p-6 pt-4"
          )}>
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}