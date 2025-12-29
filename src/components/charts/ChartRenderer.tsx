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
import { DataTable } from '../ui/Table';

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
  dataColumns?: string[];
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  title?: string;
}

interface ChartRendererProps {
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'area' | 'scatter' | 'table';
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

  return (
    <div style={{ height: `${height}px` }}>
      <ChartComponent data={chartData} options={options} />
    </div>
  );
};

