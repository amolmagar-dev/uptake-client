import React, { useMemo, useState } from "react";
import { MessageCircle, Send, X, Maximize2, Minimize2 } from "lucide-react";
import { aiApi, type ChatMessage } from "../../lib/api";

const bubbleStyle = {
  backgroundColor: "var(--color-bg-secondary)",
  border: "1px solid var(--color-border)",
};

const buttonStyle = {
  background: "linear-gradient(135deg, #00f5d4, #7b2cbf)",
  color: "#0a0a0f",
};

export const ChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hi! Ask me about your data or dashboards." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerClasses = useMemo(() => "fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 text-sm", []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMessage: ChatMessage = { role: "user", content: input.trim() };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await aiApi.chat(nextMessages);
      const reply = response.data?.message || "No response received.";
      setMessages([...nextMessages, { role: "assistant", content: reply }]);
    } catch (err) {
      console.error("Chat error", err);
      setError("Unable to reach the assistant. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={containerClasses}>
      {open && (
        <div
          className={`shadow-2xl rounded-xl overflow-hidden transition-all duration-300 ${
            expanded ? "w-[600px]" : "w-80"
          }`}
          style={bubbleStyle}
        >
          <div
            className="flex items-center justify-between px-3 py-2"
            style={{ borderBottom: "1px solid var(--color-border)" }}
          >
            <div className="flex items-center gap-2">
              <MessageCircle size={18} />
              <span className="font-semibold">Assistant</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setExpanded((prev) => !prev)}
                className="p-1 rounded hover:opacity-80 transition-opacity"
                aria-label={expanded ? "Minimize chat" : "Expand chat"}
              >
                {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:opacity-80 transition-opacity"
                aria-label="Close chat"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div
            className={`overflow-y-auto px-3 py-2 space-y-2 transition-all duration-300 ${
              expanded ? "h-[500px]" : "h-80"
            }`}
          >
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-lg ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-[#00f5d4]/20 to-[#7b2cbf]/20"
                      : "bg-[var(--color-bg-tertiary)]"
                  }`}
                  style={{ border: "1px solid var(--color-border)" }}
                >
                  <p className="text-xs mb-1 text-[var(--color-text-muted)]">
                    {msg.role === "user" ? "You" : "Assistant"}
                  </p>
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {error && (
              <div className="text-red-500 text-xs" role="alert">
                {error}
              </div>
            )}
          </div>

          <div className="p-3 flex items-center gap-2" style={{ borderTop: "1px solid var(--color-border)" }}>
            <textarea
              className="flex-1 text-sm rounded-lg px-3 py-2 resize-none focus:outline-none"
              style={{
                backgroundColor: "var(--color-bg-tertiary)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-primary)",
              }}
              rows={expanded ? 3 : 2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask something..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className={`p-3 rounded-lg transition-all ${
                loading ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"
              }`}
              style={buttonStyle}
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((prev) => !prev)}
        className="p-3 rounded-full shadow-lg flex items-center gap-2 hover:scale-105 transition-transform"
        style={buttonStyle}
        aria-label="Toggle chat"
      >
        <MessageCircle size={18} />
        <span className="hidden md:inline font-semibold">Chat</span>
      </button>
    </div>
  );
};
