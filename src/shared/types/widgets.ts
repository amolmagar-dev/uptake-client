/**
 * Shared Widget Types
 * Used by both message rendering and widget components
 */

export type WidgetType = 
  | "query_result"      // SQL query results with data table
  | "chart_preview"     // Inline chart visualization
  | "data_insight"      // Metrics, trends, anomalies
  | "action_buttons"    // Quick action buttons
  | "dataset_info"      // Dataset metadata and stats
  | "connection_status" // Connection health check
  | "schema_explorer";  // Interactive schema tree

export interface WidgetAction {
  id: string;
  label: string;
  icon?: string;
  tooltip?: string;
  variant?: "primary" | "secondary" | "ghost" | "error" | "success";
  clientTool?: string; // Client tool to execute
  params?: Record<string, any>;
}

export interface BaseWidget {
  type: WidgetType;
  id: string;
  data: any; // Widget-specific data
  actions?: WidgetAction[];
  metadata?: Record<string, any>;
}

// Specific widget data types

export interface QueryResultWidgetData {
  query: string;
  rows: any[];
  columns: { name: string; type: string }[];
  rowCount: number;
  executionTime?: number;
}

export interface QueryResultWidget extends BaseWidget {
  type: "query_result";
  data: QueryResultWidgetData;
}

export interface ChartPreviewWidgetData {
  chartId: number;
  chartType: string;
  datasetName: string;
  config: any; // ECharts config
}

export interface ChartPreviewWidget extends BaseWidget {
  type: "chart_preview";
  data: ChartPreviewWidgetData;
}

export interface DataInsight {
  type: "success" | "warning" | "info" | "error";
  title: string;
  description: string;
  icon?: string;
}

export interface DataInsightWidgetData {
  insights: DataInsight[];
}

export interface DataInsightWidget extends BaseWidget {
  type: "data_insight";
  data: DataInsightWidgetData;
}

export interface ActionButtonsWidgetData {
  title?: string;
  buttons: WidgetAction[];
}

export interface ActionButtonsWidget extends BaseWidget {
  type: "action_buttons";
  data: ActionButtonsWidgetData;
}

export interface DatasetInfoWidgetData {
  datasetId: number;
  name: string;
  type: "physical" | "virtual";
  rowCount?: number;
  columnCount?: number;
  columns?: { name: string; type: string }[];
  lastUpdated?: string;
}

export interface DatasetInfoWidget extends BaseWidget {
  type: "dataset_info";
  data: DatasetInfoWidgetData;
}

// Type guard functions
export function isQueryResultWidget(widget: BaseWidget): widget is QueryResultWidget {
  return widget.type === "query_result";
}

export function isChartPreviewWidget(widget: BaseWidget): widget is ChartPreviewWidget {
  return widget.type === "chart_preview";
}

export function isDataInsightWidget(widget: BaseWidget): widget is DataInsightWidget {
  return widget.type === "data_insight";
}

export function isActionButtonsWidget(widget: BaseWidget): widget is ActionButtonsWidget {
  return widget.type === "action_buttons";
}

export function isDatasetInfoWidget(widget: BaseWidget): widget is DatasetInfoWidget {
  return widget.type === "dataset_info";
}
