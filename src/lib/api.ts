import axios, { AxiosError } from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("uptake_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("uptake_token");
      localStorage.removeItem("uptake_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

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
  addChart: (dashboardId: string, data: DashboardChartInput) => api.post(`/dashboards/${dashboardId}/charts`, data),
  updateChart: (dashboardId: string, chartId: string, data: Partial<DashboardChartInput>) =>
    api.put(`/dashboards/${dashboardId}/charts/${chartId}`, data),
  removeChart: (dashboardId: string, chartId: string) => api.delete(`/dashboards/${dashboardId}/charts/${chartId}`),
  getData: (id: string) => api.get(`/dashboards/${id}/data`),
};

// AI Chat API
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export const aiApi = {
  chat: (messages: ChatMessage[]) => api.post("/ai/chat", { messages }),
};

// Health check
export const healthCheck = () => api.get("/health");

// Types
export interface ConnectionInput {
  name: string;
  type: "postgresql" | "mysql" | "mariadb";
  host: string;
  port?: number;
  database_name: string;
  username: string;
  password?: string;
  ssl?: boolean;
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

export default api;
