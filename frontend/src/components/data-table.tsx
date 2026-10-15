import type { Key, ReactNode } from 'react';
import { cn } from 'cn';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState, ErrorState, LoadingState } from './list-states';

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  align?: 'left' | 'right';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[] | undefined;
  rowKey: (row: T) => Key;
  isLoading: boolean;
  isRefreshing?: boolean;
  error: Error | null;
  onRetry: () => void;
  errorTitle: string;
  empty: { title: string; description: string; action?: ReactNode };
}

// Tabela de lista com os três estados exigidos: carregando, vazia e erro.
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading,
  isRefreshing = false,
  error,
  onRetry,
  errorTitle,
  empty,
}: DataTableProps<T>) {
  if (isLoading) {
    return <LoadingState />;
  }
  if (error) {
    return <ErrorState title={errorTitle} error={error} onRetry={onRetry} />;
  }
  if (!rows || rows.length === 0) {
    return <EmptyState {...empty} />;
  }
  return (
    <Table
      aria-busy={isRefreshing}
      className={cn(isRefreshing && 'opacity-60 transition-opacity')}
    >
      <TableHeader className="bg-muted-subtle">
        <TableRow>
          {columns.map((column) => (
            <TableHead
              key={column.key}
              className={cn(
                'h-10 px-2 font-normal text-muted-foreground first:pl-4 last:pr-4',
                column.align === 'right' && 'text-right',
                column.className,
              )}
            >
              {column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={rowKey(row)} className="h-14">
            {columns.map((column) => (
              <TableCell
                key={column.key}
                className={cn(
                  'px-2 first:pl-4 last:pr-4',
                  column.align === 'right' && 'text-right',
                  column.className,
                )}
              >
                {column.cell(row)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
