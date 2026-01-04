// LEGACY FILE - Re-exports from shared utilities
// This file maintains backward compatibility during migration
// Import from shared/utils/api and shared/types instead

// Re-export API client and endpoints
export { api as default } from '../shared/utils/api';
export * from '../shared/utils/api/endpoints';

// Re-export types
export type {
  ConnectionInput,
  ApiConfig,
  GoogleSheetsConfig,
  SavedQueryInput,
  ChartInput,
  ChartConfig,
  DashboardInput,
  LayoutItem,
  DashboardChartInput,
  CustomComponentInput,
  DatasetInput,
  Dataset,
  ChatMessage,
  AIContext,
} from '../shared/types';
