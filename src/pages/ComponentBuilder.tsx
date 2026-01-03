import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Code2, Trash2, Edit, Eye } from 'lucide-react';
import { Button } from '../shared/components/ui/Button';
import { Card } from '../shared/components/ui/Card';
import { Modal, ConfirmModal } from '../shared/components/ui/Modal';
import { customComponentsApi, connectionsApi } from '../lib/api';
import { useAppStore } from '../store/appStore';

interface CustomComponent {
  id: string;
  name: string;
  description: string;
  html_content: string;
  css_content: string;
  js_content: string;
  config: any;
  connection_id: string;
  connection_name: string;
  sql_query: string;
}

export const ComponentBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const { setConnections, addToast } = useAppStore();
  const [components, setComponents] = useState<CustomComponent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [previewComponent, setPreviewComponent] = useState<CustomComponent | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchComponents = async () => {
    try {
      const response = await customComponentsApi.getAll();
      setComponents(response.data.components);
    } catch (error) {
      addToast('error', 'Failed to fetch components');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConnections = async () => {
    try {
      const response = await connectionsApi.getAll();
      setConnections(response.data.connections);
    } catch (error) {
      console.error('Failed to fetch connections');
    }
  };

  useEffect(() => {
    fetchComponents();
    fetchConnections();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await customComponentsApi.delete(id);
      addToast('success', 'Component deleted');
      fetchComponents();
    } catch (error) {
      addToast('error', 'Failed to delete component');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handlePreview = async (component: CustomComponent) => {
    setPreviewComponent(component);
    setPreviewLoading(true);
    try {
      const response = await customComponentsApi.getData(component.id);
      setPreviewData(response.data.data);
    } catch (error: any) {
      addToast('error', error.response?.data?.error || 'Failed to load component data');
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
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
      <div className="flex-shrink-0 sticky top-0 bg-bg-primary z-10 pb-4 -mx-6 px-6">
        <div className="flex items-center justify-between py-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Component Builder</h1>
            <p className="text-text-secondary mt-1">Create custom HTML/CSS/JS components</p>
          </div>
          <Button
            leftIcon={<Plus size={18} />}
            onClick={() => navigate('/components/new')}
          >
            Create Component
          </Button>
        </div>
      </div>

      {components.length === 0 ? (
        <Card className="text-center py-12">
          <Code2 size={48} className="mx-auto mb-4 text-text-muted" />
          <h3 className="text-lg font-medium text-text-primary mb-2">No custom components yet</h3>
          <p className="text-text-secondary mb-4">Create your first custom HTML/CSS/JS component</p>
          <Button onClick={() => navigate('/components/new')} leftIcon={<Plus size={16} />}>
            Create Component
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {components.map((component) => (
            <Card key={component.id} hover className="flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🧩</span>
                  <div>
                    <h3 className="font-semibold text-text-primary">{component.name}</h3>
                    <p className="text-xs text-text-muted">Custom Component</p>
                  </div>
                </div>
              </div>
              
              {component.description && (
                <p className="text-sm text-text-secondary mb-4 line-clamp-2">{component.description}</p>
              )}
              
              {component.connection_name && (
                <p className="text-xs text-text-muted mb-4">
                  Connection: {component.connection_name}
                </p>
              )}

              <div className="mt-auto flex gap-2 pt-4 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePreview(component)}
                  leftIcon={<Eye size={14} />}
                >
                  Preview
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/components/${component.id}/edit`)}
                  leftIcon={<Edit size={14} />}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteConfirm(component.id)}
                  className="text-status-error hover:text-status-error/80"
                  leftIcon={<Trash2 size={14} />}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Component"
        message="Are you sure you want to delete this component? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />

      {/* Preview Modal */}
      <Modal
        isOpen={!!previewComponent}
        onClose={() => {
          setPreviewComponent(null);
          setPreviewData(null);
        }}
        title={previewComponent?.name || 'Component Preview'}
        size="xl"
      >
        {previewLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner" />
          </div>
        ) : previewComponent ? (
          <CustomComponentRenderer
            htmlContent={previewComponent.html_content}
            cssContent={previewComponent.css_content}
            jsContent={previewComponent.js_content}
            data={previewData}
            height={400}
          />
        ) : (
          <p className="text-center text-text-muted py-12">No component to preview</p>
        )}
      </Modal>
    </div>
  );
};

// Sandboxed Component Renderer
interface CustomComponentRendererProps {
  htmlContent: string;
  cssContent?: string;
  jsContent?: string;
  data?: any[] | null;
  height?: number | string;
}

export const CustomComponentRenderer: React.FC<CustomComponentRendererProps> = ({
  htmlContent,
  cssContent,
  jsContent,
  data,
  height = 300,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current) return;

    const dataScript = data ? `window.componentData = ${JSON.stringify(data)};` : 'window.componentData = null;';
    
    const iframeContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              background: #0d0d15;
              font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
              color: #f0f0f5;
              padding: 16px;
            }
            ${cssContent || ''}
          </style>
        </head>
        <body>
          ${htmlContent}
          <script>
            ${dataScript}
            try {
              ${jsContent || ''}
            } catch(e) {
              console.error('Component JS Error:', e);
            }
          </script>
        </body>
      </html>
    `;

    const blob = new Blob([iframeContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    iframeRef.current.src = url;

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [htmlContent, cssContent, jsContent, data]);

  return (
    <iframe
      ref={iframeRef}
      sandbox="allow-scripts"
      style={{
        width: '100%',
        height: typeof height === 'number' ? `${height}px` : height,
        border: 'none',
        background: 'var(--color-bg-secondary)',
      }}
      title="Component Preview"
    />
  );
};
