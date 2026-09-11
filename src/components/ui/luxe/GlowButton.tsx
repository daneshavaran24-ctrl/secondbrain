import React from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GlowButtonProps extends ButtonProps {
  glowVariant?: 'primary' | 'accent' | 'ghost';
}

/**
 * Luxury gradient button with glow shadow.
 * Built on shadcn Button — keeps a11y (focus-visible, aria) intact.
 */
export const GlowButton = React.forwardRef<HTMLButtonElement, GlowButtonProps>(
  ({ className, glowVariant = 'primary', children, ...props }, ref) => {
    const styles = {
      primary:
        'bg-gradient-to-r from-primary via-primary to-accent text-primary-foreground border-0 shadow-[0_8px_30px_-8px_hsl(var(--primary)/0.55)] hover:shadow-[0_12px_40px_-8px_hsl(var(--primary)/0.7)]',
      accent:
        'bg-gradient-to-r from-accent to-primary text-accent-foreground border-0 shadow-[0_8px_30px_-8px_hsl(var(--accent)/0.55)] hover:shadow-[0_12px_40px_-8px_hsl(var(--accent)/0.7)]',
      ghost:
        'bg-background/40 backdrop-blur-md border border-border/50 text-foreground hover:bg-background/60 shadow-[0_4px_20px_-8px_hsl(var(--foreground)/0.15)]',
    } as const;
    return (
      <Button
        ref={ref}
        className={cn(
          'motion-safe:transition-all motion-safe:duration-300 motion-safe:hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          styles[glowVariant],
          className
        )}
        {...props}
      >
        {children}
      </Button>
    );
  }
);
GlowButton.displayName = 'GlowButton';

export default GlowButton;