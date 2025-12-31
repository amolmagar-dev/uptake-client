import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Play } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { Button } from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/Input';
import { customComponentsApi, connectionsApi, queriesApi } from '../lib/api';
import { useAppStore } from '../store/appStore';

// Sandboxed Component Renderer
interface CustomComponentRendererProps {
  htmlContent: string;
  cssContent?: string;
  jsContent?: string;
  data?: any[] | null;
  height?: number | string;
}

const CustomComponentRenderer: React.FC<CustomComponentRendererProps> = ({
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
        background: '#0d0d15',
      }}
      title="Component Preview"
    />
  );
};

export const ComponentEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { connections, setConnections, addToast } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html');
  const [testData, setTestData] = useState<any[] | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    html_content: '<div class="custom-component">\n  <h2>Hello World</h2>\n  <p>Edit this component!</p>\n</div>',
    css_content: '.custom-component {\n  padding: 20px;\n  background: linear-gradient(135deg, #1a1a2e, #16213e);\n  border-radius: 12px;\n  color: #f0f0f5;\n}\n\n.custom-component h2 {\n  color: #00f5d4;\n  margin-bottom: 10px;\n}',
    js_content: '// Access data via window.componentData\nconsole.log("Component loaded!", window.componentData);',
    connection_id: '',
    sql_query: '',
  });

  const isEditing = !!id;

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const response = await connectionsApi.getAll();
        setConnections(response.data.connections);
      } catch (error) {
        console.error('Failed to fetch connections');
      }
    };
    fetchConnections();
  }, []);

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      customComponentsApi.getOne(id)
        .then((response: any) => {
          const component = response.data.component;
          setFormData({
            name: component.name,
            description: component.description || '',
            html_content: component.html_content || '',
            css_content: component.css_content || '',
            js_content: component.js_content || '',
            connection_id: component.connection_id || '',
            sql_query: component.sql_query || '',
          });
        })
        .catch(() => {
          addToast('error', 'Failed to load component');
          navigate('/components');
        })
        .finally(() => setIsLoading(false));
    }
  }, [id]);

  const handleTestQuery = async () => {
    if (!formData.connection_id || !formData.sql_query) {
      addToast('error', 'Please select a connection and enter a query');
      return;
    }

    setTestLoading(true);
    try {
      const response = await queriesApi.execute(formData.connection_id, formData.sql_query);
      setTestData(response.data.data);
      addToast('success', `Query returned ${response.data.rowCount} rows`);
    } catch (error: any) {
      addToast('error', error.response?.data?.error || 'Query failed');
    } finally {
      setTestLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      addToast('error', 'Component name is required');
      return;
    }

    setIsSaving(true);

    const componentData = {
      name: formData.name,
      description: formData.description,
      html_content: formData.html_content,
      css_content: formData.css_content,
      js_content: formData.js_content,
      connection_id: formData.connection_id || undefined,
      sql_query: formData.sql_query || undefined,
      config: {},
    };

    try {
      if (isEditing && id) {
        await customComponentsApi.update(id, componentData);
        addToast('success', 'Component updated successfully');
      } else {
        await customComponentsApi.create(componentData);
        addToast('success', 'Component created successfully');
      }
      navigate('/components');
    } catch (error: any) {
      addToast('error', error.response?.data?.error || 'Failed to save component');
    } finally {
      setIsSaving(false);
    }
  };

  const connectionOptions = [
    { value: '', label: 'No data source (static)' },
    ...connections.map(c => ({ value: c.id, label: c.name })),
  ];

  const editorOptions = {
    minimap: { enabled: false },
    fontSize: 13,
    lineNumbers: 'on' as const,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 2,
    wordWrap: 'on' as const,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col">
      {/* Page Header */}
      <div className="flex-shrink-0 sticky top-0 bg-[#0a0a0f] z-10 pb-4 -mx-6 px-6">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/components')}
              leftIcon={<ArrowLeft size={18} />}
            >
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-[#f0f0f5]">
                {isEditing ? 'Edit Component' : 'Create Custom Component'}
              </h1>
              <p className="text-[#a0a0b0] mt-1">Build with HTML, CSS & JavaScript</p>
            </div>
          </div>
          <Button
            onClick={handleSubmit}
            isLoading={isSaving}
            leftIcon={<Save size={16} />}
          >
            {isEditing ? 'Update' : 'Create'} Component
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
        {/* Component Name and Description */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Input
            label="Component Name"
            placeholder="My Custom Widget"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
          <Input
            label="Description (optional)"
            placeholder="A brief description of this component"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          />
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
          {/* Code Editor Panel */}
          <div className="flex flex-col border border-[#2a2a3a] rounded-lg overflow-hidden">
            {/* Tabs */}
            <div className="flex bg-[#1a1a25] border-b border-[#2a2a3a]">
              {(['html', 'css', 'js'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'bg-[#2a2a3a] text-[#00f5d4] border-b-2 border-[#00f5d4]'
                      : 'text-[#a0a0b0] hover:text-[#f0f0f5] hover:bg-[#252535]'
                  }`}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Editor */}
            <div className="flex-1">
              <Editor
                height="100%"
                language={activeTab === 'js' ? 'javascript' : activeTab}
                value={
                  activeTab === 'html' ? formData.html_content :
                  activeTab === 'css' ? formData.css_content :
                  formData.js_content
                }
                onChange={(value) => {
                  const key = activeTab === 'html' ? 'html_content' :
                              activeTab === 'css' ? 'css_content' : 'js_content';
                  setFormData(prev => ({ ...prev, [key]: value || '' }));
                }}
                theme="vs-dark"
                options={editorOptions}
              />
            </div>
          </div>

          {/* Preview Panel */}
          <div className="flex flex-col border border-[#2a2a3a] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a25] border-b border-[#2a2a3a]">
              <span className="text-sm font-medium text-[#a0a0b0]">Live Preview</span>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
              </div>
            </div>
            <div className="flex-1 bg-[#0d0d15]">
              <CustomComponentRenderer
                htmlContent={formData.html_content}
                cssContent={formData.css_content}
                jsContent={formData.js_content}
                data={testData}
                height="100%"
              />
            </div>
          </div>
        </div>

        {/* Data Source Section */}
        <div className="mt-4 p-4 rounded-lg bg-[#1a1a25] border border-[#2a2a3a]">
          <h4 className="text-sm font-medium text-[#f0f0f5] mb-3">Data Source (Optional)</h4>
          <div className="grid grid-cols-3 gap-4">
            <Select
              label="Database Connection"
              options={connectionOptions}
              value={formData.connection_id}
              onChange={(e) => setFormData(prev => ({ ...prev, connection_id: e.target.value }))}
            />
            <div className="col-span-2">
              <Textarea
                label="SQL Query"
                placeholder="SELECT * FROM your_table LIMIT 10"
                value={formData.sql_query}
                onChange={(e) => setFormData(prev => ({ ...prev, sql_query: e.target.value }))}
                rows={2}
                className="font-mono text-sm"
              />
            </div>
          </div>
          {formData.connection_id && formData.sql_query && (
            <div className="mt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleTestQuery}
                isLoading={testLoading}
                leftIcon={<Play size={14} />}
              >
                Test Query
              </Button>
              {testData && (
                <span className="ml-3 text-sm text-[#00f5d4]">
                  ✓ {testData.length} rows loaded - Access via window.componentData
                </span>
              )}
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
