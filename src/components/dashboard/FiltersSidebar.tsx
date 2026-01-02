import React, { useState, useEffect } from 'react';
import { Filter, Settings, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { datasetsApi } from '../../lib/api';

export interface DashboardFilter {
  id: string;
  name: string;
  type: 'value' | 'time_range' | 'numerical_range';
  datasetId: string;
  column: string;
  value: any;
  config: {
    multiSelect?: boolean;
    required?: boolean;
    hasDefault?: boolean;
    defaultValue?: any;
  };
}

interface FiltersSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  filters: DashboardFilter[];
  onAddFilter: () => void;
  onEditFilter: (filter: DashboardFilter) => void;
  onRemoveFilter: (filterId: string) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  filterValues: Record<string, any>;
  onFilterValueChange: (filterId: string, value: any) => void;
}

export const FiltersSidebar: React.FC<FiltersSidebarProps> = ({
  isOpen,
  onToggle,
  filters,
  onAddFilter,
  onEditFilter,
  onRemoveFilter,
  onApplyFilters,
  onClearFilters,
  filterValues,
  onFilterValueChange,
}) => {
  // Store unique values for each filter's column
  const [filterOptions, setFilterOptions] = useState<Record<string, string[]>>({});

  // Fetch unique values for value-type filters
  useEffect(() => {
    const fetchFilterOptions = async () => {
      for (const filter of filters) {
        if (filter.type === 'value' && filter.datasetId && filter.column && !filterOptions[filter.id]) {
          try {
            const response = await datasetsApi.preview(filter.datasetId);
            const previewData = response.data?.preview || response.data?.data || response.data || [];
            
            if (Array.isArray(previewData) && previewData.length > 0) {
              // Extract unique values for the column
              const uniqueValues = [...new Set(previewData.map((row: any) => row[filter.column]).filter(v => v !== null && v !== undefined))];
              setFilterOptions(prev => ({
                ...prev,
                [filter.id]: uniqueValues.map(v => String(v))
              }));
            }
          } catch (error) {
            console.error('Failed to fetch filter options:', error);
          }
        }
      }
    };

    if (filters.length > 0) {
      fetchFilterOptions();
    }
  }, [filters]);

  if (!isOpen) {
    // Collapsed state - show just the toggle button
    return (
      <div className="fixed left-0 top-[73px] bottom-0 w-10 bg-[#12121a] border-r border-[#2a2a3a] flex flex-col items-center py-4 z-40">
        <button
          onClick={onToggle}
          className="p-2 rounded-lg text-[#606070] hover:text-[#00f5d4] hover:bg-[#1a1a25] transition-colors"
          title="Open Filters"
        >
          <ChevronRight size={20} />
        </button>
        <div className="mt-4">
          <Filter size={18} className="text-[#606070]" />
        </div>
        {filters.length > 0 && (
          <span className="mt-2 text-xs text-[#00f5d4] font-medium">{filters.length}</span>
        )}
      </div>
    );
  }

  // Expanded state
  return (
    <div className="fixed left-0 top-[73px] bottom-0 w-72 bg-[#12121a] border-r border-[#2a2a3a] flex flex-col z-40">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a3a]">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-[#00f5d4]" />
          <span className="text-sm font-medium text-[#f0f0f5]">Filters</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onAddFilter}
            className="p-1.5 rounded-md text-[#606070] hover:text-[#00f5d4] hover:bg-[#1a1a25] transition-colors"
            title="Add Filter"
          >
            <Settings size={16} />
          </button>
          <button
            onClick={onToggle}
            className="p-1.5 rounded-md text-[#606070] hover:text-[#f0f0f5] hover:bg-[#1a1a25] transition-colors"
            title="Collapse Filters"
          >
            <ChevronLeft size={18} />
          </button>
        </div>
      </div>

      {/* Add Filter Link */}
      <div className="px-4 py-3 border-b border-[#2a2a3a]">
        <button
          onClick={onAddFilter}
          className="flex items-center gap-2 text-sm text-[#00f5d4] hover:text-[#00d4b8] transition-colors"
        >
          <Plus size={16} />
          Add or edit filters
        </button>
      </div>

      {/* Filters List */}
      <div className="flex-1 overflow-y-auto">
        {filters.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Filter size={32} className="mx-auto mb-3 text-[#404050]" />
            <p className="text-sm text-[#606070]">No global filters are currently added</p>
            <p className="text-xs text-[#505060] mt-2">
              Click on "Add or edit filters" to create new dashboard filters
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-3">
            {filters.map((filter) => (
              <div
                key={filter.id}
                className="bg-[#1a1a25] rounded-lg border border-[#2a2a3a] p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#f0f0f5]">{filter.name}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditFilter(filter)}
                      className="p-1 rounded text-[#606070] hover:text-[#00f5d4] transition-colors"
                      title="Edit Filter"
                    >
                      <Settings size={14} />
                    </button>
                    <button
                      onClick={() => onRemoveFilter(filter.id)}
                      className="p-1 rounded text-[#606070] hover:text-[#ff4757] transition-colors"
                      title="Remove Filter"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                
                {/* Filter Input based on type */}
                {filter.type === 'value' && (
                  <select
                    value={filterValues[filter.id] || ''}
                    onChange={(e) => onFilterValueChange(filter.id, e.target.value)}
                    className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#2a2a3a] rounded text-sm text-[#f0f0f5] focus:outline-none focus:border-[#00f5d4] transition-colors"
                  >
                    <option value="">Select {filter.column}...</option>
                    {(filterOptions[filter.id] || []).map((option, idx) => (
                      <option key={idx} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                )}
                
                {filter.type === 'time_range' && (
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={filterValues[filter.id]?.start || ''}
                      onChange={(e) => onFilterValueChange(filter.id, { ...filterValues[filter.id], start: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#2a2a3a] rounded text-sm text-[#f0f0f5] focus:outline-none focus:border-[#00f5d4] transition-colors"
                    />
                    <input
                      type="date"
                      value={filterValues[filter.id]?.end || ''}
                      onChange={(e) => onFilterValueChange(filter.id, { ...filterValues[filter.id], end: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#2a2a3a] rounded text-sm text-[#f0f0f5] focus:outline-none focus:border-[#00f5d4] transition-colors"
                    />
                  </div>
                )}
                
                {filter.type === 'numerical_range' && (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filterValues[filter.id]?.min || ''}
                      onChange={(e) => onFilterValueChange(filter.id, { ...filterValues[filter.id], min: e.target.value })}
                      className="flex-1 px-3 py-2 bg-[#0a0a0f] border border-[#2a2a3a] rounded text-sm text-[#f0f0f5] focus:outline-none focus:border-[#00f5d4] transition-colors"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filterValues[filter.id]?.max || ''}
                      onChange={(e) => onFilterValueChange(filter.id, { ...filterValues[filter.id], max: e.target.value })}
                      className="flex-1 px-3 py-2 bg-[#0a0a0f] border border-[#2a2a3a] rounded text-sm text-[#f0f0f5] focus:outline-none focus:border-[#00f5d4] transition-colors"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      {filters.length > 0 && (
        <div className="px-4 py-3 border-t border-[#2a2a3a] space-y-2">
          <Button onClick={onApplyFilters} className="w-full">
            Apply filters
          </Button>
          <button
            onClick={onClearFilters}
            className="w-full py-2 text-sm text-[#606070] hover:text-[#a0a0b0] transition-colors"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};
