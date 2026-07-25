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
    if (!row) return undefined;
    if (key in row) return row[key];
    if (typeof key !== 'string') return undefined;
    const keys = key.split('.');
    let value: any = row;
    for (const k of keys) {
      if (value === null || value === undefined) return undefined;
      value = value[k];
    }
    return value;
  };

  const renderCellContent = (val: any) => {
    if (val === null || val === undefined) {
      return <span className="text-base-content/40 font-mono text-xs">-</span>;
    }
    if (typeof val === 'boolean') {
      return (
        <span
          className={`badge badge-xs font-mono font-semibold px-2 py-0.5 border-0 ${
            val
              ? 'bg-success/20 text-success'
              : 'bg-base-300 text-base-content/60'
          }`}
        >
          {val ? 'true' : 'false'}
        </span>
      );
    }
    if (typeof val === 'number') {
      return <span className="font-mono text-xs text-primary font-medium">{val}</span>;
    }
    if (typeof val === 'object') {
      try {
        const jsonStr = JSON.stringify(val);
        return (
          <span className="font-mono text-[11px] text-base-content/70 truncate max-w-xs block" title={jsonStr}>
            {jsonStr}
          </span>
        );
      } catch (e) {
        return <span className="text-xs">{String(val)}</span>;
      }
    }
    const strVal = String(val);
    return (
      <span className="text-xs text-base-content/90 max-w-xs truncate block" title={strVal}>
        {strVal}
      </span>
    );
  };

  const rows = Array.isArray(data) ? data : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return (
    <div
      className={`overflow-auto border border-base-300 ${className}`}
      style={{ maxHeight }}
    >
      <table className="w-full text-left border-collapse">
        <thead className="sticky top-0 bg-base-200/95 backdrop-blur-md border-b border-base-300 z-10">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className={`
                  px-3.5 py-2.5 text-[11px] font-bold text-base-content/70
                  uppercase tracking-wider whitespace-nowrap
                  ${column.className || ''}
                `}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-base-300/60 bg-base-100/50">
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-base-content/50 text-xs"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick?.(row, rowIndex)}
                className={`
                  hover:bg-primary/5 transition-colors duration-150
                  ${onRowClick ? 'cursor-pointer' : ''}
                `}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={`
                      px-3.5 py-2.5 text-xs text-base-content align-middle
                      ${column.className || ''}
                    `}
                  >
                    {column.render
                      ? column.render(getValue(row, column.key as string), row, rowIndex)
                      : renderCellContent(getValue(row, column.key as string))}
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
  data: Record<string, any>[] | any;
  maxHeight?: string;
  className?: string;
}

export const DataTable: React.FC<DataTableProps> = ({
  data,
  maxHeight = '500px',
  className = '',
}) => {
  const rows = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray((data as any).rows)
    ? (data as any).rows
    : data && typeof data === 'object' && Array.isArray((data as any).data)
    ? (data as any).data
    : [];

  if (!rows || rows.length === 0 || typeof rows[0] !== 'object' || !rows[0]) {
    return (
      <div className="flex items-center justify-center py-12 text-base-content/50">
        No data to display
      </div>
    );
  }

  const columns = Object.keys(rows[0]).map((key) => ({
    key,
    header: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
  }));

  return (
    <Table
      data={rows}
      columns={columns}
      maxHeight={maxHeight}
      className={className}
    />
  );
};

