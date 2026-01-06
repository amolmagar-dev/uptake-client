import React from 'react';
import { Select } from '../../../shared/components/ui/Input';
import type { ChartConfig } from '../../../types/chart-config';

interface LegendSettingsProps {
  config: ChartConfig;
  onChange: (updates: Partial<ChartConfig>) => void;
}

export const LegendSettings: React.FC<LegendSettingsProps> = ({ config, onChange }) => {
  const updateLegend = (updates: Partial<NonNullable<ChartConfig['legend']>>) => {
    onChange({
      legend: {
        show: true,
        orient: 'horizontal',
        ...config.legend,
        ...updates
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Legend</h4>
        <input
          type="checkbox"
          checked={config.legend?.show !== false}
          onChange={(e) => updateLegend({ show: e.target.checked })}
          className="w-4 h-4 rounded border-border text-accent-primary focus:ring-accent-primary"
        />
      </div>

      {config.legend?.show !== false && (
        <div className="space-y-3 pl-2 border-l-2 border-border/50">
          <div>
            <label className="block text-xs text-text-tertiary mb-1">Orientation</label>
            <Select
              value={config.legend?.orient || 'horizontal'}
              onChange={(val: string | null) => updateLegend({ orient: val as any })}
              options={[
                { value: 'horizontal', label: 'Horizontal' },
                { value: 'vertical', label: 'Vertical' },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div>
            <label className="block text-xs text-text-tertiary mb-1">Horizontal Pos</label>
            <Select
              value={config.legend?.left?.toString() || 'center'}
              onChange={(val: string | null) => updateLegend({ left: val as any })}
              options={[
                { value: 'left', label: 'Left' },
                { value: 'center', label: 'Center' },
                { value: 'right', label: 'Right' },
              ]}
            />
          </div>
          <div>
            <label className="block text-xs text-text-tertiary mb-1">Vertical Pos</label>
            <Select
              value={config.legend?.top?.toString() || 'bottom'}
              onChange={(val: string | null) => updateLegend({ top: val as any })}
              options={[
                 { value: 'top', label: 'Top' },
                 { value: 'middle', label: 'Middle' },
                 { value: 'bottom', label: 'Bottom' },
              ]}
            />
          </div>
          </div>
        </div>
      )}
    </div>
  );
};
