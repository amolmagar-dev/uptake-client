import React, { useState, useMemo } from 'react';
import { Table, Code, Search, Download, Maximize2, Minimize2, Clock, Hash, ChevronRight, ChevronDown, ArrowUp, ArrowDown, Copy, MoreHorizontal, Check } from 'lucide-react';

interface Field {
  name: string;
  dataType?: string | number;
  type?: string | number;
}

interface DataPreviewTableProps {
  data: Record<string, any>[];
  fields: Field[];
  rowCount: number;
  executionTime?: number;
  onMaximize?: () => void;
  isMaximized?: boolean;
}

// Type color mapping for badges
const getTypeColor = (dataType: string): string => {
  const type = dataType?.toLowerCase() || 'text';
  
  if (type.includes('int') || type.includes('numeric') || type.includes('decimal') || type.includes('float') || type.includes('double') || type.includes('number')) {
    return 'badge-primary';
  }
  if (type.includes('varchar') || type.includes('text') || type.includes('char') || type.includes('string')) {
    return 'badge-secondary';
  }
  if (type.includes('bool')) {
    return 'badge-accent';
  }
  if (type.includes('date') || type.includes('time') || type.includes('timestamp')) {
    return 'badge-warning';
  }
  if (type.includes('json') || type.includes('array')) {
    return 'badge-info';
  }
  return 'badge-ghost';
};

// Check if value is a nested array of objects
const isNestedArray = (value: any): boolean => {
  return Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null;
};

// Check if value is a nested object
const isNestedObject = (value: any): boolean => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

// Get keys from array of objects
const getNestedKeys = (arr: any[]): string[] => {
  const keysSet = new Set<string>();
  arr.forEach(item => {
    if (typeof item === 'object' && item !== null) {
      Object.keys(item).forEach(key => keysSet.add(key));
    }
  });
  return Array.from(keysSet);
};

