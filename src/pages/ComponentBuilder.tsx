import React, { useState, useEffect, useRef } from "react";
import { ResourceListing } from "../shared/components/ResourceListing";
import { useNavigate } from "react-router-dom";
import { Plus, Code2, Trash2, Edit, Eye, FileCode, Box } from "lucide-react";
import { Modal, ConfirmModal } from "../shared/components/ui/Modal";
import { customComponentsApi } from "../lib/api";
import { useAppStore } from "../store/appStore";

interface CustomComponent {
  id: string;
  name: string;
  description: string;
  type: string;
  code?: string;
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
  const { addToast } = useAppStore();
  const [components, setComponents] = useState<CustomComponent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteComponent, setDeleteComponent] = useState<CustomComponent | null>(null);
  const [previewComponent, setPreviewComponent] = useState<CustomComponent | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchComponents = async () => {
    try {
      setIsLoading(true);
      const response = await customComponentsApi.getAll();
      setComponents(response.data.components);
    } catch (error: any) {
      addToast("error", error.response?.data?.error || "Failed to fetch components");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComponents();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await customComponentsApi.delete(id);
      addToast("success", "Component deleted successfully");
      setDeleteComponent(null);
      fetchComponents();
    } catch (error: any) {
      addToast("error", error.response?.data?.error || "Failed to delete component");
    }
  };

  const getComponentIcon = (type: string) => {
    switch (type) {
      case "react":
        return <Code2 className="h-6 w-6 text-blue-500" />;
      case "html":
        return <FileCode className="h-6 w-6 text-orange-500" />;
      default:
        return <Box className="h-6 w-6 text-purple-500" />;
    }
  };

  const renderGridItem = (component: CustomComponent) => (
    <div
      key={component.id}
      className="card bg-base-100 border border-base-300 hover:border-primary/50 transition-all shadow-sm h-full"
    >
      <div className="card-body p-6 flex flex-col h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-base-200 flex items-center justify-center shrink-0">
              {getComponentIcon(component.type)}
            </div>
            <div className="min-w-0">
              <h3 className="card-title text-base truncate">{component.name}</h3>
              <p className="text-xs opacity-60 truncate capitalize">{component.type} Component</p>
            </div>
          </div>
        </div>

        {component.description && (
          <p className="text-sm opacity-70 mb-4 line-clamp-2 h-10 flex-grow-0">{component.description}</p>
        )}

        {/* Code Preview Placeholder */}
        <div className="bg-base-300/50 rounded-lg p-3 mb-4 font-mono text-xs opacity-60 overflow-hidden h-24 flex-grow relative">
          <div className="absolute inset-0 p-3 opacity-50">
            {component.code ? component.code.substring(0, 150) : "// No code content"}
            ...
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-base-300/50 to-transparent pointer-events-none" />
        </div>

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
              onClick={() => setDeleteComponent(component)}
              title="Delete"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderListItem = (component: CustomComponent) => (
    <div
      key={component.id}
      className="card bg-base-100 border border-base-300 hover:border-primary/50 transition-all shadow-sm card-side"
    >
        <div className="card-body flex-row items-center gap-6 py-4 w-full">
          <div className="w-10 h-10 rounded-lg bg-base-200 flex items-center justify-center shrink-0">
             {getComponentIcon(component.type)}
          </div>
         
         <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="min-w-0 flex-1">
              <h3 className="card-title text-base truncate">{component.name}</h3>
              <p className="text-sm opacity-60 truncate capitalize">{component.type} Component</p>
            </div>
         </div>

        <div className="card-actions justify-end">
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
              onClick={() => setDeleteComponent(component)}
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
        <Box size={48} className="mb-4 opacity-20" />
        <h3 className="text-xl font-bold">No components yet</h3>
        <p className="text-base-content/60 max-w-sm mb-6">
          Create reusable custom components using React or HTML/CSS to enhance your dashboards.
        </p>
        <button className="btn btn-primary" onClick={() => navigate("/components/new")}>
          <Plus size={18} />
          Create Component
        </button>
      </div>
    </div>
  );

  const handlePreview = async (component: CustomComponent) => {
    setPreviewComponent(component);
    setPreviewLoading(true);
    try {
      const response = await customComponentsApi.getData(component.id);
      setPreviewData(response.data.data);
    } catch (error: any) {
      addToast("error", error.response?.data?.error || "Failed to load component data");
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
    <>
      <ResourceListing
        title="Component Builder"
        description="Create and manage custom reusable components"
        items={components}
        renderGridItem={renderGridItem}
        renderListItem={renderListItem}
        renderEmptyState={renderEmptyState}
        onCreate={() => navigate("/components/new")}
        createButtonText="Create Component"
        onSearch={() => {}}
        filterFunction={(c, query) => 
           c.name.toLowerCase().includes(query.toLowerCase()) || 
           c.type.toLowerCase().includes(query.toLowerCase()) ||
           c.description?.toLowerCase().includes(query.toLowerCase())
        }
      />

      <ConfirmModal
        isOpen={!!deleteComponent}
        onClose={() => setDeleteComponent(null)}
        onConfirm={() => deleteComponent && handleDelete(deleteComponent.id)}
        title="Delete Component"
        message={`Are you sure you want to delete "${deleteComponent?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />

      <Modal
        isOpen={!!previewComponent}
        onClose={() => {
          setPreviewComponent(null);
          setPreviewData(null);
        }}
        title={previewComponent?.name || "Component Preview"}
        size="full"
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
            height="100%"
          />
        ) : (
          <p className="text-center text-text-muted py-12">No component to preview</p>
        )}
      </Modal>
    </>
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

    const dataScript = data ? `window.componentData = ${JSON.stringify(data)};` : "window.componentData = null;";

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
            ${cssContent || ""}
          </style>
        </head>
        <body>
          ${htmlContent}
          <script>
            ${dataScript}
            try {
              ${jsContent || ""}
            } catch(e) {
              console.error('Component JS Error:', e);
            }
          </script>
        </body>
      </html>
    `;

    const blob = new Blob([iframeContent], { type: "text/html" });
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
        width: "100%",
        height: typeof height === "number" ? `${height}px` : height,
        border: "none",
        background: "var(--color-bg-secondary)",
      }}
      title="Component Preview"
    />
  );
};
