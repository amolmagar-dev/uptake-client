import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut, Scatter } from 'react-chartjs-2';
import { DataTable } from '../../shared/components/ui/Table';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartConfig {
  labelColumn?: string;
  dataColumns?: string[]
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  title?: string;
  // KPI/Gauge specific
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

interface ChartRendererProps {
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'area' | 'scatter' | 'table' | 'kpi' | 'gauge';
  data: Record<string, any>[];
  config: ChartConfig;
  height?: number;
}

const defaultColors = [
  '#00f5d4',
  '#7b2cbf',
  '#ff6b6b',
  '#ffd93d',
  '#4cc9f0',
  '#f72585',
  '#4895ef',
  '#80ed99',
  '#e63946',
  '#a8dadc',
];

// Format number with abbreviations (K, M, B)
const formatNumber = (num: number, decimals = 1): string => {
  if (Math.abs(num) >= 1e9) {
    return (num / 1e9).toFixed(decimals) + 'B';
  }
  if (Math.abs(num) >= 1e6) {
    return (num / 1e6).toFixed(decimals) + 'M';
  }
  if (Math.abs(num) >= 1e3) {
    return (num / 1e3).toFixed(decimals) + 'K';
  }
  return num.toLocaleString(undefined, { maximumFractionDigits: decimals });
};

// KPI Card Component
const KPICard: React.FC<{ data: Record<string, any>[]; config: ChartConfig; height: number }> = ({
  data,
  config,
  height,
}) => {
  const value = useMemo(() => {
    if (!data || data.length === 0) return 0;
    const col = config.valueColumn || config.dataColumns?.[0] || Object.keys(data[0]).find(k => typeof data[0][k] === 'number');
    if (!col) return 0;
    // Sum all values if multiple rows, or take first
    if (data.length === 1) {
      return parseFloat(data[0][col]) || 0;
    }
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
    <div
      className="flex flex-col items-center justify-center h-full p-6"
      style={{ minHeight: height }}
    >
      {config.title && (
        <h3 className="text-sm font-medium text-[#a0a0b0] mb-2 text-center">{config.title}</h3>
      )}

      <div className="flex items-baseline gap-1">
        {config.prefix && <span className="text-2xl text-[#606070]">{config.prefix}</span>}
        <span className="text-5xl font-bold text-[#f0f0f5] tabular-nums">
          {formatNumber(value)}
        </span>
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

// Gauge Chart Component
const GaugeChart: React.FC<{ data: Record<string, any>[]; config: ChartConfig; height: number }> = ({
  data,
  config,
  height,
}) => {
  const value = useMemo(() => {
    if (!data || data.length === 0) return 0;
    const col = config.valueColumn || config.dataColumns?.[0] || Object.keys(data[0]).find(k => typeof data[0][k] === 'number');
    if (!col) return 0;
    return parseFloat(data[0][col]) || 0;
  }, [data, config]);

  const min = config.min ?? 0;
  const max = config.max ?? 100;
  const normalizedValue = Math.max(min, Math.min(max, value));
  const percentage = ((normalizedValue - min) / (max - min)) * 100;
  
  // Calculate angle for gauge (180 degrees arc)
  const angle = (percentage / 100) * 180 - 90; // -90 to 90 degrees

  // Determine color based on thresholds
  const gaugeColor = useMemo(() => {
    if (!config.thresholds || config.thresholds.length === 0) {
      return '#00f5d4';
    }
    const sorted = [...config.thresholds].sort((a, b) => b.value - a.value);
    for (const t of sorted) {
      if (normalizedValue >= t.value) {
        return t.color;
      }
    }
    return config.thresholds[config.thresholds.length - 1]?.color || '#00f5d4';
  }, [normalizedValue, config.thresholds]);

  const size = Math.min(height - 40, 200);
  const strokeWidth = size * 0.12;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius;

  return (
    <div className="flex flex-col items-center justify-center h-full p-4" style={{ minHeight: height }}>
      {config.title && (
        <h3 className="text-sm font-medium text-[#a0a0b0] mb-2 text-center">{config.title}</h3>
      )}

      <div className="relative" style={{ width: size, height: size / 2 + 30 }}>
        <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
          {/* Background arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke="#2a2a3a"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Value arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke={gaugeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - percentage / 100)}
            style={{ transition: 'stroke-dashoffset 0.5s ease-out, stroke 0.3s ease' }}
          />
          {/* Needle */}
          <g transform={`translate(${size / 2}, ${size / 2})`}>
            <line
              x1="0"
              y1="0"
              x2="0"
              y2={-radius + strokeWidth}
              stroke="#f0f0f5"
              strokeWidth="3"
              strokeLinecap="round"
              transform={`rotate(${angle})`}
              style={{ transition: 'transform 0.5s ease-out' }}
            />
            <circle r={strokeWidth / 2} fill="#f0f0f5" />
          </g>
        </svg>

        {/* Value display */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
          <div className="flex items-baseline justify-center gap-1">
            {config.prefix && <span className="text-lg text-[#606070]">{config.prefix}</span>}
            <span className="text-3xl font-bold text-[#f0f0f5] tabular-nums">
              {formatNumber(value)}
            </span>
            {config.suffix && <span className="text-lg text-[#606070]">{config.suffix}</span>}
          </div>
        </div>
      </div>

      {/* Min/Max labels */}
      <div className="flex justify-between w-full max-w-[200px] text-xs text-[#606070] mt-1 px-2">
        <span>{formatNumber(min)}</span>
        <span>{formatNumber(max)}</span>
      </div>
    </div>
  );
};

export const ChartRenderer: React.FC<ChartRendererProps> = ({
  type,
  data,
  config,
  height = 300,
}) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const labelColumn = config.labelColumn || Object.keys(data[0])[0];
    const dataColumns = config.dataColumns || Object.keys(data[0]).filter(k => k !== labelColumn);
    const colors = config.colors || defaultColors;

    const labels = data.map(row => row[labelColumn]);

    const datasets = dataColumns.map((column, index) => ({
      label: column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      data: data.map(row => parseFloat(row[column]) || 0),
      backgroundColor: type === 'line' || type === 'area'
        ? `${colors[index % colors.length]}40`
        : colors.slice(0, data.length),
      borderColor: colors[index % colors.length],
      borderWidth: type === 'pie' || type === 'doughnut' ? 0 : 2,
      fill: type === 'area',
      tension: 0.4,
      pointRadius: type === 'scatter' ? 6 : 4,
      pointHoverRadius: 6,
    }));

    return { labels, datasets };
  }, [data, config, type]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: config.showLegend !== false,
        position: 'top' as const,
        labels: {
          color: '#a0a0b0',
          padding: 20,
          font: {
            family: "'Outfit', sans-serif",
            size: 12,
          },
        },
      },
      title: {
        display: !!config.title,
        text: config.title || '',
        color: '#f0f0f5',
        font: {
          family: "'Outfit', sans-serif",
          size: 16,
          weight: 600,
        },
        padding: { bottom: 20 },
      },
      tooltip: {
        backgroundColor: '#1e1e2a',
        titleColor: '#f0f0f5',
        bodyColor: '#a0a0b0',
        borderColor: '#2a2a3a',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          family: "'Outfit', sans-serif",
          size: 14,
          weight: 600,
        },
        bodyFont: {
          family: "'Outfit', sans-serif",
          size: 13,
        },
      },
    },
    scales: type === 'pie' || type === 'doughnut' ? undefined : {
      x: {
        display: config.showGrid !== false,
        grid: {
          color: '#2a2a3a',
          drawBorder: false,
        },
        ticks: {
          color: '#606070',
          font: {
            family: "'Outfit', sans-serif",
            size: 11,
          },
        },
      },
      y: {
        display: config.showGrid !== false,
        grid: {
          color: '#2a2a3a',
          drawBorder: false,
        },
        ticks: {
          color: '#606070',
          font: {
            family: "'Outfit', sans-serif",
            size: 11,
          },
        },
        beginAtZero: true,
      },
    },
  }), [config, type]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[#606070]">
        No data to display
      </div>
    );
  }

  // Handle KPI type
  if (type === 'kpi') {
    return <KPICard data={data} config={config} height={height} />;
  }

  // Handle Gauge type
  if (type === 'gauge') {
    return <GaugeChart data={data} config={config} height={height} />;
  }

  if (!chartData) {
    return (
      <div className="flex items-center justify-center h-full text-[#606070]">
        No data to display
      </div>
    );
  }

  if (type === 'table') {
    return <DataTable data={data} maxHeight={`${height}px`} />;
  }

  const ChartComponent = {
    bar: Bar,
    line: Line,
    area: Line,
    pie: Pie,
    doughnut: Doughnut,
    scatter: Scatter,
  }[type];

  if (!ChartComponent) {
    return (
      <div className="flex items-center justify-center h-full text-[#606070]">
        Unsupported chart type: {type}
      </div>
    );
  }

  return (
    <div style={{ height: `${height}px` }}>
      <ChartComponent data={chartData} options={options} />
    </div>
  );
};
