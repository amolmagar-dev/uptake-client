import React from 'react';
import { Select } from '../../../shared/components/ui/Input';
import type { ChartConfig } from '../../../types/chart-config';

interface VisualSettingsProps {
  config: ChartConfig;
  onChange: (updates: Partial<ChartConfig>) => void;
}

export const VisualSettings: React.FC<VisualSettingsProps> = ({ config, onChange }) => {
  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Appearance</h4>
       
      <div>
        <label className="block text-xs text-text-tertiary mb-1">Color Scheme</label>
        <Select
          value={config.colorScheme ? 'custom' : 'default'} // Simplified logic for now
          onChange={(val: string | null) => {
             // Map some presets
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
          ]}
        />
      </div>

       <div>
        <label className="block text-xs text-text-tertiary mb-1">Background Color</label>
        <div className="flex gap-2">
             <button 
                onClick={() => onChange({ backgroundColor: 'transparent' })}
                className={`w-8 h-8 rounded border ${config.backgroundColor === 'transparent' ? 'border-accent-primary' : 'border-border'}`}
                style={{ background: 'transparent' }}
                title="Transparent"
             />
             <button 
                onClick={() => onChange({ backgroundColor: '#151520' })}
                className={`w-8 h-8 rounded border ${config.backgroundColor === '#151520' ? 'border-accent-primary' : 'border-border'}`}
                style={{ background: '#151520' }}
                title="Dark"
             />
        </div>
      </div>
    </div>
  );
};
