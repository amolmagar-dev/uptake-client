import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
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

const FILTER_TYPES = [
  { value: 'value', label: 'Value' },
  { value: 'time_range', label: 'Time Range' },
  { value: 'numerical_range', label: 'Numerical Range' },
];

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

  useEffect(() => {
    if (isOpen) {
      setFilters(initialFilters);
      fetchDatasets();
    }
  }, [isOpen, initialFilters]);

  const fetchDatasets = async () => {
    try {
      const response = await datasetsApi.getAll();
      // API returns { datasets: [...] } or just an array
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
      
      // Handle various response structures
      let columnsData = response.data;
      
      // If response has a columns property, use it
      if (columnsData?.columns) {
        columnsData = columnsData.columns;
      }
      
      // If it's an array, use it directly
      if (Array.isArray(columnsData)) {
        setColumns(columnsData);
      } else if (columnsData && typeof columnsData === 'object') {
        // If it's an object with column data, try to extract columns
        setColumns([]);
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
    setFilters([...filters, newFilter]);
    setSelectedFilterId(newFilter.id);
  };

  const handleRemoveFilter = (filterId: string) => {
    setFilters(filters.filter(f => f.id !== filterId));
    if (selectedFilterId === filterId) {
      setSelectedFilterId(filters.length > 1 ? filters[0].id : null);
    }
  };

  const handleFilterChange = (field: keyof DashboardFilter, value: any) => {
    if (!selectedFilterId) return;
    
    setFilters(filters.map(f => {
      if (f.id === selectedFilterId) {
        const updated = { ...f, [field]: value };
        // If dataset changed, fetch columns
        if (field === 'datasetId' && value) {
          fetchColumns(value);
        }
        return updated;
      }
      return f;
    }));
  };

  const handleConfigChange = (field: string, value: any) => {
    if (!selectedFilterId) return;
    
    setFilters(filters.map(f => {
      if (f.id === selectedFilterId) {
        return { ...f, config: { ...f.config, [field]: value } };
      }
      return f;
    }));
  };

  const handleSave = () => {
    onSave(filters);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add and edit filters" size="xl">
      <div className="flex h-[550px]">

        {/* Left Panel - Filter List */}
        <div className="w-64 border-r border-base-300 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            {filters.map((filter) => (
              <div
                key={filter.id}
                onClick={() => {
                  setSelectedFilterId(filter.id);
                  if (filter.datasetId) {
                    fetchColumns(filter.datasetId);
                  }
                }}
                className={`flex items-center justify-between px-4 py-3 cursor-pointer border-b border-base-300 ${
                  selectedFilterId === filter.id
                    ? 'bg-base-200 border-l-2 border-l-primary'
                    : 'hover:bg-base-200/50 transition-colors'
                }`}
              >
                <span className={`text-sm truncate ${selectedFilterId === filter.id ? 'font-semibold text-primary' : 'text-base-content'}`}>
                  {filter.name || 'Untitled'}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFilter(filter.id);
                  }}
                  className="p-1 text-base-content/40 hover:text-error transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          
          <div className="p-3 border-t border-base-300">
            <button
              onClick={handleAddFilter}
              className="flex items-center justify-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-all border border-dashed border-primary/30 hover:border-primary"
            >
              <Plus size={16} />
              Add Filter
            </button>
          </div>
        </div>

        {/* Right Panel - Filter Settings */}
        <div className="flex-1 overflow-y-auto bg-base-100/30">
          {selectedFilter ? (
            <div className="p-6 space-y-6">
              {/* Filter Type & Name */}
              <div className="grid grid-cols-2 gap-6">
                <Select
                  label="Filter Type *"
                  value={selectedFilter.type}
                  onChange={(value: string | null) => handleFilterChange('type', value || 'value')}
                  options={FILTER_TYPES}
                  isClearable={false}
                />
                <Input
                  label="Filter name *"
                  value={selectedFilter.name}
                  onChange={(e) => handleFilterChange('name', e.target.value)}
                  placeholder="Enter filter name"
                  required
                />
              </div>

              {/* Dataset & Column */}
              <div className="grid grid-cols-2 gap-6">
                <Select
                  label="Dataset *"
                  value={selectedFilter.datasetId || null}
                  onChange={(value: string | null) => handleFilterChange('datasetId', value || '')}
                  options={datasets.map((dataset) => ({
                    value: dataset.id,
                    label: dataset.name
                  }))}
                  placeholder="Select a dataset"
                />
                <Select
                  label="Column *"
                  value={selectedFilter.column || null}
                  onChange={(value: string | null) => handleFilterChange('column', value || '')}
                  options={columns.map((col) => ({
                    value: col.column_name,
                    label: `${col.column_name} (${col.data_type})`
                  }))}
                  placeholder="Select a column"
                  isDisabled={!selectedFilter.datasetId}
                />
              </div>


              {/* Filter Settings */}
              <div className="pt-4 border-t border-base-300">
                <h4 className="text-sm font-bold text-base-content mb-4 uppercase tracking-wider opacity-60">Filter Configuration</h4>
                <div className="grid grid-cols-1 gap-4">
                  <Checkbox
                    label="Has default value"
                    description="Automatically apply a default selection on load"
                    checked={selectedFilter.config.hasDefault || false}
                    onChange={(e) => handleConfigChange('hasDefault', e.target.checked)}
                  />
                  <Checkbox
                    label="Selection required"
                    description="Prevent users from clearing this filter"
                    checked={selectedFilter.config.required || false}
                    onChange={(e) => handleConfigChange('required', e.target.checked)}
                  />
                  {selectedFilter.type === 'value' && (
                    <Checkbox
                      label="Multiple selection"
                      description="Allow users to select multiple items"
                      checked={selectedFilter.config.multiSelect || false}
                      onChange={(e) => handleConfigChange('multiSelect', e.target.checked)}
                    />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-base-content/30 gap-3">
              <div className="p-4 rounded-full bg-base-200">
                <Plus size={32} />
              </div>
              <p className="font-medium">Select a filter or add a new one to begin</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 pt-6 border-t border-base-300 mt-0">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} className="min-w-32">
          Save Changes
        </Button>
      </div>
    </Modal>
  );
};
