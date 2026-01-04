import React, { useEffect, useRef, useState, useCallback } from "react";
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
  ExternalLink,
  Mic,
  MicOff,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { aiApi, type ChatMessage, type AIContext } from "../lib/api";
import { Card } from "../shared/components/ui/Card";
import { ContextSelector, type SelectedContext } from "../components/ai/ContextSelector";

interface EnhancedChatMessage extends ChatMessage {
  timestamp: string;
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
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err) {
      console.error("Chat error", err);
      setError("Unable to reach the assistant. Please try again.");
    } finally {
      setLoading(false);
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
    <div className="absolute inset-0 flex flex-col p-6 lg:p-10 gap-6 max-w-7xl mx-auto overflow-hidden">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 px-2 transition-all">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-sm border border-primary/20 animate-in zoom-in duration-500">
            <Sparkles size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-base-content">AI Workspace</h1>
              <span className="badge badge-primary badge-outline badge-sm font-bold opacity-60">ALPHA</span>
            </div>
            <p className="text-base-content/50 text-xs md:text-sm font-medium">
              Intelligent data assistant for your workspace
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Actions Bar */}
          <div className="hidden lg:flex items-center gap-1 bg-base-200/50 rounded-full p-1 border border-base-300 mr-2">
            {commands.map((c, i) => (
              <button
                key={i}
                onClick={c.action}
                className="btn btn-ghost btn-xs rounded-full gap-1.5 opacity-60 hover:opacity-100 font-bold text-[10px] uppercase tracking-wider"
                title={c.description}
              >
                <c.icon size={12} />
                {c.cmd.replace("/", "")}
              </button>
            ))}
          </div>

          <button
            className="btn btn-ghost btn-sm gap-2 text-base-content/40 hover:text-error transition-all hover:bg-error/10 focus-visible:ring-2 focus-visible:ring-error/20"
            onClick={clearChat}
            aria-label="Clear chat session"
          >
            <Trash2 size={16} />
            <span className="hidden sm:inline font-bold uppercase tracking-wider text-[10px]">Clear</span>
          </button>
        </div>
      </div>

      {/* Main Chat Interface */}
      <Card
        padding="none"
        className="flex-1 flex flex-col overflow-hidden bg-base-100 border-base-300 shadow-2xl min-h-0 border-0 md:border mb-2 relative"
      >
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-scroll p-4 md:p-8 space-y-8 scroll-smooth custom-scrollbar bg-linear-to-b from-base-100 to-base-200/30">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start pl-2 md:pl-10"}`}
              >
                <div
                  className={`chat ${
                    msg.role === "user" ? "chat-end" : "chat-start"
                  } animate-in fade-in slide-in-from-bottom-4 duration-500 w-full`}
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
                    {msg.role === "user" ? "User" : "AI Assistant"}
                    <span className="flex items-center gap-1 font-medium lowercase">
                      <Clock size={10} /> {msg.timestamp}
                    </span>
                  </div>
                  <div
                    className={`chat-bubble shadow-md max-w-[85%] md:max-w-[80%] text-sm md:text-base leading-relaxed py-3.5 px-5 whitespace-pre-wrap transition-all duration-300 ${
                      msg.role === "user"
                        ? "chat-bubble-primary rounded-2xl! rounded-tr-none! hover:shadow-primary/20"
                        : "chat-bubble-neutral bg-base-100 border border-base-300 text-base-content rounded-2xl! rounded-tl-none! hover:border-primary/30"
                    }`}
                  >
                    {msg.content}

                    {/* Inline Discoverability Actions */}
                    {msg.role === "assistant" && (
                      <div className="mt-4 pt-4 border-t border-base-content/5 flex flex-wrap gap-2">
                        {msg.content.toLowerCase().includes("sql") && (
                          <button
                            onClick={() => navigate("/sql-editor")}
                            className="btn btn-xs btn-ghost gap-1 opacity-60 hover:opacity-100 text-primary"
                          >
                            <ExternalLink size={10} /> Open SQL Editor
                          </button>
                        )}
                        {msg.content.toLowerCase().includes("chart") && (
                          <button
                            onClick={() => navigate("/charts")}
                            className="btn btn-xs btn-ghost gap-1 opacity-60 hover:opacity-100 text-primary"
                          >
                            <ExternalLink size={10} /> Go to Charts
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Action Prompt Chips - Shrinks after first message */}
                {idx === 0 && msg.role === "assistant" && messages.length <= 2 && (
                  <div
                    className={`mt-6 flex flex-wrap gap-2 animate-in fade-in slide-in-from-left-4 duration-700 delay-300 transition-all ${
                      messages.length > 1 ? "opacity-40 scale-95 origin-left" : ""
                    }`}
                  >
                    <span className="w-full text-[10px] font-bold uppercase tracking-widest opacity-30 mb-1 ml-1">
                      Suggestions
                    </span>
                    {promptChips.map((chip, cIdx) => (
                      <button
                        key={cIdx}
                        onClick={() => handleSend(chip.prompt)}
                        className="btn btn-outline btn-sm gap-2 rounded-full border-base-300 hover:border-primary hover:bg-primary/5 text-xs font-bold transition-all hover:scale-105 active:scale-95 bg-base-100 shadow-sm"
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
              <div className="chat chat-start animate-in fade-in duration-300 pl-2 md:pl-10">
                <div className="chat-image avatar">
                  <div className="w-10 h-10 rounded-xl bg-primary text-primary-content flex items-center justify-center shadow-sm border border-primary/20">
                    <Bot size={18} />
                  </div>
                </div>
                <div className="chat-header opacity-40 text-[10px] font-black uppercase tracking-widest mb-1.5 px-1">
                  AI Assistant
                </div>
                <div className="chat-bubble chat-bubble-neutral bg-base-100 border border-base-300 flex items-center gap-4 py-4 px-5 rounded-2xl! rounded-tl-none! shadow-md">
                  <span className="loading loading-dots loading-md text-primary"></span>
                  <span className="text-sm font-bold opacity-40 italic tracking-tight">Processing...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-center my-8 animate-in zoom-in duration-300">
                <div className="alert alert-error shadow-xl py-3 px-6 max-w-md border-0 bg-error text-error-content">
                  <RefreshCw size={18} className="animate-spin" />
                  <span className="font-bold text-sm">{error}</span>
                  <button
                    onClick={() => handleSend()}
                    className="btn btn-sm btn-ghost bg-base-100/20 hover:bg-base-100/40 font-black border-0"
                  >
                    RETRY
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} className="h-4" />
          </div>

          {/* Sticky bottom: Context Selector + Input + Command Popover */}
          <div className="sticky bottom-0 z-30 bg-base-100/80 backdrop-blur-md border-t border-base-300 shrink-0">
            {/* Context Selector */}
            <ContextSelector
              selectedContexts={selectedContexts}
              onContextChange={setSelectedContexts}
              isExpanded={showContextSelector}
              onToggleExpand={() => setShowContextSelector(!showContextSelector)}
            />
            {/* Command Suggestion Popover */}
            {showCommands && (
              <div className="absolute left-0 right-0 bottom-full px-4 md:px-8 pb-3 z-40">
                <div className="max-w-4xl mx-auto bg-base-100 border border-primary/30 rounded-xl shadow-2xl p-2 animate-in slide-in-from-bottom-2 duration-300">
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
                          <div className="font-black text-xs uppercase tracking-tight">{c.cmd}</div>
                          <div className="text-[10px] opacity-50">{c.description}</div>
                        </div>
                      </div>
                      <ChevronRight size={14} className="opacity-20 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 md:p-8">
              <div className="max-w-4xl mx-auto relative group">
                <div className="relative">
                  <textarea
                    className="textarea textarea-bordered w-full pr-16 min-h-[48px] max-h-[48px] resize-none focus:textarea-primary bg-base-200/30 border-base-300 shadow-inner text-base leading-relaxed transition-all focus:bg-base-100 placeholder:opacity-30 rounded-2xl focus:ring-4 focus:ring-primary/10 hover:border-primary/30"
                    rows={1}
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Ask about your data, SQL, charts, or dashboards... (Type / for commands)"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    disabled={loading}
                    aria-label="Chat input"
                  />
                  <div className="absolute right-4 inset-y-0 flex items-center gap-2">
                    {/* Mic Button with Wave Animation */}
                    {speechSupported && (
                      <div className="relative">
                        {/* Sound Wave Animation */}
                        {isListening && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="flex items-center gap-[2px]">
                              {[0, 1, 2, 3].map((i) => (
                                <span
                                  key={i}
                                  className="w-[3px] bg-error rounded-full"
                                  style={{
                                    height: '16px',
                                    animation: 'soundWave 0.5s ease-in-out infinite',
                                    animationDelay: `${i * 0.1}s`,
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        <button
                          onClick={toggleListening}
                          disabled={loading}
                          className={`btn btn-circle btn-sm transition-all relative z-10 ${
                            isListening
                              ? "btn-error shadow-lg shadow-error/40"
                              : "btn-ghost hover:btn-secondary hover:scale-110"
                          }`}
                          aria-label={isListening ? "Stop listening" : "Start voice input"}
                          title={isListening ? "Stop listening" : "Click to speak"}
                        >
                          {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                        </button>
                        {/* Ripple effect when listening */}
                        {isListening && (
                          <>
                            <span className="absolute inset-0 rounded-full bg-error/30 animate-ping" />
                            <span className="absolute -inset-1 rounded-full bg-error/10 animate-pulse" />
                          </>
                        )}
                      </div>
                    )}
                    {/* Send Button */}
                    <button
                      onClick={() => handleSend()}
                      disabled={loading || !input.trim()}
                      className={`btn btn-circle btn-primary btn-md ${
                        loading ? "loading" : ""
                      } shadow-xl shadow-primary/30 hover:scale-110 transition-all active:scale-95 group-hover:translate-y-[-2px]`}
                      aria-label="Send message"
                    >
                      {!loading && <Send size={20} className="transition-transform group-hover:rotate-12" />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-4 mt-4 opacity-30">
                <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={10} /> Uptake AI v1.0
                </p>
                <div className="w-1 h-1 rounded-full bg-current" />
                <p className="text-[10px] font-black uppercase tracking-widest">Press / for commands</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
