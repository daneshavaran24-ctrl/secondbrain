import React from 'react';
import { cn } from '@/lib/utils';

interface LuxeCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glow' | 'subtle';
  interactive?: boolean;
}

/**
 * Glass card with semantic tokens, soft border, and optional glow.
 * Honors prefers-reduced-motion.
 */
export const LuxeCard = React.forwardRef<HTMLDivElement, LuxeCardProps>(
  ({ className, variant = 'default', interactive = false, children, ...props }, ref) => {
    const base =
      'relative rounded-3xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-[0_8px_40px_-12px_hsl(var(--primary)/0.15)] motion-safe:transition-all motion-safe:duration-300';
    const variants = {
      default: '',
      glow:
        'shadow-[0_12px_60px_-12px_hsl(var(--primary)/0.35)] ring-1 ring-primary/10',
      subtle:
        'bg-card/40 shadow-[0_4px_24px_-12px_hsl(var(--foreground)/0.1)]',
    } as const;
    const interactiveCls = interactive
      ? 'motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[0_16px_60px_-12px_hsl(var(--primary)/0.35)] cursor-pointer'
      : '';
    return (
      <div
        ref={ref}
        className={cn(base, variants[variant], interactiveCls, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
LuxeCard.displayName = 'LuxeCard';

export default LuxeCard;