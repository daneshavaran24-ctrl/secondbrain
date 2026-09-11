import { ReactNode, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import * as TabsPrimitive from "@radix-ui/react-tabs";

interface TabsListScrollableProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  children: ReactNode;
  className?: string;
}

export const TabsListScrollable = forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListScrollableProps
>(({ children, className, ...props }, ref) => {
  const isMobile = useIsMobile();

  return (
    <div className={cn(
      "relative",
      isMobile && "overflow-x-auto pb-2"
    )}>
      <TabsPrimitive.List
        ref={ref}
        className={cn(
          "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
          isMobile ? 
            "flex-nowrap w-max min-w-full justify-start gap-1 p-1" : 
            "grid w-full",
          className
        )}
        {...props}
      >
        {children}
      </TabsPrimitive.List>
      {isMobile && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-background via-muted to-background opacity-50" />
      )}
    </div>
  );
});

TabsListScrollable.displayName = "TabsListScrollable";