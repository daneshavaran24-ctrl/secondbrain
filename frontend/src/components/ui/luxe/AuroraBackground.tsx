import React from 'react';
import { cn } from '@/lib/utils';

interface AuroraBackgroundProps {
  className?: string;
  intensity?: 'subtle' | 'normal' | 'vivid';
  children?: React.ReactNode;
}

/**
 * Liquid-glass aurora background with animated radial gradients.
 * Uses semantic tokens from index.css (primary/accent/secondary).
 */
export const AuroraBackground: React.FC<AuroraBackgroundProps> = ({
  className,
  intensity = 'normal',
  children,
}) => {
  const opacityMap = {
    subtle: { a: 0.15, b: 0.1, c: 0.08 },
    normal: { a: 0.28, b: 0.2, c: 0.14 },
    vivid: { a: 0.45, b: 0.32, c: 0.22 },
  } as const;
  const o = opacityMap[intensity];

  return (
    <div className={cn('relative isolate overflow-hidden', className)}>
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute -top-32 -right-32 h-[28rem] w-[28rem] rounded-full blur-3xl animate-pulse"
          style={{
            background: `radial-gradient(circle, hsl(var(--primary) / ${o.a}), transparent 70%)`,
            animationDuration: '8s',
          }}
        />
        <div
          className="absolute top-1/3 -left-32 h-[24rem] w-[24rem] rounded-full blur-3xl animate-pulse"
          style={{
            background: `radial-gradient(circle, hsl(var(--accent) / ${o.b}), transparent 70%)`,
            animationDuration: '11s',
            animationDelay: '1s',
          }}
        />
        <div
          className="absolute bottom-0 right-1/4 h-[20rem] w-[20rem] rounded-full blur-3xl animate-pulse"
          style={{
            background: `radial-gradient(circle, hsl(var(--secondary) / ${o.c}), transparent 70%)`,
            animationDuration: '14s',
            animationDelay: '2s',
          }}
        />
      </div>
      {children}
    </div>
  );
};

export default AuroraBackground;