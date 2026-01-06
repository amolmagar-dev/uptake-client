import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import _ from 'lodash';
import {
  ArrowLeft, Database, RefreshCw, Check, BarChart3, LineChart, PieChart,
  AreaChart, Table, Target, Hash, Circle, ChevronDown, ChevronRight, Search, 
  X, Sparkles, Activity, LayoutGrid, GitMerge, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';

import { Select } from '../shared/components/ui/Input';
import { ChartRenderer } from '../components/charts/ChartRenderer';
import { chartsApi, datasetsApi, type Dataset } from '../lib/api';
import { useAppStore } from '../store/appStore';
import type { ChartConfig } from '../types/chart-config';

// Customization Components
import { GeneralSettings } from '../components/charts/editor/GeneralSettings';
import { AxisSettings } from '../components/charts/editor/AxisSettings';
import { LegendSettings } from '../components/charts/editor/LegendSettings';
import { SeriesSettings } from '../components/charts/editor/SeriesSettings';
import { VisualSettings } from '../components/charts/editor/VisualSettings';

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
  // Basic
  { value: 'bar', label: 'Bar Chart', icon: <BarChart3 size={24} />, category: 'basic' },
  { value: 'line', label: 'Line Chart', icon: <LineChart size={24} />, category: 'basic' },
  { value: 'area', label: 'Area Chart', icon: <AreaChart size={24} />, category: 'basic' },
  { value: 'pie', label: 'Pie Chart', icon: <PieChart size={24} />, category: 'basic' },
  { value: 'doughnut', label: 'Doughnut', icon: <Circle size={24} />, category: 'basic' },
  { value: 'scatter', label: 'Scatter', icon: <Hash size={24} />, category: 'basic' },
  
  // Advanced
  { value: 'radar', label: 'Radar', icon: <Activity size={24} />, category: 'advanced' },
  { value: 'funnel', label: 'Funnel', icon: <Activity size={24} />, category: 'advanced' }, // Using Activity as placeholder
  { value: 'heatmap', label: 'Heatmap', icon: <LayoutGrid size={24} />, category: 'advanced' },
  { value: 'treemap', label: 'Treemap', icon: <LayoutGrid size={24} />, category: 'hierarchical' },
  { value: 'sunburst', label: 'Sunburst', icon: <Circle size={24} />, category: 'hierarchical' },
  
  // Relational
  { value: 'sankey', label: 'Sankey', icon: <GitMerge size={24} />, category: 'relational' },
  { value: 'graph', label: 'Network', icon: <GitMerge size={24} />, category: 'relational' },
  
  // KPIs
  { value: 'table', label: 'Data Table', icon: <Table size={24} />, category: 'table' },
  { value: 'kpi', label: 'KPI Card', icon: <Target size={24} />, category: 'kpi' },
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
  const [, setColumnsLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [configTab, setConfigTab] = useState<'data' | 'customize'>('data');
  const [metricsExpanded, setMetricsExpanded] = useState(true);
  const [columnsExpanded, setColumnsExpanded] = useState(true);
  const [columnSearch, setColumnSearch] = useState('');
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  
  // Drag and drop state
  const [draggedColumn, setDraggedColumn] = useState<{ name: string; isNumeric: boolean } | null>(null);
  const [dragOverMetrics, setDragOverMetrics] = useState(false);
  const [dragOverXAxis, setDragOverXAxis] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [datasetId, setDatasetId] = useState('');
  const [chartType, setChartType] = useState('bar');
  const [config, setConfig] = useState<ChartConfig>({
    title: { show: true, text: '' },
    xAxis: { show: true },
    yAxis: { show: true },
    legend: { show: true, orient: 'horizontal', top: 'bottom' },
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
    if (datasetId) {
      fetchColumns(datasetId);
    }
  }, [datasetId]);

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
      
      setName(chart.name);
      setDescription(chart.description || '');
      setChartType(chart.chart_type);
      setDatasetId(chart.dataset_id || '');
      
      // Merge config carefully
      setConfig(prev => _.merge({}, prev, chart.config));
    } catch (error: any) {
      addToast('error', error.response?.data?.error || 'Failed to load chart');
      navigate('/charts');
    } finally {
      setLoading(false);
    }
  };

  const fetchColumns = async (dsId: string) => {
    if (!dsId) return;
    setColumnsLoading(true);
    try {
      const response = await datasetsApi.getColumns(dsId);
      setColumns(response.data.columns || []);
    } catch (error) {
      console.error('Failed to fetch columns:', error);
      setColumns([]);
    } finally {
      setColumnsLoading(false);
    }
  };

  const handleUpdatePreview = useCallback(async () => {
    if (!datasetId) return;

    setPreviewLoading(true);
    try {
      if (isEditing) {
         // If editing existing chart, we might want to use that specific endpoint
         // BUT for editor, we usually want raw dataset preview to apply local config
         const response = await datasetsApi.preview(datasetId);
         setPreviewData(response.data.data);
      } else {
        const response = await datasetsApi.preview(datasetId);
        setPreviewData(response.data.data);
      }
    } catch (error: any) {
      addToast('error', error.response?.data?.error || 'Failed to load preview');
    } finally {
      setPreviewLoading(false);
    }
  }, [datasetId, isEditing, addToast]);
  
  // Auto-update preview when dataset changes
  useEffect(() => {
      if (datasetId) handleUpdatePreview();
  }, [handleUpdatePreview]);

  const handleSave = async () => {
    if (!name.trim()) {
      addToast('error', 'Chart name is required');
      return;
    }
    if (!datasetId) {
      addToast('error', 'Please select a dataset');
      return;
    }

    setSaving(true);
    const chartPayload = {
      name,
      description,
      chart_type: chartType,
      dataset_id: datasetId,
      config: config
    };

    try {
      if (isEditing) {
        await chartsApi.update(id!, chartPayload as any);
        addToast('success', 'Chart updated successfully');
      } else {
        await chartsApi.create(chartPayload as any);
        addToast('success', 'Chart created successfully');
      }
      navigate('/charts');
    } catch (error: any) {
      addToast('error', error.response?.data?.error || 'Failed to save chart');
    } finally {
      setSaving(false);
    }
  };

  // Helper to update config
  const updateConfig = (updates: Partial<ChartConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  // Derived state

  const numericColumns = columns.filter((col) =>
    ['integer', 'bigint', 'numeric', 'decimal', 'real', 'double precision', 'float', 'int', 'smallint'].some((t) =>
      col.data_type.toLowerCase().includes(t)
    )
  );
  
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
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            disabled={saving || !datasetId || !name.trim()}
            className="px-4 py-2 text-sm font-medium bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
            Save
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Data Source */}
        <aside 
            className={`bg-bg-primary border-r border-border flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
                leftPanelOpen ? 'w-64' : 'w-12'
            }`}
        >
           {/* Dataset Selector header */}
          <div className={`p-4 border-b border-border flex items-center ${leftPanelOpen ? 'justify-between' : 'justify-center px-2'}`}>
            {leftPanelOpen && (
                <div className="flex items-center gap-2 overflow-hidden">
                    <Database size={16} className="text-text-tertiary flex-shrink-0" />
                    <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide whitespace-nowrap truncate">Chart Source</span>
                </div>
            )}
            
            <button 
                onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                className={`p-1 hover:bg-bg-tertiary rounded text-text-tertiary hover:text-text-primary transition-colors ${!leftPanelOpen ? 'w-full flex justify-center' : ''}`}
                title={leftPanelOpen ? "Collapse" : "Expand"}
            >
                {leftPanelOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
            </button>
          </div>

          <div className={`flex-1 flex flex-col overflow-hidden ${!leftPanelOpen ? 'opacity-0 invisible w-0' : 'opacity-100 visible'}`}>
            {/* Dataset Selector Component */}
            <div className="px-4 pb-4">
            <Select
              value={datasetId || null}
              onChange={(val: string | null) => {
                setDatasetId(val || '');
                setConfig(prev => ({ ...prev, xColumn: '', yColumns: [] }));
                setPreviewData(null);
              }}
              options={datasets.map((d) => ({ value: d.id, label: d.name }))}
              placeholder="Select dataset..."
            />
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

           {/* Columns List */}
           <div className="flex-1 overflow-y-auto">
             {/* Metrics */}
             <div className="border-b border-border">
               <button
                 onClick={() => setMetricsExpanded(!metricsExpanded)}
                 className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-text-secondary hover:bg-bg-tertiary transition-colors"
               >
                 <div className="flex items-center gap-2">
                   <Sparkles size={14} className="text-accent-primary" />
                   <span>Metrics</span>
                 </div>
                 {metricsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
               </button>
               {metricsExpanded && (
                 <div className="pb-2 px-2 space-y-0.5">
                    {filteredNumericColumns.map(col => (
                        <div
                            key={col.column_name}
                            draggable
                            onDragStart={(e) => {
                                setDraggedColumn({ name: col.column_name, isNumeric: true });
                                e.dataTransfer.setData('text/plain', col.column_name);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-accent-primary/10 rounded-md transition-colors cursor-grab"
                        >
                            <Hash size={12} className="text-accent-primary" />
                            <span className="truncate">{col.column_name}</span>
                        </div>
                    ))}
                 </div>
               )}
             </div>
             
             {/* All Columns */}
             <div>
                <button
                 onClick={() => setColumnsExpanded(!columnsExpanded)}
                 className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-text-secondary hover:bg-bg-tertiary transition-colors"
               >
                 <div className="flex items-center gap-2">
                   <Database size={14} className="text-text-tertiary" />
                   <span>Columns</span>
                 </div>
                 {columnsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
               </button>
               {columnsExpanded && (
                 <div className="pb-2 px-2 space-y-0.5">
                    {filteredColumns.map(col => (
                        <div
                            key={col.column_name}
                            draggable
                            onDragStart={(e) => {
                                setDraggedColumn({ name: col.column_name, isNumeric: false });
                                e.dataTransfer.setData('text/plain', col.column_name);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-bg-tertiary rounded-md transition-colors cursor-grab"
                        >
                             <Database size={12} className="text-text-tertiary" />
                            <span className="truncate">{col.column_name}</span>
                        </div>
                    ))}
                 </div>
               )}
             </div>
           </div>
           </div>
        </aside>

        {/* Configuration Panel */}
        <aside className="w-80 bg-bg-primary border-r border-border flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-border bg-bg-secondary">
             <button
              onClick={() => setConfigTab('data')}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative ${configTab === 'data' ? 'text-text-primary bg-bg-primary' : 'text-text-tertiary'}`}
            >
              Data
              {configTab === 'data' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary" />}
            </button>
            <button
              onClick={() => setConfigTab('customize')}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative ${configTab === 'customize' ? 'text-text-primary bg-bg-primary' : 'text-text-tertiary'}`}
            >
              Customize
              {configTab === 'customize' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary" />}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
             {configTab === 'data' ? (
                <div className="space-y-6">
                    {/* Chart Type Selection */}
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-2">Chart Type</label>
                        <div className="grid grid-cols-4 gap-2">
                            {CHART_TYPES.filter(t => t.category === 'basic' || t.category === 'advanced').slice(0, 8).map(type => (
                                <button
                                    key={type.value}
                                    onClick={() => setChartType(type.value)}
                                    className={`p-2 rounded border flex flex-col items-center gap-1 hover:bg-bg-tertiary transition-colors ${chartType === type.value ? 'border-accent-primary bg-accent-primary/10 text-accent-primary' : 'border-transparent text-text-tertiary'}`}
                                    title={type.label}
                                >
                                    {type.icon}
                                </button>
                            ))}
                        </div>
                        <Select
                            value={chartType}
                            onChange={(val: string | null) => setChartType(val || 'bar')}
                            options={CHART_TYPES.map(t => ({ value: t.value, label: t.label }))}
                            className="mt-2"
                        />
                    </div>

                    {/* X-Axis / Category */}
                    <div>
                         <label className="block text-xs font-medium text-text-secondary mb-2">X-Axis / Category</label>
                         <div
                            onDragOver={(e) => { e.preventDefault(); setDragOverXAxis(true); }}
                            onDragLeave={() => setDragOverXAxis(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setDragOverXAxis(false);
                                if (draggedColumn) updateConfig({ xColumn: draggedColumn.name });
                            }}
                            className={`border border-dashed rounded-lg p-3 transition-colors ${dragOverXAxis ? 'border-accent-primary bg-accent-primary/10' : 'border-border'}`}
                         >
                             {config.xColumn ? (
                                 <div className="flex items-center justify-between bg-bg-tertiary px-3 py-2 rounded">
                                     <span className="text-sm">{config.xColumn}</span>
                                     <button onClick={() => updateConfig({ xColumn: '' })}><X size={14} className="text-text-tertiary hover:text-error" /></button>
                                 </div>
                             ) : (
                                 <div className="text-xs text-text-tertiary text-center py-2">Drop column here</div>
                             )}
                         </div>
                    </div>

                    {/* Metrics / Y-Axis */}
                    <div>
                         <label className="block text-xs font-medium text-text-secondary mb-2">Metrics / Values</label>
                         <div
                            onDragOver={(e) => { e.preventDefault(); setDragOverMetrics(true); }}
                            onDragLeave={() => setDragOverMetrics(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setDragOverMetrics(false);
                                if (draggedColumn) {
                                    const current = config.yColumns || [];
                                    if (!current.includes(draggedColumn.name)) {
                                        updateConfig({ yColumns: [...current, draggedColumn.name] });
                                    }
                                }
                            }}
                             className={`border border-dashed rounded-lg p-3 transition-colors ${dragOverMetrics ? 'border-accent-primary bg-accent-primary/10' : 'border-border'}`}
                         >
                             <div className="space-y-2">
                                 {(config.yColumns || []).map((col, idx) => (
                                     <div key={col} className="flex items-center justify-between bg-bg-tertiary px-3 py-2 rounded">
                                         <span className="text-sm">{col}</span>
                                         <button onClick={() => {
                                             const newCols = [...(config.yColumns || [])];
                                             newCols.splice(idx, 1);
                                             updateConfig({ yColumns: newCols });
                                         }}><X size={14} className="text-text-tertiary hover:text-error" /></button>
                                     </div>
                                 ))}
                                 <div className="text-xs text-text-tertiary text-center py-2">Drop metrics here</div>
                             </div>
                         </div>
                    </div>
                </div>
             ) : (
                 /* CUSTOMIZE TAB */
                 <div className="space-y-8 pb-10">
                    <GeneralSettings config={config} onChange={updateConfig} />
                    <div className="h-px bg-border/50" />
                    <AxisSettings config={config} onChange={updateConfig} />
                    <div className="h-px bg-border/50" />
                    <LegendSettings config={config} onChange={updateConfig} />
                    <div className="h-px bg-border/50" />
                    <VisualSettings config={config} onChange={updateConfig} />
                    <div className="h-px bg-border/50" />
                    <SeriesSettings config={config} onChange={updateConfig} />
                 </div>
             )}
          </div>
        </aside>

        {/* Preview Area */}
        <main className="flex-1 bg-bg-secondary p-6 overflow-hidden flex flex-col">
            <div className="flex-1 bg-bg-primary rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
                <div className="p-4 border-b border-border flex justify-between items-center">
                    <h2 className="text-sm font-semibold text-text-secondary">Preview</h2>
                    <button 
                        onClick={handleUpdatePreview} 
                        className="p-1.5 hover:bg-bg-tertiary rounded text-text-tertiary hover:text-text-primary"
                        title="Refresh Data"
                    >
                        <RefreshCw size={14} />
                    </button>
                </div>
                <div className="flex-1 relative p-4 bg-bg-primary/50">
                    {previewLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="spinner" />
                        </div>
                    ) : (
                        <ChartRenderer
                            type={chartType}
                            data={previewData || []}
                            config={config}
                            height={500}
                        />
                    )}
                </div>
            </div>
        </main>
      </div>
    </div>
  );
}
