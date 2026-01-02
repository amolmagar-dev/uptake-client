import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
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
        <div className="w-64 border-r border-[#2a2a3a] flex flex-col">
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
                className={`flex items-center justify-between px-4 py-3 cursor-pointer border-b border-[#2a2a3a] ${
                  selectedFilterId === filter.id
                    ? 'bg-[#1a1a25] border-l-2 border-l-[#00f5d4]'
                    : 'hover:bg-[#1a1a25]'
                }`}
              >
                <span className="text-sm text-[#f0f0f5] truncate">{filter.name || 'Untitled'}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFilter(filter.id);
                  }}
                  className="p-1 text-[#606070] hover:text-[#ff4757] transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          
          <div className="p-3 border-t border-[#2a2a3a] space-y-2">
            <button
              onClick={handleAddFilter}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#00f5d4] hover:bg-[#1a1a25] rounded transition-colors"
            >
              <Plus size={16} />
              Add Filter
            </button>
          </div>
        </div>

        {/* Right Panel - Filter Settings */}
        <div className="flex-1 overflow-y-auto">
          {selectedFilter ? (
            <div className="p-4 space-y-4">
              {/* Filter Type & Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Select
                    label="Filter Type *"
                    value={selectedFilter.type}
                    onChange={(value) => handleFilterChange('type', value || 'value')}
                    options={FILTER_TYPES}
                    isClearable={false}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#a0a0b0] mb-1">Filter name *</label>
                  <Input
                    value={selectedFilter.name}
                    onChange={(e) => handleFilterChange('name', e.target.value)}
                    placeholder="Enter filter name"
                  />
                </div>
              </div>

              {/* Dataset & Column */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Select
                    label="Dataset *"
                    value={selectedFilter.datasetId || null}
                    onChange={(value) => handleFilterChange('datasetId', value || '')}
                    options={datasets.map((dataset) => ({
                      value: dataset.id,
                      label: dataset.name
                    }))}
                    placeholder="Select a dataset"
                  />
                </div>
                <div>
                  <Select
                    label="Column *"
                    value={selectedFilter.column || null}
                    onChange={(value) => handleFilterChange('column', value || '')}
                    options={columns.map((col) => ({
                      value: col.column_name,
                      label: `${col.column_name} (${col.data_type})`
                    }))}
                    placeholder="Select a column"
                    isDisabled={!selectedFilter.datasetId}
                  />
                </div>
              </div>


              {/* Filter Settings */}
              <div className="border-t border-[#2a2a3a] pt-4 mt-4">
                <h4 className="text-sm font-medium text-[#f0f0f5] mb-3">Filter Settings</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedFilter.config.hasDefault || false}
                      onChange={(e) => handleConfigChange('hasDefault', e.target.checked)}
                      className="w-4 h-4 rounded border-[#2a2a3a] bg-[#1a1a25] text-[#00f5d4] focus:ring-[#00f5d4]"
                    />
                    <span className="text-sm text-[#a0a0b0]">Filter has default value</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedFilter.config.required || false}
                      onChange={(e) => handleConfigChange('required', e.target.checked)}
                      className="w-4 h-4 rounded border-[#2a2a3a] bg-[#1a1a25] text-[#00f5d4] focus:ring-[#00f5d4]"
                    />
                    <span className="text-sm text-[#a0a0b0]">Filter value is required</span>
                  </label>
                  {selectedFilter.type === 'value' && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFilter.config.multiSelect || false}
                        onChange={(e) => handleConfigChange('multiSelect', e.target.checked)}
                        className="w-4 h-4 rounded border-[#2a2a3a] bg-[#1a1a25] text-[#00f5d4] focus:ring-[#00f5d4]"
                      />
                      <span className="text-sm text-[#a0a0b0]">Can select multiple values</span>
                    </label>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-[#606070]">
              <p>Select a filter or add a new one</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 pt-4 border-t border-[#2a2a3a] mt-4">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save
        </Button>
      </div>
    </Modal>
  );
};
