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
  Check,
  Trash2,
  Filter,
  Info,
  AlertTriangle,
  AlertCircle,
  Plus,
  SlidersHorizontal,
  ArrowUp,
  CornerDownLeft,
  ChevronDown,
  ChevronUp,
  Settings,
} from "lucide-react";
import Editor from "@monaco-editor/react";
import { Button } from "../shared/components/ui/Button";
import { Input, Select } from "../shared/components/ui/Input";
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

  // Workbench & Editor Accordion State
  const [workbenchTab, setWorkbenchTab] = useState<"code" | "ai" | "settings">("code");
  const [isHtmlOpen, setIsHtmlOpen] = useState(true);
  const [isCssOpen, setIsCssOpen] = useState(true);
  const [isJsOpen, setIsJsOpen] = useState(true);

  // AI Copilot State
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
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

  const handleAiGenerate = async (chipPrompt?: string) => {
    const promptToUse = chipPrompt || aiPrompt;
    if (!promptToUse.trim()) {
      addToast("error", "Please enter a prompt for AI Copilot");
      return;
    }

    const userMsg: ChatMessage = { role: "user", content: promptToUse };
    setAiMessages((prev) => [...prev, userMsg]);
    setAiPrompt("");
    setAiLoading(true);
    setAiResponseCode(null);

    try {
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

      const response = await aiApi.chat([...aiMessages, userMsg], contexts);
      const responseContent = response.data.message?.content || "";

      const assistantMsg: ChatMessage = { role: "assistant", content: responseContent };
      setAiMessages((prev) => [...prev, assistantMsg]);

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
        <div className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col min-h-0 p-3 space-y-2 overflow-hidden bg-base-100">
      {/* Main Studio Workspace Layout (CodePen Style: 35% Left Workbench ↔ 65% Right Live Preview) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 overflow-hidden">
        {/* Left Workbench Panel (lg:col-span-4 => ~33-35% width matching image copy 2.png) */}
        <div className="lg:col-span-4 xl:col-span-4 flex flex-col border border-base-300 rounded-xl overflow-hidden bg-base-200/50 min-h-0">
          {/* Workbench Top Switcher Bar */}
          <div className="flex items-center justify-between bg-base-200/90 backdrop-blur-md px-2.5 py-2 border-b border-base-300 shrink-0 gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => navigate("/components")}
                className="px-2 text-base-content/70 hover:text-base-content hover:bg-base-300/50 rounded-lg"
                title="Back to components"
              >
                <ArrowLeft size={16} />
              </Button>

              {/* Segmented Pill Tabs Container */}
              <div className="flex items-center gap-1 p-1 bg-base-300/60 rounded-xl border border-base-300/70 shadow-inner">
                <button
                  type="button"
                  onClick={() => setWorkbenchTab("code")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all duration-200 ${
                    workbenchTab === "code"
                      ? "bg-base-100 text-primary shadow-xs ring-1 ring-base-300/60 font-bold"
                      : "text-base-content/60 hover:text-base-content hover:bg-base-100/40"
                  }`}
                >
                  <Code2 size={13} className={workbenchTab === "code" ? "text-primary" : "text-base-content/60"} />
                  <span>Editors</span>
                </button>

                <button
                  type="button"
                  onClick={() => setWorkbenchTab("ai")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all duration-200 ${
                    workbenchTab === "ai"
                      ? "bg-primary text-primary-content shadow-xs font-bold ring-1 ring-primary/40"
                      : "text-base-content/70 hover:text-primary hover:bg-primary/10"
                  }`}
                >
                  <Sparkles size={13} className={workbenchTab === "ai" ? "text-white animate-pulse" : "text-primary"} />
                  <span>Gemini AI</span>
                  {workbenchTab === "ai" && (
                    <span className="badge badge-xs bg-white text-primary font-bold text-[9px] px-1 py-0 border-0">
                      ACTIVE
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setWorkbenchTab("settings")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all duration-200 ${
                    workbenchTab === "settings"
                      ? "bg-base-100 text-primary shadow-xs ring-1 ring-base-300/60 font-bold"
                      : "text-base-content/60 hover:text-base-content hover:bg-base-100/40"
                  }`}
                >
                  <Settings size={13} className={workbenchTab === "settings" ? "text-primary" : "text-base-content/60"} />
                  <span>Settings</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button type="submit" size="sm" isLoading={isSaving} leftIcon={<Save size={14} />} variant="primary">
                Save
              </Button>
            </div>
          </div>

            {/* Panel Body */}
            {workbenchTab === "code" ? (
              /* Stacked HTML/CSS/JS Editors (CodePen Style) */
              <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
                {/* HTML Block */}
                <div className="border border-base-300 rounded-xl overflow-hidden bg-base-100/70 flex flex-col shadow-xs">
                  <div className="flex items-center justify-between bg-base-200 px-3 py-2 border-b border-base-300 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-error"></span>
                      <span className="text-xs font-bold text-base-content uppercase tracking-wider">HTML</span>
                      <span className="badge badge-xs bg-base-200 text-base-content/60 font-mono">
                        {formData.html_content.length} chars
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsHtmlOpen(!isHtmlOpen)}
                      className="btn btn-ghost btn-xs btn-square text-base-content/70 hover:text-base-content"
                      title={isHtmlOpen ? "Collapse HTML" : "Expand HTML"}
                    >
                      {isHtmlOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                  {isHtmlOpen && (
                    <div className="h-44 min-h-[110px]">
                      <Editor
                        height="100%"
                        language="html"
                        value={formData.html_content}
                        onChange={(val) => setFormData((prev) => ({ ...prev, html_content: val || "" }))}
                        theme={monacoTheme}
                        options={editorOptions}
                      />
                    </div>
                  )}
                </div>

                {/* CSS Block */}
                <div className="border border-base-300 rounded-xl overflow-hidden bg-base-100/70 flex flex-col shadow-xs">
                  <div className="flex items-center justify-between bg-base-200 px-3 py-2 border-b border-base-300 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-info"></span>
                      <span className="text-xs font-bold text-base-content uppercase tracking-wider">CSS</span>
                      <span className="badge badge-xs bg-base-200 text-base-content/60 font-mono">
                        {formData.css_content.length} chars
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCssOpen(!isCssOpen)}
                      className="btn btn-ghost btn-xs btn-square text-base-content/70 hover:text-base-content"
                      title={isCssOpen ? "Collapse CSS" : "Expand CSS"}
                    >
                      {isCssOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                  {isCssOpen && (
                    <div className="h-44 min-h-[110px]">
                      <Editor
                        height="100%"
                        language="css"
                        value={formData.css_content}
                        onChange={(val) => setFormData((prev) => ({ ...prev, css_content: val || "" }))}
                        theme={monacoTheme}
                        options={editorOptions}
                      />
                    </div>
                  )}
                </div>

                {/* JS Block */}
                <div className="border border-base-300 rounded-xl overflow-hidden bg-base-100/70 flex flex-col shadow-xs">
                  <div className="flex items-center justify-between bg-base-200 px-3 py-2 border-b border-base-300 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-warning"></span>
                      <span className="text-xs font-bold text-base-content uppercase tracking-wider">JavaScript</span>
                      <span className="badge badge-xs bg-base-200 text-base-content/60 font-mono">
                        {formData.js_content.length} chars
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsJsOpen(!isJsOpen)}
                      className="btn btn-ghost btn-xs btn-square text-base-content/70 hover:text-base-content"
                      title={isJsOpen ? "Collapse JS" : "Expand JS"}
                    >
                      {isJsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                  {isJsOpen && (
                    <div className="h-44 min-h-[110px]">
                      <Editor
                        height="100%"
                        language="javascript"
                        value={formData.js_content}
                        onChange={(val) => setFormData((prev) => ({ ...prev, js_content: val || "" }))}
                        theme={monacoTheme}
                        options={editorOptions}
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : workbenchTab === "ai" ? (
              /* Gemini AI Chat View */
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-base-100/50">
                {/* Chat Body & Suggestions Area */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
                  {aiMessages.length === 0 ? (
                    <div className="h-full flex flex-col justify-between py-4">
                      <div className="my-auto text-center px-2">
                        <h2 className="text-lg md:text-xl font-semibold text-primary tracking-tight">
                          Type @ to reference sources
                        </h2>
                      </div>

                      <div className="space-y-1.5 shrink-0">
                        {quickPromptChips.map((chip, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setAiPrompt(chip);
                              handleAiGenerate(chip);
                            }}
                            className="w-full p-2 bg-base-200/60 hover:bg-base-200 border border-base-300/60 rounded-xl text-left text-xs text-base-content/90 transition-colors flex items-center gap-2 group"
                          >
                            <CornerDownLeft size={13} className="text-base-content/40 group-hover:text-primary shrink-0 transition-colors" />
                            <span className="font-medium text-[11px]">{chip}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {aiMessages.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-[90%] p-2.5 rounded-2xl text-xs leading-relaxed ${msg.role === 'user' ? 'bg-primary text-primary-content rounded-br-none' : 'bg-base-200 border border-base-300 text-base-content rounded-bl-none space-y-2'}`}>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        </div>
                      ))}

                      {aiResponseCode && (
                        <div className="p-2.5 bg-base-200/80 border border-primary/40 rounded-xl text-xs space-y-2">
                          <div className="flex items-center justify-between font-semibold text-primary text-[11px]">
                            <span>AI Generated Code</span>
                            <Button type="button" size="sm" variant="primary" onClick={handleApplyAiCode} leftIcon={<Check size={12} />}>
                              Apply Code
                            </Button>
                          </div>
                        </div>
                      )}

                      {aiLoading && (
                        <div className="flex justify-start">
                          <div className="p-2.5 bg-base-200 rounded-2xl rounded-bl-none text-xs text-base-content/60 flex items-center gap-2">
                            <span className="loading loading-dots loading-xs text-primary"></span>
                            <span>Gemini is thinking...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Gemini Input Pill Container */}
                <div className="p-3 bg-base-100 border-t border-base-300 shrink-0 space-y-1.5">
                  <div className="bg-base-200/70 border border-base-300 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 rounded-3xl p-2.5 space-y-2 transition-all">
                    <textarea
                      rows={2}
                      placeholder="Ask Gemini"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleAiGenerate();
                        }
                      }}
                      className="w-full bg-transparent text-xs text-base-content placeholder:text-base-content/40 focus:outline-none resize-none"
                    />

                    <div className="flex items-center justify-between pt-1 border-t border-base-300/40">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="btn btn-circle btn-xs btn-ghost text-base-content/70 hover:text-base-content"
                          title="Add attachment or context @"
                        >
                          <Plus size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-circle btn-xs btn-ghost text-base-content/70 hover:text-base-content"
                          title="Adjust settings"
                        >
                          <SlidersHorizontal size={13} />
                        </button>
                        <span className="badge badge-primary bg-primary/20 border-0 text-primary font-bold text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded-full">
                          Beta
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAiGenerate()}
                        disabled={aiLoading || !aiPrompt.trim()}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                          aiPrompt.trim() && !aiLoading
                            ? "bg-primary text-primary-content hover:bg-primary-focus"
                            : "bg-base-300 text-base-content/40 cursor-not-allowed"
                        }`}
                        title="Send Message"
                      >
                        <ArrowUp size={13} />
                      </button>
                    </div>
                  </div>

                  <p className="text-[10px] text-base-content/50 text-center select-none pt-0.5">
                    Gemini in Workspace can make mistakes. <span className="underline cursor-pointer">Learn more</span>
                  </p>
                </div>
              </div>
            ) : (
              /* Component Settings & Dataset Tab */
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs bg-base-100/50">
                <div className="space-y-4.5 p-4 bg-base-100 border border-base-300 rounded-2xl shadow-xs">
                  <div className="border-b border-base-300 pb-3">
                    <h4 className="font-bold text-sm text-base-content flex items-center gap-2">
                      <Settings size={16} className="text-primary" />
                      Component Metadata & Configuration
                    </h4>
                    <p className="text-base-content/60 text-xs mt-0.5">
                      Configure widget details, preset templates, and backend data sources.
                    </p>
                  </div>

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
                      label="Starter Preset Template"
                      value=""
                      onChange={(val: string | null) => val && handlePresetChange(val)}
                      options={[
                        { value: "", label: "⚡ Load Starter Template..." },
                        ...COMPONENT_PRESETS.map((p) => ({
                          value: p.id,
                          label: p.name,
                        })),
                      ]}
                      isClearable={false}
                    />
                  </div>

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

                  <div className="pt-2 flex items-center justify-between border-t border-base-300">
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

                    <Button type="submit" isLoading={isSaving} leftIcon={<Save size={14} />}>
                      {isEditing ? "Update" : "Save"} Component
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Column 2: Right Live Preview & Inspector Panel (65-67% Width matching CodePen image copy 2.png) */}
          <div className="lg:col-span-8 xl:col-span-8 flex flex-col border border-base-300 rounded-xl overflow-hidden bg-base-200/50 min-h-0">
            {/* Header Tabs & Controls */}
            <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-base-200/90 backdrop-blur-md border-b border-base-300 shrink-0 gap-2">
              <div className="flex items-center gap-1 p-1 bg-base-300/60 rounded-xl border border-base-300/70 shadow-inner">
                <button
                  type="button"
                  onClick={() => setPreviewTab("preview")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all duration-200 ${
                    previewTab === "preview"
                      ? "bg-base-100 text-primary shadow-xs ring-1 ring-base-300/60 font-bold"
                      : "text-base-content/60 hover:text-base-content hover:bg-base-100/40"
                  }`}
                >
                  <Play size={13} className={previewTab === "preview" ? "text-primary" : "text-base-content/60"} />
                  <span>Live Preview</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("data")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all duration-200 ${
                    previewTab === "data"
                      ? "bg-base-100 text-primary shadow-xs ring-1 ring-base-300/60 font-bold"
                      : "text-base-content/60 hover:text-base-content hover:bg-base-100/40"
                  }`}
                >
                  <Database size={13} className={previewTab === "data" ? "text-primary" : "text-base-content/60"} />
                  <span>Dataset Inspector</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("console")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all duration-200 ${
                    previewTab === "console"
                      ? "bg-base-100 text-primary shadow-xs ring-1 ring-base-300/60 font-bold"
                      : "text-base-content/60 hover:text-base-content hover:bg-base-100/40"
                  }`}
                >
                  <Terminal size={13} className={previewTab === "console" ? "text-primary" : "text-base-content/60"} />
                  <span>Console Logs</span>
                  {consoleLogs.length > 0 && (
                    <span className={`badge badge-xs px-1.5 py-0 border-0 ${errorCount > 0 ? "bg-error text-white font-bold" : "bg-base-300 text-base-content/70"}`}>
                      {consoleLogs.length}
                    </span>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-1">
                <div className="join bg-base-100 border border-base-300 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewportMode("desktop")}
                    className={`join-item btn btn-xs btn-ghost gap-1 ${viewportMode === "desktop" ? "btn-active text-primary" : ""}`}
                    title="Desktop View (100%)"
                  >
                    <Monitor size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewportMode("tablet")}
                    className={`join-item btn btn-xs btn-ghost gap-1 ${viewportMode === "tablet" ? "btn-active text-primary" : ""}`}
                    title="Tablet View (768px)"
                  >
                    <Tablet size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewportMode("mobile")}
                    className={`join-item btn btn-xs btn-ghost gap-1 ${viewportMode === "mobile" ? "btn-active text-primary" : ""}`}
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

            <div className="flex-1 bg-base-200 overflow-hidden min-h-0 flex flex-col">
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

                      <div className="space-y-2">
                        <h5 className="font-semibold text-base-content/80 flex items-center gap-1.5">
                          <Code2 size={14} className="text-primary" />
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
                    </div>
                  )}
                </div>
              )}

              {previewTab === "console" && (
                <div className="flex-1 flex flex-col overflow-hidden text-xs">
                  <div className="flex items-center justify-between px-3 py-2 bg-base-100 border-b border-base-300 shrink-0">
                    <div className="flex items-center gap-1">
                      <Filter size={13} className="text-base-content/50 mr-1" />
                      {(["all", "info", "warn", "error"] as const).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setLogFilter(lvl)}
                          className={`px-2 py-0.5 text-[11px] font-semibold rounded uppercase tracking-wider transition-colors ${
                            logFilter === lvl
                              ? "bg-primary text-primary-content"
                              : "bg-base-200 text-base-content/70 hover:bg-base-300"
                          }`}
                        >
                          {lvl}
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
  );
};
