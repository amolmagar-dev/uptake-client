import React, { useState, useEffect, useCallback } from 'react';
import { Plus, LayoutDashboard, Trash2, Edit, Eye, Grid } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input, Textarea } from '../components/ui/Input';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import { ChartRenderer } from '../components/charts/ChartRenderer';
import { dashboardsApi, chartsApi } from '../lib/api';
import { useAppStore } from '../store/appStore';

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
  chart_id: string;
  name: string;
  chart_type: string;
  config: any;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
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

  const fetchDashboards = async () => {
    try {
      const response = await dashboardsApi.getAll();
      setDashboards(response.data.dashboards);
    } catch (error) {
      addToast('error', 'Failed to fetch dashboards');
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
      addToast('success', 'Dashboard deleted');
      fetchDashboards();
    } catch (error) {
      addToast('error', 'Failed to delete dashboard');
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#f0f0f5]">Dashboards</h1>
          <p className="text-[#a0a0b0] mt-1">Create and manage your data dashboards</p>
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

      {dashboards.length === 0 ? (
        <Card className="text-center py-12">
          <LayoutDashboard size={48} className="mx-auto mb-4 text-[#606070]" />
          <h3 className="text-lg font-medium text-[#f0f0f5] mb-2">No dashboards yet</h3>
          <p className="text-[#a0a0b0] mb-4">Create your first dashboard to organize your charts</p>
          <Button onClick={() => setShowModal(true)} leftIcon={<Plus size={16} />}>
            Create Dashboard
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboards.map((dashboard) => (
            <Card key={dashboard.id} hover className="flex flex-col">
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
              
              <p className="text-xs text-[#606070] mb-4">
                By {dashboard.created_by_name}
              </p>

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
            </Card>
          ))}
        </div>
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

const DashboardModal: React.FC<DashboardModalProps> = ({
  isOpen,
  onClose,
  dashboard,
  onSuccess,
}) => {
  const { addToast } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_public: false,
  });

  useEffect(() => {
    if (dashboard) {
      setFormData({
        name: dashboard.name,
        description: dashboard.description || '',
        is_public: dashboard.is_public === 1,
      });
    } else {
      setFormData({
        name: '',
        description: '',
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
        addToast('success', 'Dashboard updated successfully');
      } else {
        await dashboardsApi.create(formData);
        addToast('success', 'Dashboard created successfully');
      }
      onSuccess();
    } catch (error: any) {
      addToast('error', error.response?.data?.error || 'Failed to save dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={dashboard ? 'Edit Dashboard' : 'Create New Dashboard'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Dashboard Name"
          placeholder="Sales Overview"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />

        <Textarea
          label="Description (optional)"
          placeholder="A brief description of this dashboard"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
        />

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.is_public}
            onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
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
            {dashboard ? 'Update' : 'Create'} Dashboard
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Dashboard View Page
export const DashboardViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addToast } = useAppStore();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [availableCharts, setAvailableCharts] = useState<any[]>([]);
  const [showAddChart, setShowAddChart] = useState(false);

  const fetchDashboard = async () => {
    if (!id) return;
    try {
      const [dashboardRes, dataRes] = await Promise.all([
        dashboardsApi.getOne(id),
        dashboardsApi.getData(id),
      ]);
      setDashboard(dashboardRes.data.dashboard);
      setChartData(dataRes.data.chartData);
    } catch (error) {
      addToast('error', 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableCharts = async () => {
    try {
      const response = await chartsApi.getAll();
      setAvailableCharts(response.data.charts);
    } catch (error) {
      console.error('Failed to fetch charts');
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchAvailableCharts();
  }, [id]);

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
      addToast('success', 'Chart added to dashboard');
      fetchDashboard();
      setShowAddChart(false);
    } catch (error) {
      addToast('error', 'Failed to add chart');
    }
  };

  const handleRemoveChart = async (dashboardChartId: string) => {
    if (!id) return;
    try {
      await dashboardsApi.removeChart(id, dashboardChartId);
      addToast('success', 'Chart removed from dashboard');
      fetchDashboard();
    } catch (error) {
      addToast('error', 'Failed to remove chart');
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#f0f0f5]">{dashboard.name}</h1>
          {dashboard.description && (
            <p className="text-[#a0a0b0] mt-1">{dashboard.description}</p>
          )}
        </div>
        <Button
          leftIcon={<Plus size={18} />}
          onClick={() => setShowAddChart(true)}
        >
          Add Chart
        </Button>
      </div>

      {dashboard.charts && dashboard.charts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dashboard.charts.map((chart) => {
            const data = chartData.find(d => d.chartId === chart.chart_id);
            return (
              <Card key={chart.id} className="overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a25] border-b border-[#2a2a3a] -mx-5 -mt-5 mb-4">
                  <span className="text-sm font-medium text-[#f0f0f5]">{chart.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveChart(chart.id)}
                    className="text-[#ff4757] hover:text-[#ff4757] -mr-2"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
                <div>
                  {data?.error ? (
                    <p className="text-[#ff4757] text-sm">{data.error}</p>
                  ) : data?.data ? (
                    <ChartRenderer
                      type={chart.chart_type as any}
                      data={data.data}
                      config={data.config || chart.config}
                      height={250}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-32">
                      <div className="spinner" />
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
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

      <Modal
        isOpen={showAddChart}
        onClose={() => setShowAddChart(false)}
        title="Add Chart to Dashboard"
        size="lg"
      >
        {availableCharts.length === 0 ? (
          <p className="text-center text-[#a0a0b0] py-8">
            No charts available. Create a chart first.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {availableCharts.map((chart) => (
              <button
                key={chart.id}
                onClick={() => handleAddChart(chart.id)}
                className="p-4 rounded-lg bg-[#1a1a25] border border-[#2a2a3a] hover:border-[#00f5d4] transition-colors text-left"
              >
                <h4 className="font-medium text-[#f0f0f5]">{chart.name}</h4>
                <p className="text-sm text-[#606070]">{chart.chart_type}</p>
              </button>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};
