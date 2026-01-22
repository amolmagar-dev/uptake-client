import React, { useState, useEffect } from "react";
import { ResourceListing } from "../shared/components/ResourceListing";
import { useNavigate } from "react-router-dom";
import { Plus, BarChart3, Trash2, Edit, Eye } from "lucide-react";
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
  const [deleteChart, setDeleteChart] = useState<Chart | null>(null);
  const [previewChart, setPreviewChart] = useState<Chart | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchCharts = async () => {
    try {
      setIsLoading(true);
      const response = await chartsApi.getAll();
      setCharts(response.data.charts);
    } catch (error: any) {
      addToast("error", error.response?.data?.error || "Failed to fetch charts");
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
      addToast("success", "Chart deleted successfully");
      setDeleteChart(null);
      fetchCharts();
    } catch (error: any) {
      addToast("error", error.response?.data?.error || "Failed to delete chart");
    }
  };

  const handlePreview = async (chart: Chart) => {
    setPreviewChart(chart);
    setPreviewLoading(true);
    try {
      // Logic to fetch preview data if needed, or mostly handled by ChartRenderer if data is embedded or re-fetched
      // Assuming chartsApi.getData exists or similar
      const response = await chartsApi.getData(chart.id);
      setPreviewData(response.data.data);
    } catch (error: any) {
      addToast("error", error.response?.data?.error || "Failed to load chart data");
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const categoryEmojis: Record<string, string> = {
    bar: "📊",
    line: "📈",
    pie: "🥧",
    area: "📉",
    scatter: "💠",
    radar: "🕸️",
    map: "🗺️",
    table: "🔢",
    metric: "1️⃣2️⃣3️⃣",
  };

  const renderGridItem = (chart: Chart) => (
    <div
      key={chart.id}
      className="card bg-base-100 border border-base-300 hover:border-primary/50 transition-all shadow-sm h-full"
    >
      <div className="card-body p-6 flex flex-col h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-base-200 text-2xl flex items-center justify-center shrink-0">
              {categoryEmojis[chart.chart_type] || "📊"}
            </div>
            <div className="min-w-0">
              <h3 className="card-title text-base truncate">{chart.name}</h3>
              <p className="text-xs opacity-60 truncate capitalize">{chart.chart_type} Chart</p>
            </div>
          </div>
        </div>

        {chart.description && (
          <p className="text-sm opacity-70 mb-4 line-clamp-2 h-10 flex-grow-0">{chart.description}</p>
        )}

        {/* Placeholder for preview or mini-chart could go here */}
        <div className="h-24 bg-base-200/50 rounded-lg mb-4 flex items-center justify-center border border-base-200 border-dashed flex-grow">
          <span className="text-xs opacity-40">Preview not available</span>
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
              onClick={() => setDeleteChart(chart)}
              title="Delete"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderListItem = (chart: Chart) => (
    <div
      key={chart.id}
      className="card bg-base-100 border border-base-300 hover:border-primary/50 transition-all shadow-sm card-side"
    >
      <div className="card-body flex-row items-center gap-6 py-4 w-full">
         <div className="w-10 h-10 rounded-lg bg-base-200 text-2xl flex items-center justify-center shrink-0">
            {categoryEmojis[chart.chart_type] || "📊"}
         </div>

         <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="min-w-0 flex-1">
              <h3 className="card-title text-base truncate">{chart.name}</h3>
              <p className="text-sm opacity-60 truncate capitalize">{chart.chart_type} Chart</p>
            </div>
         </div>

        <div className="card-actions justify-end">
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
              onClick={() => setDeleteChart(chart)}
              title="Delete"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="card bg-base-200 border border-base-300 text-center py-16">
      <div className="card-body items-center">
        <BarChart3 size={48} className="mb-4 opacity-20" />
        <h3 className="text-xl font-bold">No charts yet</h3>
        <p className="text-base-content/60 max-w-sm mb-6">
          Create charts to visualize your data. Choose from various types like bar, line, pie, and more.
        </p>
        <button className="btn btn-primary" onClick={() => navigate("/charts/new")}>
          <Plus size={18} />
          Create Chart
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
        title="Charts"
        description="Visualize your data with various chart types"
        items={charts}
        renderGridItem={renderGridItem}
        renderListItem={renderListItem}
        renderEmptyState={renderEmptyState}
        onCreate={() => navigate("/charts/new")}
        createButtonText="Create Chart"
        onSearch={() => {}}
        filterFunction={(c, query) => 
           c.name.toLowerCase().includes(query.toLowerCase()) || 
           c.chart_type.toLowerCase().includes(query.toLowerCase()) ||
           c.description?.toLowerCase().includes(query.toLowerCase())
        }
      />

      <ConfirmModal
        isOpen={!!deleteChart}
        onClose={() => setDeleteChart(null)}
        onConfirm={() => deleteChart && handleDelete(deleteChart.id)}
        title="Delete Chart"
        message={`Are you sure you want to delete "${deleteChart?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />

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
    </>
  );
};
