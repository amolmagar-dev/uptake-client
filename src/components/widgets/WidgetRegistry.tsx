/**
 * Widget Registry
 * Maps widget types to their React components
 */

import React from "react";
import type { BaseWidget, WidgetType, WidgetAction } from "../../shared/types/widgets";
import { QueryResultWidget } from "./QueryResultWidget";
import { DataInsightWidget } from "./DataInsightWidget";
import { ActionButtonsWidget } from "./ActionButtonsWidget";

interface WidgetProps extends BaseWidget {
  onAction?: (action: WidgetAction) => void;
}

// Widget registry mapping types to components
const WIDGET_REGISTRY: Partial<Record<WidgetType, React.FC<any>>> = {
  query_result: QueryResultWidget,
  data_insight: DataInsightWidget,
  action_buttons: ActionButtonsWidget,
  // TODO: Add more widgets as they are implemented
  // chart_preview: ChartPreviewWidget,
  // dataset_info: DatasetInfoWidget,
  // connection_status: ConnectionStatusWidget,
  // schema_explorer: SchemaExplorerWidget,
};

/**
 * Widget Renderer
 * Renders the appropriate widget component based on widget type
 */
export const WidgetRenderer: React.FC<WidgetProps> = ({ onAction, ...widget }) => {
  const Component = WIDGET_REGISTRY[widget.type];
  
  if (!Component) {
    console.warn(`No widget component registered for type: ${widget.type}`);
    return (
      <div className="mt-3 p-3 border border-warning/30 bg-warning/5 rounded-lg">
        <div className="text-xs opacity-70">
          Unknown widget type: <code className="font-mono">{widget.type}</code>
        </div>
      </div>
    );
  }

  return <Component {...widget} onAction={onAction} />;
};
