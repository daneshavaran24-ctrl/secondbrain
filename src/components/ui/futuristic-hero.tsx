import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FuturisticHeroProps {
  title: string;
  subtitle?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  backgroundPattern?: boolean;
  sidebarOpen?: boolean;
}

export function FuturisticHero({
  title,
  subtitle,
  description,
  children,
  className,
  backgroundPattern = true,
  sidebarOpen = true
}: FuturisticHeroProps) {
  return (
    <section className={cn(
      "relative min-h-[45vh] flex flex-col justify-center items-center",
      "bg-gradient-hero overflow-hidden",
      backgroundPattern && "before:absolute before:inset-0 before:bg-gradient-futuristic before:opacity-50",
      className
    )}>
      {/* Background Pattern */}
      {backgroundPattern && (
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.05)_50%,transparent_100%)] animate-pulse" />
        </div>
      )}

      <div className={cn(
        "relative z-10 max-w-2xl mx-auto px-4 text-center transition-all duration-300",
        sidebarOpen ? "mr-72 md:mr-80 lg:mr-88 xl:mr-96" : "mr-16 md:mr-20"
      )}>
        {/* Title */}
        <h1 className={cn(
          "text-3xl md:text-5xl lg:text-6xl font-futuristic font-bold",
          "bg-gradient-to-r from-white via-tech-cyan to-accent bg-clip-text text-transparent",
          "tracking-wide mb-4 leading-tight drop-shadow-2xl",
          "animate-fade-in"
        )}>
          {title}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <h2 className={cn(
            "text-lg md:text-2xl lg:text-3xl font-display font-medium",
            "bg-gradient-to-r from-white/95 to-tech-cyan/80 bg-clip-text text-transparent",
            "mb-4 tracking-wider font-serif italic",
            "animate-slide-up"
          )}>
            {subtitle}
          </h2>
        )}

        {/* Description */}
        {description && (
          <p className={cn(
            "text-base md:text-lg lg:text-xl font-body leading-relaxed",
            "text-white/85 mb-6 max-w-2xl mx-auto text-center",
            "backdrop-blur-sm bg-tech-cyan/20 border-tech-cyan/30 rounded-lg p-6 border-2",
            "animate-scale-in shadow-xl shadow-tech-cyan/20",
            "font-persian-nums"
          )}>
            {description}
          </p>
        )}

        {/* Children (CTAs, etc.) */}
        {children && (
          <div className="animate-blur-in">
            {children}
          </div>
        )}
      </div>

      {/* Floating Elements */}
      <div className="absolute top-10 left-5 w-12 h-12 bg-tech-cyan/20 rounded-full blur-lg animate-float shadow-lg" />
      <div className="absolute bottom-10 right-5 w-20 h-20 bg-accent/15 rounded-full blur-lg animate-float shadow-xl" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/4 w-10 h-10 bg-white/10 rounded-full blur-lg animate-float shadow-lg" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/3 right-1/3 w-6 h-6 bg-tech-cyan/30 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-1/3 left-1/5 w-8 h-8 bg-accent/25 rounded-full animate-ping" style={{ animationDelay: '1.5s' }} />

      {/* Particle Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/6 w-1 h-1 bg-white rounded-full animate-twinkle" />
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-tech-cyan rounded-full animate-twinkle" style={{ animationDelay: '0.8s' }} />
        <div className="absolute top-1/2 right-1/6 w-1 h-1 bg-accent rounded-full animate-twinkle" style={{ animationDelay: '1.2s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-white rounded-full animate-twinkle" style={{ animationDelay: '2.1s' }} />
      </div>
    </section>
  );
}