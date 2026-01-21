import { useState, useRef, useEffect } from "react";
import { X, Send, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { aiAPI } from "../lib/api";

export const AIChat = ({ eventContext = null, onClose, isOpen }) => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Namaste! I'm your Arangetram planning assistant. I can help you find the perfect venue, caterers, photographers, musicians, and more for your special day. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const response = await aiAPI.chat(userMessage, eventContext);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.data.response },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I apologize, but I encountered an issue. Please try again or browse our vendors directly.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={onClose}
        data-testid="ai-chat-toggle"
        className="fixed bottom-6 right-6 w-16 h-16 bg-[#800020] text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center z-50 hover:scale-110 group"
        style={{ transition: 'transform 0.2s, box-shadow 0.2s' }}
        aria-label="Open AI Chat Assistant"
      >
        <MessageCircle className="w-7 h-7" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C5A059] rounded-full animate-pulse"></span>
      </button>
    );
  }

  return (
    <div className="chat-container" data-testid="ai-chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <MessageCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold">Event Assistant</h3>
            <p className="text-xs text-white/70">Powered by AI</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded-full transition-colors"
          data-testid="close-chat-btn"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={msg.role === "user" ? "chat-message-user" : "chat-message-ai"}
          >
            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
          </div>
        ))}
        {loading && (
          <div className="chat-message-ai flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[#E5E5E5]">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about venues, musicians, catering..."
            className="flex-1 px-4 py-2 bg-[#F9F8F4] border border-[#E5E5E5] rounded-full text-sm focus:outline-none focus:border-[#0F4C5C]"
            data-testid="ai-chat-input"
          />
          <Button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-full bg-[#0F4C5C] hover:bg-[#093642] p-0"
            data-testid="ai-chat-send"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
