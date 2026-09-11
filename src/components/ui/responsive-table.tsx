import { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent } from './card';
import { cn } from '@/lib/utils';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  className?: string;
  mobileLabel?: string;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function ResponsiveTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  className
}: ResponsiveTableProps<T>) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="space-y-3">
        {data.map((row) => (
          <Card
            key={keyExtractor(row)}
            className={cn(
              "cursor-pointer hover:shadow-md transition-shadow",
              onRowClick && "active:scale-95 touch-manipulation"
            )}
            onClick={() => onRowClick?.(row)}
          >
            <CardContent className="p-4 space-y-2">
              {columns.map((col, idx) => (
                <div key={idx} className="flex justify-between items-start gap-2">
                  <span className="text-sm text-muted-foreground font-medium">
                    {col.mobileLabel || col.header}:
                  </span>
                  <span className="text-sm text-right flex-1">
                    {typeof col.accessor === 'function' 
                      ? col.accessor(row) 
                      : row[col.accessor]
                    }
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className={cn("w-full", className)}>
        <thead className="bg-muted/50">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className={cn("p-3 text-right text-sm font-medium", col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {data.map((row) => (
            <tr
              key={keyExtractor(row)}
              className={cn(
                "hover:bg-muted/30 transition-colors",
                onRowClick && "cursor-pointer"
              )}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col, idx) => (
                <td key={idx} className={cn("p-3 text-sm", col.className)}>
                  {typeof col.accessor === 'function' 
                    ? col.accessor(row) 
                    : row[col.accessor]
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
