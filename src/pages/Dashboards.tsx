import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ResourceListing } from "../shared/components/ResourceListing";
import {
  Plus,
  LayoutDashboard,
  Trash2,
  Edit,
  Search,
  X,
  Star,
  Copy,
  RefreshCw,
  MoreHorizontal,
  Timer,
  Check,
} from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Responsive, WidthProvider, type Layout } from "react-grid-layout";
import { Button } from "../shared/components/ui/Button";
import { Input, Textarea, Checkbox } from "../shared/components/ui/Input";
import { Modal, ConfirmModal } from "../shared/components/ui/Modal";
import { DraggableChart } from "../components/charts/DraggableChart";
import { DraggableComponent } from "../components/charts/DraggableComponent";
import { FiltersSidebar, type DashboardFilter } from "../components/dashboard/FiltersSidebar";
import { FilterModal } from "../components/dashboard/FilterModal";
import { dashboardsApi, chartsApi, customComponentsApi } from "../lib/api";
import { useAppStore } from "../store/appStore";
import { useFavoritesStore } from "../store/favoritesStore";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

interface Dashboard {
  id: string;
  name: string;
  description: string;
  layout: any[];
  is_public: number;
  chart_count: number;
  created_by_name: string;
  charts?: DashboardChart[];
}

interface DashboardChart {
  id: string;
  chart_id?: string;
  component_id?: string;
  type?: "chart" | "component";
  name: string;
  chart_type?: string;
  config: any;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  // Component-specific fields
  html_content?: string;
  css_content?: string;
  js_content?: string;
}

interface ChartData {
  chartId: string;
  dashboardChartId: string;
  data: any[];
  config: any;
  error?: string;
}

// Favorite Button Component
const FavoriteButton: React.FC<{ dashboard: Dashboard }> = ({ dashboard }) => {
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const favorite = isFavorite(dashboard.id);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleFavorite({
          id: dashboard.id,
          type: "dashboard",
          name: dashboard.name,
          path: `/dashboard/${dashboard.id}`,
        });
      }}
      className={`p-2 rounded-lg transition-colors ${
        favorite ? "text-accent-warning hover:text-accent-warning/80" : "text-text-muted hover:text-text-secondary"
      }`}
      title={favorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Star size={16} fill={favorite ? "currentColor" : "none"} />
    </button>
  );
};

// Clone Button Component
const CloneButton: React.FC<{ dashboardId: string; onClone: () => void }> = ({ dashboardId, onClone }) => {
  const { addToast } = useAppStore();
  const [isCloning, setIsCloning] = useState(false);

  const handleClone = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCloning(true);
    try {
      await dashboardsApi.clone(dashboardId);
      addToast("success", "Dashboard cloned successfully");
      onClone();
    } catch (error) {
      addToast("error", "Failed to clone dashboard");
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <button
      onClick={handleClone}
      disabled={isCloning}
      className="p-2 rounded-lg text-text-muted hover:text-text-secondary transition-colors disabled:opacity-50"
      title="Clone dashboard"
    >
      <Copy size={16} className={isCloning ? "animate-pulse" : ""} />
    </button>
  );
};

