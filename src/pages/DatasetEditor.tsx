import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Database, Globe, FileSpreadsheet, RefreshCw, Table, Code, Check, Eye } from 'lucide-react';
import { Button } from '../shared/components/ui/Button';
import { Card } from '../shared/components/ui/Card';
import { Input, Select, Textarea } from '../shared/components/ui/Input';
import { Modal } from '../shared/components/ui/Modal';
import { datasetsApi, connectionsApi } from '../lib/api';
import { useAppStore } from '../store/appStore';

interface Connection {
  id: string;
  name: string;
  type: string;
  database_name?: string;
  config?: any;
}

interface TableInfo {
  table_schema: string;
  table_name: string;
  table_type: string;
}

interface ColumnInfo {
  column_name: string;
  data_type: string;
}

export function DatasetEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const { addToast } = useAppStore();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sourceType, setSourceType] = useState<'sql' | 'api' | 'googlesheet'>('sql');
  const [datasetType, setDatasetType] = useState<'physical' | 'virtual'>('physical');
  const [connectionId, setConnectionId] = useState('');
  const [tableSchema, setTableSchema] = useState('public');
  const [tableName, setTableName] = useState('');
  const [sqlQuery, setSqlQuery] = useState('');

  // Data state
  const [connections, setConnections] = useState<Connection[]>([]);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingTables, setLoadingTables] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Fetch connections on mount
  useEffect(() => {
    fetchConnections();
    if (isEditing) {
      fetchDataset();
    }
  }, [id]);

  // Fetch tables when connection changes (for SQL)
  useEffect(() => {
    if (sourceType === 'sql' && connectionId) {
      fetchTables();
    }
  }, [connectionId, sourceType]);

  // Fetch columns when table is selected
  useEffect(() => {
    if (sourceType === 'sql' && connectionId && tableName && datasetType === 'physical') {
      fetchColumnsFromTable();
    }
  }, [tableName, tableSchema]);

  // Fetch columns for API/Google Sheets when connection selected
  useEffect(() => {
    if ((sourceType === 'api' || sourceType === 'googlesheet') && connectionId) {
      fetchColumnsFromConnection();
    }
  }, [connectionId, sourceType]);

  const fetchConnections = async () => {
    try {
      const response = await connectionsApi.getAll();
      setConnections(response.data.connections);
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    }
  };

  const fetchDataset = async () => {
    setLoading(true);
    try {
      const response = await datasetsApi.getOne(id!);
      const dataset = response.data.dataset;
      setName(dataset.name);
      setDescription(dataset.description || '');
      setSourceType(dataset.source_type);
      setDatasetType(dataset.dataset_type);
      setConnectionId(dataset.connection_id || '');
      setTableSchema(dataset.table_schema || 'public');
      setTableName(dataset.table_name || '');
      setSqlQuery(dataset.sql_query || '');
      if (dataset.columns) {
        setColumns(dataset.columns);
      }
    } catch (error: any) {
      addToast('error', error.response?.data?.error || 'Failed to load dataset');
      navigate('/datasets');
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async () => {
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

  const fetchColumnsFromTable = async () => {
    try {
      const response = await connectionsApi.getTableSchema(connectionId, tableName, tableSchema);
      setColumns(response.data.columns);
    } catch (error) {
      console.error('Failed to fetch columns:', error);
    }
  };

  const fetchColumnsFromConnection = async () => {
    // For API/Google Sheets, we show placeholder - columns will be fetched after dataset is created
    setColumns([{ column_name: 'Data from source', data_type: 'Will be fetched when dataset is created' }]);
  };

  const handlePreviewData = () => {
    if (!connectionId) return;
    addToast('info', 'Save the dataset first, then use the Preview button on the datasets page');
  };

  const handleSaveClick = () => {
    if (!connectionId) {
      addToast('error', 'Please select a connection');
      return;
    }
    if (sourceType === 'sql' && datasetType === 'physical' && !tableName) {
      addToast('error', 'Please select a table');
      return;
    }
    if (sourceType === 'sql' && datasetType === 'virtual' && !sqlQuery) {
      addToast('error', 'Please enter a SQL query');
      return;
    }
    setShowSaveModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('error', 'Dataset name is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        description,
        source_type: sourceType,
        dataset_type: datasetType,
        connection_id: connectionId,
        table_name: datasetType === 'physical' ? tableName : undefined,
        table_schema: datasetType === 'physical' ? tableSchema : undefined,
        sql_query: datasetType === 'virtual' ? sqlQuery : undefined,
      };

      if (isEditing) {
        await datasetsApi.update(id!, payload);
        addToast('success', 'Dataset updated successfully');
      } else {
        await datasetsApi.create(payload);
        addToast('success', 'Dataset created successfully');
      }
      navigate('/datasets');
    } catch (error: any) {
      addToast('error', error.response?.data?.error || 'Failed to save dataset');
    } finally {
      setSaving(false);
    }
  };

  // Filter connections by source type
  const filteredConnections = connections.filter(conn => {
    if (sourceType === 'sql') return ['postgresql', 'mysql', 'mariadb'].includes(conn.type);
    if (sourceType === 'api') return conn.type === 'api';
    if (sourceType === 'googlesheet') return conn.type === 'googlesheet';
    return false;
  });

  // Group tables by schema
  const schemaGroups = tables.reduce((acc, table) => {
    const schema = table.table_schema;
    if (!acc[schema]) acc[schema] = [];
    acc[schema].push(table);
    return acc;
  }, {} as Record<string, TableInfo[]>);

  const schemas = Object.keys(schemaGroups);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-accent-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-bg-primary">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-bg-secondary">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/datasets')}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-text-primary">
                {isEditing ? 'Edit Dataset' : 'New Dataset'}
              </h1>
              <p className="text-sm text-text-tertiary">
                {isEditing ? 'Modify dataset configuration' : 'Create a new dataset from your data sources'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/datasets')}>
              Cancel
            </Button>
            <Button onClick={handleSaveClick} disabled={saving || !connectionId}>
              {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              {isEditing ? 'Update Dataset' : 'Create Dataset'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Source selection */}
        <div className="w-80 border-r border-border bg-bg-secondary overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Source Type */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Source Type
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                  {sourceType === 'sql' && <Database size={16} />}
                  {sourceType === 'api' && <Globe size={16} />}
                  {sourceType === 'googlesheet' && <FileSpreadsheet size={16} />}
                </div>
                <Select
                  value={sourceType}
                  onChange={(val: string | null) => {
                    const newType = (val || 'sql') as 'sql' | 'api' | 'googlesheet';
                    setSourceType(newType);
                    setConnectionId('');
                    setTableName('');
                    setColumns([]);
                  }}

                  options={[
                    { value: 'sql', label: 'SQL Database' },
                    { value: 'api', label: 'REST API' },
                    { value: 'googlesheet', label: 'Google Sheets' },
                  ]}
                  isClearable={false}
                />

              </div>
            </div>

            {/* Connection */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Connection
              </label>
              <Select
                value={connectionId || null}
                onChange={(val: string | null) => {
                  setConnectionId(val || '');
                  setTableName('');
                  setColumns([]);
                }}
                options={filteredConnections.map((conn) => ({
                  value: conn.id,
                  label: conn.name
                }))}
                placeholder="Select a connection..."
              />
              {filteredConnections.length === 0 && (
                <p className="text-xs text-accent-warning mt-2">
                  No {sourceType} connections available. <a href="/connections" className="underline">Create one</a>.
                </p>
              )}
            </div>

            {/* SQL-specific options */}
            {sourceType === 'sql' && connectionId && (
              <>
                {/* Dataset Type */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Dataset Type
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'physical', label: 'Physical', icon: Table, desc: 'Table/View' },
                      { value: 'virtual', label: 'Virtual', icon: Code, desc: 'SQL Query' },
                    ].map(({ value, label, icon: Icon, desc }) => (
                      <label
                        key={value}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          datasetType === value
                            ? 'border-accent-primary bg-accent-primary/10'
                            : 'border-border hover:border-border-hover'
                        }`}
                      >
                        <input
                          type="radio"
                          name="datasetType"
                          value={value}
                          checked={datasetType === value}
                          onChange={() => {
                            setDatasetType(value as any);
                            if (value === 'virtual') {
                              setTableName('');
                            }
                          }}
                          className="w-4 h-4 text-accent-primary focus:ring-accent-primary accent-accent-primary"
                        />
                        <Icon size={18} className={datasetType === value ? 'text-accent-primary' : 'text-text-tertiary'} />
                        <div className="flex-1">
                          <span className={`text-sm font-medium ${datasetType === value ? 'text-accent-primary' : 'text-text-primary'}`}>
                            {label}
                          </span>
                          <span className={`text-xs ml-2 ${datasetType === value ? 'text-accent-primary/70' : 'text-text-tertiary'}`}>
                            {desc}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Schema and Table selection for Physical */}
                {datasetType === 'physical' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Schema
                      </label>
                      <Select
                        value={tableSchema}
                        onChange={(val: string | null) => {
                          setTableSchema(val || 'public');
                          setTableName('');
                        }}
                        options={schemas.length > 0 
                          ? schemas.map((schema) => ({ value: schema, label: schema }))
                          : [{ value: 'public', label: 'public' }]
                        }
                        isClearable={false}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-text-secondary">
                          Table
                        </label>
                        <button
                          type="button"
                          onClick={fetchTables}
                          className="text-xs text-accent-primary hover:underline flex items-center gap-1"
                        >
                          <RefreshCw size={12} className={loadingTables ? 'animate-spin' : ''} />
                          Refresh
                        </button>
                      </div>
                      <Select
                        value={tableName || null}
                        onChange={(val: string | null) => setTableName(val || '')}
                        isDisabled={loadingTables}
                        options={(schemaGroups[tableSchema] || []).map((table) => ({
                          value: table.table_name,
                          label: `${table.table_name} (${table.table_type})`
                        }))}
                        placeholder={loadingTables ? 'Loading...' : 'Select a table...'}
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {/* API/Sheet info */}
            {(sourceType === 'api' || sourceType === 'googlesheet') && connectionId && (
              <div className="p-3 rounded-lg bg-accent-primary/10 border border-accent-primary/20">
                <p className="text-sm text-text-secondary">
                  {sourceType === 'api' 
                    ? 'Data will be fetched from the API endpoint configured in this connection.'
                    : 'Data will be fetched from the Google Sheet configured in this connection.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* SQL Query for Virtual datasets */}
            {sourceType === 'sql' && datasetType === 'virtual' && connectionId && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-4">SQL Query</h2>
                <Textarea
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  placeholder="SELECT * FROM users WHERE active = true"
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-text-tertiary mt-2">
                  Write a SQL query to define this virtual dataset
                </p>
              </Card>
            )}

            {/* Columns preview */}
            {columns.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-text-primary">
                    Columns ({columns.length})
                  </h2>
                  <Button variant="ghost" size="sm" onClick={handlePreviewData}>
                    <Eye size={16} className="mr-2" />
                    Preview Data
                  </Button>
                </div>
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="max-h-[60vh] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-bg-tertiary sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-text-secondary">Column Name</th>
                          <th className="px-4 py-2 text-right font-medium text-text-secondary">Data Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {columns.map((col, i) => (
                          <tr key={i} className="border-t border-border">
                            <td className="px-4 py-2 text-text-primary font-mono text-xs">
                              {col.column_name}
                            </td>
                            <td className="px-4 py-2 text-right text-text-tertiary uppercase text-xs">
                              {col.data_type}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>
            )}

            {/* Empty state */}
            {!connectionId && (
              <Card className="p-12 text-center">
                <Database className="w-16 h-16 mx-auto text-text-tertiary mb-4" />
                <h3 className="text-xl font-semibold text-text-primary mb-2">
                  Select a Data Source
                </h3>
                <p className="text-text-tertiary">
                  Choose a source type and connection from the sidebar to start configuring your dataset.
                </p>
              </Card>
            )}

            {connectionId && !tableName && sourceType === 'sql' && datasetType === 'physical' && (
              <Card className="p-12 text-center">
                <Table className="w-16 h-16 mx-auto text-text-tertiary mb-4" />
                <h3 className="text-xl font-semibold text-text-primary mb-2">
                  Select a Table
                </h3>
                <p className="text-text-tertiary">
                  Choose a schema and table from the sidebar to see its columns.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Save Modal - prompts for name and description */}
      <Modal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        title={isEditing ? "Update Dataset" : "Save Dataset"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Dataset Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Dataset"
            required
            autoFocus
          />
          <Textarea
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this dataset contain?"
            rows={3}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => setShowSaveModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving || !name.trim()}>
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {isEditing ? "Update Dataset" : "Create Dataset"}
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default DatasetEditorPage;
