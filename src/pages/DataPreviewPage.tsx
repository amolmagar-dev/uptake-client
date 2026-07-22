import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";
import { datasetsApi } from "../lib/api";
import { useAppStore } from "../store/appStore";
import { DataPreviewTable } from "../components/DataPreviewTable";
import { WorkspaceHeader } from "../shared/components";

export function DataPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const { addToast } = useAppStore();

  useEffect(() => {
    if (id) {
      fetchPreviewData(id);
    }
  }, [id]);

  const fetchPreviewData = async (datasetId: string) => {
    try {
      setLoading(true);
      // We might want to fetch dataset details too for the name, but preview often returns it or we can just show "Data Preview"
      // For now let's assume preview returns what we need or we just show a generic title
      const response = await datasetsApi.preview(datasetId);
      setData(response.data);
      // If the API returns the dataset name in the preview response, use it. 
      // Otherwise we might need a separate call to getDataset(id), but let's stick to simple first.
    } catch (error: any) {
      addToast("error", error.response?.data?.error || "Failed to fetch data preview");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <WorkspaceHeader
        title="Data Preview"
        description={id ? `ID: ${id}` : undefined}
        leading={
          <button
            type="button"
            onClick={() => navigate("/datasets")}
            className="btn btn-ghost btn-sm btn-square"
            aria-label="Back to datasets"
          >
            <ArrowLeft size={18} />
          </button>
        }
        actions={
          <button 
            type="button" 
            onClick={() => id && fetchPreviewData(id)} 
            disabled={loading}
            className="btn btn-ghost btn-sm gap-2"
            aria-label="Refresh"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        }
      />

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-base-100/50 backdrop-blur-sm z-50">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : data ? (
          <DataPreviewTable
            data={data.data}
            fields={data.fields}
            rowCount={data.rowCount}
            executionTime={data.executionTime}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-base-content/50 gap-2">
            <AlertCircle size={48} />
            <p>No preview data available</p>
          </div>
        )}
      </div>
    </div>
  );
}
