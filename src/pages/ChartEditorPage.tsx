import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import _ from 'lodash';
import {
  ArrowLeft, Database, RefreshCw, Check, BarChart3, LineChart, PieChart,
  AreaChart, Table, Target, Hash, Circle, ChevronDown, ChevronRight, Search, 
  X, Sparkles, Activity, LayoutGrid, GitMerge, PanelLeftClose, PanelLeftOpen, Code, Copy, Maximize2, Minimize2
} from 'lucide-react';
import Editor from '@monaco-editor/react';

import { Select } from '../shared/components/ui/Input';
import { ChartRenderer } from '../components/charts/ChartRenderer';
import EChartsWrapper from '../components/charts/EChartsWrapper';
import { chartsApi, datasetsApi, type Dataset } from '../lib/api';
import { useAppStore } from '../store/appStore';
import type { ChartConfig } from '../types/chart-config';
import { generateEChartsOption } from '../lib/chartConfigGenerator';
import { interpolateData, prepareConfigForStorage, getDefaultAdvancedTemplate, isTemplateConfig } from '../lib/dataTemplateUtils';

import { parseChartConfig, stringifyChartConfig } from '../lib/chartConfigParser';

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
  { value: 'funnel', label: 'Funnel', icon: <Activity size={24} />, category: 'advanced' },
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
  
  // Custom - Full ECharts control with Advanced tab
  { value: 'custom', label: 'Custom (ECharts)', icon: <Code size={24} />, category: 'custom' },
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
  const [configTab, setConfigTab] = useState<'data' | 'customize' | 'advanced'>('data');
  const [metricsExpanded, setMetricsExpanded] = useState(true);
  const [columnsExpanded, setColumnsExpanded] = useState(true);
  const [columnSearch, setColumnSearch] = useState('');
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rawConfigText, setRawConfigText] = useState('');
  const [rawEChartsOption, setRawEChartsOption] = useState<any>(null); // For direct ECharts rendering
  const [isFullscreenEditor, setIsFullscreenEditor] = useState(false);
  
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

  // Resizing State
  const [configPanelWidth, setConfigPanelWidth] = useState(420);
  const [isResizingConfig, setIsResizingConfig] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingConfig) return;
      setConfigPanelWidth((prev) => {
        const newWidth = prev + e.movementX;
        return Math.max(200, Math.min(800, newWidth));
      });
    };

    const handleMouseUp = () => {
      setIsResizingConfig(false);
      document.body.style.cursor = 'default';
    };

    if (isResizingConfig) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingConfig]);


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
      
      // Check if this is a full ECharts option (has series)
      if (chart.config && 'series' in chart.config && chart.config.series) {
        // This is an Advanced config - set rawEChartsOption for direct rendering
        setRawEChartsOption(chart.config);
        // Also sync the raw config text
        setRawConfigText(stringifyChartConfig(chart.config));
      } else {
        // This is a Data-driven config - merge with defaults
        setConfig(prev => _.merge({}, prev, chart.config));
      }
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
    
    // Use rawEChartsOption if user applied a full config from Advanced tab
    // Otherwise use the config built from UI controls
    // Always strip embedded data - use $DATA placeholder instead
    const configToSave = rawEChartsOption 
      ? prepareConfigForStorage(rawEChartsOption)
      : config;
    
    const chartPayload = {
      name,
      description,
      chart_type: chartType,
      dataset_id: datasetId,
      config: configToSave
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

  // Helper to update config - also clears series when switching to data-driven mode
  const updateConfig = (updates: Partial<ChartConfig>) => {
    setConfig(prev => {
      const newConfig = { ...prev, ...updates };
      // If user is setting xColumn or yColumns, remove series to switch to data-driven mode
      if ('xColumn' in updates || 'yColumns' in updates) {
        delete (newConfig as any).series;
      }
      return newConfig;
    });
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

  // Generate ECharts option from current config
  const generatedOption = useMemo(() => {
    if (!previewData || previewData.length === 0) return {};
    return generateEChartsOption(chartType, previewData, config);
  }, [chartType, previewData, config]);

  // Sync rawConfigText when generatedOption changes (unless user is in advanced tab or has saved advanced config)
  // Replace embedded data with $DATA placeholder
  useEffect(() => {
    // Don't overwrite if we have a saved Advanced config (rawEChartsOption)
    // or if user is currently in advanced tab editing
    if (configTab !== 'advanced' && !rawEChartsOption) {
      // Convert to string and replace dataset.source data with $DATA
      const configStr = stringifyChartConfig(generatedOption);
      setRawConfigText(configStr);
    }
  }, [generatedOption, configTab, rawEChartsOption]);

  // When switching to Advanced tab, convert current config to use $DATA template
  useEffect(() => {
    if (configTab === 'advanced' && chartType === 'custom') {
      // If rawConfigText has embedded data, replace with $DATA
      if (rawConfigText && rawConfigText.includes('source:') && !rawConfigText.includes('$DATA')) {
        // Replace the source array with $DATA placeholder
        // Match source: [...] or source: [ ... ] patterns
        const templateConfig = rawConfigText.replace(
          /source:\s*\[[\s\S]*?\]\s*(?=,|\})/g,
          'source: $DATA'
        );
        setRawConfigText(templateConfig);
      } else if (!rawConfigText.trim()) {
        // If empty, use default template
        setRawConfigText(getDefaultAdvancedTemplate());
      }
    }
  }, [configTab, chartType]);

  // Compute the actual option to render - interpolate $DATA with preview data
  const renderableOption = useMemo(() => {
    if (!rawEChartsOption) return null;
    
    // Check if config uses $DATA template
    if (isTemplateConfig(rawEChartsOption)) {
      // If using $DATA but no data available yet, return null to prevent rendering
      if (!previewData || previewData.length === 0) {
        console.log('⏳ Waiting for previewData to interpolate $DATA...');
        return null;
      }
      try {
        return interpolateData(JSON.stringify(rawEChartsOption), previewData);
      } catch (e) {
        console.error('Failed to interpolate $DATA:', e);
        return null; // Return null instead of broken config
      }
    }
    return rawEChartsOption;
  }, [rawEChartsOption, previewData]);

  // Apply raw config changes
  const handleApplyRawConfig = () => {
    console.log('=== APPLY RAW CONFIG START ===');
    console.log('1. Raw config text (first 300 chars):', rawConfigText.substring(0, 300));
    
    try {
      console.log('2. Attempting to parse chart config (supports option = {...} format)...');
      const parsed = parseChartConfig(rawConfigText);
      console.log('3. Parsed successfully:', parsed);
      
      // Check if this is a COMPLETE ECharts option (has series - can be array or single object)
      if (parsed.series && (Array.isArray(parsed.series) || typeof parsed.series === 'object')) {
        console.log('🎯 FULL ECHARTS OPTION DETECTED - Using direct rendering mode');
        const seriesCount = Array.isArray(parsed.series) ? parsed.series.length : 1;
        console.log('   Series found:', seriesCount, 'series');
        console.log('   Will render this option directly without extraction');
        
        setRawEChartsOption(parsed);
        addToast('success', 'Full ECharts configuration applied - rendering directly');
        console.log('=== APPLY RAW CONFIG END (DIRECT MODE) ===');
        return;
      }
      
      // Otherwise, it's a PARTIAL config - extract properties
      console.log('⚙️ PARTIAL CONFIG DETECTED - Using extraction mode');
      console.log('   Extracting customization properties into config');
      
      // Clear raw option if it was set
      setRawEChartsOption(null);
      
      // Extract relevant fields back to config
      const updatedConfig: Partial<ChartConfig> = { ...config };
      console.log('4. Current config before update:', config);
      
      if (parsed.title) {
        console.log('   - Updating title:', parsed.title);
        updatedConfig.title = parsed.title;
      }
      if (parsed.legend) {
        console.log('   - Updating legend:', parsed.legend);
        updatedConfig.legend = parsed.legend;
      }
      if (parsed.xAxis) {
        console.log('   - Updating xAxis:', parsed.xAxis);
        updatedConfig.xAxis = parsed.xAxis;
      }
      if (parsed.yAxis) {
        console.log('   - Updating yAxis:', parsed.yAxis);
        updatedConfig.yAxis = parsed.yAxis;
      }
      if (parsed.grid) {
        console.log('   - Updating grid:', parsed.grid);
        updatedConfig.grid = parsed.grid;
      }
      if (parsed.tooltip) {
        console.log('   - Updating tooltip:', parsed.tooltip);
        updatedConfig.tooltip = parsed.tooltip;
      }
      if (parsed.color) {
        console.log('   - Updating colors:', parsed.color);
        updatedConfig.colors = parsed.color;
      }
      
      console.log('5. Updated config:', updatedConfig);
      console.log('6. Calling setConfig...');
      setConfig(updatedConfig as ChartConfig);
      
      console.log('7. Config state updated successfully');
      console.log('=== APPLY RAW CONFIG END (EXTRACTION MODE) ===');
      addToast('success', 'Configuration properties applied');
    } catch (error: any) {
      console.error('=== APPLY RAW CONFIG END (ERROR) ===');
      console.error('Error:', error);
      addToast('error', error.message || 'Invalid JavaScript object syntax');
    }
  };

  // Copy configuration to clipboard
  const handleCopyConfig = async () => {
    try {
      await navigator.clipboard.writeText(rawConfigText);
      addToast('success', 'Configuration copied to clipboard');
    } catch (error) {
      addToast('error', 'Failed to copy to clipboard');
    }
  };

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
            <div className="px-4 pt-4 pb-4">
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
        <aside 
          className="bg-bg-primary border-r border-border flex flex-col overflow-hidden relative"
          style={{ width: configPanelWidth }}
        >
          {/* Drag Handle */}
          <div
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-accent-primary transition-colors z-10"
            onMouseDown={(e) => {
              e.preventDefault();
              setIsResizingConfig(true);
            }}
          />
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
            {/* Advanced tab - only for Custom chart type */}
            {chartType === 'custom' && (
              <button
                onClick={() => setConfigTab('advanced')}
                className={`flex-1 py-3 text-sm font-medium transition-colors relative ${configTab === 'advanced' ? 'text-text-primary bg-bg-primary' : 'text-text-tertiary'}`}
              >
                Advanced
                {configTab === 'advanced' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary" />}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
             {configTab === 'data' ? (
                <div className="space-y-6">
                    {/* Chart Type Selection */}
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-2">Chart Type</label>
                        <Select
                            value={chartType}
                            onChange={(val: string | null) => {
                                const newType = val || 'bar';
                                setChartType(newType);
                                // Clear rawEChartsOption when switching away from custom
                                if (newType !== 'custom') {
                                    setRawEChartsOption(null);
                                }
                            }}
                            options={CHART_TYPES.map(t => ({ value: t.value, label: t.label }))}
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
                                if (draggedColumn) {
                                    // Clear rawEChartsOption when user starts using Data tab
                                    setRawEChartsOption(null);
                                    updateConfig({ xColumn: draggedColumn.name });
                                }
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
                                    // Clear rawEChartsOption when user starts using Data tab
                                    setRawEChartsOption(null);
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
             ) : configTab === 'customize' ? (
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
             ) : (
                 /* ADVANCED TAB */
                 <div className="flex flex-col h-full space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                        <Code size={16} className="text-accent-primary" />
                        Advanced Configuration
                      </h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsFullscreenEditor(true)}
                          className="p-1.5 hover:bg-bg-tertiary rounded text-text-tertiary hover:text-text-primary transition-colors"
                          title="Expand editor"
                        >
                          <Maximize2 size={16} />
                        </button>
                        <button
                          onClick={handleCopyConfig}
                          className="px-3 py-1.5 bg-bg-tertiary hover:bg-bg-secondary border border-border rounded text-xs font-medium text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5"
                          title="Copy to clipboard"
                        >
                          <Copy size={14} />
                          Copy
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col min-h-0">
                      <Editor
                        height="100%"
                        language="javascript"
                        value={rawConfigText}
                        onChange={(value) => setRawConfigText(value || '')}
                        theme="vs-dark"
                        options={{
                          minimap: { enabled: false },
                          fontSize: 12,
                          lineNumbers: 'on',
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          tabSize: 2,
                          wordWrap: 'on',
                        }}
                      />
                    </div>

                    <button
                      onClick={handleApplyRawConfig}
                      className="w-full px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <Check size={16} />
                      Apply Configuration
                    </button>

                    <div className="p-3 bg-bg-tertiary/50 border border-border/50 rounded-lg">
                      <p className="text-xs text-text-tertiary">
                        Paste ECharts examples directly using <code className="text-accent-primary">option = {'{'} ... {'}'}</code> format.
                        <a href="https://echarts.apache.org/examples/en/" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline ml-1">View examples</a>
                      </p>
                    </div>
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
                    ) : renderableOption ? (
                        /* Direct ECharts rendering mode - user provided complete option (with $DATA interpolated) */
                        <div style={{ height: '500px', width: '100%' }}>
                          <EChartsWrapper 
                            option={renderableOption}
                            style={{ height: '100%', width: '100%' }}
                            autoResize={true}
                          />
                        </div>
                    ) : (
                        /* Normal mode - use ChartRenderer with config */
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

      {/* Fullscreen Editor Modal */}
      {isFullscreenEditor && (
        <div className="fixed inset-0 z-50 bg-bg-primary flex flex-col">
          {/* Modal Header */}
          <div className="flex-shrink-0 h-14 border-b border-border bg-bg-secondary flex items-center justify-between px-4">
            <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <Code size={20} className="text-accent-primary" />
              Advanced Configuration Editor
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyConfig}
                className="px-3 py-1.5 bg-bg-tertiary hover:bg-bg-primary border border-border rounded text-xs font-medium text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5"
                title="Copy to clipboard"
              >
                <Copy size={14} />
                Copy
              </button>
              <button
                onClick={handleApplyRawConfig}
                className="px-4 py-1.5 bg-accent-primary text-white rounded hover:bg-accent-primary/90 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <Check size={16} />
                Apply
              </button>
              <button
                onClick={() => setIsFullscreenEditor(false)}
                className="p-1.5 hover:bg-bg-tertiary rounded text-text-tertiary hover:text-text-primary transition-colors"
                title="Close fullscreen"
              >
                <Minimize2 size={18} />
              </button>
            </div>
          </div>

          {/* Editor Content */}
          <div className="flex-1 overflow-hidden p-6">
            <Editor
              height="100%"
              language="javascript"
              value={rawConfigText}
              onChange={(value) => setRawConfigText(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: true },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
              }}
            />
          </div>

          {/* Footer Help */}
          <div className="flex-shrink-0 border-t border-border bg-bg-secondary px-6 py-3">
            <p className="text-xs text-text-tertiary">
              Paste ECharts examples directly using <code className="text-accent-primary">option = {'{'} ... {'}'}</code> format.
              <a href="https://echarts.apache.org/examples/en/" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline ml-1">View examples</a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
