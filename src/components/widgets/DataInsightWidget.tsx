/**
 * Data Insight Widget
 * Displays metrics, trends, anomalies in color-coded cards
 */

import React from "react";
import { CheckCircle, AlertTriangle, Info, XCircle, BarChart3 } from "lucide-react";
import type { DataInsightWidget as DataInsightWidgetType, DataInsight } from "../../shared/types/widgets";

interface DataInsightWidgetProps extends DataInsightWidgetType {}

const InsightCard: React.FC<{ insight: DataInsight }> = ({ insight }) => {
  const typeConfig = {
    success: {
      bgClass: "bg-success/5 border-success/30",
      icon: <CheckCircle size={16} className="text-success" />,
    },
    warning: {
      bgClass: "bg-warning/5 border-warning/30",
      icon: <AlertTriangle size={16} className="text-warning" />,
    },
    info: {
      bgClass: "bg-info/5 border-info/30",
      icon: <Info size={16} className="text-info" />,
    },
    error: {
      bgClass: "bg-error/5 border-error/30",
      icon: <XCircle size={16} className="text-error" />,
    },
  };

  const config = typeConfig[insight.type];

  return (
    <div className={`${config.bgClass} border rounded-lg p-3`}>
      <div className="flex items-start gap-2">
        {config.icon}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold mb-1">{insight.title}</div>
          <div className="text-xs opacity-70 leading-relaxed">{insight.description}</div>
        </div>
      </div>
    </div>
  );
};

export const DataInsightWidget: React.FC<DataInsightWidgetProps> = ({ data }) => {
  if (!data.insights || data.insights.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2 px-1">
        <BarChart3 size={14} className="text-primary" />
        <span className="text-xs font-black uppercase tracking-widest opacity-40">
          AI Insights
        </span>
      </div>
      {data.insights.map((insight, idx) => (
        <InsightCard key={idx} insight={insight} />
      ))}
    </div>
  );
};
