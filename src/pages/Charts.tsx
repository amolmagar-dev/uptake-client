import React, { useState, useEffect } from 'react';
import { Plus, BarChart3, Trash2, Edit, Eye, Play, Layers } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input, Select, Textarea } from '../components/ui/Input';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import { ChartRenderer } from '../components/charts/ChartRenderer';
import { chartsApi, datasetsApi, type Dataset } from '../lib/api';
import { useAppStore } from '../store/appStore';

interface Chart {
  id: string;
  name: string;
  description: string;
  chart_type: string;
  config: any;
  sql_query: string;
  connection_id: string;
  connection_name: string;
  dataset_id?: string;
  dataset_name?: string;
  dataset_type?: string;
}

export const ChartsPage: React.FC = () => {
  const { addToast } = useAppStore();
  const [charts, setCharts] = useState<Chart[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingChart, setEditingChart] = useState<Chart | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [previewChart, setPreviewChart] = useState<Chart | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchCharts = async () => {
    try {
      const response = await chartsApi.getAll();
      setCharts(response.data.charts);
    } catch (error) {
      addToast('error', 'Failed to fetch charts');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDatasets = async () => {
    try {
      const response = await datasetsApi.getAll();
      setDatasets(response.data.datasets);
    } catch (error) {
      console.error('Failed to fetch datasets');
    }
  };

  useEffect(() => {
    fetchCharts();
    fetchDatasets();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await chartsApi.delete(id);
      addToast('success', 'Chart deleted');
      fetchCharts();
    } catch (error) {
      addToast('error', 'Failed to delete chart');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handlePreview = async (chart: Chart) => {
    setPreviewChart(chart);
    setPreviewLoading(true);
    try {
      const response = await chartsApi.getData(chart.id);
      setPreviewData(response.data.data);
    } catch (error: any) {
      addToast('error', error.response?.data?.error || 'Failed to load chart data');
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const getChartIcon = (type: string) => {
    const icons: Record<string, string> = {
      bar: '📊',
      line: '📈',
      pie: '🥧',
      doughnut: '🍩',
      area: '📉',
      scatter: '⚡',
      table: '📋',
    };
    return icons[type] || '📊';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Sticky Header */}
      <div className="flex-shrink-0 sticky top-0 bg-[#0a0a0f] z-10 pb-4 -mx-6 px-6">
        <div className="flex items-center justify-between py-4">
          <div>
            <h1 className="text-2xl font-bold text-[#f0f0f5]">Charts</h1>
            <p className="text-[#a0a0b0] mt-1">Create and manage data visualizations</p>
          </div>
          <Button
            leftIcon={<Plus size={18} />}
            onClick={() => {
              setEditingChart(null);
              setShowModal(true);
            }}
          >
            Create Chart
          </Button>
        </div>
      </div>

      {charts.length === 0 ? (
        <Card className="text-center py-12">
          <BarChart3 size={48} className="mx-auto mb-4 text-[#606070]" />
          <h3 className="text-lg font-medium text-[#f0f0f5] mb-2">No charts yet</h3>
          <p className="text-[#a0a0b0] mb-4">Create your first chart to visualize your data</p>
          <Button onClick={() => setShowModal(true)} leftIcon={<Plus size={16} />}>
            Create Chart
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {charts.map((chart) => (
            <Card key={chart.id} hover className="flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getChartIcon(chart.chart_type)}</span>
                  <div>
                    <h3 className="font-semibold text-[#f0f0f5]">{chart.name}</h3>
                    <p className="text-xs text-[#606070]">{chart.chart_type}</p>
                  </div>
                </div>
              </div>
              
              {chart.description && (
                <p className="text-sm text-[#a0a0b0] mb-4 line-clamp-2">{chart.description}</p>
              )}
              
              <p className="text-xs text-[#606070] mb-4 flex items-center gap-1">
                <Layers size={12} />
                {chart.dataset_name || chart.connection_name || 'No data source'}
              </p>

              <div className="mt-auto flex gap-2 pt-4 border-t border-[#2a2a3a]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePreview(chart)}
                  leftIcon={<Eye size={14} />}
                >
                  Preview
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingChart(chart);
                    setShowModal(true);
                  }}
                  leftIcon={<Edit size={14} />}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteConfirm(chart.id)}
                  className="text-[#ff4757] hover:text-[#ff4757]"
                  leftIcon={<Trash2 size={14} />}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ChartModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingChart(null);
        }}
        chart={editingChart}
        datasets={datasets}
        onSuccess={() => {
          setShowModal(false);
          setEditingChart(null);
          fetchCharts();
        }}
      />

      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Chart"
        message="Are you sure you want to delete this chart? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />

      {/* Preview Modal */}
      <Modal
        isOpen={!!previewChart}
        onClose={() => {
          setPreviewChart(null);
          setPreviewData(null);
        }}
        title={previewChart?.name || 'Chart Preview'}
        size="xl"
      >
        {previewLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner" />
          </div>
        ) : previewData ? (
          <ChartRenderer
            type={previewChart?.chart_type as any}
            data={previewData}
            config={previewChart?.config || {}}
            height={400}
          />
        ) : (
          <p className="text-center text-[#606070] py-12">No data available</p>
        )}
      </Modal>
    </div>
  );
};

interface ChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  chart: Chart | null;
  datasets: Dataset[];
  onSuccess: () => void;
}

const ChartModal: React.FC<ChartModalProps> = ({
  isOpen,
  onClose,
  chart,
  datasets,
  onSuccess,
}) => {
  const { addToast } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [columns, setColumns] = useState<Array<{ column_name: string; data_type: string }>>([]);
  const [columnsLoading, setColumnsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    chart_type: 'bar',
    dataset_id: '',
    labelColumn: '',
    dataColumns: '',
    showLegend: true,
    showGrid: true,
  });

  useEffect(() => {
    if (chart) {
      setFormData({
        name: chart.name,
        description: chart.description || '',
        chart_type: chart.chart_type,
        dataset_id: chart.dataset_id || '',
        labelColumn: chart.config?.labelColumn || '',
        dataColumns: chart.config?.dataColumns?.join(', ') || '',
        showLegend: chart.config?.showLegend !== false,
        showGrid: chart.config?.showGrid !== false,
      });
      if (chart.dataset_id) {
        fetchColumns(chart.dataset_id);
      }
    } else {
      setFormData({
        name: '',
        description: '',
        chart_type: 'bar',
        dataset_id: datasets[0]?.id || '',
        labelColumn: '',
        dataColumns: '',
        showLegend: true,
        showGrid: true,
      });
      if (datasets[0]?.id) {
        fetchColumns(datasets[0].id);
      }
    }
  }, [chart, isOpen, datasets]);

  const fetchColumns = async (datasetId: string) => {
    if (!datasetId) return;
    setColumnsLoading(true);
    try {
      const response = await datasetsApi.getColumns(datasetId);
      setColumns(response.data.columns || []);
    } catch (error) {
      console.error('Failed to fetch columns:', error);
      setColumns([]);
    } finally {
      setColumnsLoading(false);
    }
  };

  const handleDatasetChange = (datasetId: string) => {
    setFormData(prev => ({ ...prev, dataset_id: datasetId, labelColumn: '', dataColumns: '' }));
    fetchColumns(datasetId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.dataset_id) {
      addToast('error', 'Please select a dataset');
      return;
    }

    setIsLoading(true);

    const chartData = {
      name: formData.name,
      description: formData.description,
      chart_type: formData.chart_type,
      dataset_id: formData.dataset_id,
      config: {
        labelColumn: formData.labelColumn || undefined,
        dataColumns: formData.dataColumns ? formData.dataColumns.split(',').map(s => s.trim()) : undefined,
        showLegend: formData.showLegend,
        showGrid: formData.showGrid,
      },
    };

    try {
      if (chart) {
        await chartsApi.update(chart.id, chartData as any);
        addToast('success', 'Chart updated successfully');
      } else {
        await chartsApi.create(chartData as any);
        addToast('success', 'Chart created successfully');
      }
      onSuccess();
    } catch (error: any) {
      addToast('error', error.response?.data?.error || 'Failed to save chart');
    } finally {
      setIsLoading(false);
    }
  };

  const chartTypes = [
    { value: 'bar', label: '📊 Bar Chart' },
    { value: 'line', label: '📈 Line Chart' },
    { value: 'area', label: '📉 Area Chart' },
    { value: 'pie', label: '🥧 Pie Chart' },
    { value: 'doughnut', label: '🍩 Doughnut Chart' },
    { value: 'scatter', label: '⚡ Scatter Plot' },
    { value: 'table', label: '📋 Data Table' },
  ];

  const selectedDataset = datasets.find(d => d.id === formData.dataset_id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={chart ? 'Edit Chart' : 'Create New Chart'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Chart Name"
            placeholder="Monthly Sales"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
          <Select
            label="Chart Type"
            options={chartTypes}
            value={formData.chart_type}
            onChange={(e) => setFormData(prev => ({ ...prev, chart_type: e.target.value }))}
          />
        </div>

        <Input
          label="Description (optional)"
          placeholder="A brief description of this chart"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        />

        <Select
          label="Dataset"
          value={formData.dataset_id}
          onChange={(e) => handleDatasetChange(e.target.value)}
        >
          <option value="">Select a dataset...</option>
          {datasets.map(d => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.dataset_type})
            </option>
          ))}
        </Select>

        {datasets.length === 0 && (
          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
            <p>No datasets available. Please <a href="/datasets" className="underline">create a dataset</a> first.</p>
          </div>
        )}

        {selectedDataset && (
          <div className="p-3 rounded-lg bg-[#1a1a25] border border-[#2a2a3a] text-sm">
            <p className="text-[#a0a0b0]">
              <span className="font-medium text-[#f0f0f5]">{selectedDataset.name}</span>
              {' — '}
              {selectedDataset.dataset_type === 'physical' 
                ? `${selectedDataset.table_schema}.${selectedDataset.table_name}`
                : 'Virtual dataset (SQL query)'
              }
            </p>
          </div>
        )}

        {columns.length > 0 && (
          <div className="p-4 rounded-lg bg-[#1a1a25] border border-[#2a2a3a]">
            <p className="text-sm text-[#a0a0b0] mb-3">
              {columnsLoading ? 'Loading columns...' : `Available columns: ${columns.map(c => c.column_name).join(', ')}`}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Label Column"
                value={formData.labelColumn}
                onChange={(e) => setFormData(prev => ({ ...prev, labelColumn: e.target.value }))}
              >
                <option value="">Select label column...</option>
                {columns.map(col => (
                  <option key={col.column_name} value={col.column_name}>
                    {col.column_name} ({col.data_type})
                  </option>
                ))}
              </Select>
              <Input
                label="Data Columns"
                placeholder={columns.slice(1, 3).map(c => c.column_name).join(', ')}
                value={formData.dataColumns}
                onChange={(e) => setFormData(prev => ({ ...prev, dataColumns: e.target.value }))}
                helperText="Comma-separated column names for values"
              />
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.showLegend}
              onChange={(e) => setFormData(prev => ({ ...prev, showLegend: e.target.checked }))}
              className="w-4 h-4 rounded border-[#2a2a3a] bg-[#1a1a25] text-[#00f5d4] focus:ring-[#00f5d4]"
            />
            <span className="text-sm text-[#a0a0b0]">Show Legend</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.showGrid}
              onChange={(e) => setFormData(prev => ({ ...prev, showGrid: e.target.checked }))}
              className="w-4 h-4 rounded border-[#2a2a3a] bg-[#1a1a25] text-[#00f5d4] focus:ring-[#00f5d4]"
            />
            <span className="text-sm text-[#a0a0b0]">Show Grid</span>
          </label>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} disabled={!formData.dataset_id}>
            {chart ? 'Update' : 'Create'} Chart
          </Button>
        </div>
      </form>
    </Modal>
  );
};