export const DashboardsPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useAppStore();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDashboard, setEditingDashboard] = useState<Dashboard | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchDashboards = async () => {
    try {
      const response = await dashboardsApi.getAll();
      setDashboards(response.data.dashboards);
    } catch (error) {
      addToast("error", "Failed to fetch dashboards");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboards();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await dashboardsApi.delete(id);
      addToast("success", "Dashboard deleted");
      fetchDashboards();
    } catch (error) {
      addToast("error", "Failed to delete dashboard");
    } finally {
      setDeleteConfirm(null);
    }
  };

  // Grid Item Renderer
  const renderGridItem = (dashboard: Dashboard) => (
    <div
      key={dashboard.id}
      className="card bg-base-100 border border-base-300 hover:border-primary/50 transition-all shadow-sm hover:shadow-md h-full"
    >
      <div className="card-body p-6 flex flex-col h-full">
        {/* Icon & Title */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <LayoutDashboard size={24} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3
                className="card-title text-base hover:text-primary cursor-pointer truncate"
                onClick={() => navigate(`/dashboard/${dashboard.id}`)}
              >
                {dashboard.name}
              </h3>
              {dashboard.is_public === 1 && (
                <span className="badge badge-sm badge-outline badge-primary">Public</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs opacity-60">
              <span>{dashboard.chart_count} charts</span>
              <span>•</span>
              <span className="truncate">By {dashboard.created_by_name}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        {dashboard.description && (
          <p className="text-sm opacity-70 line-clamp-2 mb-6 h-10 flex-grow-0">{dashboard.description}</p>
        )}
        
        <div className="flex-grow"></div>

        {/* Actions */}
        <div className="card-actions justify-end mt-auto pt-4 border-t border-base-200">
          <div className="flex items-center gap-1">
            <FavoriteButton dashboard={dashboard} />
            <CloneButton dashboardId={dashboard.id} onClone={fetchDashboards} />
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-sm btn-square">
                <MoreHorizontal size={18} />
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content z-10 menu p-2 shadow-xl bg-base-200 rounded-box w-40 border border-base-300"
              >
                <li>
                  <button
                    onClick={() => {
                      setEditingDashboard(dashboard);
                      setShowModal(true);
                    }}
                  >
                    <Edit size={14} /> Edit
                  </button>
                </li>
                <li>
                  <button className="text-error" onClick={() => setDeleteConfirm(dashboard.id)}>
                    <Trash2 size={14} /> Delete
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // List Item Renderer
  const renderListItem = (dashboard: Dashboard) => (
    <div
      key={dashboard.id}
      className="card bg-base-100 border border-base-300 hover:border-primary/50 transition-all shadow-sm hover:shadow-md card-side"
    >
      <div className="card-body flex-row items-center gap-6 py-4 w-full">
        {/* Icon & Title */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <LayoutDashboard size={24} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3
                className="card-title text-base hover:text-primary cursor-pointer truncate"
                onClick={() => navigate(`/dashboard/${dashboard.id}`)}
              >
                {dashboard.name}
              </h3>
              {dashboard.is_public === 1 && (
                <span className="badge badge-sm badge-outline badge-primary">Public</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs opacity-60">
              <span>{dashboard.chart_count} charts</span>
              <span>•</span>
              <span className="truncate">By {dashboard.created_by_name}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="card-actions justify-end">
          <div className="flex items-center gap-1">
            <FavoriteButton dashboard={dashboard} />
            <CloneButton dashboardId={dashboard.id} onClone={fetchDashboards} />
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-sm btn-square">
                <MoreHorizontal size={18} />
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content z-10 menu p-2 shadow-xl bg-base-200 rounded-box w-40 border border-base-300"
              >
                <li>
                  <button
                    onClick={() => {
                      setEditingDashboard(dashboard);
                      setShowModal(true);
                    }}
                  >
                    <Edit size={14} /> Edit
                  </button>
                </li>
                <li>
                  <button className="text-error" onClick={() => setDeleteConfirm(dashboard.id)}>
                    <Trash2 size={14} /> Delete
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="card bg-base-200 border border-base-300 text-center py-16">
      <div className="card-body items-center">
        <LayoutDashboard size={48} className="mb-4 opacity-20" />
        <h3 className="text-xl font-bold">No dashboards yet</h3>
        <p className="text-base-content/60 max-w-sm mb-6">
          Get started by creating your first dashboard to organize and visualize your data.
        </p>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Create Dashboard
        </button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <>
      <ResourceListing
        title="Dashboards"
        description="Create and manage your data dashboards"
        items={dashboards}
        renderGridItem={renderGridItem}
        renderListItem={renderListItem}
        renderEmptyState={renderEmptyState}
        onCreate={() => {
          setEditingDashboard(null);
          setShowModal(true);
        }}
        createButtonText="Create Dashboard"
        onSearch={() => {}} // Internal search used
        filterFunction={(d, query) => 
          d.name.toLowerCase().includes(query.toLowerCase()) ||
          d.description?.toLowerCase().includes(query.toLowerCase()) ||
          d.created_by_name?.toLowerCase().includes(query.toLowerCase())
        }
        actions={
          <div className="hidden sm:block">
             {/* Reclaiming the space for future actions or keep simple */}
          </div>
        }
      />

      <DashboardModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingDashboard(null);
        }}
        dashboard={editingDashboard}
        onSuccess={() => {
          setShowModal(false);
          setEditingDashboard(null);
          fetchDashboards();
        }}
      />

      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Dashboard"
        message="Are you sure you want to delete this dashboard? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
};

interface DashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  dashboard: Dashboard | null;
  onSuccess: () => void;
}

const DashboardModal: React.FC<DashboardModalProps> = ({ isOpen, onClose, dashboard, onSuccess }) => {
  const { addToast } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_public: false,
  });

  useEffect(() => {
    if (dashboard) {
      setFormData({
        name: dashboard.name,
        description: dashboard.description || "",
        is_public: dashboard.is_public === 1,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        is_public: false,
      });
    }
  }, [dashboard, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (dashboard) {
        await dashboardsApi.update(dashboard.id, formData);
        addToast("success", "Dashboard updated successfully");
      } else {
        await dashboardsApi.create(formData);
        addToast("success", "Dashboard created successfully");
      }
      onSuccess();
    } catch (error: any) {
      addToast("error", error.response?.data?.error || "Failed to save dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={dashboard ? "Edit Dashboard" : "Create New Dashboard"} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Dashboard Name"
          placeholder="Sales Overview"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          required
        />

        <Textarea
          label="Description (optional)"
          placeholder="A brief description of this dashboard"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          rows={3}
        />

        <Checkbox
          label="Make this dashboard public"
          description="Anyone with the link can view this dashboard"
          checked={formData.is_public}
          onChange={(e) => setFormData((prev) => ({ ...prev, is_public: e.target.checked }))}
        />

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {dashboard ? "Update" : "Create"} Dashboard
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// More Options Dropdown Component for Dashboard View
interface MoreOptionsDropdownProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  lastRefresh: Date | null;
  autoRefresh: boolean;
  setAutoRefresh: (value: boolean) => void;
  refreshInterval: number;
  setRefreshInterval: (value: number) => void;
}

const MoreOptionsDropdown: React.FC<MoreOptionsDropdownProps> = ({
  onRefresh,
  isRefreshing,
  lastRefresh,
  autoRefresh,
  setAutoRefresh,
  refreshInterval,
  setRefreshInterval,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showIntervalMenu, setShowIntervalMenu] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowIntervalMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const intervalOptions = [
    { value: 0, label: "Off" },
    { value: 10, label: "10 seconds" },
    { value: 30, label: "30 seconds" },
    { value: 60, label: "1 minute" },
    { value: 300, label: "5 minutes" },
  ];

  const handleIntervalSelect = (value: number) => {
    if (value === 0) {
      setAutoRefresh(false);
    } else {
      setAutoRefresh(true);
      setRefreshInterval(value);
    }
    setShowIntervalMenu(false);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Last refresh indicator */}
      {lastRefresh && <span className="text-xs text-[#606070] mr-2">Updated {lastRefresh.toLocaleTimeString()}</span>}

      {/* More Options Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-bg-tertiary border border-border text-text-muted hover:text-text-primary hover:border-accent-primary transition-colors"
        title="More options"
      >
        <MoreHorizontal size={20} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-bg-secondary border border-border rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Refresh Dashboard */}
          <button
            onClick={() => {
              onRefresh();
              setIsOpen(false);
            }}
            disabled={isRefreshing}
            className="w-full flex items-center gap-3 px-4 py-3 text-left text-text-primary hover:bg-bg-tertiary transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin text-accent-primary" : ""} />
            <span>Refresh dashboard</span>
          </button>

          {/* Auto-refresh Interval (with submenu) */}
          <div className="relative">
            <button
              onClick={() => setShowIntervalMenu(!showIntervalMenu)}
              className="w-full flex items-center justify-between px-4 py-3 text-left text-text-primary hover:bg-bg-tertiary transition-colors"
            >
              <div className="flex items-center gap-3">
                <Timer size={16} />
                <span>Set auto-refresh interval</span>
              </div>
              <span className="text-xs text-text-muted">
                {autoRefresh ? intervalOptions.find((o) => o.value === refreshInterval)?.label : "Off"}
              </span>
            </button>

            {/* Submenu */}
            {showIntervalMenu && (
              <div className="absolute left-full top-0 ml-1 w-40 bg-bg-secondary border border-border rounded-lg shadow-xl z-50 overflow-hidden">
                {intervalOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleIntervalSelect(option.value)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-left text-text-primary hover:bg-bg-tertiary transition-colors"
                  >
                    <span className="text-sm">{option.label}</span>
                    {((option.value === 0 && !autoRefresh) || (autoRefresh && option.value === refreshInterval)) && (
                      <Check size={14} className="text-accent-primary" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Auto-refresh status indicator */}
          {autoRefresh && (
            <div className="px-4 py-2 text-xs text-text-muted flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" />
              Auto-refreshing every {intervalOptions.find((o) => o.value === refreshInterval)?.label}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Dashboard View Page
export const DashboardViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const isEditMode = location.pathname.endsWith("/edit");
  const { addToast } = useAppStore();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [availableCharts, setAvailableCharts] = useState<any[]>([]);
  const [availableComponents, setAvailableComponents] = useState<any[]>([]);
  const [layouts, setLayouts] = useState<Record<string, Layout[]>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedChart, setSelectedChart] = useState<DashboardChart | null>(null);
  const [showChartSettings, setShowChartSettings] = useState(false);
  const [chartDimensions, setChartDimensions] = useState({ width: 6, height: 4 });
  const [drawerTab, setDrawerTab] = useState<"charts" | "components">("charts");
  const [drawerSearch, setDrawerSearch] = useState("");

  // Filters state
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [dashboardFilters, setDashboardFilters] = useState<DashboardFilter[]>([]);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});

  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Filter items in drawer based on search
  const filteredCharts = useMemo(() => {
    if (!drawerSearch.trim()) return availableCharts;
    const query = drawerSearch.toLowerCase();
    return availableCharts.filter((c) => c.name.toLowerCase().includes(query));
  }, [availableCharts, drawerSearch]);

  const filteredComponents = useMemo(() => {
    if (!drawerSearch.trim()) return availableComponents;
    const query = drawerSearch.toLowerCase();
    return availableComponents.filter((c) => c.name.toLowerCase().includes(query));
  }, [availableComponents, drawerSearch]);

  // Track if filters are applied
  const [filtersApplied, setFiltersApplied] = useState(false);

  // Apply filters to chart data
  const filteredChartData = useMemo(() => {
    if (!filtersApplied || dashboardFilters.length === 0) {
      return chartData;
    }

    // Apply each filter to the chart data
    return chartData.map((chart) => {
      if (!chart.data || !Array.isArray(chart.data)) {
        return chart;
      }

      let filteredData = [...chart.data];

      dashboardFilters.forEach((filter) => {
        const filterValue = filterValues[filter.id];
        if (filterValue === undefined || filterValue === null || filterValue === "") {
          return; // Skip empty filter values
        }

        const column = filter.column;

        if (filter.type === "value") {
          // Filter by exact value match
          filteredData = filteredData.filter((row: any) => {
            const rowValue = row[column];
            if (filter.config.multiSelect && Array.isArray(filterValue)) {
              return filterValue.includes(rowValue);
            }
            return rowValue === filterValue || String(rowValue) === String(filterValue);
          });
        } else if (filter.type === "time_range") {
          // Filter by date range
          if (filterValue.start || filterValue.end) {
            filteredData = filteredData.filter((row: any) => {
              const rowDate = new Date(row[column]);
              if (filterValue.start && rowDate < new Date(filterValue.start)) return false;
              if (filterValue.end && rowDate > new Date(filterValue.end)) return false;
              return true;
            });
          }
        } else if (filter.type === "numerical_range") {
          // Filter by number range
          filteredData = filteredData.filter((row: any) => {
            const rowValue = Number(row[column]);
            if (filterValue.min !== undefined && filterValue.min !== "" && rowValue < Number(filterValue.min))
              return false;
            if (filterValue.max !== undefined && filterValue.max !== "" && rowValue > Number(filterValue.max))
              return false;
            return true;
          });
        }
      });

      return { ...chart, data: filteredData };
    });
  }, [chartData, dashboardFilters, filterValues, filtersApplied]);

  const fetchDashboard = async (filters: Record<string, any> = {}) => {
    if (!id) return;
    try {
      // Build filter context - map filter ID to value, but backend expects column to value?
      // The plan said: "filterContext[filter.column] = filterValues[filter.id]"
      
      // We need to map filterValues (by ID) to actual filter columns if we want cleaner usage in SQL
      // But we can also just pass the map we have. 
      // Let's pass the raw filterValues map (by ID) AND a mapped version if we have dashboard filters loaded?
      // Actually, let's look at how filterValues is structured: { [filterId]: value }
      
      // Best to resolve columns here if possible, but dashboard might not be loaded yet on first run.
      // However, for handleApplyFilters, dashboard IS loaded.
      
      let resolvedFilters = filters;
      
      // If we have dashboard definitions, map id -> column for easier SQL usage
      if (dashboardFilters.length > 0) {
        resolvedFilters = {};
        dashboardFilters.forEach(f => {
          if (filters[f.id] !== undefined) {
             resolvedFilters[f.column] = filters[f.id];
             // Also keep ID-based mapping for safety/flexibility?
             resolvedFilters[f.id] = filters[f.id];
          }
        });
      }

      const [dashboardRes, dataRes] = await Promise.all([
        dashboardsApi.getOne(id), 
        dashboardsApi.getData(id, resolvedFilters)
      ]);
      setDashboard(dashboardRes.data.dashboard);
      setChartData(dataRes.data.chartData);

      // Load saved filters from dashboard
      if (dashboardRes.data.dashboard.filters && Array.isArray(dashboardRes.data.dashboard.filters)) {
        setDashboardFilters(dashboardRes.data.dashboard.filters);
      }

      // Initialize layouts from dashboard charts
      if (dashboardRes.data.dashboard.charts) {
        const initialLayout = dashboardRes.data.dashboard.charts.map((chart: DashboardChart) => ({
          i: chart.id,
          x: chart.position_x || 0,
          y: chart.position_y || 0,
          w: chart.width || 6,
          h: chart.height || 4,
          minW: 3,
          minH: 3,
          maxW: 12,
          maxH: 12,
        }));
        setLayouts({ lg: initialLayout });
      }
    } catch (error) {
      addToast("error", "Failed to load dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableCharts = async () => {
    try {
      const response = await chartsApi.getAll();
      setAvailableCharts(response.data.charts);
    } catch (error) {
      console.error("Failed to fetch charts");
    }
  };

  const fetchAvailableComponents = async () => {
    try {
      const response = await customComponentsApi.getAll();
      setAvailableComponents(response.data.components);
    } catch (error) {
      console.error("Failed to fetch components");
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchAvailableCharts();
    fetchAvailableComponents();
  }, [id]);

  // Force grid to recalculate width when edit mode or filters sidebar changes
  useEffect(() => {
    // Small delay to let DOM update first
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 100);
    return () => clearTimeout(timer);
  }, [isEditMode, filtersOpen]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh || !id) return;

    const refreshData = async () => {
      setIsRefreshing(true);
      try {
        const dataRes = await dashboardsApi.getData(id);
        setChartData(dataRes.data.chartData);
        setLastRefresh(new Date());
      } catch (error) {
        console.error("Auto-refresh failed:", error);
      } finally {
        setIsRefreshing(false);
      }
    };

    const intervalId = setInterval(refreshData, refreshInterval * 1000);
    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, id]);

  // Manual refresh function
  const handleManualRefresh = async () => {
    if (!id || isRefreshing) return;
    setIsRefreshing(true);
    try {
      const dataRes = await dashboardsApi.getData(id);
      setChartData(dataRes.data.chartData);
      setLastRefresh(new Date());
      addToast("success", "Dashboard refreshed");
    } catch (error) {
      addToast("error", "Failed to refresh dashboard");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLayoutChange = useCallback(
    async (layout: Layout[], allLayouts: Record<string, Layout[]>) => {
      setLayouts(allLayouts);

      // Debounce API calls to avoid too many requests
      if (isUpdating) return;
      setIsUpdating(true);

      setTimeout(async () => {
        if (!id || !dashboard?.charts) return;

        try {
          const updatePromises = layout.map((item) => {
            const chart = dashboard.charts!.find((c: DashboardChart) => c.id === item.i);
            if (chart) {
              return dashboardsApi.updateChart(id, chart.id, {
                position_x: item.x,
                position_y: item.y,
                width: item.w,
                height: item.h,
              });
            }
            return Promise.resolve();
          });

          await Promise.all(updatePromises);
          addToast("success", "Layout updated");
        } catch (error) {
          addToast("error", "Failed to update layout");
        } finally {
          setIsUpdating(false);
        }
      }, 500);
    },
    [id, dashboard, isUpdating, addToast]
  );

  const handleAddChart = async (chartId: string) => {
    if (!id) return;
    try {
      await dashboardsApi.addChart(id, {
        chart_id: chartId,
        position_x: 0,
        position_y: 0,
        width: 6,
        height: 4,
      });
      addToast("success", "Chart added to dashboard");
      fetchDashboard();
    } catch (error) {
      addToast("error", "Failed to add chart");
    }
  };

  const handleAddComponent = async (componentId: string) => {
    if (!id) return;
    try {
      await dashboardsApi.addChart(id, {
        component_id: componentId,
        position_x: 0,
        position_y: 0,
        width: 6,
        height: 4,
      } as any);
      addToast("success", "Component added to dashboard");
      fetchDashboard();
    } catch (error) {
      addToast("error", "Failed to add component");
    }
  };

  const handleRemoveChart = async (dashboardChartId: string) => {
    if (!id) return;
    try {
      await dashboardsApi.removeChart(id, dashboardChartId);
      addToast("success", "Chart removed from dashboard");
      fetchDashboard();
    } catch (error) {
      addToast("error", "Failed to remove chart");
    }
  };

  const handleChartSettings = (chartId: string) => {
    const chart = dashboard?.charts?.find((c) => c.id === chartId);
    if (chart) {
      setSelectedChart(chart);
      setChartDimensions({ width: chart.width || 6, height: chart.height || 4 });
      setShowChartSettings(true);
    }
  };

  const handleSaveChartSettings = async () => {
    if (!id || !selectedChart) return;
    try {
      await dashboardsApi.updateChart(id, selectedChart.id, {
        width: chartDimensions.width,
        height: chartDimensions.height,
      });
      addToast("success", "Chart dimensions updated");
      setShowChartSettings(false);
      setSelectedChart(null);
      fetchDashboard();
    } catch (error) {
      addToast("error", "Failed to update chart dimensions");
    }
  };

  // Filter handlers
  const handleToggleFilters = () => {
    setFiltersOpen(!filtersOpen);
  };

  const handleAddFilter = () => {
    setShowFilterModal(true);
  };

  const handleEditFilter = (_filter: DashboardFilter) => {
    setShowFilterModal(true);
  };

  const handleRemoveFilter = async (filterId: string) => {
    // 1. Optimistic update
    const oldFilters = [...dashboardFilters];
    const newFilters = dashboardFilters.filter((f) => f.id !== filterId);
    
    setDashboardFilters(newFilters);
    const newFilterValues = { ...filterValues };
    delete newFilterValues[filterId];
    setFilterValues(newFilterValues);

    // 2. API Call
    if (id) {
      try {
        await dashboardsApi.update(id, { filters: newFilters });
        addToast("success", "Filter deleted");
      } catch (error) {
        // 3. Revert on error
        console.error("Failed to delete filter:", error);
        addToast("error", "Failed to delete filter");
        setDashboardFilters(oldFilters); 
        // Note: We don't necessarily need to revert filterValues since the filter is back, 
        // but the value might be lost. That's acceptable for a revert scenario.
      }
    }
  };

  const handleSaveFilters = async (filters: DashboardFilter[]) => {
    console.log("Saving filters:", filters);
    setDashboardFilters(filters);
    setShowFilterModal(false);

    // Persist filters to backend
    if (id) {
      try {
        await dashboardsApi.update(id, { filters });
        if (filters.length > 0) {
          addToast("success", `${filters.length} filter(s) saved`);
        }
      } catch (error) {
        console.error("Failed to save filters:", error);
        addToast("error", "Failed to save filters");
      }
    }
  };

  const handleApplyFilters = () => {
    setFiltersApplied(true);
    addToast("success", "Filters applied");
    fetchDashboard(filterValues);
  };

  const handleClearFilters = () => {
    setFilterValues({});
    setFiltersApplied(false);
    addToast("info", "Filters cleared");
  };

  const handleFilterValueChange = (filterId: string, value: any) => {
    setFilterValues({ ...filterValues, [filterId]: value });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="text-center py-12">
        <p className="text-[#a0a0b0]">Dashboard not found</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative bg-base-100 overflow-visible">
      {/* Filters Sidebar - at root level, fixed position */}
      <FiltersSidebar
        isOpen={filtersOpen}
        onToggle={handleToggleFilters}
        filters={dashboardFilters}
        onAddFilter={handleAddFilter}
        onEditFilter={handleEditFilter}
        onRemoveFilter={handleRemoveFilter}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        filterValues={filterValues}
        onFilterValueChange={handleFilterValueChange}
      />

      {/* Main wrapper with left margin for sidebar */}
      <div
        className={`flex-1 flex flex-col ${
          filtersOpen ? "ml-72" : "ml-10"
        } transition-all duration-200 h-full overflow-visible`}
      >
        {/* Fixed Header */}
        <div className="navbar bg-base-100/95 backdrop-blur-md sticky top-0 z-30 px-6 border-b border-base-300 min-h-20">
          <div className="flex-1 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <LayoutDashboard size={22} />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-xl font-bold leading-tight text-base-content">{dashboard.name}</h1>
              {dashboard.description && (
                <p className="opacity-50 text-[10px] uppercase tracking-wider font-bold truncate max-w-md mt-0.5">
                  {dashboard.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex-none flex items-center gap-3">
            {!isEditMode && (
              <MoreOptionsDropdown
                onRefresh={handleManualRefresh}
                isRefreshing={isRefreshing}
                lastRefresh={lastRefresh}
                autoRefresh={autoRefresh}
                setAutoRefresh={setAutoRefresh}
                refreshInterval={refreshInterval}
                setRefreshInterval={setRefreshInterval}
              />
            )}

            {isEditMode ? (
              <button className="btn btn-secondary btn-sm gap-2" onClick={() => navigate(`/dashboard/${id}`)}>
                <X size={16} />
                <span className="hidden sm:inline">Exit Edit Mode</span>
              </button>
            ) : (
              <button className="btn btn-primary btn-sm gap-2" onClick={() => navigate(`/dashboard/${id}/edit`)}>
                <Edit size={16} />
                <span className="hidden sm:inline">Edit dashboard</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-visible">
          <div className="transition-all duration-200 p-6 flex-1">
            {dashboard.charts && dashboard.charts.length > 0 ? (
              <div className="dashboard-grid w-full">
                <ResponsiveGridLayout
                  key={`grid-${isEditMode ? "edit" : "view"}-${filtersOpen ? "filters" : "nofilters"}`}
                  className="layout"
                  layouts={layouts}
                  breakpoints={{ lg: 1200, md: 900, sm: 600, xs: 400, xxs: 0 }}
                  cols={{ lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 }}
                  rowHeight={100}
                  onLayoutChange={isEditMode ? handleLayoutChange : undefined}
                  isDraggable={isEditMode}
                  isResizable={isEditMode}
                  useCSSTransforms={true}
                  compactType="vertical"
                  preventCollision={false}
                >
                  {dashboard.charts.map((item) => {
                    const itemId = item.component_id || item.chart_id;
                    const data = filteredChartData.find((d) => d.chartId === itemId);
                    const itemHeight = (item.height || 4) * 100 - 50;

                    if (item.type === "component" || item.component_id) {
                      return (
                        <div key={item.id} className="grid-item">
                          <DraggableComponent
                            id={item.id}
                            name={item.name}
                            htmlContent={item.html_content || ""}
                            cssContent={item.css_content}
                            jsContent={item.js_content}
                            data={data?.data}
                            error={data?.error}
                            onRemove={isEditMode ? handleRemoveChart : undefined}
                            onSettings={isEditMode ? handleChartSettings : undefined}
                            height={itemHeight}
                          />
                        </div>
                      );
                    }

                    return (
                      <div key={item.id} className="grid-item">
                        <DraggableChart
                          id={item.id}
                          name={item.name}
                          chartType={item.chart_type || "bar"}
                          data={data?.data}
                          config={data?.config || item.config}
                          error={data?.error}
                          onRemove={isEditMode ? handleRemoveChart : undefined}
                          onSettings={isEditMode ? handleChartSettings : undefined}
                          height={itemHeight}
                        />
                      </div>
                    );
                  })}
                </ResponsiveGridLayout>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 opacity-20">
                <LayoutDashboard size={80} className="mb-6" />
                <h3 className="text-2xl font-bold mb-2">Empty Dashboard</h3>
                <p className="max-w-md text-center mb-8">
                  {isEditMode
                    ? "Add charts or components from the right panel to build your dashboard."
                    : "This dashboard doesn't have any content yet. Click edit to add some."}
                </p>
                {!isEditMode && (
                  <button className="btn btn-primary" onClick={() => navigate(`/dashboard/${id}/edit`)}>
                    <Edit size={18} /> Edit Dashboard
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar Panel - Only in Edit Mode */}
          {isEditMode && (
            <div className="sticky top-20 self-start w-80 h-[calc(100vh-144px)] bg-base-200 border-l border-base-300 flex flex-col z-40 animate-in slide-in-from-right duration-300">
              {/* Tabs Header */}
              <div className="tabs tabs-boxed rounded-none bg-base-300/50 p-1">
                <button
                  onClick={() => setDrawerTab("charts")}
                  className={`tab flex-1 transition-all ${
                    drawerTab === "charts" ? "tab-active bg-primary! text-primary-content!" : "text-base-content/60"
                  }`}
                >
                  Charts
                </button>
                <button
                  onClick={() => setDrawerTab("components")}
                  className={`tab flex-1 transition-all ${
                    drawerTab === "components" ? "tab-active bg-primary! text-primary-content!" : "text-base-content/60"
                  }`}
                >
                  Components
                </button>
              </div>

              <div className="flex-1 flex flex-col min-h-0 bg-base-100">
                {/* Create New Link */}
                <div className="p-4 border-b border-base-200">
                  <button
                    onClick={() => navigate(drawerTab === "charts" ? "/charts" : "/components")}
                    className="btn btn-outline btn-primary btn-sm btn-block gap-2"
                  >
                    <Plus size={16} />
                    New {drawerTab === "charts" ? "Chart" : "Component"}
                  </button>
                </div>

                {/* Search */}
                <div className="p-4 bg-base-200/50">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
                    <input
                      type="text"
                      placeholder={`Search ${drawerTab}...`}
                      value={drawerSearch}
                      onChange={(e) => setDrawerSearch(e.target.value)}
                      className="input input-bordered input-sm w-full pl-9"
                    />
                  </div>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto">
                  <ul className="menu menu-md p-2">
                    {drawerTab === "charts" ? (
                      filteredCharts.length === 0 ? (
                        <div className="p-8 text-center opacity-40 italic text-sm">No charts found</div>
                      ) : (
                        filteredCharts.map((chart) => (
                          <li key={chart.id}>
                            <button
                              onClick={() => handleAddChart(chart.id)}
                              className="flex flex-col items-start gap-0.5"
                            >
                              <span className="font-medium">{chart.name}</span>
                              <span className="text-[10px] opacity-50 uppercase tracking-tight">
                                {chart.chart_type}
                              </span>
                            </button>
                          </li>
                        ))
                      )
                    ) : filteredComponents.length === 0 ? (
                      <div className="p-8 text-center opacity-40 italic text-sm">No components found</div>
                    ) : (
                      filteredComponents.map((comp) => (
                        <li key={comp.id}>
                          <button onClick={() => handleAddComponent(comp.id)}>
                            <span className="font-medium">{comp.name}</span>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chart Dimensions Settings Modal */}
      <Modal
        isOpen={showChartSettings}
        onClose={() => {
          setShowChartSettings(false);
          setSelectedChart(null);
        }}
        title={`Chart Settings: ${selectedChart?.name}`}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Width (Columns: 3-12)</label>
            <Input
              type="number"
              min={3}
              max={12}
              value={chartDimensions.width}
              onChange={(e) =>
                setChartDimensions((prev) => ({
                  ...prev,
                  width: Math.max(3, Math.min(12, parseInt(e.target.value) || 3)),
                }))
              }
              helperText="Number of columns in the grid (3-12)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Height (Rows: 3-12)</label>
            <Input
              type="number"
              min={3}
              max={12}
              value={chartDimensions.height}
              onChange={(e) =>
                setChartDimensions((prev) => ({
                  ...prev,
                  height: Math.max(3, Math.min(12, parseInt(e.target.value) || 3)),
                }))
              }
              helperText="Number of rows in the grid (3-12)"
            />
          </div>

          <div className="p-4 rounded-lg bg-bg-tertiary border border-border">
            <p className="text-sm text-text-muted">
              💡 Tip: You can also resize charts by dragging the bottom-right corner or drag charts to rearrange them.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowChartSettings(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveChartSettings}>Save Changes</Button>
          </div>
        </div>
      </Modal>

      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={() => {
          setShowFilterModal(false);
        }}
        filters={dashboardFilters}
        onSave={handleSaveFilters}
      />
    </div>
  );
};
