import { SmartSkeleton } from "@/components/ui/luxe/SmartSkeleton";
import { AuroraBackground } from "@/components/ui/luxe/AuroraBackground";

interface PageLoadingSkeletonProps {
  variant?: "dashboard" | "list" | "card" | "page";
}

export const PageLoadingSkeleton = ({ variant = "page" }: PageLoadingSkeletonProps) => {
  return (
    <AuroraBackground intensity="subtle" className="min-h-[60vh] flex items-stretch">
      <div className="w-full" role="status" aria-busy="true" aria-live="polite">
        <span className="sr-only">در حال بارگذاری...</span>
        <SmartSkeleton variant={variant} />
      </div>
    </AuroraBackground>
  );
};

export default PageLoadingSkeleton;
