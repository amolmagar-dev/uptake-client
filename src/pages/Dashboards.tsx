import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, LayoutDashboard, Trash2, Edit, Eye, Grid, List, LayoutGrid, Search, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Responsive, WidthProvider, type Layout } from "react-grid-layout";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input, Textarea } from "../components/ui/Input";
import { Modal, ConfirmModal } from "../components/ui/Modal";
import { DraggableChart } from "../components/charts/DraggableChart";
import { DraggableComponent } from "../components/charts/DraggableComponent";
import { dashboardsApi, chartsApi, customComponentsApi } from "../lib/api";
import { useAppStore } from "../store/appStore";
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
  type?: 'chart' | 'component';
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

export const DashboardsPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useAppStore();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDashboard, setEditingDashboard] = useState<Dashboard | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'vertical' | 'grid'>('vertical');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter dashboards based on search
  const filteredDashboards = useMemo(() => {
    if (!searchQuery.trim()) return dashboards;
    const query = searchQuery.toLowerCase();
    return dashboards.filter(
      (d) =>
        d.name.toLowerCase().includes(query) ||
        d.description?.toLowerCase().includes(query) ||
        d.created_by_name?.toLowerCase().includes(query)
    );
  }, [dashboards, searchQuery]);

  // Paginate filtered dashboards
  const totalPages = Math.ceil(filteredDashboards.length / itemsPerPage);
  const paginatedDashboards = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDashboards.slice(start, start + itemsPerPage);
  }, [filteredDashboards, currentPage]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Sticky Header */}
      <div className="flex-shrink-0 sticky top-0 bg-[#0a0a0f] z-10 pb-4 -mx-6 px-6">
        <div className="flex items-center justify-between py-4">
          <div>
            <h1 className="text-2xl font-bold text-[#f0f0f5]">Dashboards</h1>
            <p className="text-[#a0a0b0] mt-1">Create and manage your data dashboards</p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center bg-[#1a1a25] rounded-lg p-1 border border-[#2a2a3a]">
              <button
                onClick={() => setViewMode('vertical')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'vertical'
                    ? 'bg-[#2a2a3a] text-[#00f5d4]'
                    : 'text-[#606070] hover:text-[#a0a0b0]'
                }`}
                title="List View"
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-[#2a2a3a] text-[#00f5d4]'
                    : 'text-[#606070] hover:text-[#a0a0b0]'
                }`}
                title="Grid View"
              >
                <LayoutGrid size={18} />
              </button>
            </div>
            <Button
              leftIcon={<Plus size={18} />}
              onClick={() => {
                setEditingDashboard(null);
                setShowModal(true);
              }}
            >
              Create Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]" />
          <input
            type="text"
            placeholder="Search dashboards by name, description, or creator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a25] border border-[#2a2a3a] rounded-lg text-[#f0f0f5] placeholder-[#606070] focus:outline-none focus:border-[#00f5d4] transition-colors"
          />
        </div>
        {searchQuery && (
          <p className="text-xs text-[#606070] mt-2">
            Found {filteredDashboards.length} dashboard{filteredDashboards.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {filteredDashboards.length === 0 ? (
        <Card className="text-center py-12">
          <LayoutDashboard size={48} className="mx-auto mb-4 text-[#606070]" />
          <h3 className="text-lg font-medium text-[#f0f0f5] mb-2">
            {searchQuery ? 'No dashboards found' : 'No dashboards yet'}
          </h3>
          <p className="text-[#a0a0b0] mb-4">
            {searchQuery
              ? `No dashboards match "${searchQuery}"`
              : 'Create your first dashboard to organize your charts'
            }
          </p>
          {!searchQuery && (
            <Button onClick={() => setShowModal(true)} leftIcon={<Plus size={16} />}>
              Create Dashboard
            </Button>
          )}
        </Card>
      ) : (
        <>
        <div className={viewMode === 'vertical' 
          ? 'flex flex-col gap-3' 
          : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
        }>
          {paginatedDashboards.map((dashboard) => (
            <Card 
              key={dashboard.id} 
              hover 
              className={viewMode === 'vertical' 
                ? 'flex flex-row items-center justify-between p-4' 
                : 'flex flex-col'
              }
            >
              {viewMode === 'vertical' ? (
                /* Vertical/List Layout */
                <>
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00f5d4]/20 to-[#7b2cbf]/20 flex items-center justify-center flex-shrink-0">
                      <Grid size={20} className="text-[#00f5d4]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-[#f0f0f5] truncate">{dashboard.name}</h3>
                        {dashboard.is_public === 1 && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-[#00f5d4]/10 text-[#00f5d4] border border-[#00f5d4]/20 flex-shrink-0">
                            Public
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#606070]">
                        <span>{dashboard.chart_count} charts</span>
                        <span>•</span>
                        <span>By {dashboard.created_by_name}</span>
                        {dashboard.description && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-xs">{dashboard.description}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/dashboard/${dashboard.id}`)}
                      leftIcon={<Eye size={14} />}
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingDashboard(dashboard);
                        setShowModal(true);
                      }}
                      leftIcon={<Edit size={14} />}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirm(dashboard.id)}
                      className="text-[#ff4757] hover:text-[#ff4757]"
                      leftIcon={<Trash2 size={14} />}
                    >
                      Delete
                    </Button>
                  </div>
                </>
              ) : (
                /* Grid/Box Layout */
                <>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00f5d4]/20 to-[#7b2cbf]/20 flex items-center justify-center">
                        <Grid size={20} className="text-[#00f5d4]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#f0f0f5]">{dashboard.name}</h3>
                        <p className="text-xs text-[#606070]">{dashboard.chart_count} charts</p>
                      </div>
                    </div>
                    {dashboard.is_public === 1 && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-[#00f5d4]/10 text-[#00f5d4] border border-[#00f5d4]/20">
                        Public
                      </span>
                    )}
                  </div>

                  {dashboard.description && (
                    <p className="text-sm text-[#a0a0b0] mb-4 line-clamp-2">{dashboard.description}</p>
                  )}

                  <p className="text-xs text-[#606070] mb-4">By {dashboard.created_by_name}</p>

                  <div className="mt-auto flex gap-2 pt-4 border-t border-[#2a2a3a]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/dashboard/${dashboard.id}`)}
                      leftIcon={<Eye size={14} />}
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingDashboard(dashboard);
                        setShowModal(true);
                      }}
                      leftIcon={<Edit size={14} />}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirm(dashboard.id)}
                      className="text-[#ff4757] hover:text-[#ff4757]"
                      leftIcon={<Trash2 size={14} />}
                    >
                      Delete
                    </Button>
                  </div>
                </>
              )}
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#2a2a3a]">
            <p className="text-sm text-[#606070]">
              Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredDashboards.length)} of {filteredDashboards.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-[#1a1a25] border border-[#2a2a3a] text-[#a0a0b0] hover:text-[#f0f0f5] hover:border-[#00f5d4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    // Show first, last, current, and adjacent pages
                    if (page === 1 || page === totalPages) return true;
                    if (Math.abs(page - currentPage) <= 1) return true;
                    return false;
                  })
                  .map((page, idx, arr) => (
                    <React.Fragment key={page}>
                      {idx > 0 && arr[idx - 1] !== page - 1 && (
                        <span className="text-[#606070] px-1">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-[#00f5d4] text-[#12121a]'
                            : 'bg-[#1a1a25] border border-[#2a2a3a] text-[#a0a0b0] hover:text-[#f0f0f5] hover:border-[#00f5d4]'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  ))}
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-[#1a1a25] border border-[#2a2a3a] text-[#a0a0b0] hover:text-[#f0f0f5] hover:border-[#00f5d4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
              <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </>
      )}

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
    </div>
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

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.is_public}
            onChange={(e) => setFormData((prev) => ({ ...prev, is_public: e.target.checked }))}
            className="w-4 h-4 rounded border-[#2a2a3a] bg-[#1a1a25] text-[#00f5d4] focus:ring-[#00f5d4]"
          />
          <div>
            <span className="text-sm text-[#f0f0f5]">Make this dashboard public</span>
            <p className="text-xs text-[#606070]">Anyone with the link can view this dashboard</p>
          </div>
        </label>

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

// Dashboard View Page
export const DashboardViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const isEditMode = location.pathname.endsWith('/edit');
  const { addToast } = useAppStore();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [availableCharts, setAvailableCharts] = useState<any[]>([]);
  const [availableComponents, setAvailableComponents] = useState<any[]>([]);
  const [showAddChart, setShowAddChart] = useState(false);
  const [layouts, setLayouts] = useState<Record<string, Layout[]>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedChart, setSelectedChart] = useState<DashboardChart | null>(null);
  const [showChartSettings, setShowChartSettings] = useState(false);
  const [chartDimensions, setChartDimensions] = useState({ width: 6, height: 4 });
  const [drawerTab, setDrawerTab] = useState<'charts' | 'components'>('charts');
  const [drawerSearch, setDrawerSearch] = useState('');

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

  const fetchDashboard = async () => {
    if (!id) return;
    try {
      const [dashboardRes, dataRes] = await Promise.all([dashboardsApi.getOne(id), dashboardsApi.getData(id)]);
      setDashboard(dashboardRes.data.dashboard);
      setChartData(dataRes.data.chartData);

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
      setShowAddChart(false);
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
      setShowAddChart(false);
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
    <div className="h-full flex flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0 sticky top-0 bg-[#0a0a0f] z-10 pb-4 -mx-6 px-6 pt-0 -mt-0">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            {/* Back Button */}
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-lg bg-[#1a1a25] border border-[#2a2a3a] text-[#a0a0b0] hover:text-[#f0f0f5] hover:border-[#00f5d4] transition-colors"
              title="Back to Dashboards"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[#f0f0f5]">{dashboard.name}</h1>
              {dashboard.description && <p className="text-[#a0a0b0] mt-1">{dashboard.description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* View/Edit Toggle */}
            <div className="flex items-center bg-[#1a1a25] rounded-lg p-1 border border-[#2a2a3a]">
              <button
                onClick={() => navigate(`/dashboard/${id}`)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  !isEditMode
                    ? 'bg-[#2a2a3a] text-[#00f5d4]'
                    : 'text-[#606070] hover:text-[#a0a0b0]'
                }`}
              >
                View
              </button>
              <button
                onClick={() => navigate(`/dashboard/${id}/edit`)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isEditMode
                    ? 'bg-[#2a2a3a] text-[#00f5d4]'
                    : 'text-[#606070] hover:text-[#a0a0b0]'
                }`}
              >
                Edit
              </button>
            </div>
            {isEditMode && (
              <Button leftIcon={<Plus size={18} />} onClick={() => setShowAddChart(true)}>
                Add Chart
              </Button>
            )}
          </div>
        </div>
      </div>

      {dashboard.charts && dashboard.charts.length > 0 ? (
        <div className="dashboard-grid">
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={100}
            onLayoutChange={isEditMode ? handleLayoutChange : undefined}
            isDraggable={isEditMode}
            isResizable={isEditMode}
            useCSSTransforms={true}
            compactType="vertical"
            preventCollision={false}
          >
            {dashboard.charts.map((item) => {
              // Find data - for components, look up by component_id; for charts, by chart_id
              const itemId = item.component_id || item.chart_id;
              const data = chartData.find((d) => d.chartId === itemId);
              const itemHeight = (item.height || 4) * 100 - 50;
              
              // Render custom component
              if (item.type === 'component' || item.component_id) {
                return (
                  <div key={item.id} className="grid-item">
                    <DraggableComponent
                      id={item.id}
                      name={item.name}
                      htmlContent={item.html_content || ''}
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
              
              // Render chart
              return (
                <div key={item.id} className="grid-item">
                  <DraggableChart
                    id={item.id}
                    name={item.name}
                    chartType={item.chart_type || 'bar'}
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
        <Card className="text-center py-12">
          <LayoutDashboard size={48} className="mx-auto mb-4 text-[#606070]" />
          <h3 className="text-lg font-medium text-[#f0f0f5] mb-2">No charts yet</h3>
          <p className="text-[#a0a0b0] mb-4">Add charts to build your dashboard</p>
          <Button onClick={() => setShowAddChart(true)} leftIcon={<Plus size={16} />}>
            Add Chart
          </Button>
        </Card>
      )}

      {/* Right Side Drawer for Add Chart */}
      <div
        className={`fixed inset-0 z-50 ${showAddChart ? 'visible' : 'invisible'}`}
      >
        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
            showAddChart ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setShowAddChart(false)}
        />
        
        {/* Drawer Panel */}
        <div
          className={`absolute right-0 top-0 h-full w-96 bg-[#12121a] border-l border-[#2a2a3a] shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${
            showAddChart ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Fixed Header Section */}
          <div className="flex-shrink-0">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a3a]">
              <h2 className="text-lg font-semibold text-[#f0f0f5]">Add to Dashboard</h2>
              <button
                onClick={() => setShowAddChart(false)}
                className="p-2 rounded-lg text-[#606070] hover:text-[#f0f0f5] hover:bg-[#2a2a3a] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Bar */}
            <div className="px-6 py-4 border-b border-[#2a2a3a]">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={drawerSearch}
                  onChange={(e) => setDrawerSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#1a1a25] border border-[#2a2a3a] rounded-lg text-[#f0f0f5] text-sm placeholder-[#606070] focus:outline-none focus:border-[#00f5d4] transition-colors"
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="px-6 pt-4 bg-[#12121a]">
              <div className="flex border-b border-[#2a2a3a]">
                <button
                  onClick={() => setDrawerTab('charts')}
                  className={`flex-1 pb-3 text-sm font-medium transition-colors border-b-2 ${
                    drawerTab === 'charts'
                      ? 'text-[#00f5d4] border-[#00f5d4]'
                      : 'text-[#606070] border-transparent hover:text-[#a0a0b0]'
                  }`}
                >
                  📊 Charts ({filteredCharts.length})
                </button>
                <button
                  onClick={() => setDrawerTab('components')}
                  className={`flex-1 pb-3 text-sm font-medium transition-colors border-b-2 ${
                    drawerTab === 'components'
                      ? 'text-[#7b2cbf] border-[#7b2cbf]'
                      : 'text-[#606070] border-transparent hover:text-[#a0a0b0]'
                  }`}
                >
                  🧩 Components ({filteredComponents.length})
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-2">
            {drawerTab === 'charts' ? (
              // Charts Tab
              filteredCharts.length === 0 ? (
                <p className="text-sm text-[#606070] text-center py-4">
                  {drawerSearch ? 'No charts match your search' : 'No charts available. Create a chart first.'}
                </p>
              ) : (
                filteredCharts.map((chart) => (
                  <button
                    key={chart.id}
                    onClick={() => handleAddChart(chart.id)}
                    className="w-full p-3 rounded-lg bg-[#1a1a25] border border-[#2a2a3a] hover:border-[#00f5d4] transition-colors text-left"
                  >
                    <h5 className="font-medium text-[#f0f0f5] text-sm">{chart.name}</h5>
                    <p className="text-xs text-[#606070]">{chart.chart_type}</p>
                  </button>
                ))
              )
            ) : (
              // Components Tab
              filteredComponents.length === 0 ? (
                <p className="text-sm text-[#606070] text-center py-4">
                  {drawerSearch ? 'No components match your search' : 'No components available. Create a component first.'}
                </p>
              ) : (
                filteredComponents.map((comp) => (
                  <button
                    key={comp.id}
                    onClick={() => handleAddComponent(comp.id)}
                    className="w-full p-3 rounded-lg bg-[#1a1a25] border border-[#2a2a3a] hover:border-[#7b2cbf] transition-colors text-left"
                  >
                    <h5 className="font-medium text-[#f0f0f5] text-sm">{comp.name}</h5>
                    <p className="text-xs text-[#606070]">Custom Component</p>
                  </button>
                ))
              )
            )}
          </div>
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
            <label className="block text-sm font-medium text-[#f0f0f5] mb-2">Width (Columns: 3-12)</label>
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
            <label className="block text-sm font-medium text-[#f0f0f5] mb-2">Height (Rows: 3-12)</label>
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

          <div className="p-4 rounded-lg bg-[#1a1a25] border border-[#2a2a3a]">
            <p className="text-sm text-[#606070]">
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
    </div>
  );
};
