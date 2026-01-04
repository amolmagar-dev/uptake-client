import api from "./client";
import type {
  ConnectionInput,
  SavedQueryInput,
  ChartInput,
  DashboardInput,
  DashboardChartInput,
  CustomComponentInput,
  DatasetInput,
  ChatMessage,
  AIContext,
} from "../../types";

// Auth API
export const authApi = {
  login: (email: string, password: string) => api.post("/auth/login", { email, password }),
  register: (email: string, password: string, name?: string) => api.post("/auth/register", { email, password, name }),
  me: () => api.get("/auth/me"),
  updateProfile: (data: { name?: string; currentPassword?: string; newPassword?: string }) =>
    api.put("/auth/profile", data),
};

// Connections API
export const connectionsApi = {
  getAll: () => api.get("/connections"),
  getOne: (id: string) => api.get(`/connections/${id}`),
  create: (data: ConnectionInput) => api.post("/connections", data),
  update: (id: string, data: Partial<ConnectionInput>) => api.put(`/connections/${id}`, data),
  delete: (id: string) => api.delete(`/connections/${id}`),
  test: (id: string) => api.post(`/connections/${id}/test`),
  getTables: (id: string) => api.get(`/connections/${id}/tables`),
  getTableSchema: (id: string, tableName: string, schema?: string) =>
    api.get(`/connections/${id}/tables/${tableName}/schema`, { params: { schema } }),
  preview: (id: string) => api.get(`/connections/${id}/preview`),
};

// Queries API
export const queriesApi = {
  execute: (connectionId: string, sql: string) => api.post("/queries/execute", { connectionId, sql }),
  getAll: () => api.get("/queries"),
  getOne: (id: string) => api.get(`/queries/${id}`),
  save: (data: SavedQueryInput) => api.post("/queries", data),
  update: (id: string, data: Partial<SavedQueryInput>) => api.put(`/queries/${id}`, data),
  delete: (id: string) => api.delete(`/queries/${id}`),
  executeSaved: (id: string) => api.post(`/queries/${id}/execute`),
};

// Charts API
export const chartsApi = {
  getAll: () => api.get("/charts"),
  getOne: (id: string) => api.get(`/charts/${id}`),
  create: (data: ChartInput) => api.post("/charts", data),
  update: (id: string, data: Partial<ChartInput>) => api.put(`/charts/${id}`, data),
  delete: (id: string) => api.delete(`/charts/${id}`),
  getData: (id: string) => api.get(`/charts/${id}/data`),
};

// Dashboards API
export const dashboardsApi = {
  getAll: () => api.get("/dashboards"),
  getOne: (id: string) => api.get(`/dashboards/${id}`),
  getPublic: (id: string) => api.get(`/dashboards/public/${id}`),
  create: (data: DashboardInput) => api.post("/dashboards", data),
  update: (id: string, data: Partial<DashboardInput>) => api.put(`/dashboards/${id}`, data),
  delete: (id: string) => api.delete(`/dashboards/${id}`),
  clone: (id: string) => api.post(`/dashboards/${id}/clone`),
  addChart: (dashboardId: string, data: DashboardChartInput) => api.post(`/dashboards/${dashboardId}/charts`, data),
  updateChart: (dashboardId: string, chartId: string, data: Partial<DashboardChartInput>) =>
    api.put(`/dashboards/${dashboardId}/charts/${chartId}`, data),
  removeChart: (dashboardId: string, chartId: string) => api.delete(`/dashboards/${dashboardId}/charts/${chartId}`),
  getData: (id: string) => api.get(`/dashboards/${id}/data`),
};

// AI Chat API
export const aiApi = {
  chat: (messages: ChatMessage[], contexts?: AIContext[]) =>
    api.post("/ai/chat", { messages, contexts }),
};

// Custom Components API
export const customComponentsApi = {
  getAll: () => api.get("/components"),
  getOne: (id: string) => api.get(`/components/${id}`),
  create: (data: CustomComponentInput) => api.post("/components", data),
  update: (id: string, data: Partial<CustomComponentInput>) => api.put(`/components/${id}`, data),
  delete: (id: string) => api.delete(`/components/${id}`),
  getData: (id: string) => api.get(`/components/${id}/data`),
};

// Datasets API
export const datasetsApi = {
  getAll: () => api.get("/datasets"),
  getOne: (id: string) => api.get(`/datasets/${id}`),
  create: (data: DatasetInput) => api.post("/datasets", data),
  update: (id: string, data: Partial<DatasetInput>) => api.put(`/datasets/${id}`, data),
  delete: (id: string) => api.delete(`/datasets/${id}`),
  preview: (id: string) => api.get(`/datasets/${id}/preview`),
  getColumns: (id: string) => api.get(`/datasets/${id}/columns`),
  refreshColumns: (id: string) => api.post(`/datasets/${id}/refresh-columns`),
};

// Health check
export const healthCheck = () => api.get("/health");
