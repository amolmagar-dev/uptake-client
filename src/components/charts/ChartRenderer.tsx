import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { DataTable } from '../../shared/components/ui/Table';
import EChartsWrapper from './EChartsWrapper';
import type { EChartsOption } from 'echarts';
import type { ChartConfig } from '../../types/chart-config';

// Re-export interface for backward compatibility
export type { ChartConfig };

interface ChartRendererProps {
  type: string;
  data: Record<string, any>[];
  config: ChartConfig;
  height?: number;
}

const defaultColors = [
  '#00f5d4', '#7b2cbf', '#ff6b6b', '#ffd93d', '#4cc9f0',
  '#f72585', '#4895ef', '#80ed99', '#e63946', '#a8dadc',
];

// Format number with abbreviations (K, M, B)
const formatNumber = (num: number, decimals = 1): string => {
  if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(decimals) + 'B';
  if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(decimals) + 'M';
  if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(decimals) + 'K';
  return num.toLocaleString(undefined, { maximumFractionDigits: decimals });
};

// KPI Card Component (Preserved as React Component for best styling)
const KPICard: React.FC<{ data: Record<string, any>[]; config: ChartConfig; height: number }> = ({
  data,
  config,
  height,
}) => {
  const value = useMemo(() => {
    if (!data || data.length === 0) return 0;
    const col = config.valueColumn || config.yColumns?.[0] || Object.keys(data[0]).find(k => typeof data[0][k] === 'number');
    if (!col) return 0;
    if (data.length === 1) return parseFloat(data[0][col]) || 0;
    return data.reduce((sum, row) => sum + (parseFloat(row[col]) || 0), 0);
  }, [data, config]);

  const trend = useMemo(() => {
    if (config.previousValue === undefined) return null;
    const diff = value - config.previousValue;
    const pct = config.previousValue !== 0 ? (diff / config.previousValue) * 100 : 0;
    return {
      value: diff,
      percentage: pct,
      direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral',
    };
  }, [value, config.previousValue]);

  const targetProgress = useMemo(() => {
    if (!config.target) return null;
    return Math.min(100, (value / config.target) * 100);
  }, [value, config.target]);

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 card bg-base-100 border border-base-300" style={{ minHeight: height }}>
      {config.title?.show !== false && (
        <h3 className="text-sm font-medium text-[#a0a0b0] mb-2 text-center">{(config.title as any)?.text || config.title}</h3>
      )}

      <div className="flex items-baseline gap-1">
        {config.prefix && <span className="text-2xl text-[#606070]">{config.prefix}</span>}
        <span className="text-5xl font-bold text-[#f0f0f5] tabular-nums">{formatNumber(value)}</span>
        {config.suffix && <span className="text-2xl text-[#606070]">{config.suffix}</span>}
      </div>

      {trend && (
        <div className={`flex items-center gap-1 mt-3 text-sm ${
          trend.direction === 'up' ? 'text-[#80ed99]' : 
          trend.direction === 'down' ? 'text-[#ff6b6b]' : 'text-[#606070]'
        }`}>
          {trend.direction === 'up' && <TrendingUp size={16} />}
          {trend.direction === 'down' && <TrendingDown size={16} />}
          {trend.direction === 'neutral' && <Minus size={16} />}
          <span>{trend.percentage >= 0 ? '+' : ''}{trend.percentage.toFixed(1)}%</span>
          {config.trendLabel && <span className="text-[#606070] ml-1">{config.trendLabel}</span>}
        </div>
      )}

      {targetProgress !== null && (
        <div className="w-full mt-4">
          <div className="flex justify-between text-xs text-[#606070] mb-1">
            <span>Progress</span>
            <span>{targetProgress.toFixed(0)}% of target</span>
          </div>
          <div className="h-2 bg-[#2a2a3a] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${targetProgress}%`,
                background: targetProgress >= 100 
                  ? 'linear-gradient(90deg, #80ed99, #00f5d4)' 
                  : 'linear-gradient(90deg, #00f5d4, #7b2cbf)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Main Chart Renderer
export const ChartRenderer: React.FC<ChartRendererProps> = ({
  type,
  data,
  config,
  height = 300,
}) => {
  // Option Generator
  const getOption = (): EChartsOption => {
    if (!data || data.length === 0) return {};

    // 1. Data Processing
    // Backward compatibility: use config.labelColumn or defaults
    const xColumn = config.xColumn || config.labelColumn || Object.keys(data[0])[0];
    // Backward compatibility: use config.dataColumns or defaults
    const yColumns = config.yColumns || config.dataColumns || Object.keys(data[0]).filter(k => k !== xColumn);
    
    const colors = config.colors || config.colorScheme || defaultColors;

    // Common Base Option
    const baseOption: EChartsOption = {
      backgroundColor: 'transparent',
      textStyle: { fontFamily: "'Outfit', sans-serif" },
      color: colors,
      title: config.title?.show !== false ? {
        text: typeof config.title === 'string' ? config.title : config.title?.text,
        subtext: typeof config.title === 'object' ? config.title.subtext : undefined,
        left: 'center',
        textStyle: { color: '#f0f0f5', fontSize: 16, fontWeight: 600 },
        subtextStyle: { color: '#a0a0b0' },
        ...config.title
      } : { show: false },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#1e1e2a',
        borderColor: '#2a2a3a',
        textStyle: { color: '#a0a0b0' },
        ...config.tooltip
      },
      legend: config.legend?.show !== false ? {
        top: 'bottom',
        textStyle: { color: '#a0a0b0' },
        ...config.legend
      } : { show: false },
      grid: {
        containLabel: true,
        left: '5%', right: '5%', bottom: '10%', top: '15%',
        ...config.grid
      },
    };

    // Chart-Specific Logic
    switch (type) {
      case 'bar':
      case 'line':
      case 'area':
      case 'scatter':
        return {
          ...baseOption,
          xAxis: {
            type: 'category',
            data: data.map(d => d[xColumn]),
            axisLabel: { color: '#606070', rotate: config.xAxis?.labelRotate || 0 },
            axisLine: { lineStyle: { color: '#2a2a3a' } },
            ...config.xAxis
          } as any, // Cast to avoid strict union check
          yAxis: {
            type: 'value',
            splitLine: { lineStyle: { color: '#2a2a3a', type: 'dashed' } },
            axisLabel: { color: '#606070' },
            ...config.yAxis
          },
          series: yColumns.map((col: string) => ({
            name: col,
            type: (type === 'area' ? 'line' : type) as any,
            data: data.map(d => d[col]),
            areaStyle: type === 'area' ? { opacity: 0.3 } : undefined,
            smooth: type === 'area' || type === 'line',
            emphasis: { focus: 'series' },
            ...config.seriesParams?.[col]
          }))
        };

      case 'pie':
      case 'doughnut':
        return {
          ...baseOption,
          tooltip: { trigger: 'item' },
          series: [{
            name: xColumn,
            type: 'pie',
            radius: type === 'doughnut' ? ['40%', '70%'] : '70%',
            center: ['50%', '50%'],
            itemStyle: { borderRadius: 5, borderColor: '#151520', borderWidth: 2 },
            label: { show: false },
            data: data.map(row => ({
              name: row[xColumn],
              value: row[yColumns[0]] // Pie usually takes 1 metric
            })),
          }]
        };
        
      case 'rose':
        return {
          ...baseOption,
          tooltip: { trigger: 'item' },
          series: [{
            name: xColumn,
            type: 'pie',
            radius: ['20%', '70%'],
            roseType: 'area', // Nightingale Rose Chart
            itemStyle: { borderRadius: 5 },
            data: data.map(row => ({
               name: row[xColumn],
               value: row[yColumns[0]]
            })),
          }]
        }

      case 'radar':
        return {
          ...baseOption,
          radar: {
            indicator: data.map(row => ({ name: row[xColumn], max: Math.max(...yColumns.map((c: string) => Number(row[c]))) * 1.2 })),
            splitArea: { show: false },
            axisLine: { lineStyle: { color: '#2a2a3a' } }
          },
          series: yColumns.map((col: string) => ({
            name: col,
            type: 'radar' as any,
            data: [{
              value: data.map(row => row[col]),
              name: col
            }]
          }))
        };

      case 'funnel':
        return {
           ...baseOption,
           tooltip: { trigger: 'item' },
           series: [{
              name: 'Funnel',
              type: 'funnel',
              left: '10%', top: 60, bottom: 60, width: '80%',
              min: 0, max: 100,
              minSize: '0%', maxSize: '100%',
              sort: 'descending',
              gap: 2,
              label: { show: true, position: 'inside' },
              data: data.map(row => ({
                 value: row[yColumns[0]],
                 name: row[xColumn]
              }))
           }]
        };

      case 'treemap':
        return {
            ...baseOption,
             series: [{
                type: 'treemap',
                data: data.map(row => ({
                    name: row[xColumn],
                    value: row[yColumns[0]]
                }))
             }]
        };
        
      case 'gauge':
         // Basic Gauge implementation for ECharts if config is minimal
         // Ideally use the Custom Gauge below, but this is for full ECharts support
         const valCol = config.valueColumn || yColumns[0];
         const val = data.length > 0 ? data[0][valCol] : 0;
         return {
            ...baseOption,
            series: [{
                type: 'gauge',
                progress: { show: true, width: 18 },
                axisLine: { lineStyle: { width: 18 } },
                axisTick: { show: false },
                splitLine: { length: 15, lineStyle: { width: 2, color: '#999' } },
                axisLabel: { distance: 25, color: '#999', fontSize: 12 },
                anchor: { show: true, showAbove: true, size: 25, itemStyle: { borderWidth: 10 } },
                title: { show: false },
                detail: { valueAnimation: true, fontSize: 30, offsetCenter: [0, '70%'] },
                data: [{ value: val }]
            }]
         };

      default:
        // Generic fallback or try to render as bar
        return {
            ...baseOption,
            xAxis: { type: 'category', data: data.map(d => d[xColumn]) },
            yAxis: { type: 'value' },
          series: yColumns.map((col: string) => ({ type: 'bar', data: data.map(d => d[col]) }))
        };
    }
  };

  // Rendering
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-[#606070]">No data to display</div>;
  }

  // Handle Tables separately
  if (type === 'table') {
    return <DataTable data={data} maxHeight={`${height}px`} />;
  }

  // Handle Custom KPIs
  if (type === 'kpi') {
    return <KPICard data={data} config={config} height={height} />;
  }

  // Render ECharts
  return (
    <div style={{ height: `${height}px`, width: '100%' }}>
      <EChartsWrapper 
        option={getOption()} 
        style={{ height: '100%', width: '100%' }} 
        autoResize={true}
      />
    </div>
  );
};
