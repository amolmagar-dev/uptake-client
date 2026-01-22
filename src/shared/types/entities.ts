// Entity type definitions
// Consolidated from various page files

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  layout: any[];
  is_public: number;
  chart_count: number;
  created_by_name: string;
  charts?: DashboardChart[];
}

export interface DashboardChart {
  id: string;
  chart_id?: string;
  component_id?: string;
  type?: 'chart' | 'component';
  name: string;
  chart_type?: string;
  config: any;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  // Component-specific fields
  html_content?: string;
  css_content?: string;
  js_content?: string;
}

export interface ChartData {
  chartId: string;
  dashboardChartId: string;
  data: any[];
  config: any;
  error?: string;
}

export interface Connection {
  id: string;
  name: string;
  type: 'postgresql' | 'mysql' | 'mariadb' | 'api' | 'googlesheet';
  host?: string;
  port?: number;
  database_name?: string;
  username?: string;
  ssl?: number;
  config?: any;
}

export interface TableInfo {
  table_schema: string;
  table_name: string;
  table_type: string;
}

export interface Chart {
  id: string;
  name: string;
  description: string;
  chart_type: string;
  config: any;
  dataset_id: string;
  dataset_name?: string;
  dataset_type?: string;
  source_type?: string;
}
