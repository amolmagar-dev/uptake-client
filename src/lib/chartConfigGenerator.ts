import type { EChartsOption } from 'echarts';
import type { ChartConfig } from '../types/chart-config';

const defaultColors = [
  '#00f5d4', '#7b2cbf', '#ff6b6b', '#ffd93d', '#4cc9f0',
  '#f72585', '#4895ef', '#80ed99', '#e63946', '#a8dadc',
];

/**
 * Generate ECharts option object from chart config and data
 */
export function generateEChartsOption(
  type: string,
  data: Record<string, any>[],
  config: ChartConfig
): EChartsOption {
  if (!data || data.length === 0) return {};

  // 1. Data Processing
  const xColumn = config.xColumn || config.labelColumn || Object.keys(data[0])[0];
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
        dataset: {
          source: data,
          dimensions: [xColumn, ...yColumns]
        },
        xAxis: {
          type: 'category',
          axisLabel: { color: '#606070', rotate: config.xAxis?.labelRotate || 0 },
          axisLine: { lineStyle: { color: '#2a2a3a' } },
          ...config.xAxis
        } as any,
        yAxis: {
          type: 'value',
          splitLine: { lineStyle: { color: '#2a2a3a', type: 'dashed' } },
          axisLabel: { color: '#606070' },
          ...config.yAxis
        },
        series: yColumns.map((col: string) => ({
          name: col,
          type: (type === 'area' ? 'line' : type) as any,
          encode: {
            x: xColumn,
            y: col,
            tooltip: [xColumn, col]
          },
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
        dataset: {
          source: data,
          dimensions: [xColumn, ...yColumns]
        },
        tooltip: { trigger: 'item' },
        series: [{
          name: xColumn,
          type: 'pie',
          radius: type === 'doughnut' ? ['40%', '70%'] : '70%',
          center: ['50%', '50%'],
          itemStyle: { borderRadius: 5, borderColor: '#151520', borderWidth: 2 },
          label: { show: false },
          encode: {
            itemName: xColumn,
            value: yColumns[0],
            tooltip: [xColumn, yColumns[0]]
          }
        }]
      };
      
    case 'rose':
      return {
        ...baseOption,
        dataset: {
          source: data,
          dimensions: [xColumn, ...yColumns]
        },
        tooltip: { trigger: 'item' },
        series: [{
          name: xColumn,
          type: 'pie',
          radius: ['20%', '70%'],
          roseType: 'area',
          itemStyle: { borderRadius: 5 },
          encode: {
            itemName: xColumn,
            value: yColumns[0],
            tooltip: [xColumn, yColumns[0]]
          }
        }]
      };

    case 'radar':
      return {
        ...baseOption,
        dataset: {
          source: data,
          dimensions: [xColumn, ...yColumns]
        },
        radar: {
          indicator: data.map(row => ({ 
            name: row[xColumn], 
            max: Math.max(...yColumns.map((c: string) => Number(row[c]))) * 1.2 
          })),
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
         dataset: {
           source: data,
           dimensions: [xColumn, ...yColumns]
         },
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
            encode: {
              itemName: xColumn,
              value: yColumns[0],
              tooltip: [xColumn, yColumns[0]]
            }
         }]
      };

    case 'treemap':
      return {
          ...baseOption,
          tooltip: { trigger: 'item' },
          series: [{
              type: 'treemap',
              data: data.map(row => ({
                name: row[xColumn],
                value: row[yColumns[0]]
              })),
              label: {
                show: true,
                formatter: '{b}'
              },
              itemStyle: {
                borderColor: '#151520',
                borderWidth: 2,
                gapWidth: 2
              },
              levels: [
                {
                  itemStyle: {
                    borderWidth: 0,
                    gapWidth: 5
                  }
                },
                {
                  itemStyle: {
                    gapWidth: 1
                  }
                }
              ]
          }]
      };
      
    case 'gauge':
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

    case 'heatmap':
      // Heatmap still needs manual transformation for coordinate mapping
      const xValues = [...new Set(data.map(d => d[xColumn]))];
      const yValues = yColumns;
      return {
        ...baseOption,
        tooltip: { position: 'top' },
        grid: { height: '50%', top: '10%' },
        xAxis: {
          type: 'category',
          data: xValues,
          splitArea: { show: true }
        },
        yAxis: {
          type: 'category',
          data: yValues,
          splitArea: { show: true }
        },
        visualMap: {
          min: 0,
          max: 10,
          calculable: true,
          orient: 'horizontal',
          left: 'center',
          bottom: '15%'
        },
        series: [{
          name: 'Heatmap',
          type: 'heatmap',
          data: data.flatMap((row, xIdx) => 
            yColumns.map((col, yIdx) => [xIdx, yIdx, row[col] || 0])
          ),
          label: { show: true },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      };

    default:
      return {
          ...baseOption,
          dataset: {
            source: data,
            dimensions: [xColumn, ...yColumns]
          },
          xAxis: { type: 'category' },
          yAxis: { type: 'value' },
          series: yColumns.map((col: string) => ({ 
            type: 'bar',
            encode: {
              x: xColumn,
              y: col,
              tooltip: [xColumn, col]
            }
          }))
      };
  }
}
