import React from 'react';
import { Input, Select } from '../../../shared/components/ui/Input';
import type { ChartConfig } from '../../../types/chart-config';

interface GeneralSettingsProps {
  config: ChartConfig;
  onChange: (updates: Partial<ChartConfig>) => void;
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({ config, onChange }) => {
  const updateTitle = (updates: Partial<NonNullable<ChartConfig['title']>>) => {
    onChange({
      title: {
        show: true,
        text: '',
        ...config.title,
        ...updates
      }
    });
  };

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">General Settings</h4>
      
      {/* Title */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-text-tertiary mb-1">Chart Title</label>
          <Input
            value={config.title?.text || ''}
            onChange={(e) => updateTitle({ text: e.target.value })}
            placeholder="Enter chart title..."
          />
        </div>
        
        <div>
          <label className="block text-xs text-text-tertiary mb-1">Subtitle</label>
          <Input
            value={config.title?.subtext || ''}
            onChange={(e) => updateTitle({ subtext: e.target.value })}
            placeholder="Enter subtitle..."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-text-tertiary mb-1">Alignment</label>
            <Select
              value={config.title?.left || 'center'}
              onChange={(val: string | null) => updateTitle({ left: val as any })}
              options={[
                { value: 'left', label: 'Left' },
                { value: 'center', label: 'Center' },
                { value: 'right', label: 'Right' },
              ]}
            />
          </div>
          <div>
             <label className="block text-xs text-text-tertiary mb-1">Position</label>
             <Select
              value={config.title?.top || 'top'}
              onChange={(val: string | null) => updateTitle({ top: val as any })}
              options={[
                { value: 'top', label: 'Top' },
                { value: 'bottom', label: 'Bottom' },
              ]}
             />
          </div>
        </div>
      </div>
    </div>
  );
};
