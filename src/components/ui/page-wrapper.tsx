import React from 'react';
import { cn } from '@/lib/utils';

interface PageWrapperProps {
    children: React.ReactNode;
    className?: string;
    sidebarOpen?: boolean;
    fullWidth?: boolean;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({
    children,
    className,
    sidebarOpen = true,
    fullWidth = false
}) => {
    // Don't apply any margin since the main element already handles it
    return (
        <div
            className={cn(
                'w-full',
                className
            )}
        >
            {children}
        </div>
    );
};

export default PageWrapper;