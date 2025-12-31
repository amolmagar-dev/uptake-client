import React, { useState, useEffect } from 'react';
import { Plus, Database, Trash2, Edit, RefreshCw, CheckCircle, XCircle, Table, Globe, FileSpreadsheet } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input, Select, Textarea } from '../components/ui/Input';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import { connectionsApi, type ConnectionInput, type ApiConfig, type GoogleSheetsConfig } from '../lib/api';
import { useAppStore } from '../store/appStore';

interface Connection {
  id: string;
  name: string;
  type: ConnectionInput['type'];
  host?: string;
  port?: number;
  database_name?: string;
  username?: string;
  ssl?: number;
  config?: any;
}

interface TableInfo {
  table_schema: string;
  table_name: string;
  table_type: string;
}

export const ConnectionsPage: React.FC = () => {
  const { setConnections, addToast } = useAppStore();
  const [connections, setLocalConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [expandedConnection, setExpandedConnection] = useState<string | null>(null);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);

  const fetchConnections = async () => {
    try {
      const response = await connectionsApi.getAll();
      setLocalConnections(response.data.connections);
      setConnections(response.data.connections);
    } catch (error) {
      addToast('error', 'Failed to fetch connections');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      const response = await connectionsApi.test(id);
      setTestResults(prev => ({ ...prev, [id]: response.data.success }));
      addToast(
        response.data.success ? 'success' : 'error',
        response.data.message
      );
    } catch (error: any) {
      setTestResults(prev => ({ ...prev, [id]: false }));
      addToast('error', 'Connection test failed');
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await connectionsApi.delete(id);
      addToast('success', 'Connection deleted');
      fetchConnections();
    } catch (error) {
      addToast('error', 'Failed to delete connection');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleExpand = async (id: string, type: string) => {
    if (['api', 'googlesheet'].includes(type)) return; // No tables for these types
    
    if (expandedConnection === id) {
      setExpandedConnection(null);
      setTables([]);
      return;
    }

    setExpandedConnection(id);
    setLoadingTables(true);
    try {
      const response = await connectionsApi.getTables(id);
      setTables(response.data.tables);
    } catch (error) {
      addToast('error', 'Failed to fetch tables');
    } finally {
      setLoadingTables(false);
    }
  };

  const getConnectionIcon = (type: string) => {
    if (type === 'api') return Globe;
    if (type === 'googlesheet') return FileSpreadsheet;
    return Database;
  };

  const getConnectionColor = (type: string) => {
    const colors: Record<string, string> = {
      postgresql: '#336791',
      postgres: '#336791',
      mysql: '#4479A1',
      mariadb: '#003545',
      api: '#00f5d4',
      googlesheet: '#34a853',
    };
    return colors[type.toLowerCase()] || '#00f5d4';
  };

  const getConnectionDescription = (conn: Connection) => {
    if (conn.type === 'api') {
      return `REST API • ${conn.config?.url || 'No URL'}`;
    }
    if (conn.type === 'googlesheet') {
      return `Google Sheets • ${conn.config?.spreadsheet_id?.substring(0, 20) || 'No ID'}...`;
    }
    return `${conn.type} • ${conn.host}:${conn.port} • ${conn.database_name}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Sticky Header */}
      <div className="flex-shrink-0 sticky top-0 bg-[#0a0a0f] z-10 pb-4 -mx-6 px-6">
        <div className="flex items-center justify-between py-4">
          <div>
            <h1 className="text-2xl font-bold text-[#f0f0f5]">Connections</h1>
            <p className="text-[#a0a0b0] mt-1">Manage databases, APIs, and data sources</p>
          </div>
          <Button
            leftIcon={<Plus size={18} />}
            onClick={() => {
              setEditingConnection(null);
              setShowModal(true);
            }}
          >
            Add Connection
          </Button>
        </div>
      </div>

      {connections.length === 0 ? (
        <Card className="text-center py-12">
          <Database size={48} className="mx-auto mb-4 text-[#606070]" />
          <h3 className="text-lg font-medium text-[#f0f0f5] mb-2">No connections yet</h3>
          <p className="text-[#a0a0b0] mb-4">Add your first connection to get started</p>
          <Button onClick={() => setShowModal(true)} leftIcon={<Plus size={16} />}>
            Add Connection
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {connections.map((connection) => {
            const IconComponent = getConnectionIcon(connection.type);
            const isSqlType = !['api', 'googlesheet'].includes(connection.type);
            
            return (
              <Card key={connection.id} hover className="overflow-hidden">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${getConnectionColor(connection.type)}20` }}
                  >
                    <IconComponent size={24} style={{ color: getConnectionColor(connection.type) }} />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#f0f0f5]">{connection.name}</h3>
                    <p className="text-sm text-[#a0a0b0]">{getConnectionDescription(connection)}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {testResults[connection.id] !== undefined && (
                      testResults[connection.id] ? (
                        <CheckCircle size={20} className="text-[#00f5a0]" />
                      ) : (
                        <XCircle size={20} className="text-[#ff4757]" />
                      )
                    )}
                    
                    {isSqlType && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExpand(connection.id, connection.type)}
                        leftIcon={<Table size={16} />}
                      >
                        Tables
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTest(connection.id)}
                      isLoading={testingId === connection.id}
                      leftIcon={<RefreshCw size={16} />}
                    >
                      Test
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingConnection(connection);
                        setShowModal(true);
                      }}
                      leftIcon={<Edit size={16} />}
                    >
                      Edit
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirm(connection.id)}
                      className="text-[#ff4757] hover:text-[#ff4757]"
                      leftIcon={<Trash2 size={16} />}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {expandedConnection === connection.id && isSqlType && (
                  <div className="mt-4 pt-4 border-t border-[#2a2a3a]">
                    {loadingTables ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="spinner" />
                      </div>
                    ) : tables.length === 0 ? (
                      <p className="text-[#606070] text-center py-4">No tables found</p>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {tables.map((table, i) => (
                          <div
                            key={i}
                            className="px-3 py-2 rounded-lg bg-[#1a1a25] text-sm flex items-center gap-2"
                          >
                            <Table size={14} className="text-[#606070]" />
                            <span className="text-[#a0a0b0]">{table.table_schema}.</span>
                            <span className="text-[#f0f0f5]">{table.table_name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <ConnectionModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingConnection(null);
        }}
        connection={editingConnection}
        onSuccess={() => {
          setShowModal(false);
          setEditingConnection(null);
          fetchConnections();
        }}
      />

      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Connection"
        message="Are you sure you want to delete this connection? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  connection: Connection | null;
  onSuccess: () => void;
}

const ConnectionModal: React.FC<ConnectionModalProps> = ({
  isOpen,
  onClose,
  connection,
  onSuccess,
}) => {
  const { addToast } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [connectionType, setConnectionType] = useState<ConnectionInput['type']>('postgresql');
  
  // SQL form data
  const [sqlForm, setSqlForm] = useState({
    name: '',
    host: 'localhost',
    port: 5432,
    database_name: '',
    username: '',
    password: '',
    ssl: false,
  });

  // API form data
  const [apiForm, setApiForm] = useState<ApiConfig & { name: string }>({
    name: '',
    url: '',
    method: 'GET',
    auth_type: 'none',
    api_key: '',
    bearer_token: '',
    data_path: '',
  });

  // Google Sheets form data
  const [sheetsForm, setSheetsForm] = useState<GoogleSheetsConfig & { name: string }>({
    name: '',
    spreadsheet_id: '',
    sheet_name: 'Sheet1',
    api_key: '',
  });

  useEffect(() => {
    if (connection) {
      setConnectionType(connection.type);
      if (['api'].includes(connection.type)) {
        setApiForm({
          name: connection.name,
          ...connection.config,
        });
      } else if (connection.type === 'googlesheet') {
        setSheetsForm({
          name: connection.name,
          ...connection.config,
        });
      } else {
        setSqlForm({
          name: connection.name,
          host: connection.host || 'localhost',
          port: connection.port || 5432,
          database_name: connection.database_name || '',
          username: connection.username || '',
          password: '',
          ssl: connection.ssl === 1,
        });
      }
    } else {
      setConnectionType('postgresql');
      setSqlForm({
        name: '', host: 'localhost', port: 5432, database_name: '', username: '', password: '', ssl: false,
      });
      setApiForm({ name: '', url: '', method: 'GET', auth_type: 'none', api_key: '', bearer_token: '', data_path: '' });
      setSheetsForm({ name: '', spreadsheet_id: '', sheet_name: 'Sheet1', api_key: '' });
    }
  }, [connection, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let formData: ConnectionInput;

      if (connectionType === 'api') {
        const { name, ...config } = apiForm;
        formData = { name, type: 'api', config };
      } else if (connectionType === 'googlesheet') {
        const { name, ...config } = sheetsForm;
        formData = { name, type: 'googlesheet', config };
      } else {
        formData = {
          name: sqlForm.name,
          type: connectionType as 'postgresql' | 'mysql' | 'mariadb',
          host: sqlForm.host,
          port: sqlForm.port,
          database_name: sqlForm.database_name,
          username: sqlForm.username,
          password: sqlForm.password || undefined,
          ssl: sqlForm.ssl,
        };
      }

      if (connection) {
        await connectionsApi.update(connection.id, formData);
        addToast('success', 'Connection updated successfully');
      } else {
        await connectionsApi.create(formData);
        addToast('success', 'Connection created successfully');
      }
      onSuccess();
    } catch (error: any) {
      addToast('error', error.response?.data?.error || 'Failed to save connection');
    } finally {
      setIsLoading(false);
    }
  };

  const connectionTypes = [
    { value: 'postgresql', label: '🐘 PostgreSQL' },
    { value: 'mysql', label: '🐬 MySQL' },
    { value: 'mariadb', label: '🦭 MariaDB' },
    { value: 'api', label: '🌐 REST API' },
    { value: 'googlesheet', label: '📊 Google Sheets' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={connection ? 'Edit Connection' : 'New Connection'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Connection Type"
          options={connectionTypes}
          value={connectionType}
          onChange={(e) => setConnectionType(e.target.value as ConnectionInput['type'])}
        />

        {/* SQL Database Form */}
        {['postgresql', 'mysql', 'mariadb'].includes(connectionType) && (
          <>
            <Input
              label="Connection Name"
              placeholder="My Database"
              value={sqlForm.name}
              onChange={(e) => setSqlForm(prev => ({ ...prev, name: e.target.value }))}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Host"
                placeholder="localhost"
                value={sqlForm.host}
                onChange={(e) => setSqlForm(prev => ({ ...prev, host: e.target.value }))}
                required
              />
              <Input
                label="Port"
                type="number"
                value={sqlForm.port}
                onChange={(e) => setSqlForm(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                required
              />
            </div>
            <Input
              label="Database Name"
              placeholder="my_database"
              value={sqlForm.database_name}
              onChange={(e) => setSqlForm(prev => ({ ...prev, database_name: e.target.value }))}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Username"
                placeholder="postgres"
                value={sqlForm.username}
                onChange={(e) => setSqlForm(prev => ({ ...prev, username: e.target.value }))}
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder={connection ? '(unchanged)' : '••••••••'}
                value={sqlForm.password}
                onChange={(e) => setSqlForm(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sqlForm.ssl}
                onChange={(e) => setSqlForm(prev => ({ ...prev, ssl: e.target.checked }))}
                className="w-4 h-4 rounded border-[#2a2a3a] bg-[#1a1a25] text-[#00f5d4] focus:ring-[#00f5d4]"
              />
              <span className="text-sm text-[#a0a0b0]">Use SSL connection</span>
            </label>
          </>
        )}

        {/* API Form */}
        {connectionType === 'api' && (
          <>
            <Input
              label="Connection Name"
              placeholder="My API"
              value={apiForm.name}
              onChange={(e) => setApiForm(prev => ({ ...prev, name: e.target.value }))}
              required
            />
            <Input
              label="API URL"
              placeholder="https://api.example.com/data"
              value={apiForm.url}
              onChange={(e) => setApiForm(prev => ({ ...prev, url: e.target.value }))}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Method"
                options={[
                  { value: 'GET', label: 'GET' },
                  { value: 'POST', label: 'POST' },
                ]}
                value={apiForm.method}
                onChange={(e) => setApiForm(prev => ({ ...prev, method: e.target.value as 'GET' | 'POST' }))}
              />
              <Select
                label="Authentication"
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'api_key', label: 'API Key' },
                  { value: 'bearer', label: 'Bearer Token' },
                ]}
                value={apiForm.auth_type}
                onChange={(e) => setApiForm(prev => ({ ...prev, auth_type: e.target.value as any }))}
              />
            </div>
            {apiForm.auth_type === 'api_key' && (
              <Input
                label="API Key"
                type="password"
                placeholder="Your API key"
                value={apiForm.api_key}
                onChange={(e) => setApiForm(prev => ({ ...prev, api_key: e.target.value }))}
              />
            )}
            {apiForm.auth_type === 'bearer' && (
              <Input
                label="Bearer Token"
                type="password"
                placeholder="Your bearer token"
                value={apiForm.bearer_token}
                onChange={(e) => setApiForm(prev => ({ ...prev, bearer_token: e.target.value }))}
              />
            )}
            <Input
              label="Data Path (optional)"
              placeholder="data.items"
              helperText="JSON path to array in response (e.g., 'data.items')"
              value={apiForm.data_path}
              onChange={(e) => setApiForm(prev => ({ ...prev, data_path: e.target.value }))}
            />
          </>
        )}

        {/* Google Sheets Form */}
        {connectionType === 'googlesheet' && (
          <>
            <Input
              label="Connection Name"
              placeholder="My Spreadsheet"
              value={sheetsForm.name}
              onChange={(e) => setSheetsForm(prev => ({ ...prev, name: e.target.value }))}
              required
            />
            <Input
              label="Spreadsheet ID or URL"
              placeholder="1BxiMVs0XRA5nFMdKv...or full URL"
              helperText="Found in the spreadsheet URL after /d/"
              value={sheetsForm.spreadsheet_id}
              onChange={(e) => {
                let value = e.target.value;
                // Extract ID from URL if pasted
                const match = value.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
                if (match) value = match[1];
                setSheetsForm(prev => ({ ...prev, spreadsheet_id: value }));
              }}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Sheet Name"
                placeholder="Sheet1"
                value={sheetsForm.sheet_name}
                onChange={(e) => setSheetsForm(prev => ({ ...prev, sheet_name: e.target.value }))}
              />
              <Input
                label="API Key (optional)"
                type="password"
                placeholder="For private sheets"
                value={sheetsForm.api_key}
                onChange={(e) => setSheetsForm(prev => ({ ...prev, api_key: e.target.value }))}
              />
            </div>
            <p className="text-xs text-[#606070]">
              For public sheets, no API key is needed. Make sure sharing is set to "Anyone with the link can view".
            </p>
          </>
        )}

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {connection ? 'Update' : 'Create'} Connection
          </Button>
        </div>
      </form>
    </Modal>
  );
};
