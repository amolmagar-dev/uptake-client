import React from "react";
import { ChartRenderer } from "./ChartRenderer";
import { Trash2, Settings } from "lucide-react";
import { Button } from "../ui/Button";

interface DraggableChartProps {
  id: string;
  name: string;
  chartType: string;
  data?: any[];
  config?: any;
  error?: string;
  isLoading?: boolean;
  onRemove: (id: string) => void;
  onSettings?: (id: string) => void;
  height?: number;
}

export const DraggableChart: React.FC<DraggableChartProps> = ({
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
    <div className="h-full w-full flex flex-col bg-[#12121a] rounded-lg overflow-hidden border border-[#2a2a3a] hover:border-[#00f5d4]/50 transition-colors">
      {/* Chart Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a25] border-b border-[#2a2a3a]">
        <span className="text-sm font-medium text-[#f0f0f5] truncate">{name}</span>
        <div className="flex items-center gap-1">
          {onSettings && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSettings(id)}
              className="text-[#a0a0b0] hover:text-[#f0f0f5] p-1 h-auto"
            >
              <Settings size={14} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(id)}
            className="text-[#ff4757] hover:text-[#ff4757] p-1 h-auto"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {/* Chart Content */}
      <div className="flex-1 p-4 min-h-0">
        {error ? (
          <p className="text-[#ff4757] text-sm">{error}</p>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="spinner" />
          </div>
        ) : data && data.length > 0 ? (
          <ChartRenderer type={chartType as any} data={data} config={config || {}} height={height} />
        ) : (
          <div className="flex items-center justify-center h-full text-[#606070]">No data to display</div>
        )}
      </div>
    </div>
  );
};
