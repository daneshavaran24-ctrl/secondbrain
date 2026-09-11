import React from 'react';
import { cn } from '@/lib/utils';

interface MinimalSectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const MinimalSectionHeader: React.FC<MinimalSectionHeaderProps> = ({
  title,
  subtitle,
  icon,
  action,
  className,
}) => (
  <div className={cn('flex items-start justify-between gap-4 mb-6', className)}>
    <div className="flex items-start gap-3">
      {icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 text-primary backdrop-blur-md border border-primary/10">
          {icon}
        </div>
      )}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          {title}
          <span aria-hidden className="block mt-1 h-px w-12 bg-gradient-to-r from-primary to-transparent" />
        </h2>
        {subtitle && (
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{subtitle}</p>
        )}
      </div>
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export default MinimalSectionHeader;