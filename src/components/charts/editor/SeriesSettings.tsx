import React from 'react';
import { Select } from '../../../shared/components/ui/Input';
import type { ChartConfig } from '../../../types/chart-config';

interface SeriesSettingsProps {
  config: ChartConfig;
  onChange: (updates: Partial<ChartConfig>) => void;
}

export const SeriesSettings: React.FC<SeriesSettingsProps> = ({ config, onChange }) => {
  const seriesNames = config.yColumns || [];

  const updateSeries = (seriesName: string, updates: any) => {
    onChange({
      seriesParams: {
        ...config.seriesParams,
        [seriesName]: {
          ...(config.seriesParams?.[seriesName] || {}),
          ...updates
        }
      }
    });
  };

  if (seriesNames.length === 0) {
      return <div className="text-xs text-text-tertiary italic">Add metrics to configure series</div>;
  }

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Series Override</h4>
      
      <div className="space-y-4">
        {seriesNames.map((series) => {
            const currentConfig = config.seriesParams?.[series] || {};

            return (
                <div key={series} className="p-3 border border-border rounded-lg bg-bg-tertiary/20">
                    <h5 className="text-xs font-bold text-text-primary mb-2 truncate">{series}</h5>
                    
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                             <label className="block text-[10px] text-text-tertiary mb-1">Chart Type</label>
                             <Select
                                value={currentConfig.type || 'default'}
                                onChange={(val: string | null) => updateSeries(series, { type: val === 'default' ? undefined : val })}
                                options={[
                                    { value: 'default', label: 'Default' },
                                    { value: 'bar', label: 'Bar' },
                                    { value: 'line', label: 'Line' },
                                    { value: 'area', label: 'Area' },
                                    { value: 'scatter', label: 'Scatter' },
                                ]}
                                className="text-xs"
                             />
                        </div>
                        <div>
                             <label className="block text-[10px] text-text-tertiary mb-1">Stack Group</label>
                             <Select
                                value={currentConfig.stack || 'none'}
                                onChange={(val: string | null) => updateSeries(series, { stack: val === 'none' ? undefined : val })}
                                options={[
                                    { value: 'none', label: 'None' },
                                    { value: 'total', label: 'Total' },
                                    { value: 'group1', label: 'Group 1' },
                                ]}
                                className="text-xs"
                             />
                        </div>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};
