import React, { useState, useEffect } from 'react';
import { Plus, Trash2, List, Calendar, Hash, AlertTriangle } from 'lucide-react';
import { Modal } from '../../shared/components/ui/Modal';
import { Button } from '../../shared/components/ui/Button';
import { Input, Select, Checkbox } from '../../shared/components/ui/Input';
import { datasetsApi, type Dataset } from '../../lib/api';
import type { DashboardFilter } from './FiltersSidebar';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: DashboardFilter[];
  onSave: (filters: DashboardFilter[]) => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  filters: initialFilters,
  onSave,
}) => {
  const [filters, setFilters] = useState<DashboardFilter[]>(initialFilters);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedFilterId, setSelectedFilterId] = useState<string | null>(null);
  const [columns, setColumns] = useState<Array<{ column_name: string; data_type: string }>>([]);
  const [triedSave, setTriedSave] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFilters(initialFilters);
      setTriedSave(false);
      fetchDatasets();
      if (initialFilters.length > 0) {
        setSelectedFilterId(initialFilters[0].id);
        if (initialFilters[0].datasetId) {
          fetchColumns(initialFilters[0].datasetId);
        }
      } else {
        setSelectedFilterId(null);
        setColumns([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const fetchDatasets = async () => {
    try {
      const response = await datasetsApi.getAll();
      const data = response.data.datasets || response.data || [];
      setDatasets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch datasets:', error);
      setDatasets([]);
    }
  };

  const fetchColumns = async (datasetId: string) => {
    try {
      const response = await datasetsApi.getColumns(datasetId);
      console.log('Columns API response:', response.data);
      
      let columnsData = response.data;
      if (columnsData?.columns) {
        columnsData = columnsData.columns;
      }
      
      if (Array.isArray(columnsData)) {
        setColumns(columnsData);
      } else {
        setColumns([]);
      }
    } catch (error) {
      console.error('Failed to fetch columns:', error);
      setColumns([]);
    }
  };

  const selectedFilter = filters.find(f => f.id === selectedFilterId);

  const handleAddFilter = () => {
    const newFilter: DashboardFilter = {
      id: `filter-${Date.now()}`,
      name: 'New Filter',
      type: 'value',
      datasetId: '',
      column: '',
      value: null,
      config: {
        multiSelect: false,
        required: false,
        hasDefault: false,
      },
    };
    setFilters(prev => [...prev, newFilter]);
    setSelectedFilterId(newFilter.id);
    setColumns([]);
  };

  const handleRemoveFilter = (filterId: string) => {
    setFilters(prev => {
      const nextFilters = prev.filter(f => f.id !== filterId);
      
      setSelectedFilterId(prevId => {
        if (prevId === filterId) {
          const nextSelected = nextFilters[0];
          if (nextSelected) {
            if (nextSelected.datasetId) {
              fetchColumns(nextSelected.datasetId);
            } else {
              setColumns([]);
            }
            return nextSelected.id;
          }
          setColumns([]);
          return null;
        }
        return prevId;
      });

      return nextFilters;
    });
  };

  const handleFilterChange = (field: keyof DashboardFilter, value: any) => {
    if (!selectedFilterId) return;
    
    setFilters(prev => prev.map(f => {
      if (f.id === selectedFilterId) {
        let updated = { ...f, [field]: value };
        
        // If dataset changed, fetch columns and reset column selection
        if (field === 'datasetId') {
          if (value) {
            fetchColumns(value);
          } else {
            setColumns([]);
          }
          updated.column = '';
        }
        
        // If type changed, reset or adjust default value and multiSelect
        if (field === 'type') {
          const newType = value;
          const prevConfig = f.config || {};
          const newConfig = { ...prevConfig };
          
          if (newType !== 'value') {
            newConfig.multiSelect = false;
          }
          
          if (newConfig.hasDefault) {
            if (newType === 'time_range') {
              newConfig.defaultValue = { start: '', end: '' };
            } else if (newType === 'numerical_range') {
              newConfig.defaultValue = { min: '', max: '' };
            } else {
              newConfig.defaultValue = '';
            }
          } else {
            newConfig.defaultValue = undefined;
          }
          
          updated = { ...updated, config: newConfig };
        }
        return updated;
      }
      return f;
    }));
  };

  const handleConfigChange = (field: string, value: any) => {
    if (!selectedFilterId) return;
    
    setFilters(prev => prev.map(f => {
      if (f.id === selectedFilterId) {
        const prevConfig = f.config || {};
        return { ...f, config: { ...prevConfig, [field]: value } };
      }
      return f;
    }));
  };

  const handleToggleDefaultValue = (isChecked: boolean) => {
    if (!selectedFilterId) return;
    
    setFilters(prev => prev.map(f => {
      if (f.id === selectedFilterId) {
        const prevConfig = f.config || {};
        const newConfig = { ...prevConfig, hasDefault: isChecked };
        if (!isChecked) {
          newConfig.defaultValue = undefined;
        } else {
          if (f.type === 'time_range') {
            newConfig.defaultValue = { start: '', end: '' };
          } else if (f.type === 'numerical_range') {
            newConfig.defaultValue = { min: '', max: '' };
          } else {
            newConfig.defaultValue = '';
          }
        }
        return { ...f, config: newConfig };
      }
      return f;
    }));
  };

  const handleSave = () => {
    if (isSaveDisabled) {
      setTriedSave(true);
      return;
    }
    onSave(filters);
    onClose();
  };

  const isIncomplete = (filter: DashboardFilter) => {
    return !filter.name?.trim() || !filter.datasetId || !filter.column;
  };

  const isSaveDisabled = filters.some(isIncomplete);
  const saveButtonLabel = `Save (${filters.length})`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add and edit filters"
      size="xl"
      bodyClassName="flex-1 min-h-0 flex flex-col overflow-hidden"
    >
      {/* master-detail row: only the panes scroll */}
      <div className="flex flex-1 min-h-0">
        {/* LEFT: filter list */}
        <aside className="w-64 shrink-0 border-r border-base-300 flex flex-col">
          <div className="p-3 shrink-0">
            <button
              type="button"
              onClick={handleAddFilter}
              className="btn btn-sm btn-outline btn-primary w-full gap-2"
            >
              <Plus size={14} />
              Add Filter
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
            {filters.map((filter) => {
              const isSelected = selectedFilterId === filter.id;
              const isInc = isIncomplete(filter);
              return (
                <div
                  key={filter.id}
                  onClick={() => {
                    setSelectedFilterId(filter.id);
                    if (filter.datasetId) {
                      fetchColumns(filter.datasetId);
                    } else {
                      setColumns([]);
                    }
                  }}
                  className={`group cursor-pointer rounded-lg p-2 space-y-2 border transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-base-300 bg-base-100 hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary shrink-0">
                        {filter.type === 'time_range' ? (
                          <Calendar size={16} />
                        ) : filter.type === 'numerical_range' ? (
                          <Hash size={16} />
                        ) : (
                          <List size={16} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-sm truncate text-base-content" title={filter.name || 'Untitled filter'}>
                          {filter.name?.trim() || 'Untitled filter'}
                        </h4>
                        <span className="text-[10px] text-base-content/50 uppercase font-bold tracking-wider block mt-0.5">
                          {filter.type === 'time_range' ? 'Date range' : filter.type === 'numerical_range' ? 'Number range' : 'Value'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 shrink-0">
                      {isInc && (
                        <span title="Incomplete filter configuration">
                          <AlertTriangle size={14} className="text-warning shrink-0" />
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFilter(filter.id);
                        }}
                        className="p-1 text-base-content/40 hover:text-error transition-all rounded hover:bg-base-200 opacity-0 group-hover:opacity-100"
                        title="Delete filter"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* RIGHT: config form OR empty state — this is the ONLY primary scroll region */}
        <div className="flex-1 min-w-0 overflow-y-auto p-5">
          {filters.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 max-w-sm mx-auto my-auto">
              <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mb-4 text-base-content/40">
                <List size={32} />
              </div>
              <h3 className="text-lg font-semibold text-base-content mb-2">No filters yet</h3>
              <p className="text-sm text-base-content/60 mb-6">
                No filters yet — add one to let viewers slice this dashboard
              </p>
              <button
                type="button"
                onClick={handleAddFilter}
                className="btn btn-primary btn-sm gap-2"
              >
                <Plus size={14} />
                Add filter
              </button>
            </div>
          ) : selectedFilter ? (
            <div className="space-y-4">
              {/* 1. Name */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-base-content/60">Filter Details</h3>
                <Input
                  label="Filter name *"
                  value={selectedFilter.name}
                  onChange={(e) => handleFilterChange('name', e.target.value)}
                  placeholder="Enter filter name"
                  error={triedSave && !selectedFilter.name?.trim() ? "Filter name is required" : undefined}
                  required
                />
              </div>

              {/* 2. Type (Segmented control) */}
              <div className="space-y-2">
                <fieldset className="fieldset w-full">
                  <legend className="fieldset-legend text-base-content font-medium">Filter Type</legend>
                  <div className="flex bg-base-200 p-1 rounded-lg gap-1 w-full">
                    <button
                      type="button"
                      onClick={() => handleFilterChange('type', 'value')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-md transition-all ${
                        selectedFilter.type === 'value'
                          ? 'bg-primary text-primary-content shadow-sm'
                          : 'text-base-content/70 hover:text-base-content hover:bg-base-300/50'
                      }`}
                    >
                      <List size={16} />
                      <span>Value</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFilterChange('type', 'time_range')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-md transition-all ${
                        selectedFilter.type === 'time_range'
                          ? 'bg-primary text-primary-content shadow-sm'
                          : 'text-base-content/70 hover:text-base-content hover:bg-base-300/50'
                      }`}
                    >
                      <Calendar size={16} />
                      <span>Date range</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFilterChange('type', 'numerical_range')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-md transition-all ${
                        selectedFilter.type === 'numerical_range'
                          ? 'bg-primary text-primary-content shadow-sm'
                          : 'text-base-content/70 hover:text-base-content hover:bg-base-300/50'
                      }`}
                    >
                      <Hash size={16} />
                      <span>Number range</span>
                    </button>
                  </div>
                </fieldset>
              </div>

              {/* 3. Dataset & 4. Column */}
              <div className="space-y-3 pt-3 border-t border-base-300">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-base-content/60">Data Mapping</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Select
                    label="Dataset *"
                    value={selectedFilter.datasetId || null}
                    onChange={(value: string | null) => handleFilterChange('datasetId', value || '')}
                    options={datasets.map((dataset) => ({
                      value: dataset.id,
                      label: dataset.name
                    }))}
                    placeholder="Select a dataset"
                    error={triedSave && !selectedFilter.datasetId ? "Dataset is required" : undefined}
                  />

                  <Select
                    label="Column *"
                    value={selectedFilter.column || null}
                    onChange={(value: string | null) => handleFilterChange('column', value || '')}
                    options={columns.map((col) => ({
                      value: col.column_name,
                      label: `${col.column_name} (${col.data_type})`
                    }))}
                    placeholder={!selectedFilter.datasetId ? "Select a dataset first" : "Select a column"}
                    isDisabled={!selectedFilter.datasetId}
                    error={triedSave && selectedFilter.datasetId && !selectedFilter.column ? "Column is required" : undefined}
                  />
                </div>
              </div>

              {/* 5. Options */}
              <div className="space-y-3 pt-3 border-t border-base-300">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-base-content/60">Options</h3>
                <div className="space-y-3">
                  {selectedFilter.type === 'value' && (
                    <Checkbox
                      label="Multiple selection"
                      description="Allow users to select multiple items"
                      checked={selectedFilter.config?.multiSelect || false}
                      onChange={(e) => handleConfigChange('multiSelect', e.target.checked)}
                    />
                  )}
                  
                  <Checkbox
                    label="Selection required"
                    description="Prevent users from clearing this filter"
                    checked={selectedFilter.config?.required || false}
                    onChange={(e) => handleConfigChange('required', e.target.checked)}
                  />

                  <Checkbox
                    label="Set a default value"
                    description="Automatically apply a default selection on load"
                    checked={selectedFilter.config?.hasDefault || false}
                    onChange={(e) => handleToggleDefaultValue(e.target.checked)}
                  />
                </div>

                {/* Render conditional inputs if default value is enabled */}
                {selectedFilter.config?.hasDefault && (
                  <div className="p-3 bg-base-200/50 rounded-lg border border-base-300 space-y-3 mt-3">
                    {selectedFilter.type === 'value' && (
                      <Input
                        label="Default Value"
                        placeholder={selectedFilter.config?.multiSelect ? "Default values (comma-separated)" : "Default value"}
                        value={selectedFilter.config?.defaultValue || ''}
                        onChange={(e) => handleConfigChange('defaultValue', e.target.value)}
                        helperText={selectedFilter.config?.multiSelect ? "Enter values separated by commas, e.g. USA, Canada, UK" : undefined}
                      />
                    )}

                    {selectedFilter.type === 'time_range' && (() => {
                      const defaultValObj = (typeof selectedFilter.config?.defaultValue === 'object' && selectedFilter.config?.defaultValue !== null)
                        ? selectedFilter.config.defaultValue
                        : { start: '', end: '' };
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input
                            type="date"
                            label="From Date"
                            value={defaultValObj.start || ''}
                            onChange={(e) => {
                              handleConfigChange('defaultValue', {
                                ...defaultValObj,
                                start: e.target.value
                              });
                            }}
                          />
                          <Input
                            type="date"
                            label="To Date"
                            value={defaultValObj.end || ''}
                            onChange={(e) => {
                              handleConfigChange('defaultValue', {
                                ...defaultValObj,
                                end: e.target.value
                              });
                            }}
                          />
                        </div>
                      );
                    })()}

                    {selectedFilter.type === 'numerical_range' && (() => {
                      const defaultValObj = (typeof selectedFilter.config?.defaultValue === 'object' && selectedFilter.config?.defaultValue !== null)
                        ? selectedFilter.config.defaultValue
                        : { min: '', max: '' };
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input
                            type="number"
                            label="Minimum Value"
                            placeholder="Min"
                            value={defaultValObj.min !== undefined ? defaultValObj.min : ''}
                            onChange={(e) => {
                              handleConfigChange('defaultValue', {
                                ...defaultValObj,
                                min: e.target.value
                              });
                            }}
                          />
                          <Input
                            type="number"
                            label="Maximum Value"
                            placeholder="Max"
                            value={defaultValObj.max !== undefined ? defaultValObj.max : ''}
                            onChange={(e) => {
                              handleConfigChange('defaultValue', {
                                ...defaultValObj,
                                max: e.target.value
                              });
                            }}
                          />
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-base-content/30 gap-3 my-auto">
              <div className="p-4 rounded-full bg-base-200">
                <Plus size={32} />
              </div>
              <p className="font-medium">Select a filter or add a new one to begin</p>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER: pinned, never scrolls */}
      <div className="shrink-0 border-t border-base-300 px-5 py-4 flex items-center justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaveDisabled}
          className="min-w-32 btn-primary"
        >
          {saveButtonLabel}
        </Button>
      </div>
    </Modal>
  );
};