// Nested Table Component for arrays
const NestedArrayTable: React.FC<{ data: any[]; level?: number }> = ({ data, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(level === 0);
  const keys = getNestedKeys(data);

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="flex items-center gap-1 text-xs text-primary hover:text-primary-focus"
      >
        <ChevronRight size={14} />
        <span className="badge badge-sm badge-info">Array[{data.length}]</span>
      </button>
    );
  }

  return (
    <div className="my-1">
      <button
        onClick={() => setIsExpanded(false)}
        className="flex items-center gap-1 text-xs text-primary hover:text-primary-focus mb-1"
      >
        <ChevronDown size={14} />
        <span className="badge badge-sm badge-info">Array[{data.length}]</span>
      </button>
      <div className="border border-base-300 rounded-lg overflow-hidden ml-2">
        <table className="table table-xs w-full">
          <thead>
            <tr className="bg-base-300/50">
              <th className="w-8 text-center text-xs">#</th>
              {keys.map((key, i) => (
                <th key={i} className="text-xs font-medium">{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-base-200/30">
                <td className="text-center text-xs opacity-50">{rowIdx + 1}</td>
                {keys.map((key, colIdx) => (
                  <td key={colIdx} className="text-xs">
                    <CellValue value={item[key]} level={level + 1} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Nested Object Component
const NestedObjectView: React.FC<{ data: Record<string, any>; level?: number }> = ({ data, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const keys = Object.keys(data);

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="flex items-center gap-1 text-xs text-primary hover:text-primary-focus"
      >
        <ChevronRight size={14} />
        <span className="badge badge-sm badge-secondary">Object{`{${keys.length}}`}</span>
      </button>
    );
  }

  return (
    <div className="my-1">
      <button
        onClick={() => setIsExpanded(false)}
        className="flex items-center gap-1 text-xs text-primary hover:text-primary-focus mb-1"
      >
        <ChevronDown size={14} />
        <span className="badge badge-sm badge-secondary">Object{`{${keys.length}}`}</span>
      </button>
      <div className="border border-base-300 rounded-lg overflow-hidden ml-2 p-2 bg-base-200/20">
        <dl className="space-y-1">
          {keys.map((key, i) => (
            <div key={i} className="flex gap-2 text-xs">
              <dt className="font-medium text-base-content/70 min-w-[80px]">{key}:</dt>
              <dd className="flex-1">
                <CellValue value={data[key]} level={level + 1} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
};

// Copy Button Component
const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`btn btn-ghost btn-xs btn-square opacity-0 group-hover:opacity-100 transition-opacity ${copied ? 'text-success' : ''}`}
      title="Copy value"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
};

// Cell Value renderer - handles all types including nested
const CellValue: React.FC<{ value: any; level?: number }> = ({ value, level = 0 }) => {
  if (value === null || value === undefined) {
    return <span className="text-base-content/30 italic text-xs">null</span>;
  }

  // Nested array of objects
  if (isNestedArray(value)) {
    return <NestedArrayTable data={value} level={level} />;
  }

  // Simple array (non-objects)
  if (Array.isArray(value)) {
    const displayValue = `[${value.map(v => typeof v === 'string' ? `"${v}"` : String(v)).join(', ')}]`;
    return (
      <div className="group flex items-center gap-2 min-w-[100px]">
        <span className="font-mono text-xs text-info truncate max-w-[200px]" title={displayValue}>
          {displayValue}
        </span>
        <CopyButton text={displayValue} />
      </div>
    );
  }

  // Nested object
  if (isNestedObject(value)) {
    return <NestedObjectView data={value} level={level} />;
  }

  // Boolean
  if (typeof value === 'boolean') {
    return (
      <span className={`badge badge-xs font-mono lowercase ${value ? 'badge-success badge-outline' : 'badge-error badge-outline'}`}>
        {value ? 'true' : 'false'}
      </span>
    );
  }

  // Number
  if (typeof value === 'number') {
    return <span className="font-mono text-xs text-primary">{value}</span>;
  }

  // String
  const stringValue = String(value);
  const isLong = stringValue.length > 50;
  
  return (
    <div className="group flex items-center gap-1 min-w-[100px] max-w-[300px]">
      <span className="truncate text-xs text-base-content/80" title={stringValue}>
        {stringValue}
      </span>
      <CopyButton text={stringValue} />
    </div>
  );
};

// Format cell value for search (flat string)
const formatCellValueForSearch = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

export const DataPreviewTable: React.FC<DataPreviewTableProps> = ({
  data,
  fields,
  rowCount,
  executionTime,
  onMaximize,
  isMaximized = false,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Filter and Sort data
  const processedData = useMemo(() => {
    let result = [...data];

    // Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(row => 
        Object.values(row).some(value => 
          formatCellValueForSearch(value).toLowerCase().includes(query)
        )
      );
    }

    // Sort
    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === bValue) return 0;
        
        // Handle nulls
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        const comparison = aValue < bValue ? -1 : 1;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, searchQuery, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        if (current.direction === 'asc') return { key, direction: 'desc' };
        return null; // Reset sort
      }
      return { key, direction: 'asc' };
    });
  };

  // Download as JSON
  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data-preview.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-base-100">
      {/* Toolbar */}
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 p-3 border-b border-base-300 bg-base-200 flex-shrink-0">
        {/* Left: View Toggle & Rows Count */}
        <div className="flex items-center gap-4">
          <div className="join">
            <button
              className={`join-item btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('table')}
            >
              <Table size={16} />
              <span className="hidden sm:inline ml-1">Table</span>
            </button>
            <button
              className={`join-item btn btn-sm ${viewMode === 'json' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('json')}
            >
              <Code size={16} />
              <span className="hidden sm:inline ml-1">JSON</span>
            </button>
          </div>
          
          <div className="hidden md:flex items-center gap-3 text-xs font-medium text-base-content/60 border-l border-base-300 pl-4 h-6">
            <span className="flex items-center gap-1.5">
              <Hash size={12} />
              {processedData.length}
              {searchQuery && <span className="opacity-50">/ {rowCount}</span>} rows
            </span>
            {executionTime !== undefined && (
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {executionTime}ms
              </span>
            )}
          </div>
        </div>

        {/* Right: Search & Actions */}
        <div className="flex items-center gap-3">
          <div className="relative w-48 transition-all focus-within:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
            <input
              type="text"
              placeholder="Filter data..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-sm input-bordered w-full pl-9 bg-base-100 focus:outline-none focus:border-primary transition-all"
            />
            {searchQuery && (
              <button 
                className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content p-1 rounded-full hover:bg-base-200 transition-colors"
                onClick={() => setSearchQuery('')}
              >
                ×
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 border-l border-base-300 pl-3">
            <button
              className="btn btn-ghost btn-sm btn-square"
              onClick={handleDownload}
              title="Download JSON"
            >
              <Download size={16} />
            </button>
            {onMaximize && (
              <button
                className="btn btn-ghost btn-sm btn-square"
                onClick={onMaximize}
                title={isMaximized ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-base-100">
        {viewMode === 'table' ? (
          <table className="table table-sm table-pin-rows w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-base-200/50 backdrop-blur-sm z-10">
                {/* Row number column */}
                <th className="w-12 text-center font-mono text-xs text-base-content/50 border-b border-base-300 bg-base-200/50">#</th>
                {fields.map((field, i) => (
                  <th 
                    key={i} 
                    className="border-b border-base-300 bg-base-200/50 cursor-pointer hover:bg-base-200 transition-colors group"
                    onClick={() => handleSort(field.name)}
                  >
                    <div className="flex flex-col gap-0.5 py-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-base-content selection:bg-base-300">{field.name}</span>
                        {sortConfig?.key === field.name ? (
                          sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-primary" /> : <ArrowDown size={12} className="text-primary" />
                        ) : (
                          <div className="flex flex-col opacity-0 group-hover:opacity-20 transition-opacity">
                             <ArrowUp size={8} />
                             <ArrowDown size={8} className="-mt-1" />
                          </div>
                        )}
                      </div>
                      <span className={`badge badge-xs text-[10px] h-4 font-normal gap-1 w-fit ${getTypeColor(String(field.dataType || field.type || 'text'))} bg-opacity-20 border-opacity-40`}>
                        {String(field.dataType || field.type || 'text').toLowerCase()}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {processedData.length === 0 ? (
                <tr>
                  <td colSpan={fields.length + 1} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-base-content/40">
                      <Search size={24} />
                      <p className="text-sm">{searchQuery ? 'No matching records found' : 'No data available'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                processedData.map((row, rowIndex) => (
                  <tr key={rowIndex} className="group hover:bg-base-200/30 transition-colors border-b border-base-100">
                    {/* Row number */}
                    <td className="text-center font-mono text-[10px] text-base-content/30 bg-base-100/50 group-hover:bg-base-200/20 border-r border-base-200/50">
                      {rowIndex + 1}
                    </td>
                    {fields.map((field, colIndex) => (
                      <td key={colIndex} className="py-2 border-r border-base-200/50 last:border-none min-w-[120px]">
                        <CellValue value={row[field.name]} />
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          /* JSON View */
          <div className="p-4">
            <pre className="bg-base-300/30 p-4 rounded-lg overflow-auto text-xs font-mono text-base-content max-h-full border border-base-300">
              <code>{JSON.stringify(processedData, null, 2)}</code>
            </pre>
          </div>
        )}
      </div>

      {/* Mobile Stats Footer */}
      <div className="md:hidden flex items-center justify-center gap-4 p-2 border-t border-base-300 bg-base-200 text-xs text-base-content/60">
        <span className="flex items-center gap-1">
          <Hash size={12} />
          {processedData.length} rows
        </span>
        {executionTime !== undefined && (
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {executionTime}ms
          </span>
        )}
      </div>
    </div>
  );
};

export default DataPreviewTable;
