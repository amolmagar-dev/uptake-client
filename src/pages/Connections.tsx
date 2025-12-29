import React, { useState, useEffect } from 'react';
import { Plus, Database, Trash2, Edit, RefreshCw, CheckCircle, XCircle, Table } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { Input, Select } from '../components/ui/Input';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import { connectionsApi } from '../lib/api';
import { useAppStore } from '../store/appStore';

interface Connection {
  id: string;
  name: string;
  type: string;
  host: string;
  port: number;
  database_name: string;
  username: string;
  ssl: number;
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

  const handleExpand = async (id: string) => {
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

  const getDbIcon = (type: string) => {
    const colors: Record<string, string> = {
      postgresql: '#336791',
      postgres: '#336791',
      mysql: '#4479A1',
      mariadb: '#003545',
    };
    return colors[type.toLowerCase()] || '#00f5d4';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#f0f0f5]">Database Connections</h1>
          <p className="text-[#a0a0b0] mt-1">Manage your database connections</p>
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

      {connections.length === 0 ? (
        <Card className="text-center py-12">
          <Database size={48} className="mx-auto mb-4 text-[#606070]" />
          <h3 className="text-lg font-medium text-[#f0f0f5] mb-2">No connections yet</h3>
          <p className="text-[#a0a0b0] mb-4">Add your first database connection to get started</p>
          <Button onClick={() => setShowModal(true)} leftIcon={<Plus size={16} />}>
            Add Connection
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {connections.map((connection) => (
            <Card key={connection.id} hover className="overflow-hidden">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${getDbIcon(connection.type)}20` }}
                >
                  <Database size={24} style={{ color: getDbIcon(connection.type) }} />
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-[#f0f0f5]">{connection.name}</h3>
                  <p className="text-sm text-[#a0a0b0]">
                    {connection.type} • {connection.host}:{connection.port} • {connection.database_name}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {testResults[connection.id] !== undefined && (
                    testResults[connection.id] ? (
                      <CheckCircle size={20} className="text-[#00f5a0]" />
                    ) : (
                      <XCircle size={20} className="text-[#ff4757]" />
                    )
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleExpand(connection.id)}
                    leftIcon={<Table size={16} />}
                  >
                    Tables
                  </Button>
                  
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

              {expandedConnection === connection.id && (
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
          ))}
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
  const [formData, setFormData] = useState({
    name: '',
    type: 'postgresql',
    host: 'localhost',
    port: 5432,
    database_name: '',
    username: '',
    password: '',
    ssl: false,
  });

  useEffect(() => {
    if (connection) {
      setFormData({
        name: connection.name,
        type: connection.type,
        host: connection.host,
        port: connection.port,
        database_name: connection.database_name,
        username: connection.username,
        password: '',
        ssl: connection.ssl === 1,
      });
    } else {
      setFormData({
        name: '',
        type: 'postgresql',
        host: 'localhost',
        port: 5432,
        database_name: '',
        username: '',
        password: '',
        ssl: false,
      });
    }
  }, [connection, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (connection) {
        await connectionsApi.update(connection.id, formData);
        addToast('success', 'Connection updated successfully');
      } else {
        await connectionsApi.create(formData as any);
        addToast('success', 'Connection created successfully');
      }
      onSuccess();
    } catch (error: any) {
      addToast('error', error.response?.data?.error || 'Failed to save connection');
    } finally {
      setIsLoading(false);
    }
  };

  const dbTypes = [
    { value: 'postgresql', label: 'PostgreSQL' },
    { value: 'mysql', label: 'MySQL' },
    { value: 'mariadb', label: 'MariaDB' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={connection ? 'Edit Connection' : 'New Connection'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Connection Name"
          placeholder="My Database"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />

        <Select
          label="Database Type"
          options={dbTypes}
          value={formData.type}
          onChange={(e) => {
            const type = e.target.value;
            setFormData(prev => ({
              ...prev,
              type,
              port: type === 'postgresql' ? 5432 : 3306,
            }));
          }}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Host"
            placeholder="localhost"
            value={formData.host}
            onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value }))}
            required
          />
          <Input
            label="Port"
            type="number"
            placeholder="5432"
            value={formData.port}
            onChange={(e) => setFormData(prev => ({ ...prev, port: parseInt(e.target.value) }))}
            required
          />
        </div>

        <Input
          label="Database Name"
          placeholder="my_database"
          value={formData.database_name}
          onChange={(e) => setFormData(prev => ({ ...prev, database_name: e.target.value }))}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Username"
            placeholder="postgres"
            value={formData.username}
            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder={connection ? '(unchanged)' : '••••••••'}
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.ssl}
            onChange={(e) => setFormData(prev => ({ ...prev, ssl: e.target.checked }))}
            className="w-4 h-4 rounded border-[#2a2a3a] bg-[#1a1a25] text-[#00f5d4] focus:ring-[#00f5d4]"
          />
          <span className="text-sm text-[#a0a0b0]">Use SSL connection</span>
        </label>

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

