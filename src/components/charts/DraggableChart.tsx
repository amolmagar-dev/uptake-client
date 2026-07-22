import React from "react";
import { ChartRenderer } from "./ChartRenderer";
import { Trash2, Settings } from "lucide-react";
import { Button } from "../../shared/components/ui/Button";

interface DraggableChartProps {
  id: string;
  name: string;
  chartType: string;
  data?: any[];
  config?: any;
  error?: string;
  isLoading?: boolean;
  onRemove?: (id: string) => void;
  onSettings?: (id: string) => void;
  height?: number;
}

const DraggableChartComponent: React.FC<DraggableChartProps> = ({
  id,
  name,
  chartType,
  data,
  config,
  error,
  isLoading,
  onRemove,
  onSettings,
  height = 300,
}) => {
  return (
    <div className="h-full w-full flex flex-col bg-base-200 rounded-lg overflow-hidden border border-base-300 shadow-sm hover:border-primary/50 hover:shadow-md transition-all">
      {/* Chart Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-base-200 border-b border-base-300">
        <span className="text-sm font-medium text-base-content truncate">{name}</span>
        <div className="flex items-center gap-1">
          {onSettings && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSettings(id)}
              className="text-base-content/60 hover:text-base-content p-1 h-auto"
            >
              <Settings size={14} />
            </Button>
          )}
          {onRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(id)}
              className="text-error hover:text-error p-1 h-auto"
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      </div>

      {/* Chart Content */}
      <div className="flex-1 p-4 min-h-0">
        {error ? (
          <p className="text-error text-sm">{error}</p>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="spinner" />
          </div>
        ) : data && data.length > 0 ? (
          <ChartRenderer type={chartType as any} data={data} config={config || {}} height={height} />
        ) : (
          <div className="flex items-center justify-center h-full text-base-content/50">No data to display</div>
        )}
      </div>
    </div>
  );
};

export const DraggableChart = React.memo(DraggableChartComponent);
