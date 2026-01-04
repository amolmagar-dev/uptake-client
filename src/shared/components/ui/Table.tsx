import React from 'react';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T, index: number) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  maxHeight?: string;
}

export function Table<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  isLoading = false,
  emptyMessage = 'No data available',
  className = '',
  maxHeight,
}: TableProps<T>) {
  const getValue = (row: T, key: string) => {
    const keys = key.split('.');
    let value: any = row;
    for (const k of keys) {
      value = value?.[k];
    }
    return value;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return (
    <div
      className={`overflow-auto rounded-lg border border-border ${className}`}
      style={{ maxHeight }}
    >
      <table className="w-full text-left">
        <thead className="sticky top-0 bg-bg-tertiary border-b border-border">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className={`
                  px-4 py-3 text-sm font-medium text-text-secondary
                  whitespace-nowrap
                  ${column.className || ''}
                `}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-text-muted"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick?.(row, rowIndex)}
                className={`
                  bg-bg-card hover:bg-bg-elevated
                  transition-colors duration-150
                  ${onRowClick ? 'cursor-pointer' : ''}
                `}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={`
                      px-4 py-3 text-sm text-text-primary
                      ${column.className || ''}
                    `}
                  >
                    {column.render
                      ? column.render(getValue(row, column.key as string), row, rowIndex)
                      : getValue(row, column.key as string) ?? '-'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

interface DataTableProps {
  data: Record<string, any>[];
  maxHeight?: string;
  className?: string;
}

export const DataTable: React.FC<DataTableProps> = ({
  data,
  maxHeight = '500px',
  className = '',
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-text-muted">
        No data to display
      </div>
    );
  }

  const columns = Object.keys(data[0]).map((key) => ({
    key,
    header: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
  }));

  return (
    <Table
      data={data}
      columns={columns}
      maxHeight={maxHeight}
      className={className}
    />
  );
};

