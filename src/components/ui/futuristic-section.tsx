import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FuturisticSectionProps {
  children: ReactNode;
  className?: string;
  container?: boolean;
  glassmorphism?: boolean;
  gradient?: boolean;
}

export function FuturisticSection({
  children,
  className,
  container = true,
  glassmorphism = false,
  gradient = false
}: FuturisticSectionProps) {
  return (
    <section className={cn(
      "relative py-16 md:py-24",
      glassmorphism && "glass-card backdrop-blur-sm",
      gradient && "bg-gradient-glow",
      className
    )}>
      {gradient && (
        <div className="absolute inset-0 bg-gradient-futuristic opacity-30" />
      )}
      
      <div className={cn(
        "relative z-10",
        container && "container mx-auto px-6"
      )}>
        {children}
      </div>
      
      {/* Subtle decorative elements */}
      <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-primary/20 to-transparent" />
      <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-accent/20 to-transparent" />
    </section>
  );
}