import React, { useState, useEffect } from 'react';
import { Filter, Settings, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../shared/components/ui/Button';
import { Select, MultiSelect } from '../../shared/components/ui/Input';
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
  onApplyFilters: (draftValues: Record<string, any>) => void;
  onClearFilters: () => void;
  filterValues: Record<string, any>;
  onFilterValueChange?: (filterId: string, value: any) => void;
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
}) => {
  // Local draft state for filters so changes only apply on explicit "Apply filters" button click
  const [draftValues, setDraftValues] = useState<Record<string, any>>(filterValues);

  useEffect(() => {
    setDraftValues(filterValues);
  }, [filterValues]);

  const handleDraftValueChange = (filterId: string, value: any) => {
    setDraftValues((prev) => ({ ...prev, [filterId]: value }));
  };
  // Store unique values for each filter's column
  const [filterOptions, setFilterOptions] = useState<Record<string, string[]>>({});

  // Fetch unique values for value-type filters in parallel with cleanup
  useEffect(() => {
    let isMounted = true;
    const fetchFilterOptions = async () => {
      const valueFilters = filters.filter(
        (f) => f.type === 'value' && f.datasetId && f.column && !filterOptions[f.id]
      );
      if (valueFilters.length === 0) return;

      try {
        const results = await Promise.all(
          valueFilters.map(async (filter) => {
            try {
              const response = await datasetsApi.preview(filter.datasetId);
              const previewData = response.data?.preview || response.data?.data || response.data || [];
              if (Array.isArray(previewData) && previewData.length > 0) {
                const uniqueValues = [
                  ...new Set(
                    previewData
                      .map((row: any) => row[filter.column])
                      .filter((v) => v !== null && v !== undefined)
                  ),
                ];
                return { id: filter.id, options: uniqueValues.map((v) => String(v)) };
              }
            } catch (error) {
              console.error('Failed to fetch filter options:', error);
            }
            return null;
          })
        );

        if (isMounted) {
          setFilterOptions((prev) => {
            const updated = { ...prev };
            results.forEach((res) => {
              if (res) updated[res.id] = res.options;
            });
            return updated;
          });
        }
      } catch (err) {
        console.error('Error fetching filter options', err);
      }
    };

    if (filters.length > 0) {
      fetchFilterOptions();
    }

    return () => {
      isMounted = false;
    };
  }, [filters, filterOptions]);

  // Memoize select options per filter to prevent re-creating options array on every render
  const formattedSelectOptions = React.useMemo(() => {
    const map: Record<string, Array<{ value: string; label: string }>> = {};
    Object.entries(filterOptions).forEach(([id, options]) => {
      map[id] = options.map((option) => ({ value: option, label: option }));
    });
    return map;
  }, [filterOptions]);

  return (
    <aside
      className={`shrink-0 h-full flex flex-col overflow-hidden bg-base-100 border-r border-base-300 transition-[width] duration-300 ease-in-out ${
        isOpen ? "w-72" : "w-10"
      }`}
    >
      {!isOpen ? (
        // Collapsed state
        <div className="w-10 h-full flex flex-col items-center py-4 overflow-hidden">
          <button
            onClick={onToggle}
            className="p-2 rounded-lg text-base-content/50 hover:text-primary hover:bg-base-300 transition-colors duration-150"
            title="Open Filters"
          >
            <ChevronRight size={20} className="transition-transform duration-200" />
          </button>
          <div className="mt-4">
            <Filter size={18} className="text-base-content/50" />
          </div>
          {filters.length > 0 && (
            <span className="mt-2 text-xs text-primary font-medium">{filters.length}</span>
          )}
        </div>
      ) : (
        // Expanded state
        <div className="w-72 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-base-300 shrink-0">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-primary" />
          <span className="text-sm font-medium text-base-content">Filters</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onAddFilter}
            className="w-8 h-8 flex items-center justify-center rounded-md text-base-content/50 hover:text-primary hover:bg-base-300 transition-colors"
            title="Add Filter"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={onToggle}
            className="w-8 h-8 flex items-center justify-center rounded-md text-base-content/50 hover:text-base-content hover:bg-base-300 transition-colors"
            title="Collapse Filters"
          >
            <ChevronLeft size={20} />
          </button>
        </div>
      </div>

      {/* Add Filter Link */}
      <div className="p-4 border-b border-base-300 bg-base-100">
        <button
          onClick={onAddFilter}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-base-300 p-3 bg-base-100 text-sm font-medium text-primary hover:border-primary hover:bg-base-200/20 transition-all cursor-pointer"
        >
          <Plus size={16} />
          Add or edit filters
        </button>
      </div>

      {/* Filters List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3">
        {filters.length === 0 ? (
          <div className="py-8 text-center">
            <Filter size={32} className="mx-auto mb-3 text-base-content/40" />
            <p className="text-sm text-base-content/50">No global filters are currently added</p>
            <p className="text-xs text-base-content/45 mt-2">
              Click on "Add or edit filters" to create new dashboard filters
            </p>
          </div>
        ) : (
          filters.map((filter) => (
            <div
              key={filter.id}
              className="bg-base-200 rounded-lg border border-base-300 p-3 shadow-sm min-w-0"
            >
              <div className="flex items-center justify-between mb-2.5 min-w-0 gap-2">
                <span className="text-sm font-semibold text-base-content truncate min-w-0 flex-1">{filter.name}</span>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => onEditFilter(filter)}
                    className="w-7 h-7 flex items-center justify-center rounded text-base-content/50 hover:text-primary hover:bg-base-200 transition-colors"
                    title="Edit Filter"
                  >
                    <Settings size={14} />
                  </button>
                  <button
                    onClick={() => onRemoveFilter(filter.id)}
                    className="w-7 h-7 flex items-center justify-center rounded text-base-content/50 hover:text-error hover:bg-base-200 transition-colors"
                    title="Remove Filter"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
                
              {/* Filter Input based on type */}
              {filter.type === 'value' && (
                <div className="min-w-0 w-full">
                  {filter.config?.multiSelect ? (
                    <MultiSelect
                      value={
                        Array.isArray(draftValues[filter.id])
                          ? draftValues[filter.id]
                          : draftValues[filter.id]
                          ? [draftValues[filter.id]]
                          : []
                      }
                      onChange={(values: string[]) => handleDraftValueChange(filter.id, values)}
                      options={formattedSelectOptions[filter.id] || []}
                      placeholder={`Select ${filter.column}...`}
                      isClearable
                      isSearchable
                    />
                  ) : (
                    <Select
                      value={draftValues[filter.id] || ''}
                      onChange={(value: string | null) => handleDraftValueChange(filter.id, value || '')}
                      options={formattedSelectOptions[filter.id] || []}
                      placeholder={`Select ${filter.column}...`}
                      isClearable
                      isSearchable
                    />
                  )}
                </div>
              )}
                
              {filter.type === 'time_range' && (
                <div className="space-y-2 min-w-0 w-full">
                  <input
                    type="date"
                    value={draftValues[filter.id]?.start || ''}
                    onChange={(e) => handleDraftValueChange(filter.id, { ...draftValues[filter.id], start: e.target.value })}
                    className="w-full px-3 py-2 bg-base-100 border border-base-300 rounded text-sm text-base-content focus:outline-none focus:border-primary transition-colors"
                  />
                  <input
                    type="date"
                    value={draftValues[filter.id]?.end || ''}
                    onChange={(e) => handleDraftValueChange(filter.id, { ...draftValues[filter.id], end: e.target.value })}
                    className="w-full px-3 py-2 bg-base-100 border border-base-300 rounded text-sm text-base-content focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              )}
                
              {filter.type === 'numerical_range' && (
                <div className="flex gap-2 min-w-0 w-full">
                  <input
                    type="number"
                    placeholder="Min"
                    value={draftValues[filter.id]?.min || ''}
                    onChange={(e) => handleDraftValueChange(filter.id, { ...draftValues[filter.id], min: e.target.value })}
                    className="flex-1 px-3 py-2 bg-base-100 border border-base-300 rounded text-sm text-base-content focus:outline-none focus:border-primary transition-colors"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={draftValues[filter.id]?.max || ''}
                    onChange={(e) => handleDraftValueChange(filter.id, { ...draftValues[filter.id], max: e.target.value })}
                    className="flex-1 px-3 py-2 bg-base-100 border border-base-300 rounded text-sm text-base-content focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer Actions */}
      {filters.length > 0 && (
        <div className="border-t border-base-300 p-4 shrink-0 space-y-2 bg-base-100">
          <Button onClick={() => onApplyFilters(draftValues)} className="w-full">
            Apply filters
          </Button>
          <button
            onClick={() => {
              setDraftValues({});
              onClearFilters();
            }}
            className="w-full py-2 text-sm text-base-content/50 hover:text-base-content/70 transition-colors"
          >
            Clear all
          </button>
        </div>
      )}
        </div>
      )}
    </aside>
  );
};
