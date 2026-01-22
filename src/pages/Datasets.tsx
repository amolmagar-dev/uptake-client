import { useState, useEffect } from "react";
import { ResourceListing } from "../shared/components/ResourceListing";
import { useNavigate } from "react-router-dom";
import { Plus, Database, Trash2, Edit, Eye, Table, Code, FileSpreadsheet, Globe } from "lucide-react";
import { ConfirmModal } from "../shared/components/ui/Modal";
import { datasetsApi, type Dataset } from "../lib/api";
import { useAppStore } from "../store/appStore";

export function DatasetsPage() {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDataset, setDeleteDataset] = useState<Dataset | null>(null);
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

  const handlePreview = (dataset: Dataset, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigate(`/datasets/${dataset.id}/preview`);
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

  const renderGridItem = (dataset: Dataset) => (
    <div
      key={dataset.id}
      className="card bg-base-100 border border-base-300 hover:border-primary/50 transition-all shadow-sm h-full"
    >
      <div className="card-body p-6 flex flex-col h-full">
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
          <p className="text-sm opacity-70 mb-4 line-clamp-2 h-10 flex-grow-0">{dataset.description}</p>
        )}

        <div className="text-xs opacity-50 space-y-1 mb-6 flex-grow">
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
              onClick={(e) => handlePreview(dataset, e)}
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
  );

  const renderListItem = (dataset: Dataset) => (
    <div
      key={dataset.id}
      className="card bg-base-100 border border-base-300 hover:border-primary/50 transition-all shadow-sm card-side"
    >
      <div className="card-body flex-row items-center gap-6 py-4 w-full">
         <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            {getSourceIcon(dataset.source_type)}
         </div>

        <div className="min-w-0 flex-1">
          <h3 className="card-title text-base truncate">{dataset.name}</h3>
          <p className="text-xs opacity-60 truncate">
            {dataset.connection_name || "External Source"} •{" "}
            {dataset.columns?.length || 0} columns
          </p>
        </div>

        <span
          className={`badge badge-sm gap-1 shrink-0 ${
            dataset.dataset_type === "physical"
              ? "badge-success badge-outline"
              : "badge-secondary badge-outline"
          }`}
        >
          {getTypeIcon(dataset.dataset_type)}
          {dataset.dataset_type}
        </span>

        <div className="card-actions justify-end">
          <div className="flex items-center gap-1">
            <button
              className="btn btn-ghost btn-sm btn-square"
              onClick={(e) => handlePreview(dataset, e)}
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
  );

  const renderEmptyState = () => (
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
  );

  if (loading) {
     return (
       <div className="flex items-center justify-center h-64">
         <div className="spinner" />
       </div>
     );
   }

  return (
    <>
      <ResourceListing
        title="Datasets"
        description="Create and manage reusable data sources for your charts"
        items={datasets}
        renderGridItem={renderGridItem}
        renderListItem={renderListItem}
        renderEmptyState={renderEmptyState}
        onCreate={() => navigate("/datasets/new")}
        createButtonText="Create Dataset"
        onSearch={() => {}}
        filterFunction={(d, query) => 
           d.name.toLowerCase().includes(query.toLowerCase()) || 
           (d.connection_name?.toLowerCase().includes(query.toLowerCase()) ?? false) || 
           (d.table_name?.toLowerCase().includes(query.toLowerCase()) ?? false) ||
           (d.description?.toLowerCase().includes(query.toLowerCase()) ?? false)
        }
      />

      <ConfirmModal
        isOpen={!!deleteDataset}
        onClose={() => setDeleteDataset(null)}
        onConfirm={() => deleteDataset && handleDelete(deleteDataset.id)}
        title="Delete Dataset"
        message={`Are you sure you want to delete "${deleteDataset?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
}

export default DatasetsPage;
