import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, LayoutDashboard, Trash2, Edit, Grid, List, LayoutGrid, Search, ChevronLeft, ChevronRight, X, Star, Copy, RefreshCw, MoreHorizontal, Timer, Check } from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Responsive, WidthProvider, type Layout } from "react-grid-layout";
import { Button } from "../shared/components/ui/Button";
import { Card } from "../shared/components/ui/Card";
import { Input, Textarea } from "../shared/components/ui/Input";
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
          type: 'dashboard',
          name: dashboard.name,
          path: `/dashboard/${dashboard.id}`,
        });
      }}
      className={`p-2 rounded-lg transition-colors ${
        favorite
          ? 'text-[#ffd93d] hover:text-[#ffc107]'
          : 'text-[#606070] hover:text-[#a0a0b0]'
      }`}
      title={favorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Star size={16} fill={favorite ? 'currentColor' : 'none'} />
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
      addToast('success', 'Dashboard cloned successfully');
      onClone();
    } catch (error) {
      addToast('error', 'Failed to clone dashboard');
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <button
      onClick={handleClone}
      disabled={isCloning}
      className="p-2 rounded-lg text-[#606070] hover:text-[#a0a0b0] transition-colors disabled:opacity-50"
      title="Clone dashboard"
    >
      <Copy size={16} className={isCloning ? 'animate-pulse' : ''} />
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

        {/* Search Bar - part of sticky header */}
        <div className="mt-4">
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
                        <h3 
                          className="font-semibold text-[#f0f0f5] truncate cursor-pointer hover:text-[#00f5d4] hover:underline transition-colors"
                          onClick={() => navigate(`/dashboard/${dashboard.id}`)}
                        >
                          {dashboard.name}
                        </h3>
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
                    <FavoriteButton dashboard={dashboard} />
                    <CloneButton dashboardId={dashboard.id} onClone={fetchDashboards} />
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
                        <h3 
                          className="font-semibold text-[#f0f0f5] cursor-pointer hover:text-[#00f5d4] hover:underline transition-colors"
                          onClick={() => navigate(`/dashboard/${dashboard.id}`)}
                        >
                          {dashboard.name}
                        </h3>
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
                    <FavoriteButton dashboard={dashboard} />
                    <CloneButton dashboardId={dashboard.id} onClone={fetchDashboards} />
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

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const intervalOptions = [
    { value: 0, label: 'Off' },
    { value: 10, label: '10 seconds' },
    { value: 30, label: '30 seconds' },
    { value: 60, label: '1 minute' },
    { value: 300, label: '5 minutes' },
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
      {lastRefresh && (
        <span className="text-xs text-[#606070] mr-2">
          Updated {lastRefresh.toLocaleTimeString()}
        </span>
      )}

      {/* More Options Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-[#1a1a25] border border-[#2a2a3a] text-[#a0a0b0] hover:text-[#f0f0f5] hover:border-[#00f5d4] transition-colors"
        title="More options"
      >
        <MoreHorizontal size={20} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-[#12121a] border border-[#2a2a3a] rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Refresh Dashboard */}
          <button
            onClick={() => {
              onRefresh();
              setIsOpen(false);
            }}
            disabled={isRefreshing}
            className="w-full flex items-center gap-3 px-4 py-3 text-left text-[#f0f0f5] hover:bg-[#1a1a25] transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-[#00f5d4]' : ''} />
            <span>Refresh dashboard</span>
          </button>

          {/* Auto-refresh Interval (with submenu) */}
          <div className="relative">
            <button
              onClick={() => setShowIntervalMenu(!showIntervalMenu)}
              className="w-full flex items-center justify-between px-4 py-3 text-left text-[#f0f0f5] hover:bg-[#1a1a25] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Timer size={16} />
                <span>Set auto-refresh interval</span>
              </div>
              <span className="text-xs text-[#606070]">
                {autoRefresh ? intervalOptions.find(o => o.value === refreshInterval)?.label : 'Off'}
              </span>
            </button>

            {/* Submenu */}
            {showIntervalMenu && (
              <div className="absolute left-full top-0 ml-1 w-40 bg-[#12121a] border border-[#2a2a3a] rounded-lg shadow-xl z-50 overflow-hidden">
                {intervalOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleIntervalSelect(option.value)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-left text-[#f0f0f5] hover:bg-[#1a1a25] transition-colors"
                  >
                    <span className="text-sm">{option.label}</span>
                    {((option.value === 0 && !autoRefresh) || (autoRefresh && option.value === refreshInterval)) && (
                      <Check size={14} className="text-[#00f5d4]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-[#2a2a3a]" />

          {/* Auto-refresh status indicator */}
          {autoRefresh && (
            <div className="px-4 py-2 text-xs text-[#606070] flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00f5d4] animate-pulse" />
              Auto-refreshing every {intervalOptions.find(o => o.value === refreshInterval)?.label}
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
  const isEditMode = location.pathname.endsWith('/edit');
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
  const [drawerTab, setDrawerTab] = useState<'charts' | 'components'>('charts');
  const [drawerSearch, setDrawerSearch] = useState('');

  // Filters state
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [dashboardFilters, setDashboardFilters] = useState<DashboardFilter[]>([]);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [editingFilter, setEditingFilter] = useState<DashboardFilter | null>(null);

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
        if (filterValue === undefined || filterValue === null || filterValue === '') {
          return; // Skip empty filter values
        }

        const column = filter.column;

        if (filter.type === 'value') {
          // Filter by exact value match
          filteredData = filteredData.filter((row: any) => {
            const rowValue = row[column];
            if (filter.config.multiSelect && Array.isArray(filterValue)) {
              return filterValue.includes(rowValue);
            }
            return rowValue === filterValue || String(rowValue) === String(filterValue);
          });
        } else if (filter.type === 'time_range') {
          // Filter by date range
          if (filterValue.start || filterValue.end) {
            filteredData = filteredData.filter((row: any) => {
              const rowDate = new Date(row[column]);
              if (filterValue.start && rowDate < new Date(filterValue.start)) return false;
              if (filterValue.end && rowDate > new Date(filterValue.end)) return false;
              return true;
            });
          }
        } else if (filter.type === 'numerical_range') {
          // Filter by number range
          filteredData = filteredData.filter((row: any) => {
            const rowValue = Number(row[column]);
            if (filterValue.min !== undefined && filterValue.min !== '' && rowValue < Number(filterValue.min)) return false;
            if (filterValue.max !== undefined && filterValue.max !== '' && rowValue > Number(filterValue.max)) return false;
            return true;
          });
        }
      });

      return { ...chart, data: filteredData };
    });
  }, [chartData, dashboardFilters, filterValues, filtersApplied]);

  const fetchDashboard = async () => {
    if (!id) return;
    try {
      const [dashboardRes, dataRes] = await Promise.all([dashboardsApi.getOne(id), dashboardsApi.getData(id)]);
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
      window.dispatchEvent(new Event('resize'));
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
        console.error('Auto-refresh failed:', error);
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
      addToast('success', 'Dashboard refreshed');
    } catch (error) {
      addToast('error', 'Failed to refresh dashboard');
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

  const handleEditFilter = (filter: DashboardFilter) => {
    setEditingFilter(filter);
    setShowFilterModal(true);
  };

  const handleRemoveFilter = (filterId: string) => {
    setDashboardFilters(dashboardFilters.filter(f => f.id !== filterId));
    const newFilterValues = { ...filterValues };
    delete newFilterValues[filterId];
    setFilterValues(newFilterValues);
  };

  const handleSaveFilters = async (filters: DashboardFilter[]) => {
    console.log('Saving filters:', filters);
    setDashboardFilters(filters);
    setShowFilterModal(false);
    setEditingFilter(null);
    
    // Persist filters to backend
    if (id) {
      try {
        await dashboardsApi.update(id, { filters });
        if (filters.length > 0) {
          addToast("success", `${filters.length} filter(s) saved`);
        }
      } catch (error) {
        console.error('Failed to save filters:', error);
        addToast("error", "Failed to save filters");
      }
    }
  };

  const handleApplyFilters = () => {
    setFiltersApplied(true);
    addToast("success", "Filters applied");
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
    <div className="h-full flex flex-col relative">
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
      <div className={`flex-1 flex flex-col ${filtersOpen ? 'ml-72' : 'ml-10'} transition-all duration-200`}>
        {/* Fixed Header */}
        <div className="flex-shrink-0 sticky top-0 bg-[#0a0a0f] z-10 pb-2 px-6 pt-0 border-b border-[#2a2a3a]">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#f0f0f5]">{dashboard.name}</h1>
                {dashboard.description && <p className="text-[#a0a0b0] mt-1 text-sm">{dashboard.description}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* More Options Dropdown */}
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
                /* Edit Mode: Exit button */
                <button
                  onClick={() => navigate(`/dashboard/${id}`)}
                  className="p-2 rounded-lg bg-[#1a1a25] border border-[#2a2a3a] text-[#a0a0b0] hover:text-[#f0f0f5] hover:border-[#00f5d4] transition-colors"
                  title="Exit Edit Mode"
                >
                  <X size={20} />
                </button>
              ) : (
                /* View Mode: Edit dashboard button */
                <Button
                  onClick={() => navigate(`/dashboard/${id}/edit`)}
                  leftIcon={<Edit size={16} />}
                >
                  Edit dashboard
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex">
          {/* Dashboard Content - constrain width properly for edit sidebar */}
          <div 
            className="flex-1 transition-all duration-200 px-6"
            style={{ 
              width: isEditMode ? 'calc(100% - 320px)' : '100%',
              maxWidth: isEditMode ? 'calc(100% - 320px)' : '100%'
            }}
          >
            {dashboard.charts && dashboard.charts.length > 0 ? (
            <div className="dashboard-grid py-4" style={{ width: '100%' }}>


              <ResponsiveGridLayout
                key={`grid-${isEditMode ? 'edit' : 'view'}-${filtersOpen ? 'filters' : 'nofilters'}`}
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
                  // Find data - for components, look up by component_id; for charts, by chart_id
                  const itemId = item.component_id || item.chart_id;
                  const data = filteredChartData.find((d) => d.chartId === itemId);
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
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-24">
              <LayoutDashboard size={64} className="mb-6 text-[#404050]" />
              <h3 className="text-lg font-medium text-[#a0a0b0] mb-2">
                There are no charts added to this dashboard
              </h3>
              <p className="text-sm text-[#606070] mb-6">
                {isEditMode 
                  ? 'You can create a new chart or use existing ones from the panel on the right'
                  : 'Go to the edit mode to configure the dashboard and add charts'
                }
              </p>
              {!isEditMode && (
                <Button 
                  onClick={() => navigate(`/dashboard/${id}/edit`)}
                  leftIcon={<Edit size={16} />}
                >
                  Edit the dashboard
                </Button>
              )}
              {isEditMode && (
                <Button
                  onClick={() => navigate('/charts')}
                  leftIcon={<Plus size={16} />}
                >
                  Create a new chart
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar Panel - Only in Edit Mode */}
        {isEditMode && (
          <div className="fixed right-0 top-[73px] bottom-0 w-80 bg-[#12121a] border-l border-[#2a2a3a] flex flex-col z-40">
            {/* Sidebar Header with Close Button */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a3a]">
              <span className="text-sm font-medium text-[#f0f0f5]">Edit Mode</span>
              <button
                onClick={() => navigate(`/dashboard/${id}`)}
                className="p-1.5 rounded-md text-[#606070] hover:text-[#f0f0f5] hover:bg-[#2a2a3a] transition-colors"
                title="Exit Edit Mode"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs Header */}
            <div className="flex border-b border-[#2a2a3a]">
              <button
                onClick={() => setDrawerTab('charts')}
                className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
                  drawerTab === 'charts'
                    ? 'text-[#00f5d4] border-[#00f5d4]'
                    : 'text-[#606070] border-transparent hover:text-[#a0a0b0]'
                }`}
              >
                Charts
              </button>
              <button
                onClick={() => setDrawerTab('components')}
                className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
                  drawerTab === 'components'
                    ? 'text-[#7b2cbf] border-[#7b2cbf]'
                    : 'text-[#606070] border-transparent hover:text-[#a0a0b0]'
                }`}
              >
                Components
              </button>
            </div>

            {/* Create New Link */}
            <div className="px-4 py-3 border-b border-[#2a2a3a]">
              <button
                onClick={() => navigate(drawerTab === 'charts' ? '/charts' : '/components')}
                className="flex items-center gap-2 text-sm text-[#00f5d4] hover:text-[#00d4b8] transition-colors"
              >
                <Plus size={16} />
                Create new {drawerTab === 'charts' ? 'chart' : 'component'}
              </button>
            </div>

            {/* Search */}
            <div className="px-4 py-3 border-b border-[#2a2a3a]">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]" />
                <input
                  type="text"
                  placeholder={`Filter your ${drawerTab}...`}
                  value={drawerSearch}
                  onChange={(e) => setDrawerSearch(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 bg-[#1a1a25] border border-[#2a2a3a] rounded text-[#f0f0f5] text-sm placeholder-[#606070] focus:outline-none focus:border-[#00f5d4] transition-colors"
                />
              </div>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto">
              {drawerTab === 'charts' ? (
                filteredCharts.length === 0 ? (
                  <p className="text-sm text-[#606070] text-center py-8">
                    {drawerSearch ? 'No charts match your search' : 'No charts available'}
                  </p>
                ) : (
                  <div className="divide-y divide-[#2a2a3a]">
                    {filteredCharts.map((chart) => (
                      <button
                        key={chart.id}
                        onClick={() => handleAddChart(chart.id)}
                        className="w-full px-4 py-3 hover:bg-[#1a1a25] transition-colors text-left"
                      >
                        <h5 className="font-medium text-[#f0f0f5] text-sm">{chart.name}</h5>
                        <div className="flex items-center gap-2 mt-1 text-xs text-[#606070]">
                          <span>Viz type: {chart.chart_type}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )
              ) : (
                filteredComponents.length === 0 ? (
                  <p className="text-sm text-[#606070] text-center py-8">
                    {drawerSearch ? 'No components match your search' : 'No components available'}
                  </p>
                ) : (
                  <div className="divide-y divide-[#2a2a3a]">
                    {filteredComponents.map((comp) => (
                      <button
                        key={comp.id}
                        onClick={() => handleAddComponent(comp.id)}
                        className="w-full px-4 py-3 hover:bg-[#1a1a25] transition-colors text-left"
                      >
                        <h5 className="font-medium text-[#f0f0f5] text-sm">{comp.name}</h5>
                        <div className="flex items-center gap-2 mt-1 text-xs text-[#606070]">
                          <span>Custom Component</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )
              )}
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

      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={() => {
          setShowFilterModal(false);
          setEditingFilter(null);
        }}
        filters={dashboardFilters}
        onSave={handleSaveFilters}
      />
    </div>
  );
};
