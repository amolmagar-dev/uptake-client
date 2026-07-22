import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Layers,
  Sparkles,
  Code2,
  Play,
  RefreshCw,
  Monitor,
  Tablet,
  Smartphone,
  Terminal,
  Database,
  Wand2,
  Check,
  X,
  Trash2,
  Filter,
  Info,
  AlertTriangle,
  AlertCircle,
  FileCode,
} from "lucide-react";
import Editor from "@monaco-editor/react";
import { Button } from "../shared/components/ui/Button";
import { Input, Select } from "../shared/components/ui/Input";
import { WorkspaceHeader } from "../shared/components";
import {
  customComponentsApi,
  datasetsApi,
  aiApi,
  type Dataset,
  type ChatMessage,
  type AIContext,
} from "../lib/api";
import { useAppStore } from "../store/appStore";
import { useThemeStore } from "../store/themeStore";
import { COMPONENT_PRESETS } from "../components/component-editor/presets";

const LIGHT_THEMES = [
  'light', 'cupcake', 'bumblebee', 'emerald', 'corporate', 'retro',
  'cyberpunk', 'valentine', 'garden', 'lofi', 'pastel', 'fantasy',
  'wireframe', 'cmyk', 'autumn', 'acid', 'lemonade', 'winter'
];

interface CustomComponentRendererProps {
  htmlContent: string;
  cssContent?: string;
  jsContent?: string;
  data?: any[] | null;
  height?: number | string;
  refreshKey?: number;
}

const CustomComponentRenderer: React.FC<CustomComponentRendererProps> = ({
  htmlContent,
  cssContent,
  jsContent,
  data,
  height = "100%",
  refreshKey = 0,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current) return;

    const dataScript = data
      ? `window.componentData = ${JSON.stringify(data || []).replace(/</g, "\\u003c")};`
      : "window.componentData = null;";

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
          <script>
            (function() {
              function sendLog(type, args) {
                try {
                  const message = args.map(function(a) {
                    if (typeof a === 'object') {
                      try { return JSON.stringify(a); } catch(e) { return String(a); }
                    }
                    return String(a);
                  }).join(' ');
                  window.parent.postMessage({
                    type: 'COMPONENT_CONSOLE_LOG',
                    level: type,
                    message: message,
                    timestamp: new Date().toLocaleTimeString()
                  }, '*');
                } catch(e) {}
              }
              ['log', 'info', 'warn', 'error'].forEach(function(level) {
                const orig = console[level];
                console[level] = function() {
                  const args = Array.prototype.slice.call(arguments);
                  sendLog(level, args);
                  if (orig) orig.apply(console, args);
                };
              });
            })();
          </script>
        </head>
        <body>
          ${htmlContent}
          <script>
            ${dataScript}
            try {
              ${jsContent || ""}
            } catch(e) {
              console.error('Runtime Error:', e.message || e);
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
  }, [htmlContent, cssContent, jsContent, data, refreshKey]);

  return (
    <iframe
      ref={iframeRef}
      sandbox="allow-scripts"
      style={{
        width: "100%",
        height: typeof height === "number" ? `${height}px` : height,
        border: "none",
        background: "var(--color-base-200, #1d232a)",
      }}
      title="Component Live Sandbox Preview"
    />
  );
};

export interface ConsoleLogEntry {
  id: string;
  type: "log" | "info" | "warn" | "error";
  message: string;
  timestamp: string;
}

function parseAiResponse(content: string): { html?: string; css?: string; js?: string } {
  const result: { html?: string; css?: string; js?: string } = {};

  try {
    const json = JSON.parse(content);
    if (json.html || json.css || json.js) {
      if (json.html) result.html = json.html;
      if (json.css) result.css = json.css;
      if (json.js) result.js = json.js;
      return result;
    }
  } catch (e) {
    // Continue markdown regex parsing
  }

  const htmlMatch = content.match(/```html\s*([\s\S]*?)\s*```/i);
  if (htmlMatch) result.html = htmlMatch[1].trim();

  const cssMatch = content.match(/```css\s*([\s\S]*?)\s*```/i);
  if (cssMatch) result.css = cssMatch[1].trim();

  const jsMatch = content.match(/```js(?:cript)?\s*([\s\S]*?)\s*```/i);
  if (jsMatch) result.js = jsMatch[1].trim();

  return result;
}

