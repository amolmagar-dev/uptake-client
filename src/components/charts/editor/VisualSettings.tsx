import React from 'react';
import { Select } from '../../../shared/components/ui/Input';
import type { ChartConfig } from '../../../types/chart-config';

interface VisualSettingsProps {
  config: ChartConfig;
  onChange: (updates: Partial<ChartConfig>) => void;
}

export const VisualSettings: React.FC<VisualSettingsProps> = ({ config, onChange }) => {
  const getSchemeValue = () => {
    if (!config.colorScheme || config.colorScheme.length === 0) return 'default';
    const str = JSON.stringify(config.colorScheme);
    if (str === JSON.stringify(['#00f5d4', '#4cc9f0', '#4895ef', '#7b2cbf'])) return 'cool';
    if (str === JSON.stringify(['#ff6b6b', '#ffd93d', '#f72585', '#7b2cbf'])) return 'warm';
    if (str === JSON.stringify(['#2a2a3a', '#606070', '#a0a0b0', '#f0f0f5'])) return 'monochrome';
    return 'custom';
  };

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold text-base-content/70 uppercase tracking-wider mb-3">Appearance</h4>
       
      <div>
        <label className="block text-xs text-base-content/50 mb-1">Color Scheme</label>
        <Select
          value={getSchemeValue()}
          onChange={(val: string | null) => {
             if (val === 'default') onChange({ colorScheme: undefined });
             if (val === 'cool') onChange({ colorScheme: ['#00f5d4', '#4cc9f0', '#4895ef', '#7b2cbf'] });
             if (val === 'warm') onChange({ colorScheme: ['#ff6b6b', '#ffd93d', '#f72585', '#7b2cbf'] });
             if (val === 'monochrome') onChange({ colorScheme: ['#2a2a3a', '#606070', '#a0a0b0', '#f0f0f5'] });
          }}
          options={[
            { value: 'default', label: 'Default (Neon)' },
            { value: 'cool', label: 'Cool Blues' },
            { value: 'warm', label: 'Warm Sunset' },
            { value: 'monochrome', label: 'Monochrome' },
            { value: 'custom', label: 'Custom Palette' },
          ]}
        />
      </div>

       <div>
        <label className="block text-xs text-base-content/50 mb-1">Background Color</label>
        <div className="flex gap-2">
             <button 
                onClick={() => onChange({ backgroundColor: 'transparent' })}
                className={`w-8 h-8 rounded border ${config.backgroundColor === 'transparent' ? 'border-primary' : 'border-base-300'}`}
                style={{ background: 'transparent' }}
                title="Transparent"
             />
             <button 
                onClick={() => onChange({ backgroundColor: '#151520' })}
                className={`w-8 h-8 rounded border ${config.backgroundColor === '#151520' ? 'border-primary' : 'border-base-300'}`}
                style={{ background: '#151520' }}
                title="Dark"
             />
        </div>
      </div>
    </div>
  );
};
