import React, { useState, useEffect } from 'react';
import { Plus, Database, Trash2, Edit, Eye, RefreshCw, Table, Code, FileSpreadsheet, Globe } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input, Select, Textarea } from '../components/ui/Input';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import { datasetsApi, connectionsApi, type Dataset, type DatasetInput } from '../lib/api';
import { useAppStore } from '../store/appStore';

interface Connection {
  id: string;
  name: string;
  type: string;
  database_name: string;
}

interface TableInfo {
  table_schema: string;
  table_name: string;
  table_type: string;
}

export function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDataset, setEditingDataset] = useState<Dataset | null>(null);
  const [deleteDataset, setDeleteDataset] = useState<Dataset | null>(null);
  const [previewDataset, setPreviewDataset] = useState<Dataset | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const { addToast } = useAppStore();

  useEffect(() => {
    fetchDatasets();
    fetchConnections();
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

  const fetchConnections = async () => {
    try {
      const response = await connectionsApi.getAll();
      setConnections(response.data.connections);
    } catch (error) {
      console.error('Failed to fetch connections:', error);
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
            onClick={() => {
              setEditingDataset(null);
              setIsModalOpen(true);
            }}
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
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
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
                  onClick={() => {
                    setEditingDataset(dataset);
                    setIsModalOpen(true);
                  }}
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

      {/* Create/Edit Modal */}
      <DatasetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingDataset(null);
        }}
        dataset={editingDataset}
        connections={connections}
        onSuccess={() => {
          setIsModalOpen(false);
          setEditingDataset(null);
          fetchDatasets();
        }}
      />

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

// Dataset Modal Component
interface DatasetModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: Dataset | null;
  connections: Connection[];
  onSuccess: () => void;
}

function DatasetModal({ isOpen, onClose, dataset, connections, onSuccess }: DatasetModalProps) {
  const [formData, setFormData] = useState<DatasetInput>({
    name: '',
    description: '',
    source_type: 'sql',
    dataset_type: 'physical',
    connection_id: '',
    table_name: '',
    table_schema: 'public',
    sql_query: '',
  });
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { addToast } = useAppStore();

  useEffect(() => {
    if (dataset) {
      setFormData({
        name: dataset.name,
        description: dataset.description || '',
        source_type: dataset.source_type as DatasetInput['source_type'],
        dataset_type: dataset.dataset_type as DatasetInput['dataset_type'],
        connection_id: dataset.connection_id || '',
        table_name: dataset.table_name || '',
        table_schema: dataset.table_schema || 'public',
        sql_query: dataset.sql_query || '',
      });
      if (dataset.connection_id) {
        fetchTables(dataset.connection_id);
      }
    } else {
      setFormData({
        name: '',
        description: '',
        source_type: 'sql',
        dataset_type: 'physical',
        connection_id: connections[0]?.id || '',
        table_name: '',
        table_schema: 'public',
        sql_query: '',
      });
      setTables([]);
    }
    setTestResult(null);
  }, [dataset, isOpen, connections]);

  const fetchTables = async (connectionId: string) => {
    if (!connectionId) return;
    setLoadingTables(true);
    try {
      const response = await connectionsApi.getTables(connectionId);
      setTables(response.data.tables);
    } catch (error) {
      console.error('Failed to fetch tables:', error);
    } finally {
      setLoadingTables(false);
    }
  };

  const handleConnectionChange = (connectionId: string) => {
    setFormData({ ...formData, connection_id: connectionId, table_name: '' });
    fetchTables(connectionId);
  };

  const handleTestQuery = async () => {
    if (!formData.connection_id || !formData.sql_query) {
      addToast('error', 'Please select a connection and enter a SQL query');
      return;
    }
    setTestLoading(true);
    setTestResult(null);
    try {
      // Create a temporary dataset to test via preview
      const tempDataset: DatasetInput = {
        ...formData,
        name: 'Test Query',
      };
      const createResponse = await datasetsApi.create(tempDataset);
      const tempId = createResponse.data.dataset.id;
      
      try {
        const previewResponse = await datasetsApi.preview(tempId);
        setTestResult({
          success: true,
          data: previewResponse.data,
        });
      } finally {
        // Clean up temp dataset
        await datasetsApi.delete(tempId);
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        error: error.response?.data?.error || 'Query failed',
      });
    } finally {
      setTestLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (dataset) {
        await datasetsApi.update(dataset.id, formData);
        addToast('success', 'Dataset updated successfully');
      } else {
        await datasetsApi.create(formData);
        addToast('success', 'Dataset created successfully');
      }
      onSuccess();
    } catch (error: any) {
      addToast('error', error.response?.data?.error || 'Failed to save dataset');
    } finally {
      setSaving(false);
    }
  };

  // Group tables by schema
  const schemaGroups = tables.reduce((acc, table) => {
    const schema = table.table_schema;
    if (!acc[schema]) acc[schema] = [];
    acc[schema].push(table);
    return acc;
  }, {} as Record<string, TableInfo[]>);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={dataset ? 'Edit Dataset' : 'Create Dataset'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="My Dataset"
          required
        />

        <Textarea
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Optional description..."
          rows={2}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Source Type"
            value={formData.source_type}
            onChange={(e) => {
              const newType = e.target.value as DatasetInput['source_type'];
              setFormData({ 
                ...formData, 
                source_type: newType,
                connection_id: '',
                dataset_type: newType === 'sql' ? formData.dataset_type : 'physical',
              });
            }}
          >
            <option value="sql">SQL Database</option>
            <option value="api">REST API</option>
            <option value="googlesheet">Google Sheets</option>
          </Select>
        </div>

        {formData.source_type === 'sql' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Dataset Type"
                value={formData.dataset_type}
                onChange={(e) => setFormData({ ...formData, dataset_type: e.target.value as DatasetInput['dataset_type'] })}
              >
                <option value="physical">Physical (Table/View)</option>
                <option value="virtual">Virtual (SQL Query)</option>
              </Select>

              <Select
                label="Connection"
                value={formData.connection_id}
                onChange={(e) => handleConnectionChange(e.target.value)}
                required
              >
                <option value="">Select a connection...</option>
                {connections
                  .filter((conn) => ['postgresql', 'mysql', 'mariadb'].includes(conn.type))
                  .map((conn) => (
                    <option key={conn.id} value={conn.id}>
                      {conn.name} ({conn.type})
                    </option>
                  ))}
              </Select>
            </div>

            {formData.dataset_type === 'physical' && (
              <div className="grid grid-cols-3 gap-4">
                <Select
                  label="Schema"
                  value={formData.table_schema}
                  onChange={(e) => setFormData({ ...formData, table_schema: e.target.value })}
                >
                  {Object.keys(schemaGroups).length > 0 ? (
                    Object.keys(schemaGroups).map((schema) => (
                      <option key={schema} value={schema}>{schema}</option>
                    ))
                  ) : (
                    <option value="public">public</option>
                  )}
                </Select>

                <div className="col-span-2">
                  <Select
                    label="Table"
                    value={formData.table_name}
                    onChange={(e) => setFormData({ ...formData, table_name: e.target.value })}
                    disabled={loadingTables}
                    required
                  >
                    <option value="">
                      {loadingTables ? 'Loading tables...' : 'Select a table...'}
                    </option>
                    {schemaGroups[formData.table_schema || 'public']?.map((table) => (
                      <option key={table.table_name} value={table.table_name}>
                        {table.table_name} ({table.table_type})
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            )}

            {formData.dataset_type === 'virtual' && (
              <div className="space-y-2">
                <Textarea
                  label="SQL Query"
                  value={formData.sql_query}
                  onChange={(e) => setFormData({ ...formData, sql_query: e.target.value })}
                  placeholder="SELECT * FROM users WHERE active = true"
                  rows={6}
                  className="font-mono text-sm"
                  required
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleTestQuery}
                    disabled={testLoading || !formData.sql_query}
                  >
                    {testLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Test Query
                      </>
                    )}
                  </Button>
                </div>

                {testResult && (
                  <div className={`p-3 rounded-lg text-sm ${
                    testResult.success 
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {testResult.success ? (
                      <p>✓ Query successful - {testResult.data.rowCount} rows returned</p>
                    ) : (
                      <p>✗ {testResult.error}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* API Source Type */}
        {formData.source_type === 'api' && (
          <>
            <Select
              label="API Connection"
              value={formData.connection_id}
              onChange={(e) => setFormData({ ...formData, connection_id: e.target.value })}
              required
            >
              <option value="">Select an API connection...</option>
              {connections
                .filter((conn) => conn.type === 'api')
                .map((conn) => (
                  <option key={conn.id} value={conn.id}>
                    {conn.name}
                  </option>
                ))}
            </Select>
            {connections.filter(c => c.type === 'api').length === 0 && (
              <p className="text-sm text-yellow-400">
                No API connections available. <a href="/connections" className="underline">Create one first</a>.
              </p>
            )}
          </>
        )}

        {/* Google Sheets Source Type */}
        {formData.source_type === 'googlesheet' && (
          <>
            <Select
              label="Google Sheets Connection"
              value={formData.connection_id}
              onChange={(e) => setFormData({ ...formData, connection_id: e.target.value })}
              required
            >
              <option value="">Select a Google Sheets connection...</option>
              {connections
                .filter((conn) => conn.type === 'googlesheet')
                .map((conn) => (
                  <option key={conn.id} value={conn.id}>
                    {conn.name}
                  </option>
                ))}
            </Select>
            {connections.filter(c => c.type === 'googlesheet').length === 0 && (
              <p className="text-sm text-yellow-400">
                No Google Sheets connections available. <a href="/connections" className="underline">Create one first</a>.
              </p>
            )}
          </>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-primary)]">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving...' : dataset ? 'Update Dataset' : 'Create Dataset'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default DatasetsPage;
