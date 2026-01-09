/**
 * Query Result Widget
 * Displays SQL query results with interactive data table and action buttons
 */

import React from "react";
import { Database, BarChart3, Filter, TrendingUp, Download } from "lucide-react";
import type { QueryResultWidget as QueryResultWidgetType, WidgetAction } from "../../shared/types/widgets";

interface QueryResultWidgetProps extends QueryResultWidgetType {
  onAction?: (action: WidgetAction) => void;
}

export const QueryResultWidget: React.FC<QueryResultWidgetProps> = ({ data, actions, onAction }) => {
  const handleAction = (action: WidgetAction) => {
    if (onAction) {
      onAction(action);
    }
  };

  // Icon map for action buttons
  const iconMap: Record<string, React.FC<{ size?: number }>> = {
    BarChart3,
    Filter,
    TrendingUp,
    Download,
    Database,
  };

  return (
    <div className="mt-3 w-full border border-base-300 rounded-lg overflow-hidden bg-base-100 shadow-sm">
      {/* SQL Query Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-base-200/50 border-b border-base-300">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Database size={14} className="text-primary shrink-0" />
          <code className="text-xs font-mono text-base-content/80 break-all sm:truncate">
            {data.query}
          </code>
        </div>
        <div className="flex items-center gap-3 text-xs opacity-50 shrink-0">
          <span>{data.rowCount} rows</span>
          {data.executionTime && <span>• {data.executionTime}ms</span>}
        </div>
      </div>

      {/* Data Table - Full width with horizontal scroll */}
      <div className="w-full overflow-x-auto max-h-96 custom-scrollbar">
        <table className="table table-xs table-pin-rows w-full">
          <thead>
            <tr className="bg-base-200/30">
              {data.columns.map((col) => (
                <th key={col.name} className="font-bold text-xs uppercase tracking-wider whitespace-nowrap">
                  {col.name}
                  <span className="ml-1 text-[10px] opacity-40 font-normal lowercase">
                    ({col.type})
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-base-200/30 transition-colors">
                {data.columns.map((col) => (
                  <td key={col.name} className="text-xs whitespace-nowrap">
                    {row[col.name] !== null && row[col.name] !== undefined
                      ? String(row[col.name])
                      : <span className="opacity-30 italic">null</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      {actions && actions.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 border-t border-base-300 bg-base-50">
          {actions.map((action) => {
            const Icon = action.icon ? iconMap[action.icon] : null;
            const btnClass = action.variant === "primary"
              ? "btn-primary"
              : action.variant === "secondary"
              ? "btn-secondary"
              : action.variant === "error"
              ? "btn-error"
              : action.variant === "success"
              ? "btn-success"
              : "btn-ghost";

            return (
              <button
                key={action.id}
                onClick={() => handleAction(action)}
                className={`btn btn-xs ${btnClass} gap-1`}
                title={action.tooltip}
              >
                {Icon && <Icon size={12} />}
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
