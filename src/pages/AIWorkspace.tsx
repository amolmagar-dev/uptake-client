/**
 * AI Workspace Page
 * Main interface for conversational AI interactions with database
 * Supports context selection and follows chat UX best practices
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  Sparkles,
  Bot,
  User,
  Trash2,
  RefreshCw,
  Database,
  Code2,
  BarChart3,
  LayoutDashboard,
  Clock,
  Command,
  ChevronRight,
  Mic,
  MicOff,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { aiApi, type ChatMessage, type AIContext } from "../lib/api";
import { ContextSelector, type SelectedContext } from "../components/ai/ContextSelector";
import { WidgetRenderer } from "../components/widgets/WidgetRegistry";
import type { BaseWidget, WidgetAction } from "../shared/types/widgets";

interface EnhancedChatMessage extends ChatMessage {
  timestamp: string;
  widget?: BaseWidget; // NEW: Support for rendering widgets in messages
}

export const AIWorkspacePage: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<EnhancedChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your AI data assistant. I can help you explore your databases, query your data using SQL, create charts, or build dashboards. What would you like to do today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCommands, setShowCommands] = useState(false);
  const [selectedContexts, setSelectedContexts] = useState<SelectedContext[]>([]);
  const [showContextSelector, setShowContextSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Voice recognition states
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);

  const promptChips = [
    { label: "Explore Datasets", icon: Database, prompt: "Show me all available datasets and their tables." },
    { label: "Generate SQL", icon: Code2, prompt: "Help me write a SQL query to analyze my data." },
    { label: "Create Chart", icon: BarChart3, prompt: "I want to create a new chart from my sales data." },
    { label: "Build Dashboard", icon: LayoutDashboard, prompt: "How do I build a dashboard with multiple charts?" },
  ];

  const commands = [
    { cmd: "/sql", description: "Open SQL Editor", action: () => navigate("/sql-editor"), icon: Code2 },
    { cmd: "/chart", description: "Go to Charts", action: () => navigate("/charts"), icon: BarChart3 },
    { cmd: "/dashboard", description: "View Dashboards", action: () => navigate("/"), icon: LayoutDashboard },
    { cmd: "/datasets", description: "Manage Datasets", action: () => navigate("/datasets"), icon: Database },
  ];

  const quickActions = [
    { label: "Preview data", icon: Database },
    { label: "Show statistics", icon: BarChart3 },
    { label: "Find null values", icon: Code2 },
    { label: "Analyze trends", icon: BarChart3 },
    { label: "Create dashboard", icon: LayoutDashboard },
  ];

  const activeTasks = [
    { name: "Sales Analysis Dashboard", status: "In Progress", progress: 60 },
    { name: "Data Quality Check", status: "Completed", progress: 100 },
    { name: "Monthly Report", status: "Queued", progress: 0 },
  ];

  const suggestedSteps = [
    "Group by Status",
    "Calculate Averages",
    "Time Series Chart",
    "Export Report",
  ];

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  // Track if user wants to keep listening (to handle auto-restart)
  const shouldKeepListeningRef = useRef(false);

  // Initialize speech recognition
  useEffect(() => {
    // Check if browser supports the Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        
        setInput(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        // Don't stop on 'no-speech' error, just ignore it
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          shouldKeepListeningRef.current = false;
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        // Auto-restart if user didn't manually stop
        if (shouldKeepListeningRef.current) {
          try {
            recognition.start();
          } catch (error) {
            console.error('Failed to restart speech recognition:', error);
            shouldKeepListeningRef.current = false;
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      shouldKeepListeningRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Toggle voice recording
  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      // User manually stopping
      shouldKeepListeningRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        shouldKeepListeningRef.current = true;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        shouldKeepListeningRef.current = false;
      }
    }
  }, [isListening]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);

    // Show commands if user starts with /
    if (value.startsWith("/")) {
      setShowCommands(true);
    } else {
      setShowCommands(false);
    }
  };

  const executeCommand = (cmd: (typeof commands)[0]) => {
    cmd.action();
    setInput("");
    setShowCommands(false);
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend || loading) return;

    // Check if input is a command
    const matchedCmd = commands.find((c) => textToSend.toLowerCase().startsWith(c.cmd));
    if (matchedCmd && !customPrompt) {
      executeCommand(matchedCmd);
      return;
    }

    const userMessage: EnhancedChatMessage = {
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setShowCommands(false);
    setLoading(true);
    setError(null);

    try {
      // Map selected contexts to AIContext format
      const aiContexts: AIContext[] = selectedContexts.map((ctx) => ({
        type: ctx.type,
        id: ctx.id,
        name: ctx.name,
        metadata: ctx.metadata,
        customText: ctx.customText,
      }));

      const response = await aiApi.chat(
        nextMessages.map(({ role, content }) => ({ role, content })),
        aiContexts.length > 0 ? aiContexts : undefined
      );
      const reply = response.data?.message || "No response received.";
      const widgets = response.data?.widgets || null; // NEW: Extract widget data

      // Create assistant message with widget support
      const assistantMessage: EnhancedChatMessage = {
        role: "assistant",
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        // NEW: Include first widget if available (can be extended to support multiple)
        widget: widgets && widgets.length > 0 ? widgets[0] : undefined,
      };

      setMessages([...nextMessages, assistantMessage]);
    } catch (err) {
      console.error("Chat error", err);
      setError("Unable to reach the assistant. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle widget action execution
   * Executes client tools based on widget action definitions
   */
  const handleWidgetAction = (action: WidgetAction) => {
    console.log("[AIWorkspace] Widget action triggered:", action);

    // Handle client tool execution
    if (action.clientTool) {
      switch (action.clientTool) {
        case "navigate_to_page":
          if (action.params?.page) {
            navigate(`/${action.params.page}`, { state: action.params.params });
          }
          break;

        case "add_to_context":
          if (action.params?.type && action.params?.id && action.params?.name) {
            setSelectedContexts(prev => [...prev, {
              type: action.params!.type,
              id: action.params!.id,
              name: action.params!.name,
              metadata: action.params!.metadata,
            }]);
          }
          break;

        case "show_notification":
          // For now, just log. You can integrate with a toast library later
          console.log(`[Notification ${action.params?.type}]:`, action.params?.message);
          break;

        default:
          console.warn("Unknown client tool:", action.clientTool);
      }
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "Hello! I'm your AI data assistant. I can help you explore your databases, query your data using SQL, create charts, or build dashboards. What would you like to do today?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-base-200/30 overflow-hidden">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4 shrink-0 px-4 py-3 bg-base-100 border-b border-base-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-sm border border-primary/20">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-base-content">Data Analysis Session</h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="btn btn-ghost btn-sm gap-2 text-base-content/40 hover:text-error transition-all hover:bg-error/10"
            onClick={clearChat}
            aria-label="Clear chat session"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Three-column layout */}
      <div className="flex-1 flex gap-0 overflow-hidden">
        {/* LEFT SIDEBAR */}
        <div
          className={`${
            showLeftSidebar ? "w-64" : "w-0"
          } bg-base-100 border-r border-base-300 flex flex-col transition-all duration-300 overflow-hidden`}
        >
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Active Context */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-widest opacity-40">Active Context</h2>
                <span className="badge badge-xs">1/5</span>
              </div>
              <div className="bg-base-200/50 rounded-lg p-3 border border-base-300">
                <div className="flex items-start gap-3">
                  <Database className="w-8 h-8 text-primary mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">UAT-AESM</div>
                    <div className="text-xs opacity-50 truncate">PostgreSQL</div>
                    <div className="text-xs text-primary mt-1">2,345 rows with no null values</div>
                  </div>
                </div>
                <button className="btn btn-xs btn-ghost w-full mt-3 opacity-60">+ Add Database / Table</button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <h2 className="text-xs font-black uppercase tracking-widest opacity-40">Quick Actions</h2>
              <div className="space-y-1">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    className="btn btn-sm btn-ghost w-full justify-start gap-2 text-xs font-medium opacity-70 hover:opacity-100"
                  >
                    <action.icon size={14} />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Tasks */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-widest opacity-40">Active Tasks</h2>
                <button className="btn btn-xs btn-ghost text-primary">+ NEW</button>
              </div>
              <div className="space-y-2">
                {activeTasks.map((task, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      task.status === "In Progress"
                        ? "bg-primary/5 border-primary/30"
                        : task.status === "Completed"
                        ? "bg-success/5 border-success/30 opacity-60"
                        : "bg-base-200/50 border-base-300 opacity-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {task.status === "In Progress" ? (
                        <LayoutDashboard size={14} className="text-primary" />
                      ) : task.status === "Completed" ? (
                        <BarChart3 size={14} className="text-success" />
                      ) : (
                        <Database size={14} className="text-base-content/40" />
                      )}
                      <div className="text-xs font-bold flex-1 truncate">{task.name}</div>
                    </div>
                    <div className="text-[10px] font-medium uppercase tracking-wider opacity-40 mb-1">
                      {task.status}
                    </div>
                    {task.progress > 0 && (
                      <progress className="progress progress-primary w-full h-1" value={task.progress} max="100"></progress>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CENTER CHAT PANEL */}
        <div className="flex-1 flex flex-col min-w-0 bg-base-100">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth custom-scrollbar">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`chat ${
                    msg.role === "user" ? "chat-end" : "chat-start"
                  } animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-3xl`}
                >
                  <div className="chat-image avatar">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border ${
                        msg.role === "user"
                          ? "bg-secondary text-secondary-content border-secondary/20"
                          : "bg-primary text-primary-content border-primary/20"
                      }`}
                    >
                      {msg.role === "user" ? <User size={18} /> : <Bot size={18} />}
                    </div>
                  </div>
                  <div className="chat-header opacity-40 text-[10px] font-black uppercase tracking-widest mb-1.5 px-1 flex items-center gap-2">
                    {msg.role === "user" ? "You" : "AI Assistant"}
                    <span className="flex items-center gap-1 font-medium lowercase">
                      <Clock size={10} /> {msg.timestamp}
                    </span>
                  </div>
                  <div
                    className={`chat-bubble shadow-md text-sm leading-relaxed py-3.5 px-5 transition-all duration-300 ${
                      msg.role === "user"
                        ? "chat-bubble-primary rounded-2xl! rounded-tr-none!"
                        : "chat-bubble-neutral bg-base-200/50 border border-base-300 text-base-content rounded-2xl! rounded-tl-none!"
                    }`}
                  >
                    {/* Render markdown for AI messages, plain text for user messages */}
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none prose-invert">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            // Customize rendering of specific elements
                            p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                            ul: ({node, ...props}) => <ul className="mb-2 list-disc list-inside" {...props} />,
                            ol: ({node, ...props}) => <ol className="mb-2 list-decimal list-inside" {...props} />,
                            code: ({node, inline, ...props}: {node?: any; inline?: boolean; [key: string]: any}) => 
                              inline 
                                ? <code className="bg-base-300/50 px-1 py-0.5 rounded text-xs" {...props} />
                                : <code className="block bg-base-300/50 p-2 rounded text-xs overflow-x-auto" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-bold text-primary" {...props} />,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    )}

                    {/* NEW: Widget rendering */}
                    {msg.widget && (
                      <WidgetRenderer {...msg.widget} onAction={handleWidgetAction} />
                    )}

                    {/* Inline Actions for AI messages */}
                    {msg.role === "assistant" && idx > 0 && (
                      <div className="mt-3 pt-3 border-t border-base-content/5 flex flex-wrap gap-2">
                        <button className="btn btn-xs btn-ghost gap-1 opacity-60 hover:opacity-100">
                          <Database size={10} /> Preview Table
                        </button>
                        <button className="btn btn-xs btn-ghost gap-1 opacity-60 hover:opacity-100">
                          <BarChart3 size={10} /> Show Statistics
                        </button>
                        {msg.content.toLowerCase().includes("sql") && (
                          <button
                            onClick={() => navigate("/sql-editor")}
                            className="btn btn-xs btn-ghost gap-1 opacity-60 hover:opacity-100 text-primary"
                          >
                            <Code2 size={10} /> Write SQL
                          </button>
                        )}
                        <button className="btn btn-xs btn-ghost gap-1 opacity-60 hover:opacity-100">
                          <BarChart3 size={10} /> Generate Chart
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Prompt Chips */}
                {idx === 0 && msg.role === "assistant" && messages.length <= 2 && (
                  <div className="mt-6 flex flex-wrap gap-2 animate-in fade-in duration-700 max-w-3xl">
                    <span className="w-full text-[10px] font-bold uppercase tracking-widest opacity-30 mb-1">
                      Suggestions
                    </span>
                    {promptChips.map((chip, cIdx) => (
                      <button
                        key={cIdx}
                        onClick={() => handleSend(chip.prompt)}
                        className="btn btn-outline btn-sm gap-2 rounded-full border-base-300 hover:border-primary hover:bg-primary/5 text-xs font-bold"
                      >
                        <chip.icon size={14} className="text-primary" />
                        {chip.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="chat chat-start animate-in fade-in duration-300">
                <div className="chat-image avatar">
                  <div className="w-10 h-10 rounded-xl bg-primary text-primary-content flex items-center justify-center shadow-sm border border-primary/20">
                    <Bot size={18} />
                  </div>
                </div>
                <div className="chat-header opacity-40 text-[10px] font-black uppercase tracking-widest mb-1.5 px-1">
                  AI Assistant
                </div>
                <div className="chat-bubble chat-bubble-neutral bg-base-200/50 border border-base-300 flex items-center gap-4 py-4 px-5 rounded-2xl! rounded-tl-none!">
                  <span className="loading loading-dots loading-md text-primary"></span>
                  <span className="text-sm font-bold opacity-40 italic">Processing...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-center my-8">
                <div className="alert alert-error shadow-xl py-3 px-6 max-w-md">
                  <RefreshCw size={18} className="animate-spin" />
                  <span className="font-bold text-sm">{error}</span>
                  <button onClick={() => handleSend()} className="btn btn-sm btn-ghost">
                    RETRY
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} className="h-4" />
          </div>

          {/* Input Area */}
          <div className="sticky bottom-0 z-30 bg-base-100/95 backdrop-blur-sm border-t border-base-300 shrink-0">
            {/* Context Selector */}
            <ContextSelector
              selectedContexts={selectedContexts}
              onContextChange={setSelectedContexts}
              isExpanded={showContextSelector}
              onToggleExpand={() => setShowContextSelector(!showContextSelector)}
            />

            {/* Command Popover */}
            {showCommands && (
              <div className="absolute left-0 right-0 bottom-full px-4 pb-3 z-40">
                <div className="max-w-4xl mx-auto bg-base-100 border border-primary/30 rounded-xl shadow-2xl p-2">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-base-200 mb-1 opacity-40">
                    <Command size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Commands</span>
                  </div>
                  {commands.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => executeCommand(c)}
                      className="w-full flex items-center justify-between p-3 hover:bg-primary/10 rounded-lg transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-base-200 text-primary group-hover:bg-primary group-hover:text-primary-content transition-colors">
                          <c.icon size={16} />
                        </div>
                        <div className="text-left">
                          <div className="font-black text-xs uppercase">{c.cmd}</div>
                          <div className="text-[10px] opacity-50">{c.description}</div>
                        </div>
                      </div>
                      <ChevronRight size={14} className="opacity-20 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4">
              <div className="max-w-4xl mx-auto relative">
                <textarea
                  className="textarea textarea-bordered w-full pr-24 min-h-[48px] max-h-[48px] resize-none focus:textarea-primary bg-base-200/30 border-base-300 text-base rounded-2xl"
                  rows={1}
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask about your data, write SQL, create visualizations..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={loading}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {/* Mic Button */}
                  {speechSupported && (
                    <button
                      onClick={toggleListening}
                      disabled={loading}
                      className={`btn btn-circle btn-sm ${
                        isListening ? "btn-error" : "btn-ghost hover:btn-secondary"
                      }`}
                    >
                      {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                    </button>
                  )}
                  {/* Send Button */}
                  <button
                    onClick={() => handleSend()}
                    disabled={loading || !input.trim()}
                    className="btn btn-circle btn-primary btn-sm shadow-lg"
                  >
                    {!loading && <Send size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div
          className={`${
            showRightSidebar ? "w-80" : "w-0"
          } bg-base-100 border-l border-base-300 flex flex-col transition-all duration-300 overflow-hidden`}
        >
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* AI Insights */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-primary" />
                <h2 className="text-xs font-black uppercase tracking-widest opacity-40">AI Insights</h2>
              </div>

              {/* Data Quality */}
              <div className="bg-success/5 border border-success/30 rounded-lg p-3">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-lg">✓</span>
                  <div>
                    <div className="text-xs font-bold">Data Quality</div>
                    <div className="text-xs opacity-70 mt-1">
                      Your table has 2,345 rows with no null values detected. Data quality: Excellent
                    </div>
                  </div>
                </div>
              </div>

              {/* Trend Analysis */}
              <div className="bg-primary/5 border border-primary/30 rounded-lg p-3">
                <div className="flex items-start gap-2 mb-2">
                  <BarChart3 size={16} className="text-primary mt-0.5" />
                  <div>
                    <div className="text-xs font-bold">Trend Analysis</div>
                    <div className="text-xs opacity-70 mt-1">
                      Values show an upward trend of 12.5% over the last month
                    </div>
                  </div>
                </div>
              </div>

              {/* Anomaly Detected */}
              <div className="bg-warning/5 border border-warning/30 rounded-lg p-3">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-lg">⚠</span>
                  <div>
                    <div className="text-xs font-bold">Anomaly Detected</div>
                    <div className="text-xs opacity-70 mt-1">
                      3 outlier values found in "Value" column that may need review
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Context Memory */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Database size={14} className="text-primary" />
                <h2 className="text-xs font-black uppercase tracking-widest opacity-40">Context Memory</h2>
              </div>
              <div className="bg-base-200/50 rounded-lg p-3 border border-base-300 space-y-2 text-xs">
                <div>
                  <div className="font-bold opacity-50">Current Session:</div>
                  <div className="opacity-70">Exploring UAT-AESM table</div>
                </div>
                <div>
                  <div className="font-bold opacity-50">Focus:</div>
                  <div className="opacity-70">Data preview & statistics</div>
                </div>
                <div>
                  <div className="font-bold opacity-50">Queries Executed:</div>
                  <div className="opacity-70">3 queries</div>
                </div>
                <div>
                  <div className="font-bold opacity-50">User Preferences:</div>
                  <div className="opacity-70">Prefers visual representations</div>
                  <div className="opacity-70">Often exports to CSV</div>
                </div>
              </div>
            </div>

            {/* Suggested Next Steps */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ChevronRight size={14} className="text-primary" />
                <h2 className="text-xs font-black uppercase tracking-widest opacity-40">Suggested Next Steps</h2>
              </div>
              <div className="space-y-1">
                {suggestedSteps.map((step, idx) => (
                  <button
                    key={idx}
                    className="btn btn-sm btn-ghost w-full justify-start text-xs font-medium opacity-70 hover:opacity-100 hover:bg-primary/5"
                  >
                    {step}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Toggle Buttons (for mobile/responsive) */}
      <button
        onClick={() => setShowLeftSidebar(!showLeftSidebar)}
        className="fixed left-2 top-20 z-50 btn btn-circle btn-sm btn-ghost bg-base-100 border border-base-300 lg:hidden"
        aria-label="Toggle left sidebar"
      >
        <ChevronRight size={16} className={`transition-transform ${showLeftSidebar ? "" : "rotate-180"}`} />
      </button>
      <button
        onClick={() => setShowRightSidebar(!showRightSidebar)}
        className="fixed right-2 top-20 z-50 btn btn-circle btn-sm btn-ghost bg-base-100 border border-base-300 lg:hidden"
        aria-label="Toggle right sidebar"
      >
        <ChevronRight size={16} className={`transition-transform ${showRightSidebar ? "rotate-180" : ""}`} />
      </button>
    </div>
  );
};
