import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Database, Trash2, Edit, Eye, RefreshCw, Table, Code, FileSpreadsheet, Globe } from "lucide-react";
import { ConfirmModal, Modal } from "../shared/components/ui/Modal";
import { datasetsApi, type Dataset } from "../lib/api";
import { useAppStore } from "../store/appStore";

export function DatasetsPage() {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDataset, setDeleteDataset] = useState<Dataset | null>(null);
  const [previewDataset, setPreviewDataset] = useState<Dataset | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const { addToast } = useAppStore();

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const response = await datasetsApi.getAll();
      setDatasets(response.data.datasets);
    } catch (error: any) {
      addToast("error", error.response?.data?.error || "Failed to fetch datasets");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await datasetsApi.delete(id);
      addToast("success", "Dataset deleted successfully");
      setDeleteDataset(null);
      fetchDatasets();
    } catch (error: any) {
      addToast("error", error.response?.data?.error || "Failed to delete dataset");
    }
  };

  const handlePreview = async (dataset: Dataset) => {
    setPreviewDataset(dataset);
    setPreviewLoading(true);
    setPreviewData(null);
    try {
      const response = await datasetsApi.preview(dataset.id);
      setPreviewData(response.data);
    } catch (error: any) {
      addToast("error", error.response?.data?.error || "Failed to preview dataset");
    } finally {
      setPreviewLoading(false);
    }
  };

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case "sql":
        return <Database className="h-5 w-5" />;
      case "googlesheet":
        return <FileSpreadsheet className="h-5 w-5" />;
      case "api":
        return <Globe className="h-5 w-5" />;
      default:
        return <Database className="h-5 w-5" />;
    }
  };

  const getTypeIcon = (datasetType: string) => {
    return datasetType === "physical" ? <Table className="h-4 w-4" /> : <Code className="h-4 w-4" />;
  };

  return (
    <div className="p-6 lg:p-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Datasets</h1>
          <p className="text-base-content/60 mt-1 text-sm">Create and manage reusable data sources for your charts</p>
        </div>
        <button className="btn btn-primary btn-sm md:btn-md" onClick={() => navigate("/datasets/new")}>
          <Plus size={18} />
          <span>Create Dataset</span>
        </button>
      </div>

      {/* Datasets Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : datasets.length === 0 ? (
        <div className="card bg-base-200 border border-base-300 text-center py-16">
          <div className="card-body items-center">
            <Database size={48} className="mb-4 opacity-20" />
            <h3 className="text-xl font-bold">No datasets yet</h3>
            <p className="text-base-content/60 max-w-sm mb-6">
              Datasets connect your charts to your data sources. Create your first one to get started.
            </p>
            <button className="btn btn-primary" onClick={() => navigate("/datasets/new")}>
              <Plus size={18} />
              Create Dataset
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {datasets.map((dataset) => (
            <div
              key={dataset.id}
              className="card bg-base-100 border border-base-300 hover:border-primary/50 transition-all shadow-sm"
            >
              <div className="card-body p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      {getSourceIcon(dataset.source_type)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="card-title text-base truncate">{dataset.name}</h3>
                      <p className="text-xs opacity-60 truncate">{dataset.connection_name || "External Source"}</p>
                    </div>
                  </div>
                  <span
                    className={`badge badge-sm gap-1 ${
                      dataset.dataset_type === "physical"
                        ? "badge-success badge-outline"
                        : "badge-secondary badge-outline"
                    }`}
                  >
                    {getTypeIcon(dataset.dataset_type)}
                    {dataset.dataset_type}
                  </span>
                </div>

                {dataset.description && (
                  <p className="text-sm opacity-70 mb-4 line-clamp-2 h-10">{dataset.description}</p>
                )}

                <div className="text-xs opacity-50 space-y-1 mb-6">
                  {dataset.dataset_type === "physical" && dataset.table_name && (
                    <div className="flex items-center gap-1">
                      <Table size={12} />
                      <span className="truncate">
                        {dataset.table_schema}.{dataset.table_name}
                      </span>
                    </div>
                  )}
                  {dataset.columns && (
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">{dataset.columns.length}</span>
                      <span>columns</span>
                    </div>
                  )}
                </div>

                <div className="card-actions justify-end mt-auto pt-4 border-t border-base-200">
                  <div className="flex items-center gap-1">
                    <button
                      className="btn btn-ghost btn-sm btn-square"
                      onClick={() => handlePreview(dataset)}
                      title="Preview Data"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      className="btn btn-ghost btn-sm btn-square"
                      onClick={() => navigate(`/datasets/${dataset.id}/edit`)}
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      className="btn btn-ghost btn-sm btn-square text-error"
                      onClick={() => setDeleteDataset(dataset)}
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
      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteDataset}
        onClose={() => setDeleteDataset(null)}
        onConfirm={() => deleteDataset && handleDelete(deleteDataset.id)}
        title="Delete Dataset"
        message={`Are you sure you want to delete "${deleteDataset?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />

      {/* Preview Modal */}
      <Modal
        isOpen={!!previewDataset}
        onClose={() => {
          setPreviewDataset(null);
          setPreviewData(null);
        }}
        title={`Preview: ${previewDataset?.name}`}
        size="full"
      >
        {previewLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-accent-primary" />
          </div>
        ) : previewData ? (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between text-sm text-text-tertiary mb-4">
              <span>{previewData.rowCount} rows</span>
              <span>Execution time: {previewData.executionTime}ms</span>
            </div>
            <div className="overflow-auto flex-1">
              <table className="w-full text-sm">
                <thead className="bg-bg-tertiary sticky top-0">
                  <tr>
                    {previewData.fields?.map((field: any, i: number) => (
                      <th key={i} className="px-3 py-2 text-left font-medium text-text-secondary">
                        {field.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.data?.map((row: any, i: number) => (
                    <tr key={i} className="border-t border-border">
                      {previewData.fields?.map((field: any, j: number) => (
                        <td key={j} className="px-3 py-2 text-text-primary">
                          {row[field.name]?.toString() ?? "null"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-text-tertiary text-center py-8">No data available</p>
        )}
      </Modal>
    </div>
  );
}

export default DatasetsPage;
