import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Database,
  RefreshCw,
  Check,
  BarChart3,
  LineChart,
  PieChart,
  AreaChart,
  Table,
  Target,
  Hash,
  Circle,
  ChevronDown,
  ChevronRight,
  Search,
  Play,
  X,
  Sparkles,
} from 'lucide-react';
import { Card } from '../shared/components/ui/Card';
import { Input, Select } from '../shared/components/ui/Input';
import { ChartRenderer } from '../components/charts/ChartRenderer';
import { chartsApi, datasetsApi, type Dataset } from '../lib/api';
import { useAppStore } from '../store/appStore';

interface ColumnInfo {
  column_name: string;
  data_type: string;
}

interface ChartTypeInfo {
  value: string;
  label: string;
  icon: React.ReactNode;
  category: string;
}

const CHART_TYPES: ChartTypeInfo[] = [
  { value: 'bar', label: 'Bar Chart', icon: <BarChart3 size={24} />, category: 'featured' },
  { value: 'line', label: 'Line Chart', icon: <LineChart size={24} />, category: 'featured' },
  { value: 'area', label: 'Area Chart', icon: <AreaChart size={24} />, category: 'trend' },
  { value: 'pie', label: 'Pie Chart', icon: <PieChart size={24} />, category: 'part-of-whole' },
  { value: 'doughnut', label: 'Doughnut', icon: <Circle size={24} />, category: 'part-of-whole' },
  { value: 'table', label: 'Data Table', icon: <Table size={24} />, category: 'table' },
  { value: 'kpi', label: 'KPI Card', icon: <Target size={24} />, category: 'kpi' },
  { value: 'scatter', label: 'Scatter', icon: <Hash size={24} />, category: 'featured' },
  { value: 'gauge', label: 'Gauge', icon: <Target size={24} />, category: 'kpi' },
];

