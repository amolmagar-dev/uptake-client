import React, { useState, useEffect, useMemo } from "react";
import {
  Database,
  Table,
  BarChart3,
  LayoutDashboard,
  FileText,
  ChevronDown,
  ChevronUp,
  X,
  Search,
  Plus,
  Check,
  Layers,
  Globe,
  FileSpreadsheet,
  Sparkles,
} from "lucide-react";
import {
  connectionsApi,
  datasetsApi,
  chartsApi,
  dashboardsApi,
  type Dataset,
} from "../../lib/api";

// Context Types
export interface ContextMetadata {
  tables?: string[];
  schema?: string;
  columns?: string[];
  chartType?: string;
  connectionType?: string;
  datasetType?: string;
}

export interface SelectedContext {
  type: "connection" | "dataset" | "chart" | "dashboard" | "custom";
  id?: string;
  name: string;
  metadata?: ContextMetadata;
  customText?: string;
}

export interface AIContext {
  type: "connection" | "dataset" | "chart" | "dashboard" | "custom";
  id?: string;
  name: string;
  metadata?: Record<string, any>;
  customText?: string;
}

interface ContextSelectorProps {
  selectedContexts: SelectedContext[];
  onContextChange: (contexts: SelectedContext[]) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

type ContextTab = "connections" | "datasets" | "charts" | "dashboards" | "custom";

interface Connection {
  id: string;
  name: string;
  type: string;
  database_name?: string;
}

interface TableInfo {
  table_schema: string;
  table_name: string;
}

interface Chart {
  id: string;
  name: string;
  chart_type: string;
  dataset_name?: string;
}

interface Dashboard {
  id: string;
  name: string;
  description: string;
  chart_count: number;
}

const tabConfig = [
  { id: "connections" as ContextTab, label: "Connections", icon: Database },
  { id: "datasets" as ContextTab, label: "Datasets", icon: Layers },
  { id: "charts" as ContextTab, label: "Charts", icon: BarChart3 },
  { id: "dashboards" as ContextTab, label: "Dashboards", icon: LayoutDashboard },
  { id: "custom" as ContextTab, label: "Custom", icon: FileText },
];

export const ContextSelector: React.FC<ContextSelectorProps> = ({
  selectedContexts,
  onContextChange,
  isExpanded,
  onToggleExpand,
}) => {
  const [activeTab, setActiveTab] = useState<ContextTab>("connections");
  const [searchQuery, setSearchQuery] = useState("");
  const [customText, setCustomText] = useState("");

  // Data states
  const [connections, setConnections] = useState<Connection[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [charts, setCharts] = useState<Chart[]>([]);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(false);

  // Connection table expansion
  const [expandedConnection, setExpandedConnection] = useState<string | null>(null);
  const [connectionTables, setConnectionTables] = useState<Record<string, TableInfo[]>>({});
  const [selectedTables, setSelectedTables] = useState<Record<string, string[]>>({});

  // Fetch data on mount
  useEffect(() => {
    fetchConnections();
    fetchDatasets();
    fetchCharts();
    fetchDashboards();
  }, []);

  const fetchConnections = async () => {
    try {
      const response = await connectionsApi.getAll();
      const data = response.data;
      // Handle both array and object-wrapped responses
      setConnections(Array.isArray(data) ? data : (data?.data || data?.connections || []));
    } catch (error) {
      console.error("Failed to fetch connections:", error);
      setConnections([]);
    }
  };

  const fetchDatasets = async () => {
    try {
      const response = await datasetsApi.getAll();
      const data = response.data;
      setDatasets(Array.isArray(data) ? data : (data?.data || data?.datasets || []));
    } catch (error) {
      console.error("Failed to fetch datasets:", error);
      setDatasets([]);
    }
  };

  const fetchCharts = async () => {
    try {
      const response = await chartsApi.getAll();
      const data = response.data;
      setCharts(Array.isArray(data) ? data : (data?.data || data?.charts || []));
    } catch (error) {
      console.error("Failed to fetch charts:", error);
      setCharts([]);
    }
  };

  const fetchDashboards = async () => {
    try {
      const response = await dashboardsApi.getAll();
      const data = response.data;
      setDashboards(Array.isArray(data) ? data : (data?.data || data?.dashboards || []));
    } catch (error) {
      console.error("Failed to fetch dashboards:", error);
      setDashboards([]);
    }
  };

  const fetchConnectionTables = async (connectionId: string) => {
    if (connectionTables[connectionId]) return;
    
    setLoading(true);
    try {
      const response = await connectionsApi.getTables(connectionId);
      const data = response.data;
      const tables = Array.isArray(data) ? data : (data?.data || data?.tables || []);
      setConnectionTables((prev) => ({
        ...prev,
        [connectionId]: tables,
      }));
    } catch (error) {
      console.error("Failed to fetch tables:", error);
      setConnectionTables((prev) => ({
        ...prev,
        [connectionId]: [],
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionExpand = (connectionId: string) => {
    if (expandedConnection === connectionId) {
      setExpandedConnection(null);
    } else {
      setExpandedConnection(connectionId);
      fetchConnectionTables(connectionId);
    }
  };

  const isContextSelected = (type: SelectedContext["type"], id?: string): boolean => {
    return selectedContexts.some((ctx) => ctx.type === type && ctx.id === id);
  };

  const toggleContext = (context: SelectedContext) => {
    const exists = selectedContexts.find(
      (ctx) => ctx.type === context.type && ctx.id === context.id
    );

    if (exists) {
      onContextChange(selectedContexts.filter((ctx) => !(ctx.type === context.type && ctx.id === context.id)));
    } else {
      onContextChange([...selectedContexts, context]);
    }
  };

  const handleTableToggle = (connectionId: string, tableName: string, schema: string) => {
    const currentTables = selectedTables[connectionId] || [];
    const tableKey = `${schema}.${tableName}`;
    
    let newTables: string[];
    if (currentTables.includes(tableKey)) {
      newTables = currentTables.filter((t) => t !== tableKey);
    } else {
      newTables = [...currentTables, tableKey];
    }

    setSelectedTables((prev) => ({
      ...prev,
      [connectionId]: newTables,
    }));

    // Update the connection context with selected tables
    const connection = connections.find((c) => c.id === connectionId);
    if (connection) {
      const existingContext = selectedContexts.find(
        (ctx) => ctx.type === "connection" && ctx.id === connectionId
      );

      if (newTables.length > 0) {
        const newContext: SelectedContext = {
          type: "connection",
          id: connectionId,
          name: connection.name,
          metadata: {
            tables: newTables,
            connectionType: connection.type,
          },
        };

        if (existingContext) {
          onContextChange(
            selectedContexts.map((ctx) =>
              ctx.type === "connection" && ctx.id === connectionId ? newContext : ctx
            )
          );
        } else {
          onContextChange([...selectedContexts, newContext]);
        }
      } else if (existingContext) {
        onContextChange(
          selectedContexts.filter((ctx) => !(ctx.type === "connection" && ctx.id === connectionId))
        );
      }
    }
  };

  const addCustomContext = () => {
    if (!customText.trim()) return;

    const newContext: SelectedContext = {
      type: "custom",
      id: `custom-${Date.now()}`,
      name: customText.length > 30 ? customText.substring(0, 30) + "..." : customText,
      customText: customText,
    };

    onContextChange([...selectedContexts, newContext]);
    setCustomText("");
  };

  const removeContext = (context: SelectedContext) => {
    onContextChange(selectedContexts.filter((ctx) => !(ctx.type === context.type && ctx.id === context.id)));
    
    // Clear selected tables if removing a connection
    if (context.type === "connection" && context.id) {
      setSelectedTables((prev) => {
        const newState = { ...prev };
        delete newState[context.id!];
        return newState;
      });
    }
  };

  const getConnectionIcon = (type: string) => {
    switch (type) {
      case "api":
        return <Globe size={14} className="text-orange-500" />;
      case "googlesheet":
        return <FileSpreadsheet size={14} className="text-green-500" />;
      default:
        return <Database size={14} className="text-blue-500" />;
    }
  };

  // Filtered data based on search
  const filteredConnections = useMemo(() => {
    if (!searchQuery) return connections;
    return connections.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [connections, searchQuery]);

  const filteredDatasets = useMemo(() => {
    if (!searchQuery) return datasets;
    return datasets.filter((d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [datasets, searchQuery]);

  const filteredCharts = useMemo(() => {
    if (!searchQuery) return charts;
    return charts.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [charts, searchQuery]);

  const filteredDashboards = useMemo(() => {
    if (!searchQuery) return dashboards;
    return dashboards.filter((d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [dashboards, searchQuery]);

  return (
    <div className="border-b border-base-300 bg-base-200/30 animate-in fade-in duration-300">
      {/* Selected Context Chips */}
      {selectedContexts.length > 0 && (
        <div className="px-4 md:px-8 py-3 flex flex-wrap items-center gap-2 border-b border-base-300">
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-1.5">
            <Sparkles size={10} />
            Context
          </span>
          {selectedContexts.map((ctx) => (
            <div
              key={`${ctx.type}-${ctx.id}`}
              className="badge badge-primary badge-outline gap-1.5 pr-1 font-medium text-xs animate-in zoom-in duration-200"
            >
              {ctx.type === "connection" && <Database size={10} />}
              {ctx.type === "dataset" && <Layers size={10} />}
              {ctx.type === "chart" && <BarChart3 size={10} />}
              {ctx.type === "dashboard" && <LayoutDashboard size={10} />}
              {ctx.type === "custom" && <FileText size={10} />}
              <span className="max-w-[120px] truncate">{ctx.name}</span>
              {ctx.metadata?.tables && (
                <span className="opacity-60">({ctx.metadata.tables.length} tables)</span>
              )}
              <button
                onClick={() => removeContext(ctx)}
                className="btn btn-ghost btn-xs btn-circle hover:bg-error/20 hover:text-error ml-0.5"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={onToggleExpand}
        className="w-full px-4 md:px-8 py-2.5 flex items-center justify-between hover:bg-base-300/50 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <Plus
            size={14}
            className={`transition-transform duration-300 ${isExpanded ? "rotate-45" : ""}`}
          />
          <span className="text-xs font-bold uppercase tracking-wider opacity-60 group-hover:opacity-100">
            {isExpanded ? "Close Context Selector" : "Add Context"}
          </span>
        </div>
        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="px-4 md:px-8 pb-4 animate-in slide-in-from-top-2 duration-300">
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-base-300/50 rounded-xl mb-4">
            {tabConfig.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchQuery("");
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-tight transition-all ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-content shadow-md"
                    : "hover:bg-base-200 opacity-60 hover:opacity-100"
                }`}
              >
                <tab.icon size={12} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Search (not for custom tab) */}
          {activeTab !== "custom" && (
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-bordered input-sm w-full pl-9 bg-base-100 border-base-300 focus:border-primary"
              />
            </div>
          )}

          {/* Content */}
          <div className="max-h-[200px] overflow-y-auto custom-scrollbar rounded-lg border border-base-300 bg-base-100">
            {/* Connections Tab */}
            {activeTab === "connections" && (
              <div className="divide-y divide-base-200">
                {filteredConnections.length === 0 ? (
                  <div className="p-4 text-center text-sm opacity-50">No connections found</div>
                ) : (
                  filteredConnections.map((conn) => (
                    <div key={conn.id}>
                      <div
                        className="flex items-center justify-between p-3 hover:bg-base-200/50 cursor-pointer transition-colors"
                        onClick={() => handleConnectionExpand(conn.id)}
                      >
                        <div className="flex items-center gap-2">
                          {getConnectionIcon(conn.type)}
                          <span className="font-medium text-sm">{conn.name}</span>
                          <span className="badge badge-ghost badge-xs opacity-50">{conn.type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isContextSelected("connection", conn.id) && (
                            <Check size={14} className="text-primary" />
                          )}
                          <ChevronDown
                            size={14}
                            className={`transition-transform ${
                              expandedConnection === conn.id ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </div>
                      {/* Tables list */}
                      {expandedConnection === conn.id && (
                        <div className="bg-base-200/30 border-t border-base-200 animate-in slide-in-from-top-1 duration-200">
                          {loading ? (
                            <div className="p-3 flex items-center gap-2">
                              <span className="loading loading-spinner loading-xs"></span>
                              <span className="text-xs opacity-50">Loading tables...</span>
                            </div>
                          ) : connectionTables[conn.id]?.length === 0 ? (
                            <div className="p-3 text-xs opacity-50">No tables found</div>
                          ) : (
                            <div className="p-2 flex flex-wrap gap-1.5">
                              {connectionTables[conn.id]?.map((table) => {
                                const tableKey = `${table.table_schema}.${table.table_name}`;
                                const isSelected = selectedTables[conn.id]?.includes(tableKey);
                                return (
                                  <button
                                    key={tableKey}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTableToggle(conn.id, table.table_name, table.table_schema);
                                    }}
                                    className={`btn btn-xs gap-1 ${
                                      isSelected
                                        ? "btn-primary"
                                        : "btn-ghost border border-base-300"
                                    }`}
                                  >
                                    <Table size={10} />
                                    {table.table_name}
                                    {isSelected && <Check size={10} />}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Datasets Tab */}
            {activeTab === "datasets" && (
              <div className="divide-y divide-base-200">
                {filteredDatasets.length === 0 ? (
                  <div className="p-4 text-center text-sm opacity-50">No datasets found</div>
                ) : (
                  filteredDatasets.map((dataset) => {
                    const isSelected = isContextSelected("dataset", dataset.id);
                    return (
                      <div
                        key={dataset.id}
                        onClick={() =>
                          toggleContext({
                            type: "dataset",
                            id: dataset.id,
                            name: dataset.name,
                            metadata: {
                              datasetType: dataset.dataset_type,
                              columns: dataset.columns?.map((c) => c.column_name),
                            },
                          })
                        }
                        className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                          isSelected ? "bg-primary/10" : "hover:bg-base-200/50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Layers size={14} className="text-purple-500" />
                          <span className="font-medium text-sm">{dataset.name}</span>
                          <span className="badge badge-ghost badge-xs opacity-50">
                            {dataset.dataset_type}
                          </span>
                        </div>
                        {isSelected && <Check size={14} className="text-primary" />}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Charts Tab */}
            {activeTab === "charts" && (
              <div className="divide-y divide-base-200">
                {filteredCharts.length === 0 ? (
                  <div className="p-4 text-center text-sm opacity-50">No charts found</div>
                ) : (
                  filteredCharts.map((chart) => {
                    const isSelected = isContextSelected("chart", chart.id);
                    return (
                      <div
                        key={chart.id}
                        onClick={() =>
                          toggleContext({
                            type: "chart",
                            id: chart.id,
                            name: chart.name,
                            metadata: {
                              chartType: chart.chart_type,
                            },
                          })
                        }
                        className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                          isSelected ? "bg-primary/10" : "hover:bg-base-200/50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <BarChart3 size={14} className="text-emerald-500" />
                          <span className="font-medium text-sm">{chart.name}</span>
                          <span className="badge badge-ghost badge-xs opacity-50">
                            {chart.chart_type}
                          </span>
                        </div>
                        {isSelected && <Check size={14} className="text-primary" />}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Dashboards Tab */}
            {activeTab === "dashboards" && (
              <div className="divide-y divide-base-200">
                {filteredDashboards.length === 0 ? (
                  <div className="p-4 text-center text-sm opacity-50">No dashboards found</div>
                ) : (
                  filteredDashboards.map((dashboard) => {
                    const isSelected = isContextSelected("dashboard", dashboard.id);
                    return (
                      <div
                        key={dashboard.id}
                        onClick={() =>
                          toggleContext({
                            type: "dashboard",
                            id: dashboard.id,
                            name: dashboard.name,
                          })
                        }
                        className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                          isSelected ? "bg-primary/10" : "hover:bg-base-200/50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <LayoutDashboard size={14} className="text-cyan-500" />
                          <span className="font-medium text-sm">{dashboard.name}</span>
                          <span className="badge badge-ghost badge-xs opacity-50">
                            {dashboard.chart_count} charts
                          </span>
                        </div>
                        {isSelected && <Check size={14} className="text-primary" />}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Custom Tab */}
            {activeTab === "custom" && (
              <div className="p-3">
                <textarea
                  placeholder="Enter custom context for the AI... (e.g., 'Focus on sales data from Q4 2023' or 'The user prefers bar charts')"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="textarea textarea-bordered w-full min-h-[80px] text-sm bg-base-100 focus:textarea-primary"
                />
                <button
                  onClick={addCustomContext}
                  disabled={!customText.trim()}
                  className="btn btn-primary btn-sm mt-2 gap-1"
                >
                  <Plus size={14} />
                  Add Custom Context
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContextSelector;
