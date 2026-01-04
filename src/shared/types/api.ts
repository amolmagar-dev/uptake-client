// API-related type definitions
// Moved from lib/api.ts

export interface ConnectionInput {
  name: string;
  type: "postgresql" | "mysql" | "mariadb" | "api" | "googlesheet";
  // SQL connection fields
  host?: string;
  port?: number;
  database_name?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  // Config for API and Google Sheets
  config?: ApiConfig | GoogleSheetsConfig;
}

export interface ApiConfig {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  auth_type?: "none" | "api_key" | "bearer" | "basic";
  api_key?: string;
  api_key_name?: string;
  api_key_location?: "header" | "query";
  bearer_token?: string;
  username?: string;
  password?: string;
  body?: string;
  data_path?: string;
}

export interface GoogleSheetsConfig {
  spreadsheet_id: string;
  sheet_name?: string;
  sheet_gid?: string;
  range?: string;
  api_key?: string;
}

export interface SavedQueryInput {
  name: string;
  description?: string;
  sql_query: string;
  connection_id: string;
}

export interface ChartInput {
  name: string;
  description?: string;
  chart_type: "bar" | "line" | "pie" | "doughnut" | "area" | "scatter" | "table";
  config: ChartConfig;
  query_id?: string;
  sql_query?: string;
  connection_id: string;
}

export interface ChartConfig {
  labelColumn?: string;
  dataColumns?: string[];
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  title?: string;
}

export interface DashboardInput {
  name: string;
  description?: string;
  layout?: LayoutItem[];
  is_public?: boolean;
  filters?: any[];
}

export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DashboardChartInput {
  chart_id: string;
  position_x?: number;
  position_y?: number;
  width?: number;
  height?: number;
}

export interface CustomComponentInput {
  name: string;
  description?: string;
  html_content: string;
  css_content?: string;
  js_content?: string;
  config?: Record<string, any>;
  dataset_id?: string;
  // Legacy fields for backward compatibility
  connection_id?: string;
  sql_query?: string;
}

export interface DatasetInput {
  name: string;
  description?: string;
  source_type: 'sql' | 'googlesheet' | 'nosql' | 'api';
  dataset_type: 'physical' | 'virtual';
  connection_id?: string;
  table_name?: string;
  table_schema?: string;
  sql_query?: string;
  source_config?: Record<string, any>;
}

export interface Dataset {
  id: string;
  name: string;
  description?: string;
  source_type: string;
  dataset_type: string;
  connection_id?: string;
  connection_name?: string;
  connection_type?: string;
  table_name?: string;
  table_schema?: string;
  sql_query?: string;
  source_config?: Record<string, any>;
  columns?: Array<{ column_name: string; data_type: string }>;
  created_at?: string;
  updated_at?: string;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIContext {
  type: "connection" | "dataset" | "chart" | "dashboard" | "component" | "custom";
  id?: string;
  name: string;
  metadata?: Record<string, any>;
  customText?: string;
}
