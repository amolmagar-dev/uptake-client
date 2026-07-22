/**
 * AI Workspace Page
 * Matching exact background & card structure of image.png
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  Bot,
  User,
  RefreshCw,
  Code2,
  BarChart3,
  LayoutDashboard,
  Database,
  Clock,
  Command,
  ChevronRight,
  Mic,
  MicOff,
  Copy,
  Check,
  Plus,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { aiApi, type ChatMessage, type AIContext } from "../lib/api";
import { ContextSelector, type SelectedContext } from "../components/ai/ContextSelector";
import { WidgetRenderer } from "../components/widgets/WidgetRegistry";
import type { BaseWidget, WidgetAction } from "../shared/types/widgets";

interface EnhancedChatMessage extends ChatMessage {
  timestamp: string;
  widget?: BaseWidget;
}

export const AIWorkspacePage: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<EnhancedChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCommands, setShowCommands] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Context Selection States
  const [selectedContexts, setSelectedContexts] = useState<SelectedContext[]>([]);
  const [showContextSelector, setShowContextSelector] = useState(false);

  // Voice recognition states
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  const commands = [
    { cmd: "/sql", description: "Open SQL Editor", action: () => navigate("/sql-editor"), icon: Code2 },
    { cmd: "/chart", description: "Go to Charts", action: () => navigate("/charts"), icon: BarChart3 },
    { cmd: "/dashboard", description: "View Dashboards", action: () => navigate("/dashboards"), icon: LayoutDashboard },
    { cmd: "/datasets", description: "Manage Datasets", action: () => navigate("/datasets"), icon: Database },
  ];

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  const shouldKeepListeningRef = useRef(false);

  // Speech recognition initialization
  useEffect(() => {
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
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          shouldKeepListeningRef.current = false;
          setIsListening(false);
        }
      };

      recognition.onend = () => {
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

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

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
    setShowContextSelector(false);
    setLoading(true);
    setError(null);

    try {
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
      const widgets = response.data?.widgets || null;

      const assistantMessage: EnhancedChatMessage = {
        role: "assistant",
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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

  const handleWidgetAction = (action: WidgetAction) => {
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
        default:
          console.warn("Unknown client tool:", action.clientTool);
      }
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const removeSelectedContext = (ctx: SelectedContext) => {
    setSelectedContexts(prev => prev.filter(c => !(c.type === ctx.type && c.id === ctx.id)));
  };

  return (
    <div className="h-full w-full bg-base-100 flex flex-col overflow-hidden relative min-h-0 font-sans antialiased text-base-content">
      {/* Center Main View Canvas */}
      <main className="flex-1 flex flex-col min-w-0 bg-base-100 overflow-hidden relative">
          <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth custom-scrollbar">
            <div className="max-w-3xl mx-auto w-full flex flex-col justify-center min-h-full">
              {messages.length === 0 ? (
                /* Hero Graphic & Subtitle */
                <div className="my-auto py-12 flex flex-col items-center text-center animate-in fade-in duration-500">
                  {/* Glowing purple sphere illustration */}
                  <div className="relative mb-6 flex items-center justify-center">
                    <div className="w-44 h-44 rounded-full bg-primary/20 blur-2xl absolute"></div>
                    
                    <div className="w-36 h-36 rounded-full bg-gradient-to-tr from-primary via-purple-500 to-indigo-400 shadow-xl flex items-center justify-center relative border border-white/30">
                      <div className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 flex items-center gap-2 text-white shadow-sm">
                        <div className="w-5 h-5 rounded-md bg-white/30 flex items-center justify-center font-bold text-xs">
                          ⚡
                        </div>
                        <div className="w-16 h-1.5 rounded-full bg-white/60"></div>
                      </div>
                    </div>
                  </div>

                  {/* Main Title */}
                  <h1 className="text-2xl md:text-3xl font-extrabold text-base-content tracking-tight mb-2">
                    Let the Data Speak
                  </h1>

                  {/* Subtitle */}
                  <p className="text-base-content/60 text-sm max-w-md font-normal leading-relaxed">
                    Data-driven dialogues are ready to transform your curiosity into strategic actions.
                  </p>
                </div>
              ) : (
                /* Active Chat Stream */
                <div className="space-y-6 py-4">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`chat ${
                          msg.role === "user" ? "chat-end" : "chat-start"
                        } animate-in fade-in slide-in-from-bottom-2 duration-300 w-full`}
                      >
                        <div className="chat-image avatar">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm border ${
                              msg.role === "user"
                                ? "bg-slate-800 text-white border-slate-700"
                                : "bg-indigo-600 text-white border-indigo-500"
                            }`}
                          >
                            {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                          </div>
                        </div>
                        <div className="chat-header text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1 px-1 flex items-center gap-2">
                          {msg.role === "user" ? "You" : "AI Assistant"}
                          <span className="flex items-center gap-1 font-medium lowercase text-slate-400">
                            <Clock size={10} /> {msg.timestamp}
                          </span>
                        </div>
                        
                        <div
                          className={`shadow-sm text-sm leading-relaxed py-3 px-4.5 transition-all relative group ${
                            msg.role === "user"
                              ? "bg-indigo-600 text-white rounded-2xl rounded-tr-none"
                              : "bg-slate-50 dark:bg-base-200 border border-slate-200 dark:border-base-300 text-slate-800 dark:text-base-content rounded-2xl rounded-tl-none"
                          }`}
                        >
                          {/* Copy Button */}
                          {msg.role === "assistant" && (
                            <button
                              onClick={() => copyToClipboard(msg.content, idx)}
                              className="absolute right-3 top-3 p-1 rounded bg-slate-200/50 opacity-0 group-hover:opacity-100 hover:bg-slate-200 text-slate-600 transition-all"
                              title="Copy response"
                            >
                              {copiedIdx === idx ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                            </button>
                          )}

                          {msg.role === "assistant" ? (
                            <div className="prose prose-sm max-w-none text-slate-800 dark:text-base-content pr-4">
                              <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                                  ul: ({node, ...props}) => <ul className="mb-2 list-disc list-inside" {...props} />,
                                  ol: ({node, ...props}) => <ol className="mb-2 list-decimal list-inside" {...props} />,
                                  code: ({node, inline, ...props}: {node?: any; inline?: boolean; [key: string]: any}) => 
                                    inline 
                                      ? <code className="bg-slate-200/70 dark:bg-base-300 px-1 py-0.5 rounded text-xs text-indigo-700 dark:text-indigo-400 font-mono" {...props} />
                                      : <code className="block bg-slate-100 dark:bg-base-300 p-3 rounded-lg text-xs font-mono overflow-x-auto border border-slate-200 text-slate-800 dark:text-base-content" {...props} />,
                                  strong: ({node, ...props}) => <strong className="font-bold text-indigo-600 dark:text-indigo-400" {...props} />,
                                }}
                              >
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                          )}

                          {/* Widget Output */}
                          {msg.widget && (
                            <WidgetRenderer {...msg.widget} onAction={handleWidgetAction} />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="chat chat-start animate-in fade-in duration-200">
                      <div className="chat-image avatar">
                        <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                          <Bot size={16} />
                        </div>
                      </div>
                      <div className="chat-header text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1 px-1">
                        AI Assistant
                      </div>
                      <div className="bg-slate-50 dark:bg-base-200 border border-slate-200 dark:border-base-300 flex items-center gap-3 py-3 px-4 rounded-2xl rounded-tl-none">
                        <span className="loading loading-dots loading-sm text-indigo-600"></span>
                        <span className="text-xs font-medium text-slate-500">Analyzing data...</span>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="flex justify-center my-6">
                      <div className="bg-rose-50 border border-rose-200 text-rose-700 shadow-md py-2.5 px-4 rounded-xl flex items-center gap-3 max-w-md">
                        <RefreshCw size={16} className="animate-spin text-rose-600" />
                        <span className="font-semibold text-xs flex-1">{error}</span>
                        <button onClick={() => handleSend()} className="px-2 py-1 bg-rose-100 hover:bg-rose-200 rounded text-xs font-bold text-rose-800">
                          RETRY
                        </button>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} className="h-4" />
                </div>
              )}
            </div>
          </div>

          {/* Integrated Bottom Input Dock matching image copy.png */}
          <div className="p-4 md:p-6 bg-white dark:bg-base-100 border-t border-slate-100 dark:border-base-200 shrink-0">
            <div className="max-w-3xl mx-auto w-full space-y-3">

              {/* Context Selector Drawer when expanded */}
              {showContextSelector && (
                <div className="mb-3 animate-in slide-in-from-bottom-2 duration-200 border border-slate-200 dark:border-base-300 rounded-xl overflow-hidden shadow-xl">
                  <ContextSelector
                    selectedContexts={selectedContexts}
                    onContextChange={setSelectedContexts}
                    isExpanded={true}
                    onToggleExpand={() => setShowContextSelector(false)}
                  />
                </div>
              )}

              {/* Attached Context Badges */}
              {selectedContexts.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pb-1 animate-in fade-in duration-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">Attached:</span>
                  {selectedContexts.map((ctx) => (
                    <div
                      key={`${ctx.type}-${ctx.id}`}
                      className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs rounded-full font-medium flex items-center gap-1.5"
                    >
                      <span className="max-w-[120px] truncate">{ctx.name}</span>
                      <button
                        onClick={() => removeSelectedContext(ctx)}
                        className="hover:text-rose-600 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Command Popover */}
              {showCommands && (
                <div className="relative z-40">
                  <div className="bg-white dark:bg-base-100 border border-indigo-200 dark:border-base-300 rounded-xl shadow-xl p-1.5">
                    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-slate-100 dark:border-base-200 mb-1 text-slate-400">
                      <Command size={13} />
                      <span className="text-[10px] font-extrabold uppercase tracking-widest">Commands</span>
                    </div>
                    {commands.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => executeCommand(c)}
                        className="w-full flex items-center justify-between p-2 hover:bg-indigo-50 dark:hover:bg-base-200 rounded-lg transition-colors group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-1 rounded-md bg-slate-100 dark:bg-base-200 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <c.icon size={13} />
                          </div>
                          <div className="text-left">
                            <div className="font-bold text-xs text-slate-800 dark:text-slate-200">{c.cmd}</div>
                            <div className="text-[10px] text-slate-400">{c.description}</div>
                          </div>
                        </div>
                        <ChevronRight size={13} className="text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Bar with Left (+) Attachment Button matching image copy.png */}
              <div className="relative flex items-center w-full bg-slate-50 dark:bg-base-200/50 hover:bg-slate-100/70 focus-within:bg-white dark:focus-within:bg-base-100 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 border border-slate-200 dark:border-base-300 rounded-xl transition-all shadow-sm">
                
                {/* Left (+) Button inside Input Pill */}
                <div className="pl-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowContextSelector(!showContextSelector)}
                    className="w-8 h-8 rounded-full bg-slate-200/70 dark:bg-base-300 hover:bg-slate-300 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors shadow-none"
                    title="Add files and context @"
                  >
                    <Plus size={18} className={`transition-transform duration-200 ${showContextSelector ? "rotate-45 text-indigo-600" : ""}`} />
                  </button>
                </div>

                {/* Input Text Field */}
                <input
                  type="text"
                  className="w-full bg-transparent py-3.5 pl-3 pr-20 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                  value={input}
                  onChange={handleInputChange}
                  placeholder="What's your next insight? Ask and find out."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={loading}
                />

                {/* Right Action Icons (Mic + Send) */}
                <div className="absolute right-2.5 flex items-center gap-1">
                  {speechSupported && (
                    <button
                      onClick={toggleListening}
                      disabled={loading}
                      type="button"
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                        isListening ? "bg-rose-500 text-white animate-pulse" : "text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
                      }`}
                      title={isListening ? "Stop listening" : "Voice input"}
                    >
                      {isListening ? <MicOff size={13} /> : <Mic size={13} />}
                    </button>
                  )}
                  <button
                    onClick={() => handleSend()}
                    disabled={loading || !input.trim()}
                    type="button"
                    className="w-7 h-7 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white flex items-center justify-center transition-colors shadow-sm"
                    title="Send message"
                  >
                    <Send size={12} />
                  </button>
                </div>
              </div>

            </div>
          </div>
        </main>
    </div>
  );
};