export const ComponentEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addToast } = useAppStore();
  const currentThemeId = useThemeStore((s) => s.currentThemeId);
  const monacoTheme = LIGHT_THEMES.includes(currentThemeId) ? 'vs' : 'vs-dark';

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Tabs & Viewports
  const [activeTab, setActiveTab] = useState<"html" | "css" | "js">("html");
  const [previewTab, setPreviewTab] = useState<"preview" | "data" | "console">("preview");
  const [viewportMode, setViewportMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [refreshKey, setRefreshKey] = useState(0);

  // Datasets & Data Preview
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [datasetColumns, setDatasetColumns] = useState<Array<{ column_name: string; data_type: string }>>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Console Logs
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLogEntry[]>([]);
  const [logFilter, setLogFilter] = useState<"all" | "info" | "warn" | "error">("all");

  // AI Copilot State
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponseText, setAiResponseText] = useState("");
  const [aiResponseCode, setAiResponseCode] = useState<{ html?: string; css?: string; js?: string } | null>(null);

  // Component Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    html_content: COMPONENT_PRESETS[0].html,
    css_content: COMPONENT_PRESETS[0].css,
    js_content: COMPONENT_PRESETS[0].js,
    dataset_id: "",
  });

  const isEditing = !!id;

  // Listen to postMessage logs from preview iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "COMPONENT_CONSOLE_LOG") {
        const { level, message, timestamp } = event.data;
        setConsoleLogs((prev) => [
          ...prev.slice(-99),
          {
            id: Math.random().toString(36).substring(2, 9),
            type: level || "log",
            message: message || "",
            timestamp: timestamp || new Date().toLocaleTimeString(),
          },
        ]);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Load available datasets
  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const response = await datasetsApi.getAll();
        setDatasets(response.data.datasets || []);
      } catch (error) {
        console.error("Failed to fetch datasets", error);
      }
    };
    fetchDatasets();
  }, []);

  // Load component if editing
  useEffect(() => {
    if (id) {
      setIsLoading(true);
      customComponentsApi
        .getOne(id)
        .then((response: any) => {
          const component = response.data.component;
          setFormData({
            name: component.name || "",
            description: component.description || "",
            html_content: component.html_content || "",
            css_content: component.css_content || "",
            js_content: component.js_content || "",
            dataset_id: component.dataset_id || "",
          });
          if (component.dataset_id) {
            loadDatasetDetails(component.dataset_id);
          }
        })
        .catch(() => {
          addToast("error", "Failed to load component");
          navigate("/components");
        })
        .finally(() => setIsLoading(false));
    }
  }, [id]);

  const loadDatasetDetails = async (datasetId: string) => {
    if (!datasetId) {
      setPreviewData(null);
      setDatasetColumns([]);
      return;
    }
    setPreviewLoading(true);
    try {
      const previewRes = await datasetsApi.preview(datasetId);
      const rows = previewRes.data.data || [];
      setPreviewData(rows);

      try {
        const colRes = await datasetsApi.getColumns(datasetId);
        setDatasetColumns(colRes.data.columns || []);
      } catch (e) {
        if (rows.length > 0) {
          const inferred = Object.keys(rows[0]).map((key) => ({
            column_name: key,
            data_type: typeof rows[0][key],
          }));
          setDatasetColumns(inferred);
        }
      }
      addToast("success", `Loaded ${rows.length} rows from dataset`);
    } catch (error: any) {
      addToast("error", error.response?.data?.error || "Failed to load dataset preview");
      setPreviewData(null);
      setDatasetColumns([]);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDatasetChange = (datasetId: string) => {
    setFormData((prev) => ({ ...prev, dataset_id: datasetId }));
    loadDatasetDetails(datasetId);
  };

  const handlePresetChange = (presetId: string) => {
    const selectedPreset = COMPONENT_PRESETS.find((p) => p.id === presetId);
    if (!selectedPreset) return;

    const hasContent = Boolean(
      formData.html_content?.trim() ||
      formData.css_content?.trim() ||
      formData.js_content?.trim()
    );

    if (hasContent) {
      const confirmed = window.confirm("Overwrite current editor contents with selected preset?");
      if (!confirmed) return;
    }

    setFormData((prev) => ({
      ...prev,
      html_content: selectedPreset.html,
      css_content: selectedPreset.css,
      js_content: selectedPreset.js,
      name: prev.name || selectedPreset.name,
      description: prev.description || selectedPreset.description,
    }));
    setConsoleLogs([]);
    addToast("success", `Applied preset starter: ${selectedPreset.name}`);
  };

  const handleFormatCode = () => {
    if (activeTab === "html") {
      setFormData((prev) => ({
        ...prev,
        html_content: prev.html_content.split("\n").map((l) => l.trimEnd()).join("\n"),
      }));
    } else if (activeTab === "css") {
      setFormData((prev) => ({
        ...prev,
        css_content: prev.css_content.split("\n").map((l) => l.trimEnd()).join("\n"),
      }));
    } else if (activeTab === "js") {
      setFormData((prev) => ({
        ...prev,
        js_content: prev.js_content.split("\n").map((l) => l.trimEnd()).join("\n"),
      }));
    }
    addToast("info", `Formatted ${activeTab.toUpperCase()} code`);
  };

  const handleAiGenerate = async (chipPrompt?: string) => {
    const promptToUse = chipPrompt || aiPrompt;
    if (!promptToUse.trim()) {
      addToast("error", "Please enter a prompt for AI Copilot");
      return;
    }

    setAiLoading(true);
    setAiResponseCode(null);
    setAiResponseText("");

    try {
      const userMessage: ChatMessage = {
        role: "user",
        content: promptToUse,
      };

      const contexts: AIContext[] = [
        {
          type: "component",
          name: "Current Component Code",
          customText: `HTML:\n\`\`\`html\n${formData.html_content}\n\`\`\`\n\nCSS:\n\`\`\`css\n${formData.css_content}\n\`\`\`\n\nJS:\n\`\`\`js\n${formData.js_content}\n\`\`\``,
        },
      ];

      if (formData.dataset_id && selectedDataset) {
        contexts.push({
          type: "dataset",
          id: selectedDataset.id,
          name: `Dataset Schema: ${selectedDataset.name}`,
          customText: `Columns: ${datasetColumns.map((c) => `${c.column_name} (${c.data_type})`).join(", ")}\nTotal Rows: ${previewData ? previewData.length : 0}`,
        });
      }

      const response = await aiApi.chat([userMessage], contexts);
      const responseContent = response.data.message?.content || "";
      setAiResponseText(responseContent);

      const parsed = parseAiResponse(responseContent);
      setAiResponseCode(parsed);
      addToast("success", "AI generation complete!");
    } catch (error: any) {
      console.error("AI Chat error", error);
      addToast("error", error.response?.data?.error || "Failed to call AI Copilot");
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAiCode = () => {
    if (!aiResponseCode) return;
    setFormData((prev) => ({
      ...prev,
      html_content: aiResponseCode.html !== undefined ? aiResponseCode.html : prev.html_content,
      css_content: aiResponseCode.css !== undefined ? aiResponseCode.css : prev.css_content,
      js_content: aiResponseCode.js !== undefined ? aiResponseCode.js : prev.js_content,
    }));
    addToast("success", "Applied AI code to studio editor");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      addToast("error", "Component name is required");
      return;
    }

    setIsSaving(true);

    const componentPayload = {
      name: formData.name,
      description: formData.description,
      html_content: formData.html_content,
      css_content: formData.css_content,
      js_content: formData.js_content,
      dataset_id: formData.dataset_id || undefined,
      config: {},
    };

    try {
      if (isEditing && id) {
        await customComponentsApi.update(id, componentPayload);
        addToast("success", "Component updated successfully");
      } else {
        await customComponentsApi.create(componentPayload);
        addToast("success", "Component created successfully");
      }
      navigate("/components");
    } catch (error: any) {
      addToast("error", error.response?.data?.error || "Failed to save component");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedDataset = datasets.find((d) => d.id === formData.dataset_id);

  const editorOptions = {
    minimap: { enabled: false },
    fontSize: 13,
    lineNumbers: "on" as const,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 2,
    wordWrap: "on" as const,
  };

  const quickPromptChips = [
    "Generate from dataset fields",
    "Apply glowing dark glassmorphism",
    "Add search & filter logic",
    "Fix JS syntax or runtime error",
  ];

  const filteredLogs = consoleLogs.filter((log) => {
    if (logFilter === "all") return true;
    return log.type === logFilter;
  });

  const errorCount = consoleLogs.filter((l) => l.type === "error").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-base-100 min-h-0 overflow-hidden">
      {/* Workspace Header */}
      <WorkspaceHeader
        title={isEditing ? "Edit Custom Component" : "AI Component Studio"}
        description="Design & build interactive widgets with HTML, CSS, JS & AI Copilot"
        leading={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/components")}
            leftIcon={<ArrowLeft size={18} />}
          >
            Back
          </Button>
        }
        actions={
          <>
            <div className="w-52">
              <Select
                value=""
                onChange={(val: string | null) => val && handlePresetChange(val)}
                options={[
                  { value: "", label: "Load Starter Preset..." },
                  ...COMPONENT_PRESETS.map((p) => ({
                    value: p.id,
                    label: p.name,
                  })),
                ]}
                isClearable={false}
              />
            </div>
            <Button
              variant={isAiOpen ? "primary" : "secondary"}
              size="sm"
              onClick={() => setIsAiOpen(!isAiOpen)}
              leftIcon={<Sparkles size={16} className={isAiOpen ? "animate-pulse" : ""} />}
            >
              AI Copilot
            </Button>
            <Button onClick={handleSubmit} isLoading={isSaving} leftIcon={<Save size={16} />}>
              {isEditing ? "Update" : "Save"} Component
            </Button>
          </>
        }
      />

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 p-4 space-y-3 overflow-hidden">
        {/* Meta Bar */}
        <div className="p-3 bg-base-200/80 border border-base-300 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-3 items-center shrink-0">
          <Input
            label="Component Name"
            placeholder="e.g. Sales KPI Card"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <Input
            label="Description (optional)"
            placeholder="Brief explanation of widget purpose"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          />
          <div className="flex flex-col">
            <Select
              label="Dataset Source"
              value={formData.dataset_id || null}
              onChange={(val: string | null) => handleDatasetChange(val || "")}
              options={[
                { value: "", label: "Static (No Data Source)" },
                ...datasets.map((d) => ({
                  value: d.id,
                  label: `${d.name} (${d.dataset_type})`,
                })),
              ]}
              isClearable={false}
            />
          </div>
          <div className="flex flex-col justify-end pt-5">
            {selectedDataset ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-success/15 border border-success/30 rounded-lg text-xs text-success font-medium">
                <Layers size={14} />
                <span>
                  {previewLoading
                    ? "Loading dataset..."
                    : previewData
                    ? `Loaded ${previewData.length} Rows`
                    : "Dataset Selected"}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 bg-base-300/50 border border-base-300 rounded-lg text-xs text-base-content/60 font-medium">
                <Layers size={14} />
                <span>Static Component Mode</span>
              </div>
            )}
          </div>
        </div>

        {/* AI Copilot Drawer */}
        {isAiOpen && (
          <div className="p-4 bg-gradient-to-r from-base-200 via-primary/5 to-base-200 border border-primary/30 rounded-xl shadow-lg shrink-0 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-primary animate-pulse" />
                <h3 className="type-h3 text-sm text-base-content font-bold">AI Studio Copilot</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAiOpen(false)}
                className="btn btn-ghost btn-xs btn-circle"
              >
                <X size={14} />
              </button>
            </div>

            {/* Prompt Chips */}
            <div className="flex flex-wrap gap-2">
              {quickPromptChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setAiPrompt(chip);
                    handleAiGenerate(chip);
                  }}
                  className="px-2.5 py-1 text-xs bg-base-100 hover:bg-primary/20 hover:border-primary/40 border border-base-300 rounded-full text-base-content/80 transition-colors flex items-center gap-1"
                >
                  <Wand2 size={12} className="text-primary" />
                  {chip}
                </button>
              ))}
            </div>

            {/* Prompt Form */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ask AI to generate component code or add features (e.g. 'Build a stat card with green trend pill')"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="input input-sm flex-1 bg-base-100 border-base-300 text-xs focus:outline-none focus:border-primary"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAiGenerate();
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                onClick={() => handleAiGenerate()}
                isLoading={aiLoading}
                leftIcon={<Sparkles size={14} />}
              >
                Generate
              </Button>
            </div>

            {/* AI Response Output */}
            {(aiResponseText || aiResponseCode) && (
              <div className="mt-3 p-3 bg-base-100 border border-base-300 rounded-lg text-xs space-y-2 max-h-48 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-primary">AI Response Preview</span>
                  {aiResponseCode && (
                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      onClick={handleApplyAiCode}
                      leftIcon={<Check size={12} />}
                    >
                      Apply AI Code
                    </Button>
                  )}
                </div>
                {aiResponseText && <p className="text-base-content/80 whitespace-pre-wrap">{aiResponseText}</p>}
              </div>
            )}
          </div>
        )}

        {/* Main 2-Pane Studio Workspace */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0 overflow-hidden">
          {/* Left Editor Panel */}
          <div className="flex flex-col border border-base-300 rounded-xl overflow-hidden bg-base-200/50 min-h-0">
            {/* Tabs & Format */}
            <div className="flex items-center justify-between bg-base-200 px-2 border-b border-base-300 shrink-0">
              <div className="flex">
                {(["html", "css", "js"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors ${
                      activeTab === tab
                        ? "bg-base-300/80 text-primary border-primary"
                        : "text-base-content/60 border-transparent hover:text-base-content hover:bg-base-300/30"
                    }`}
                  >
                    <span>{tab}</span>
                    <span className="badge badge-xs bg-base-100 text-base-content/60 font-mono">
                      {tab === "html"
                        ? formData.html_content.length
                        : tab === "css"
                        ? formData.css_content.length
                        : formData.js_content.length}
                    </span>
                  </button>
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleFormatCode}
                leftIcon={<Code2 size={14} />}
              >
                Format Code
              </Button>
            </div>

            {/* Monaco Instance */}
            <div className="flex-1 min-h-0">
              <Editor
                height="100%"
                language={activeTab === "js" ? "javascript" : activeTab}
                value={
                  activeTab === "html"
                    ? formData.html_content
                    : activeTab === "css"
                    ? formData.css_content
                    : formData.js_content
                }
                onChange={(value) => {
                  const key =
                    activeTab === "html"
                      ? "html_content"
                      : activeTab === "css"
                      ? "css_content"
                      : "js_content";
                  setFormData((prev) => ({ ...prev, [key]: value || "" }));
                }}
                theme={monacoTheme}
                options={editorOptions}
              />
            </div>
          </div>

          {/* Right Preview & Inspector Panel */}
          <div className="flex flex-col border border-base-300 rounded-xl overflow-hidden bg-base-200/50 min-h-0">
            {/* Header Tabs & Controls */}
            <div className="flex flex-wrap items-center justify-between px-3 py-1.5 bg-base-200 border-b border-base-300 shrink-0 gap-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPreviewTab("preview")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                    previewTab === "preview"
                      ? "bg-base-300 text-primary"
                      : "text-base-content/60 hover:text-base-content"
                  }`}
                >
                  <Play size={14} />
                  Live Preview
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("data")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                    previewTab === "data"
                      ? "bg-base-300 text-primary"
                      : "text-base-content/60 hover:text-base-content"
                  }`}
                >
                  <Database size={14} />
                  Dataset Inspector
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("console")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                    previewTab === "console"
                      ? "bg-base-300 text-primary"
                      : "text-base-content/60 hover:text-base-content"
                  }`}
                >
                  <Terminal size={14} />
                  Console Logs
                  {consoleLogs.length > 0 && (
                    <span
                      className={`badge badge-xs ${
                        errorCount > 0 ? "badge-error text-white" : "bg-base-100 text-base-content/70"
                      }`}
                    >
                      {consoleLogs.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Viewport Controls */}
              <div className="flex items-center gap-1">
                <div className="join bg-base-100 border border-base-300 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewportMode("desktop")}
                    className={`join-item btn btn-xs btn-ghost gap-1 ${
                      viewportMode === "desktop" ? "btn-active text-primary" : ""
                    }`}
                    title="Desktop View (100%)"
                  >
                    <Monitor size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewportMode("tablet")}
                    className={`join-item btn btn-xs btn-ghost gap-1 ${
                      viewportMode === "tablet" ? "btn-active text-primary" : ""
                    }`}
                    title="Tablet View (768px)"
                  >
                    <Tablet size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewportMode("mobile")}
                    className={`join-item btn btn-xs btn-ghost gap-1 ${
                      viewportMode === "mobile" ? "btn-active text-primary" : ""
                    }`}
                    title="Mobile View (375px)"
                  >
                    <Smartphone size={13} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setRefreshKey((prev) => prev + 1)}
                  className="btn btn-xs btn-ghost btn-square text-base-content/70 hover:text-base-content"
                  title="Refresh Frame"
                >
                  <RefreshCw size={13} />
                </button>
              </div>
            </div>

            {/* Tab Body */}
            <div className="flex-1 bg-base-200 overflow-hidden min-h-0 flex flex-col">
              {/* Tab 1: Live Preview */}
              {previewTab === "preview" && (
                <div className="flex-1 w-full h-full flex items-center justify-center p-2 bg-base-300/30 overflow-auto min-h-0">
                  <div
                    className={`h-full bg-base-100 transition-all duration-300 shadow-md rounded-lg overflow-hidden ${
                      viewportMode === "desktop"
                        ? "w-full"
                        : viewportMode === "tablet"
                        ? "w-[768px] border-x border-base-300"
                        : "w-[375px] border-x border-base-300"
                    }`}
                  >
                    <CustomComponentRenderer
                      htmlContent={formData.html_content}
                      cssContent={formData.css_content}
                      jsContent={formData.js_content}
                      data={previewData}
                      height="100%"
                      refreshKey={refreshKey}
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Dataset Inspector */}
              {previewTab === "data" && (
                <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
                  {selectedDataset ? (
                    <>
                      <div className="p-3 bg-base-100 border border-base-300 rounded-lg flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-base-content">{selectedDataset.name}</h4>
                          <p className="text-base-content/60 text-xs">
                            Type: {selectedDataset.dataset_type} | ID: {selectedDataset.id}
                          </p>
                        </div>
                        <span className="badge badge-primary font-semibold">
                          {previewData ? `${previewData.length} Rows` : "0 Rows"}
                        </span>
                      </div>

                      {/* Schema Table */}
                      <div className="space-y-2">
                        <h5 className="font-semibold text-base-content/80 flex items-center gap-1.5">
                          <Database size={14} className="text-primary" />
                          Table Schema
                        </h5>
                        <div className="border border-base-300 rounded-lg overflow-hidden bg-base-100">
                          <table className="table table-xs w-full">
                            <thead>
                              <tr className="bg-base-200">
                                <th>Column Name</th>
                                <th>Data Type</th>
                              </tr>
                            </thead>
                            <tbody>
                              {datasetColumns.length > 0 ? (
                                datasetColumns.map((col, idx) => (
                                  <tr key={idx}>
                                    <td className="font-mono font-medium text-primary">{col.column_name}</td>
                                    <td>
                                      <span className="badge badge-xs bg-base-200 border-base-300 font-mono">
                                        {col.data_type}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={2} className="text-center text-base-content/50 py-3">
                                    No schema attributes detected
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* JSON Payload Viewer */}
                      <div className="space-y-2">
                        <h5 className="font-semibold text-base-content/80 flex items-center gap-1.5">
                          <FileCode size={14} className="text-primary" />
                          window.componentData Payload
                        </h5>
                        <pre className="p-3 bg-base-100 border border-base-300 rounded-lg font-mono text-xs overflow-x-auto max-h-64 text-base-content/90">
                          {previewData ? JSON.stringify(previewData, null, 2) : "null"}
                        </pre>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-base-content/50 p-8 space-y-2">
                      <Database size={32} className="opacity-40" />
                      <p className="font-medium">No Dataset Selected</p>
                      <p className="text-xs max-w-sm">
                        Select a dataset source from the Meta Bar above to inject real data into{" "}
                        <code className="text-primary font-mono">window.componentData</code>.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Console Log Viewer */}
              {previewTab === "console" && (
                <div className="flex-1 flex flex-col overflow-hidden text-xs">
                  {/* Filter Toolbar */}
                  <div className="flex items-center justify-between px-3 py-2 bg-base-100 border-b border-base-300 shrink-0">
                    <div className="flex items-center gap-1">
                      <Filter size={13} className="text-base-content/50 mr-1" />
                      {(["all", "info", "warn", "error"] as const).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setLogFilter(level)}
                          className={`px-2 py-0.5 text-[11px] font-semibold rounded uppercase tracking-wider transition-colors ${
                            logFilter === level
                              ? "bg-primary text-primary-content"
                              : "bg-base-200 text-base-content/70 hover:bg-base-300"
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setConsoleLogs([])}
                      leftIcon={<Trash2 size={12} />}
                    >
                      Clear Logs
                    </Button>
                  </div>

                  {/* Log Entries List */}
                  <div className="flex-1 p-2 overflow-y-auto font-mono space-y-1 bg-base-100/50">
                    {filteredLogs.length > 0 ? (
                      filteredLogs.map((log) => (
                        <div
                          key={log.id}
                          className={`p-2 rounded border flex items-start gap-2 text-xs ${
                            log.type === "error"
                              ? "bg-error/10 border-error/30 text-error"
                              : log.type === "warn"
                              ? "bg-warning/10 border-warning/30 text-warning"
                              : log.type === "info"
                              ? "bg-info/10 border-info/30 text-info"
                              : "bg-base-100 border-base-300 text-base-content/90"
                          }`}
                        >
                          <span className="shrink-0 mt-0.5">
                            {log.type === "error" && <AlertCircle size={13} />}
                            {log.type === "warn" && <AlertTriangle size={13} />}
                            {log.type === "info" && <Info size={13} />}
                            {log.type === "log" && <Terminal size={13} />}
                          </span>
                          <span className="shrink-0 opacity-60 text-[10px]">{log.timestamp}</span>
                          <span className="flex-1 break-all whitespace-pre-wrap">{log.message}</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center text-base-content/40 p-6 space-y-1">
                        <Terminal size={28} className="opacity-30" />
                        <p>No console output captured yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
