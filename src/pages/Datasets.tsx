import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Database, Trash2, Edit, Eye, RefreshCw, Table, Code, FileSpreadsheet, Globe } from 'lucide-react';
import { Button } from '../shared/components/ui/Button';
import { Card } from '../shared/components/ui/Card';
import { ConfirmModal, Modal } from '../shared/components/ui/Modal';
import { datasetsApi, type Dataset } from '../lib/api';
import { useAppStore } from '../store/appStore';

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
      addToast('error', error.response?.data?.error || 'Failed to fetch datasets');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await datasetsApi.delete(id);
      addToast('success', 'Dataset deleted successfully');
      setDeleteDataset(null);
      fetchDatasets();
    } catch (error: any) {
      addToast('error', error.response?.data?.error || 'Failed to delete dataset');
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
      addToast('error', error.response?.data?.error || 'Failed to preview dataset');
    } finally {
      setPreviewLoading(false);
    }
  };

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'sql':
        return <Database className="h-5 w-5" />;
      case 'googlesheet':
        return <FileSpreadsheet className="h-5 w-5" />;
      case 'api':
        return <Globe className="h-5 w-5" />;
      default:
        return <Database className="h-5 w-5" />;
    }
  };

  const getTypeIcon = (datasetType: string) => {
    return datasetType === 'physical' ? <Table className="h-4 w-4" /> : <Code className="h-4 w-4" />;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-[var(--bg-primary)] -mx-6 px-6 py-4 -mt-6 border-b border-[var(--border-primary)]">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Datasets</h1>
            <p className="text-[var(--text-tertiary)] mt-1">
              Create and manage reusable data sources for your charts
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => navigate('/datasets/new')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Dataset
          </Button>
        </div>
      </div>

      {/* Datasets Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-[var(--accent-primary)]" />
        </div>
      ) : datasets.length === 0 ? (
        <Card className="p-12 text-center">
          <Database className="h-16 w-16 mx-auto text-[var(--text-tertiary)] mb-4" />
          <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">No Datasets Yet</h3>
          <p className="text-[var(--text-tertiary)] mb-6">
            Create your first dataset to start building charts
          </p>
          <Button variant="primary" onClick={() => navigate('/datasets/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Dataset
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {datasets.map((dataset) => (
            <Card key={dataset.id} className="p-4 hover:border-[var(--accent-primary)] transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                    {getSourceIcon(dataset.source_type)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)]">{dataset.name}</h3>
                    <p className="text-sm text-[var(--text-tertiary)]">
                      {dataset.connection_name || 'External Source'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                    dataset.dataset_type === 'physical' 
                      ? 'bg-green-500/10 text-green-400' 
                      : 'bg-purple-500/10 text-purple-400'
                  }`}>
                    {getTypeIcon(dataset.dataset_type)}
                    {dataset.dataset_type}
                  </span>
                </div>
              </div>

              {dataset.description && (
                <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">
                  {dataset.description}
                </p>
              )}

              <div className="text-xs text-[var(--text-tertiary)] mb-3 space-y-1">
                {dataset.dataset_type === 'physical' && dataset.table_name && (
                  <p className="flex items-center gap-1">
                    <Table className="h-3 w-3" />
                    {dataset.table_schema}.{dataset.table_name}
                  </p>
                )}
                {dataset.columns && (
                  <p>{dataset.columns.length} columns</p>
                )}
              </div>

              <div className="flex gap-2 pt-3 border-t border-[var(--border-primary)]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePreview(dataset)}
                  title="Preview Data"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/datasets/${dataset.id}/edit`)}
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteDataset(dataset)}
                  className="text-red-400 hover:text-red-300"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
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
        size="lg"
      >
        {previewLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-[var(--accent-primary)]" />
          </div>
        ) : previewData ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-[var(--text-tertiary)]">
              <span>{previewData.rowCount} rows</span>
              <span>Execution time: {previewData.executionTime}ms</span>
            </div>
            <div className="overflow-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-[var(--bg-tertiary)] sticky top-0">
                  <tr>
                    {previewData.fields?.map((field: any, i: number) => (
                      <th key={i} className="px-3 py-2 text-left font-medium text-[var(--text-secondary)]">
                        {field.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.data?.map((row: any, i: number) => (
                    <tr key={i} className="border-t border-[var(--border-primary)]">
                      {previewData.fields?.map((field: any, j: number) => (
                        <td key={j} className="px-3 py-2 text-[var(--text-primary)]">
                          {row[field.name]?.toString() ?? 'null'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-[var(--text-tertiary)] text-center py-8">No data available</p>
        )}
      </Modal>
    </div>
  );
}

export default DatasetsPage;
