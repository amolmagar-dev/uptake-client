/**
 * Client Tool Definitions
 * Shared between backend (as definitions) and frontend (as implementations)
 */

import { toolDefinition } from "@tanstack/ai";
import { z } from "zod";

/**
 * Navigate to a specific page in the application
 */
export const navigateToPageDef = toolDefinition({
  name: "navigate_to_page",
  description: "Navigate user to a specific page in the application (chart editor, SQL editor, datasets, etc.)",
  inputSchema: z.object({
    page: z.enum(["sql-editor", "charts", "chart-editor", "datasets", "dashboards", "connections"]).describe("The page to navigate to"),
    params: z.record(z.string(), z.any()).optional().describe("URL parameters or state to pass to the page"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    page: z.string(),
  }),
});

/**
 * Add an item to the active AI context
 */
export const addToContextDef = toolDefinition({
  name: "add_to_context",
  description: "Add a connection, dataset, chart, or dashboard to the active AI context for better assistance",
  inputSchema: z.object({
    type: z.enum(["connection", "dataset", "chart", "dashboard", "component"]).describe("Type of item to add"),
    id: z.number().describe("ID of the item"),
    name: z.string().describe("Name of the item"),
    metadata: z.record(z.string(), z.any()).optional().describe("Additional metadata about the item"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    totalContexts: z.number(),
    message: z.string(),
  }),
});

/**
 * Show a toast notification to the user
 */
export const showNotificationDef = toolDefinition({
  name: "show_notification",
  description: "Show a toast notification message to the user",
  inputSchema: z.object({
    message: z.string().describe("The notification message to display"),
    type: z.enum(["success", "error", "info", "warning"]).describe("Type of notification"),
    duration: z.number().optional().describe("Duration in milliseconds (default: 3000)"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
  }),
});

/**
 * Open a preview modal for data or visualization
 */
export const openPreviewModalDef = toolDefinition({
  name: "open_preview_modal",
  description: "Open a modal to preview data, charts, or other content",
  inputSchema: z.object({
    contentType: z.enum(["data", "chart", "schema", "custom"]).describe("Type of content to preview"),
    title: z.string().describe("Modal title"),
    data: z.any().describe("Content data to display in the modal"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
  }),
});

/**
 * Update a form field in the current page
 */
export const updateFormFieldDef = toolDefinition({
  name: "update_form_field",
  description: "Update a form field value in the current page (useful for pre-filling dataset, chart, or connection forms)",
  inputSchema: z.object({
    fieldName: z.string().describe("Name of the form field to update"),
    value: z.any().describe("New value for the field"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    fieldName: z.string(),
  }),
});
