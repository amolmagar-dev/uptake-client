import React, { useState, useEffect } from 'react';
import { Plus, BarChart3, Trash2, Edit, Eye, Play } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input, Select, Textarea } from '../components/ui/Input';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import { ChartRenderer } from '../components/charts/ChartRenderer';
import { chartsApi, connectionsApi, queriesApi } from '../lib/api';
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
}

export const ChartsPage: React.FC = () => {
  const { setConnections, addToast } = useAppStore();
  const [charts, setCharts] = useState<Chart[]>([]);
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

  const fetchConnections = async () => {
    try {
      const response = await connectionsApi.getAll();
      setConnections(response.data.connections);
    } catch (error) {
      console.error('Failed to fetch connections');
    }
  };

  useEffect(() => {
    fetchCharts();
    fetchConnections();
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
    <div>
      <div className="flex items-center justify-between mb-6">
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
              
              <p className="text-xs text-[#606070] mb-4">
                Connection: {chart.connection_name}
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
  onSuccess: () => void;
}

const ChartModal: React.FC<ChartModalProps> = ({
  isOpen,
  onClose,
  chart,
  onSuccess,
}) => {
  const { connections, addToast } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [testData, setTestData] = useState<any[] | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    chart_type: 'bar',
    connection_id: '',
    sql_query: '',
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
        connection_id: chart.connection_id,
        sql_query: chart.sql_query || '',
        labelColumn: chart.config?.labelColumn || '',
        dataColumns: chart.config?.dataColumns?.join(', ') || '',
        showLegend: chart.config?.showLegend !== false,
        showGrid: chart.config?.showGrid !== false,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        chart_type: 'bar',
        connection_id: connections[0]?.id || '',
        sql_query: '',
        labelColumn: '',
        dataColumns: '',
        showLegend: true,
        showGrid: true,
      });
    }
    setTestData(null);
  }, [chart, isOpen, connections]);

  const handleTestQuery = async () => {
    if (!formData.connection_id || !formData.sql_query) {
      addToast('error', 'Please select a connection and enter a query');
      return;
    }

    setTestLoading(true);
    try {
      const response = await queriesApi.execute(formData.connection_id, formData.sql_query);
      setTestData(response.data.data);
      addToast('success', `Query returned ${response.data.rowCount} rows`);
    } catch (error: any) {
      addToast('error', error.response?.data?.error || 'Query failed');
    } finally {
      setTestLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const chartData = {
      name: formData.name,
      description: formData.description,
      chart_type: formData.chart_type,
      connection_id: formData.connection_id,
      sql_query: formData.sql_query,
      config: {
        labelColumn: formData.labelColumn || undefined,
        dataColumns: formData.dataColumns ? formData.dataColumns.split(',').map(s => s.trim()) : undefined,
        showLegend: formData.showLegend,
        showGrid: formData.showGrid,
      },
    };

    try {
      if (chart) {
        await chartsApi.update(chart.id, chartData);
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

  const connectionOptions = [
    { value: '', label: 'Select a connection...' },
    ...connections.map(c => ({ value: c.id, label: c.name })),
  ];

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
          label="Database Connection"
          options={connectionOptions}
          value={formData.connection_id}
          onChange={(e) => setFormData(prev => ({ ...prev, connection_id: e.target.value }))}
        />

        <div>
          <Textarea
            label="SQL Query"
            placeholder="SELECT category, SUM(amount) as total FROM sales GROUP BY category"
            value={formData.sql_query}
            onChange={(e) => setFormData(prev => ({ ...prev, sql_query: e.target.value }))}
            rows={4}
            className="font-mono text-sm"
            required
          />
          <div className="mt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleTestQuery}
              isLoading={testLoading}
              leftIcon={<Play size={14} />}
            >
              Test Query
            </Button>
          </div>
        </div>

        {testData && testData.length > 0 && (
          <div className="p-4 rounded-lg bg-[#1a1a25] border border-[#2a2a3a]">
            <p className="text-sm text-[#a0a0b0] mb-2">
              Available columns: {Object.keys(testData[0]).join(', ')}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Label Column"
                placeholder={Object.keys(testData[0])[0]}
                value={formData.labelColumn}
                onChange={(e) => setFormData(prev => ({ ...prev, labelColumn: e.target.value }))}
                helperText="Column to use for labels (X-axis or pie slices)"
              />
              <Input
                label="Data Columns"
                placeholder={Object.keys(testData[0]).slice(1).join(', ')}
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
          <Button type="submit" isLoading={isLoading}>
            {chart ? 'Update' : 'Create'} Chart
          </Button>
        </div>
      </form>
    </Modal>
  );
};

