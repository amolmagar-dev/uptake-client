import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, BarChart3, Trash2, Edit, Eye, Layers } from "lucide-react";
import { Modal, ConfirmModal } from "../shared/components/ui/Modal";
import { ChartRenderer } from "../components/charts/ChartRenderer";
import { chartsApi } from "../lib/api";
import { useAppStore } from "../store/appStore";

interface Chart {
  id: string;
  name: string;
  description: string;
  chart_type: string;
  config: any;
  sql_query: string;
  connection_id: string;
  connection_name: string;
  dataset_id?: string;
  dataset_name?: string;
  dataset_type?: string;
}

export const ChartsPage: React.FC = () => {
  const { addToast } = useAppStore();
  const navigate = useNavigate();
  const [charts, setCharts] = useState<Chart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [previewChart, setPreviewChart] = useState<Chart | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchCharts = async () => {
    try {
      const response = await chartsApi.getAll();
      setCharts(response.data.charts);
    } catch (error) {
      addToast("error", "Failed to fetch charts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCharts();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await chartsApi.delete(id);
      addToast("success", "Chart deleted");
      fetchCharts();
    } catch (error) {
      addToast("error", "Failed to delete chart");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handlePreview = async (chart: Chart) => {
    setPreviewChart(chart);
    setPreviewLoading(true);
    try {
      const response = await chartsApi.getData(chart.id);
      setPreviewData(response.data.data);
    } catch (error: any) {
      addToast("error", error.response?.data?.error || "Failed to load chart data");
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const getChartIcon = (type: string) => {
    const icons: Record<string, string> = {
      bar: "📊",
      line: "📈",
      pie: "🥧",
      doughnut: "🍩",
      area: "📉",
      scatter: "⚡",
      table: "📋",
      kpi: "🔢",
      gauge: "🎯",
    };
    return icons[type] || "📊";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Charts</h1>
          <p className="text-base-content/60 mt-1 text-sm">Create and manage data visualizations</p>
        </div>
        <button
          className="btn btn-primary btn-sm md:btn-md"
          onClick={() => navigate('/charts/new')}
        >
          <Plus size={18} />
          <span>Create Chart</span>
        </button>
      </div>

      {charts.length === 0 ? (
        <div className="card bg-base-200 border border-base-300 text-center py-16">
          <div className="card-body items-center">
            <BarChart3 size={48} className="mb-4 opacity-20" />
            <h3 className="text-xl font-bold">No charts yet</h3>
            <p className="text-base-content/60 max-w-sm mb-6">
              Create your first chart to visualize your data and gain insights.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/charts/new')}>
              <Plus size={18} />
              Create Chart
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {charts.map((chart) => (
            <div
              key={chart.id}
              className="card bg-base-100 border border-base-300 hover:border-primary/50 transition-all shadow-sm"
            >
              <div className="card-body p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl shrink-0">{getChartIcon(chart.chart_type)}</span>
                    <div className="min-w-0">
                      <h3 className="card-title text-base truncate">{chart.name}</h3>
                      <p className="text-xs opacity-60 uppercase font-bold tracking-tight">{chart.chart_type}</p>
                    </div>
                  </div>
                </div>

                {chart.description && <p className="text-sm opacity-70 mb-4 line-clamp-2 h-10">{chart.description}</p>}

                <div className="flex items-center gap-1 text-xs opacity-50 mb-6">
                  <Layers size={14} />
                  <span className="truncate">{chart.dataset_name || chart.connection_name || "No data source"}</span>
                </div>

                <div className="card-actions justify-end mt-auto pt-4 border-t border-base-200">
                  <div className="flex items-center gap-1">
                    <button
                      className="btn btn-ghost btn-sm btn-square"
                      onClick={() => handlePreview(chart)}
                      title="Preview"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      className="btn btn-ghost btn-sm btn-square"
                      onClick={() => navigate(`/charts/${chart.id}/edit`)}
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      className="btn btn-ghost btn-sm btn-square text-error"
                      onClick={() => setDeleteConfirm(chart.id)}
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}



      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Chart"
        message="Are you sure you want to delete this chart? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />

      {/* Preview Modal */}
      <Modal
        isOpen={!!previewChart}
        onClose={() => {
          setPreviewChart(null);
          setPreviewData(null);
        }}
        title={previewChart?.name || "Chart Preview"}
        size="full"
      >
        {previewLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner" />
          </div>
        ) : previewData ? (
          <ChartRenderer
            type={previewChart?.chart_type as any}
            data={previewData}
            config={previewChart?.config || {}}
            height={600}
          />
        ) : (
          <p className="text-center text-text-muted py-12">No data available</p>
        )}
      </Modal>
    </div>
  );
};
