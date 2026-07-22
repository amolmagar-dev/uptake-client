import React from 'react';
import { Input } from '../../../shared/components/ui/Input';
import type { ChartConfig } from '../../../types/chart-config';

interface AxisSettingsProps {
  config: ChartConfig;
  onChange: (updates: Partial<ChartConfig>) => void;
}

export const AxisSettings: React.FC<AxisSettingsProps> = ({ config, onChange }) => {
  const updateXAxis = (updates: Partial<NonNullable<ChartConfig['xAxis']>>) => {
    onChange({
      xAxis: {
        show: true,
        ...config.xAxis,
        ...updates
      }
    });
  };

  const updateYAxis = (updates: Partial<NonNullable<ChartConfig['yAxis']>>) => {
    onChange({
      yAxis: {
        show: true,
        ...config.yAxis,
        ...updates
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* X Axis */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-base-content/70 uppercase tracking-wider">X Axis</h4>
          <input
            type="checkbox"
            checked={config.xAxis?.show !== false}
            onChange={(e) => updateXAxis({ show: e.target.checked })}
            className="checkbox checkbox-primary checkbox-sm"
          />
        </div>
        
        {config.xAxis?.show !== false && (
          <div className="space-y-3 pl-2 border-l-2 border-base-300/50">
            <div>
              <label className="block text-xs text-base-content/50 mb-1">Axis Name</label>
              <Input
                value={config.xAxis?.name || ''}
                onChange={(e) => updateXAxis({ name: e.target.value })}
                placeholder="X Axis Name..."
              />
            </div>
            
            <div>
              <label className="block text-xs text-base-content/50 mb-1">Label Rotation</label>
              <Input
                type="number"
                value={config.xAxis?.labelRotate ?? 0}
                onChange={(e) => {
                  const parsed = parseInt(e.target.value, 10);
                  updateXAxis({ labelRotate: isNaN(parsed) ? 0 : parsed });
                }}
                placeholder="0"
              />
            </div>
          </div>
        )}
      </div>

      {/* Y Axis */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-base-content/70 uppercase tracking-wider">Y Axis</h4>
          <input
            type="checkbox"
            checked={config.yAxis?.show !== false}
            onChange={(e) => updateYAxis({ show: e.target.checked })}
            className="checkbox checkbox-primary checkbox-sm"
          />
        </div>
        
         {config.yAxis?.show !== false && (
          <div className="space-y-3 pl-2 border-l-2 border-base-300/50">
            <div>
              <label className="block text-xs text-base-content/50 mb-1">Axis Name</label>
              <Input
                value={config.yAxis?.name || ''}
                onChange={(e) => updateYAxis({ name: e.target.value })}
                placeholder="Y Axis Name..."
              />
            </div>
          </div>
        )}
      </div>

       {/* Grid */}
      <div>
         <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-base-content/70 uppercase tracking-wider">Grid</h4>
          <input
            type="checkbox"
            checked={config.grid?.show !== false}
            onChange={(e) => onChange({ grid: { ...config.grid, show: e.target.checked } })}
            className="checkbox checkbox-primary checkbox-sm"
          />
        </div>
      </div>
    </div>
  );
};
