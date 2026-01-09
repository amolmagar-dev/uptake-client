/**
 * Action Buttons Widget
 * Displays a set of quick action buttons
 */

import React from "react";
import { Command } from "lucide-react";
import type { ActionButtonsWidget as ActionButtonsWidgetData, WidgetAction } from "../../shared/types/widgets";

interface ActionButtonsWidgetProps extends ActionButtonsWidgetData {
  onAction?: (action: WidgetAction) => void;
}

export const ActionButtonsWidget: React.FC<ActionButtonsWidgetProps> = ({ 
  data, 
  onAction 
}) => {
  const handleAction = (action: WidgetAction) => {
    if (onAction) {
      onAction(action);
    }
  };

  return (
    <div className="mt-3">
      {data.title && (
        <div className="flex items-center gap-2 px-1 mb-2">
          <Command size={14} className="text-primary" />
          <span className="text-xs font-black uppercase tracking-widest opacity-40">
            {data.title}
          </span>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {data.buttons.map((action) => {
          const btnClass = action.variant === "primary"
            ? "btn-primary"
            : action.variant === "secondary"
            ? "btn-secondary"
            : action.variant === "error"
            ? "btn-error"
            : action.variant === "success"
            ? "btn-success"
            : "btn-ghost border-base-300";

          return (
            <button
              key={action.id}
              onClick={() => handleAction(action)}
              className={`btn btn-sm ${btnClass}`}
              title={action.tooltip}
            >
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
