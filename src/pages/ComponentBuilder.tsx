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
    <div className="p-6 lg:p-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Component Builder</h1>
          <p className="text-base-content/60 mt-1 text-sm">Create custom HTML/CSS/JS components</p>
        </div>
        <button
          className="btn btn-primary btn-sm md:btn-md"
          onClick={() => navigate('/components/new')}
        >
          <Plus size={18} />
          <span>Create Component</span>
        </button>
      </div>

      {components.length === 0 ? (
        <div className="card bg-base-200 border border-base-300 text-center py-16">
          <div className="card-body items-center">
            <Code2 size={48} className="mb-4 opacity-20" />
            <h3 className="text-xl font-bold">No custom components yet</h3>
            <p className="text-base-content/60 max-w-sm mb-6">
              Build your own custom visualizations and UI elements using standard web technologies.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/components/new')}>
              <Plus size={18} />
              Create Component
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {components.map((component) => (
            <div key={component.id} className="card bg-base-100 border border-base-300 hover:border-primary/50 transition-all shadow-sm">
              <div className="card-body p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl shrink-0">🧩</span>
                    <div className="min-w-0">
                      <h3 className="card-title text-base truncate">{component.name}</h3>
                      <p className="text-xs opacity-60">Custom Component</p>
                    </div>
                  </div>
                </div>
                
                {component.description && (
                  <p className="text-sm opacity-70 mb-4 line-clamp-2 h-10">{component.description}</p>
                )}
                
                {component.connection_name && (
                  <div className="flex items-center gap-1 text-xs opacity-50 mb-6">
                    <Code2 size={14} />
                    <span className="truncate">{component.connection_name}</span>
                  </div>
                )}

                <div className="card-actions justify-end mt-auto pt-4 border-t border-base-200">
                  <div className="flex items-center gap-1">
                    <button
                      className="btn btn-ghost btn-sm btn-square"
                      onClick={() => handlePreview(component)}
                      title="Preview"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      className="btn btn-ghost btn-sm btn-square"
                      onClick={() => navigate(`/components/${component.id}/edit`)}
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      className="btn btn-ghost btn-sm btn-square text-error"
                      onClick={() => setDeleteConfirm(component.id)}
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
