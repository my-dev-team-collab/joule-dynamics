import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bot, X, AlertCircle, Activity, Loader2, Maximize2, Minimize2, MessageSquarePlus, ArrowUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  sender: 'assistant' | 'user';
  text: string;
  path?: string;
  suggested_actions?: string[];
  isError?: boolean;
  retryable?: boolean;
  isStreaming?: boolean;
}

const MessageBubble = ({
  msg,
  isLastMessage,
  handleSend,
  loading,
  markdownComponents
}: {
  msg: Message;
  isLastMessage: boolean;
  handleSend: (text?: string) => void;
  loading: boolean;
  markdownComponents: Components;
}) => {
  const [displayedText, setDisplayedText] = useState(msg.isStreaming ? '' : msg.text);
  const [isComplete, setIsComplete] = useState(!msg.isStreaming);

  useEffect(() => {
    if (!msg.isStreaming || isComplete) {
      setDisplayedText(msg.text);
      setIsComplete(true);
      return;
    }

    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setDisplayedText(msg.text.slice(0, i));
      if (i >= msg.text.length) {
        clearInterval(interval);
        setIsComplete(true);
        msg.isStreaming = false;
      }
    }, 25);

    return () => clearInterval(interval);
  }, [msg.text, msg.isStreaming, isComplete, msg]);

  return (
    <div className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[90%] p-3 rounded-xl text-sm ${
          msg.sender === 'user'
            ? 'bg-secondary text-secondary-foreground font-medium rounded-br-sm'
            : msg.isError
              ? 'bg-red-500/10 border border-red-500/50 text-red-500 rounded-bl-sm'
              : 'bg-card text-foreground border border-border/50 shadow-sm rounded-bl-sm'
        }`}
      >
        {msg.sender === 'assistant' ? (
          msg.isError ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <p className="whitespace-pre-wrap">{displayedText}</p>
              </div>
              {msg.retryable && (
                <button 
                  onClick={() => handleSend()} 
                  className="self-start mt-1 text-xs px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 rounded-md transition-colors font-medium"
                >
                  Try again
                </button>
              )}
            </div>
          ) : (
            <div className="prose dark:prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-muted prose-pre:text-muted-foreground prose-a:text-primary">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {displayedText}
              </ReactMarkdown>
              {!isComplete && <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle" />}
            </div>
          )
        ) : (
          <p className="whitespace-pre-wrap">{msg.text}</p>
        )}
      </div>
      
      {msg.sender === 'assistant' && msg.suggested_actions && msg.suggested_actions.length > 0 && isLastMessage && isComplete && (
        <div className="flex flex-wrap gap-2 mt-3 max-w-[90%]">
          {msg.suggested_actions.map((action, actionIdx) => (
            <button
              key={actionIdx}
              onClick={() => handleSend(action)}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-accent hover:text-accent-foreground text-muted-foreground bg-transparent transition-colors disabled:opacity-50 text-left"
            >
              {action}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const STARTER_QUESTIONS = [
  "What is the average rate in Miami?",
  "Are there any rate spikes above 25% today?",
  "Explain how the 7-day trailing average works."
];

export default function RealEstateChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: "Hello! I'm your Real Estate Intelligence Assistant. Ask me about live rate volatility, property availability, or how our tracking methodology works."
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();

  // Browser-scoped persistent session ID
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const [isMaximized, setIsMaximized] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleNewChat = () => {
    setSessionId(crypto.randomUUID());
    setMessages([
      {
        sender: 'assistant',
        text: "Hello! I'm your Real Estate Intelligence Assistant. Ask me about live rate volatility, property availability, or how our tracking methodology works.",
        isStreaming: false
      }
    ]);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };



  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  const handleSend = async (queryToSend?: string) => {
    let text = queryToSend || input;
    
    // Find the last user message if we're retrying (no input, no queryToSend)
    if (!text.trim()) {
      const lastUserMsg = [...messages].reverse().find(m => m.sender === 'user');
      if (lastUserMsg) text = lastUserMsg.text;
    }
    
    if (!text.trim() || loading) return;

    if (!queryToSend && text === input) {
      const userMsg: Message = { sender: 'user', text };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
    } else if (queryToSend) {
      const userMsg: Message = { sender: 'user', text };
      setMessages((prev) => [...prev, userMsg]);
    }
    
    setLoading(true);

    // Capture URL SearchParam Filters to send to backend
    const activeFilters = {
      market: searchParams.get('market') || 'all',
      platform: searchParams.get('platform') || 'all',
      bedrooms: searchParams.get('bedrooms') || 'all',
    };

    try {
      const baseUrl = import.meta.env.VITE_BACKEND_URL ?? "https://johnalbarkaibrahim-sentimentscope.hf.space";
      const apiUrl = `${baseUrl}/api/v1/real-estate/chat`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          session_id: sessionId,
          context: activeFilters
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.error) {
        const errPayload = data.error || { message: `Network response was not ok: ${response.status}`, retryable: true };
        throw errPayload;
      }
      
      if (data.path_used === "ERROR") {
        throw { message: "The Real Estate Intelligence Layer experienced an issue parsing the request.", retryable: true };
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: data.reply || "I couldn't parse the response. Please try again.",
          path: data.path_used,
          suggested_actions: data.suggested_actions,
          isStreaming: true
        }
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: err.message || "An unexpected error occurred. Please try again later.",
          isError: true,
          retryable: err.retryable !== false,
          isStreaming: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[60] p-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-full shadow-lg flex items-center gap-2 transition-all"
        aria-label="Toggle Intelligence Assistant"
      >
        <Bot className="w-6 h-6" />
        {/* Hide text on small screens for responsiveness */}
        <span className="hidden sm:inline-block text-sm font-semibold pr-1">Ask Intelligence</span>
      </button>

      {/* Slide-over Drawer Panel */}
      {isOpen && (
        <div className={`fixed top-12 bottom-0 right-0 z-40 bg-background border-l border-border shadow-2xl flex flex-col transition-all duration-200 ${
          isMaximized 
            ? "left-0 w-full" 
            : "w-full sm:w-[400px] md:max-w-md"
        }`}>
          {/* Header */}
          <div className="p-4 border-b border-border flex justify-between items-center bg-card shrink-0">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <div>
                <h3 className="text-sm font-bold text-foreground">Real Estate Intelligence</h3>
                <p className="text-xs text-muted-foreground">Scoped to Rate Monitor</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={handleNewChat} className="text-muted-foreground hover:text-foreground p-1.5 rounded-md transition-colors" title="New Chat">
                <MessageSquarePlus className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsMaximized(!isMaximized)} 
                className="hidden md:flex text-muted-foreground hover:text-foreground p-1.5 rounded-md transition-colors"
                title={isMaximized ? "Minimize" : "Maximize"}
              >
                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground p-1.5 rounded-md transition-colors" title="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Centered Content Column */}
          <div className={`flex flex-col flex-1 overflow-hidden ${isMaximized ? 'max-w-4xl mx-auto w-full' : 'w-full'}`}>
            {/* Read-Only Scope Notice */}
            <div className="px-4 py-2 bg-muted/50 border-b border-border flex items-center gap-2 text-xs text-muted-foreground shrink-0">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span className="leading-snug">Answers grounded live from page data and methodology context.</span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 relative assistant-scrollbar">
            {messages.map((msg, idx) => {
              const isLastMessage = idx === messages.length - 1;
              
              // Format data and dates
              let formattedText = msg.text;
              if (msg.sender === 'assistant' && !msg.isError) {
                formattedText = formattedText.replace(/\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?\b/g, (_match) => {
                  try {
                    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(_match));
                  } catch { return _match; }
                });
                
                formattedText = formattedText.replace(/(\$?)(\d+)\.(\d{3,})(%?)/g, (_match, dollar, whole, frac, percent) => {
                  const num = parseFloat(`${whole}.${frac}`);
                  if (!dollar && !percent) {
                    return `$${num.toFixed(2)}`;
                  }
                  return `${dollar}${num.toFixed(2)}${percent}`;
                });
              }

              const markdownComponents: Components = {
                table: ({ children, ...props }) => (
                  <div className="w-full overflow-x-auto my-3 border border-border rounded-md assistant-scrollbar">
                    <table className="w-full text-left border-collapse text-xs whitespace-nowrap" {...props}>
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children, ...props }) => (
                  <th className="p-2 border-b border-border bg-muted font-semibold" {...props}>{children}</th>
                ),
                td: ({ children, ...props }) => (
                  <td className="p-2 border-b border-border/50" {...props}>{children}</td>
                ),
                a: ({ children, href, ...props }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline" {...props}>{children}</a>
                )
              };

              const formattedMsg = { ...msg, text: formattedText };

              return (
                <MessageBubble
                  key={idx}
                  msg={formattedMsg}
                  isLastMessage={isLastMessage}
                  handleSend={handleSend}
                  loading={loading}
                  markdownComponents={markdownComponents}
                />
              );
            })}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 bg-transparent text-muted-foreground py-2 px-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="text-xs font-medium">Running tool...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Starter Quick Questions */}
          {messages.length <= 2 && (
            <div className="p-3 border-t border-border bg-card/50">
              <p className="text-[11px] text-muted-foreground mb-2 font-medium">Suggested questions:</p>
              <div className="flex flex-col gap-1.5">
                {STARTER_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    className="text-left text-xs text-primary hover:bg-accent hover:text-accent-foreground p-1.5 rounded transition-colors"
                  >
                    → {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Box */}
          <div className="p-4 border-t border-border bg-card">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex flex-col gap-2 p-3 bg-zinc-900 border border-zinc-800 rounded-xl focus-within:ring-1 focus-within:ring-zinc-700 transition-shadow"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about rates, spikes..."
                rows={Math.min(5, input.split('\n').length || 1)}
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none min-h-[24px] max-h-32 assistant-scrollbar"
              />
              <div className="flex justify-between items-center mt-1">
                <span className="px-2 py-1 bg-zinc-800 rounded text-[10px] font-mono text-zinc-400">rate-monitor-v1</span>
                
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className={`p-1.5 rounded-full flex items-center justify-center w-8 h-8 transition-all ${
                    loading || !input.trim() 
                      ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
                      : "bg-emerald-500 text-zinc-950 hover:bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                  }`}
                  aria-label="Send message"
                >
                  <ArrowUp className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </form>
          </div>
          </div>
        </div>
      )}
    </>
  );
}
