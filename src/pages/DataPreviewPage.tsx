import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";
import { datasetsApi } from "../lib/api";
import { useAppStore } from "../store/appStore";
import { DataPreviewTable } from "../components/DataPreviewTable";

export function DataPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [datasetName, setDatasetName] = useState("");
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
    <div className="flex flex-col h-[calc(100vh-4rem)] p-6 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button 
            className="btn btn-ghost btn-sm btn-square"
            onClick={() => navigate("/datasets")}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Data Preview</h1>
            {id && <p className="text-xs text-base-content/50 font-mono">ID: {id}</p>}
          </div>
        </div>
        <button 
          className="btn btn-ghost btn-sm"
          onClick={() => id && fetchPreviewData(id)}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 bg-base-100 rounded-lg border border-base-300 overflow-hidden shadow-sm relative">
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
