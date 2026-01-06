
export interface SeriesSpecificConfig {
  type?: string;
  name?: string;
  color?: string;
  stack?: string;
  areaStyle?: { opacity: number; color?: string };
  showSymbol?: boolean;
  symbolSize?: number;
  smooth?: boolean; // For line charts
  barWidth?: string | number; // For bar charts
  label?: { show: boolean; position: string; formatter?: string };
}

export interface ChartConfig {
  // Data Mapping
  xColumn?: string;
  yColumns?: string[];
  seriesParams?: Record<string, SeriesSpecificConfig>;

  // General
  title?: { 
    show: boolean; 
    text: string; 
    subtext?: string; 
    left?: 'left' | 'center' | 'right';
    top?: 'top' | 'middle' | 'bottom';
  };
  
  legend?: { 
    show: boolean; 
    orient: 'horizontal' | 'vertical'; 
    top?: string | number; 
    left?: string | number; 
  };
  
  grid?: { 
    show: boolean; 
    top?: number; 
    right?: number; 
    bottom?: number; 
    left?: number; 
    containLabel?: boolean;
  };
  
  // Axes
  xAxis?: { 
    show: boolean; 
    name?: string; 
    type?: 'category' | 'time' | 'value'; 
    labelRotate?: number;
    axisLabel?: { show: boolean };
    boundaryGap?: boolean;
  };
  
  yAxis?: { 
    show: boolean; 
    name?: string; 
    scale?: boolean;
    axisLabel?: { show: boolean; formatter?: string };
  };
  
  // Tooltip
  tooltip?: { 
    show: boolean; 
    trigger: 'item' | 'axis';
    formatter?: string;
  };
  
  // Theme / Color
  colorScheme?: string[];
  backgroundColor?: string;
  
  // Legacy / Backward Compatibility
  labelColumn?: string;
  dataColumns?: string[];
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;

  // KPI/Gauge compatibility (Legacy props to support migration)
  valueColumn?: string;
  prefix?: string;
  suffix?: string;
  target?: number;
  min?: number;
  max?: number;
  thresholds?: { value: number; color: string }[];
  previousValue?: number;
  trendLabel?: string;
}