export function ChartEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const { addToast } = useAppStore();

  // Data state
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [previewData, setPreviewData] = useState<any[] | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [columnsLoading, setColumnsLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [metricsExpanded, setMetricsExpanded] = useState(true);
  const [columnsExpanded, setColumnsExpanded] = useState(true);
  const [columnSearch, setColumnSearch] = useState('');
  const [configTab, setConfigTab] = useState<'data' | 'customize'>('data');
  
  // Drag and drop state
  const [draggedColumn, setDraggedColumn] = useState<{ name: string; isNumeric: boolean } | null>(null);
  const [dragOverMetrics, setDragOverMetrics] = useState(false);
  const [dragOverDimensions, setDragOverDimensions] = useState(false);
  const [dragOverXAxis, setDragOverXAxis] = useState(false);
  const [dimensions, setDimensions] = useState<string[]>([]);
  
  // Customize options
  const [timeGrain, setTimeGrain] = useState('day');
  const [colorScheme, setColorScheme] = useState('default');
  const [stackMode, setStackMode] = useState('none');
  const [xAxisTitle, setXAxisTitle] = useState('');
  const [yAxisTitle, setYAxisTitle] = useState('');
  const [xAxisMargin, setXAxisMargin] = useState('15');
  const [yAxisMargin, setYAxisMargin] = useState('30');

  // Form state
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

  // Fetch datasets on mount
  useEffect(() => {
    fetchDatasets();
    if (isEditing) {
      fetchChart();
    }
  }, [id]);

  // Fetch columns when dataset changes
  useEffect(() => {
    if (formData.dataset_id) {
      fetchColumns(formData.dataset_id);
    }
  }, [formData.dataset_id]);

  const fetchDatasets = async () => {
    try {
      const response = await datasetsApi.getAll();
      setDatasets(response.data.datasets);
    } catch (error) {
      console.error('Failed to fetch datasets:', error);
    }
  };

  const fetchChart = async () => {
    setLoading(true);
    try {
      const response = await chartsApi.getOne(id!);
      const chart = response.data.chart;
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
    } catch (error: any) {
      addToast('error', error.response?.data?.error || 'Failed to load chart');
      navigate('/charts');
    } finally {
      setLoading(false);
    }
  };

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

  const handleUpdateChart = useCallback(async () => {
    if (!formData.dataset_id) {
      addToast('error', 'Please select a dataset');
      return;
    }

    setPreviewLoading(true);
    try {
      if (isEditing) {
        const response = await chartsApi.getData(id!);
        setPreviewData(response.data.data);
      } else {
        const response = await datasetsApi.preview(formData.dataset_id);
        setPreviewData(response.data.data);
      }
    } catch (error: any) {
      addToast('error', error.response?.data?.error || 'Failed to load preview');
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
  }, [formData, isEditing, id, addToast]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      addToast('error', 'Chart name is required');
      return;
    }
    if (!formData.dataset_id) {
      addToast('error', 'Please select a dataset');
      return;
    }

    setSaving(true);
    const chartData = {
      name: formData.name,
      description: formData.description,
      chart_type: formData.chart_type,
      dataset_id: formData.dataset_id,
      config: {
        labelColumn: formData.labelColumn || undefined,
        dataColumns: formData.dataColumns ? formData.dataColumns.split(',').map((s) => s.trim()) : undefined,
        showLegend: formData.showLegend,
        showGrid: formData.showGrid,
      },
    };

    try {
      if (isEditing) {
        await chartsApi.update(id!, chartData as any);
        addToast('success', 'Chart updated successfully');
      } else {
        await chartsApi.create(chartData as any);
        addToast('success', 'Chart created successfully');
      }
      navigate('/charts');
    } catch (error: any) {
      addToast('error', error.response?.data?.error || 'Failed to save chart');
    } finally {
      setSaving(false);
    }
  };

  const selectedDataset = datasets.find((d) => d.id === formData.dataset_id);

  // Separate numeric and non-numeric columns
  const numericColumns = columns.filter((col) =>
    ['integer', 'bigint', 'numeric', 'decimal', 'real', 'double precision', 'float', 'int', 'smallint'].some((t) =>
      col.data_type.toLowerCase().includes(t)
    )
  );

  // Filter columns by search
  const filteredColumns = columns.filter((col) =>
    col.column_name.toLowerCase().includes(columnSearch.toLowerCase())
  );

  const filteredNumericColumns = numericColumns.filter((col) =>
    col.column_name.toLowerCase().includes(columnSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg-secondary">
        <RefreshCw className="w-8 h-8 animate-spin text-accent-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--bg-secondary)' }}>
      {/* Header Bar */}
      <header className="flex-shrink-0 h-14 border-b border-border bg-bg-primary flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/charts')}
            className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors text-text-secondary hover:text-text-primary"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="h-6 w-px bg-border" />
          <input
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Untitled chart"
            className="text-lg font-semibold bg-transparent border-none outline-none text-text-primary placeholder:text-text-tertiary w-64"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/charts')}
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !formData.dataset_id || !formData.name.trim()}
            className="px-4 py-2 text-sm font-medium bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
            Save
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Data Source */}
        <aside className="w-64 bg-bg-primary border-r border-border flex flex-col overflow-hidden">
          {/* Dataset Selector */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2 mb-3">
              <Database size={16} className="text-text-tertiary" />
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Chart Source</span>
            </div>
            <Select
              value={formData.dataset_id || null}
              onChange={(val: string | null) => {
                setFormData((prev) => ({ ...prev, dataset_id: val || '', labelColumn: '', dataColumns: '' }));
                setPreviewData(null);
              }}
              options={datasets.map((d) => ({
                value: d.id,
                label: d.name,
              }))}
              placeholder="Select dataset..."
            />
            {selectedDataset && (
              <p className="text-xs text-text-tertiary mt-2 truncate">
                {selectedDataset.dataset_type === 'physical'
                  ? `${selectedDataset.table_schema}.${selectedDataset.table_name}`
                  : 'Virtual dataset'}
              </p>
            )}
          </div>

          {/* Search */}
          <div className="px-4 py-3 border-b border-border">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                value={columnSearch}
                onChange={(e) => setColumnSearch(e.target.value)}
                placeholder="Search columns..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-accent-primary text-text-primary placeholder:text-text-tertiary"
              />
            </div>
          </div>

          {/* Scrollable Column Lists */}
          <div className="flex-1 overflow-y-auto">
            {/* Metrics Section */}
            <div className="border-b border-border">
              <button
                onClick={() => setMetricsExpanded(!metricsExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-text-secondary hover:bg-bg-tertiary transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-accent-primary" />
                  <span>Metrics</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-1.5 py-0.5 bg-bg-tertiary rounded text-text-tertiary">
                    {filteredNumericColumns.length}
                  </span>
                  {metricsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              </button>
              {metricsExpanded && (
                <div className="pb-2">
                  {columnsLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <RefreshCw size={16} className="animate-spin text-text-tertiary" />
                    </div>
                  ) : filteredNumericColumns.length > 0 ? (
                    <div className="space-y-0.5 px-2">
                      {filteredNumericColumns.map((col) => (
                        <button
                          key={col.column_name}
                          draggable
                          onDragStart={(e) => {
                            setDraggedColumn({ name: col.column_name, isNumeric: true });
                            e.dataTransfer.setData('text/plain', col.column_name);
                            e.dataTransfer.effectAllowed = 'copy';
                          }}
                          onDragEnd={() => setDraggedColumn(null)}
                          onClick={() => {
                            const current = formData.dataColumns ? formData.dataColumns.split(',').map((s) => s.trim()) : [];
                            if (!current.includes(col.column_name)) {
                              setFormData((prev) => ({
                                ...prev,
                                dataColumns: [...current, col.column_name].join(', '),
                              }));
                            }
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-accent-primary/10 rounded-md transition-colors group cursor-grab active:cursor-grabbing"
                        >
                          <Hash size={12} className="text-accent-primary flex-shrink-0" />
                          <span className="truncate flex-1 text-left">{col.column_name}</span>
                          <span className="text-[10px] text-text-tertiary uppercase opacity-0 group-hover:opacity-100">
                            {col.data_type.split(' ')[0]}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="px-4 py-3 text-xs text-text-tertiary">No numeric columns</p>
                  )}
                </div>
              )}
            </div>

            {/* Columns Section */}
            <div>
              <button
                onClick={() => setColumnsExpanded(!columnsExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-text-secondary hover:bg-bg-tertiary transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Database size={14} className="text-text-tertiary" />
                  <span>Columns</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-1.5 py-0.5 bg-bg-tertiary rounded text-text-tertiary">
                    {filteredColumns.length}
                  </span>
                  {columnsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              </button>
              {columnsExpanded && (
                <div className="pb-2">
                  {columnsLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <RefreshCw size={16} className="animate-spin text-text-tertiary" />
                    </div>
                  ) : filteredColumns.length > 0 ? (
                    <div className="space-y-0.5 px-2">
                      {filteredColumns.map((col) => {
                        const isNumeric = ['integer', 'bigint', 'numeric', 'decimal', 'real', 'double precision', 'float', 'int', 'smallint'].some((t) =>
                          col.data_type.toLowerCase().includes(t)
                        );
                        return (
                          <button
                            key={col.column_name}
                            draggable
                            onDragStart={(e) => {
                              setDraggedColumn({ name: col.column_name, isNumeric });
                              e.dataTransfer.setData('text/plain', col.column_name);
                              e.dataTransfer.effectAllowed = 'copy';
                            }}
                            onDragEnd={() => setDraggedColumn(null)}
                            onClick={() => setFormData((prev) => ({ ...prev, labelColumn: col.column_name }))}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors group cursor-grab active:cursor-grabbing ${
                              formData.labelColumn === col.column_name
                                ? 'bg-accent-primary/15 text-accent-primary'
                                : 'text-text-primary hover:bg-bg-tertiary'
                            }`}
                          >
                            <Database size={12} className="flex-shrink-0 text-text-tertiary" />
                            <span className="truncate flex-1 text-left">{col.column_name}</span>
                            <span className="text-[10px] text-text-tertiary uppercase">
                              {col.data_type.split(' ')[0]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="px-4 py-3 text-xs text-text-tertiary">
                      {formData.dataset_id ? 'No columns found' : 'Select a dataset'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Middle Panel - Configuration with Tabs */}
        <aside className="w-80 bg-bg-primary border-r border-border flex flex-col overflow-hidden">
          {/* Tab Headers */}
          <div className="flex border-b border-border bg-bg-secondary">
            <button
              onClick={() => setConfigTab('data')}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                configTab === 'data' ? 'text-text-primary bg-bg-primary' : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              Data
              {configTab === 'data' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary" />}
            </button>
            <button
              onClick={() => setConfigTab('customize')}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                configTab === 'customize' ? 'text-text-primary bg-bg-primary' : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              Customize
              {configTab === 'customize' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary" />}
            </button>
          </div>

          {/* Chart Type Icons Row */}
          <div className="p-3 border-b border-border flex items-center gap-1">
            {CHART_TYPES.slice(0, 5).map((chart) => (
              <button
                key={chart.value}
                onClick={() => setFormData((prev) => ({ ...prev, chart_type: chart.value }))}
                className={`p-2 rounded-lg border transition-all ${
                  formData.chart_type === chart.value
                    ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                    : 'border-transparent hover:bg-bg-tertiary text-text-tertiary hover:text-text-primary'
                }`}
                title={chart.label}
              >
                {chart.icon}
              </button>
            ))}
            <div className="flex-1" />
            <a href="#" className="text-xs text-accent-primary hover:underline">View all charts</a>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {configTab === 'data' ? (
              /* DATA TAB */
              <div className="p-4 space-y-5">
                {/* Query Section */}
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-text-primary">Query</h3>
                  <ChevronDown size={16} className="text-text-tertiary" />
                </div>

                {/* X-axis */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-2">X-axis</label>
                  <div className="space-y-2">
                    {formData.labelColumn && (
                      <div className="flex items-center justify-between px-3 py-2 bg-bg-tertiary rounded-lg border border-border group">
                        <div className="flex items-center gap-2">
                          <Database size={12} className="text-text-tertiary" />
                          <span className="text-sm text-text-primary">{formData.labelColumn}</span>
                        </div>
                        <button
                          onClick={() => setFormData((prev) => ({ ...prev, labelColumn: '' }))}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-error/10 text-text-tertiary hover:text-error transition-all"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                    {!formData.labelColumn && (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'copy';
                          setDragOverXAxis(true);
                        }}
                        onDragLeave={() => setDragOverXAxis(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOverXAxis(false);
                          if (draggedColumn) {
                            setFormData((prev) => ({
                              ...prev,
                              labelColumn: draggedColumn.name,
                            }));
                          }
                        }}
                        className={`w-full text-left px-3 py-2 text-xs border border-dashed rounded-lg transition-colors cursor-pointer ${
                          dragOverXAxis
                            ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                            : 'border-border text-text-tertiary hover:border-accent-primary hover:text-accent-primary'
                        }`}
                      >
                        + Drop column here or click
                      </div>
                    )}
                  </div>
                </div>

                {/* Time Grain */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-2">Time Grain</label>
                  <Select
                    value={timeGrain}
                    onChange={(val: string | null) => setTimeGrain(val || 'day')}
                    options={[
                      { value: 'minute', label: 'Minute' },
                      { value: 'hour', label: 'Hour' },
                      { value: 'day', label: 'Day' },
                      { value: 'week', label: 'Week' },
                      { value: 'month', label: 'Month' },
                      { value: 'year', label: 'Year' },
                    ]}
                    isClearable={false}
                  />
                </div>

                {/* Metrics */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-2">Metrics</label>
                  <div className="space-y-2">
                    {formData.dataColumns && formData.dataColumns.split(',').filter(Boolean).map((col, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2 bg-bg-tertiary rounded-lg border border-border group">
                        <div className="flex items-center gap-2">
                          <Hash size={12} className="text-accent-primary" />
                          <span className="text-sm text-text-primary">{col.trim()}</span>
                        </div>
                        <button
                          onClick={() => {
                            const cols = formData.dataColumns.split(',').map((s) => s.trim()).filter(Boolean);
                            cols.splice(i, 1);
                            setFormData((prev) => ({ ...prev, dataColumns: cols.join(', ') }));
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-error/10 text-text-tertiary hover:text-error transition-all"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'copy';
                        setDragOverMetrics(true);
                      }}
                      onDragLeave={() => setDragOverMetrics(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOverMetrics(false);
                        if (draggedColumn) {
                          const current = formData.dataColumns ? formData.dataColumns.split(',').map((s) => s.trim()).filter(Boolean) : [];
                          if (!current.includes(draggedColumn.name)) {
                            setFormData((prev) => ({
                              ...prev,
                              dataColumns: [...current, draggedColumn.name].join(', '),
                            }));
                          }
                        }
                      }}
                      className={`w-full text-left px-3 py-2 text-xs border border-dashed rounded-lg transition-colors cursor-pointer ${
                        dragOverMetrics
                          ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                          : 'border-border text-text-tertiary hover:border-accent-primary hover:text-accent-primary'
                      }`}
                    >
                      + Drop columns/metrics here or click
                    </div>
                  </div>
                </div>

                {/* Dimensions */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-2">Dimensions</label>
                  <div className="space-y-2">
                    {dimensions.map((dim, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2 bg-bg-tertiary rounded-lg border border-border group">
                        <div className="flex items-center gap-2">
                          <Database size={12} className="text-text-tertiary" />
                          <span className="text-sm text-text-primary">{dim}</span>
                        </div>
                        <button
                          onClick={() => {
                            setDimensions((prev) => prev.filter((_, idx) => idx !== i));
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-error/10 text-text-tertiary hover:text-error transition-all"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'copy';
                        setDragOverDimensions(true);
                      }}
                      onDragLeave={() => setDragOverDimensions(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOverDimensions(false);
                        if (draggedColumn && !dimensions.includes(draggedColumn.name)) {
                          setDimensions((prev) => [...prev, draggedColumn.name]);
                        }
                      }}
                      className={`w-full text-left px-3 py-2 text-xs border border-dashed rounded-lg transition-colors cursor-pointer ${
                        dragOverDimensions
                          ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                          : 'border-border text-text-tertiary hover:border-accent-primary hover:text-accent-primary'
                      }`}
                    >
                      + Drop columns here or click
                    </div>
                  </div>
                </div>

                {/* Contribution Mode */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-2">Contribution Mode</label>
                  <Select
                    value={stackMode}
                    onChange={(val: string | null) => setStackMode(val || 'none')}
                    options={[
                      { value: 'none', label: 'None' },
                      { value: 'row', label: 'Row' },
                      { value: 'column', label: 'Column' },
                    ]}
                    isClearable={false}
                  />
                </div>
              </div>
            ) : (
              /* CUSTOMIZE TAB */
              <div className="p-4 space-y-6">
                {/* Chart Title Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-text-primary">Chart Title</h3>
                    <ChevronDown size={16} className="text-text-tertiary" />
                  </div>
                  
                  {/* X Axis */}
                  <div className="space-y-3 mb-4">
                    <div>
                      <label className="block text-xs text-text-tertiary mb-1">X Axis Title</label>
                      <Input
                        value={xAxisTitle}
                        onChange={(e) => setXAxisTitle(e.target.value)}
                        placeholder="Enter title..."
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-tertiary mb-1">X Axis Title Margin</label>
                      <Input
                        value={xAxisMargin}
                        onChange={(e) => setXAxisMargin(e.target.value)}
                        placeholder="15"
                        className="text-sm"
                      />
                    </div>
                  </div>

                  {/* Y Axis */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-text-tertiary mb-1">Y Axis Title</label>
                      <Input
                        value={yAxisTitle}
                        onChange={(e) => setYAxisTitle(e.target.value)}
                        placeholder="Enter title..."
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-tertiary mb-1">Y Axis Title Margin</label>
                      <Input
                        value={yAxisMargin}
                        onChange={(e) => setYAxisMargin(e.target.value)}
                        placeholder="30"
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Chart Options Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-text-primary">Chart Options</h3>
                    <ChevronDown size={16} className="text-text-tertiary" />
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-text-secondary">Show Legend</span>
                      <input
                        type="checkbox"
                        checked={formData.showLegend}
                        onChange={(e) => setFormData((prev) => ({ ...prev, showLegend: e.target.checked }))}
                        className="w-4 h-4 rounded border-border text-accent-primary focus:ring-accent-primary"
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-text-secondary">Show Grid</span>
                      <input
                        type="checkbox"
                        checked={formData.showGrid}
                        onChange={(e) => setFormData((prev) => ({ ...prev, showGrid: e.target.checked }))}
                        className="w-4 h-4 rounded border-border text-accent-primary focus:ring-accent-primary"
                      />
                    </label>
                  </div>

                  {/* Color Scheme */}
                  <div className="mt-4">
                    <label className="block text-xs text-text-tertiary mb-1">Color Scheme</label>
                    <Select
                      value={colorScheme}
                      onChange={(val: string | null) => setColorScheme(val || 'default')}
                      options={[
                        { value: 'default', label: 'Superset Colors' },
                        { value: 'blues', label: 'Blues' },
                        { value: 'greens', label: 'Greens' },
                        { value: 'warm', label: 'Warm' },
                        { value: 'cool', label: 'Cool' },
                      ]}
                      isClearable={false}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Update Button */}
          <div className="p-4 border-t border-border">
            <button
              onClick={handleUpdateChart}
              disabled={!formData.dataset_id || previewLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {previewLoading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Play size={16} />
                  Update chart
                </>
              )}
            </button>
          </div>
        </aside>

        {/* Right Panel - Preview */}
        <main className="flex-1 flex flex-col overflow-hidden bg-bg-secondary">
          {/* Preview Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-bg-primary border-b border-border">
            <div className="flex items-center gap-3">
              {previewData && (
                <span className="text-sm text-text-secondary">
                  <span className="font-medium text-text-primary">{previewData.length}</span> rows
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 bg-bg-tertiary rounded-lg p-1">
              <button className="px-3 py-1 text-xs font-medium text-text-primary bg-bg-primary rounded shadow-sm">
                Results
              </button>
              <button className="px-3 py-1 text-xs font-medium text-text-tertiary hover:text-text-primary rounded">
                Samples
              </button>
            </div>
          </div>

          {/* Chart Preview */}
          <div className="flex-1 p-6 overflow-auto">
            {previewLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-accent-primary mx-auto mb-3" />
                  <p className="text-text-tertiary text-sm">Loading preview...</p>
                </div>
              </div>
            ) : previewData ? (
              <Card className="h-full p-6 bg-bg-primary">
                <ChartRenderer
                  type={formData.chart_type as any}
                  data={previewData}
                  config={{
                    labelColumn: formData.labelColumn,
                    dataColumns: formData.dataColumns ? formData.dataColumns.split(',').map((s) => s.trim()) : undefined,
                    showLegend: formData.showLegend,
                    showGrid: formData.showGrid,
                  }}
                  height={500}
                />
              </Card>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-sm">
                  <div className="w-20 h-20 rounded-2xl bg-bg-primary flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <BarChart3 className="w-10 h-10 text-text-tertiary" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">No chart preview</h3>
                  <p className="text-text-tertiary text-sm leading-relaxed">
                    Select a dataset and configure your chart settings, then click
                    <span className="font-medium text-accent-primary"> Update chart </span>
                    to see the preview.
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default ChartEditorPage;
